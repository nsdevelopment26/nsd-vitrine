/* HORIZON : socle commun des scènes 3D (immeuble et maisons).
   Rendu, lumière, matériaux « maquette d'architecte », fusion de
   géométries (peu d'appels de dessin, donc fluide sur mobile),
   animations de caméra écrites à la main. */
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export { THREE };

export const MOBILE = matchMedia("(max-width: 860px), (pointer: coarse)").matches;
export const CALME = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
export function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* Rendu + scène + lumière. Le fond reste transparent : la page dessine le ciel. */
export function creerRendu(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfccc4, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1df, 2.6);
  sun.position.set(-40, 60, 45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  return { renderer, scene, sun };
}

export function ombreCamera(sun, taille) {
  const c = sun.shadow.camera;
  c.left = -taille; c.right = taille; c.top = taille; c.bottom = -taille; c.near = 1; c.far = 220;
  c.updateProjectionMatrix();
}

/* Palette maquette : béton clair, verre fumé, laiton discret. */
export function materiaux() {
  return {
    beton: new THREE.MeshStandardMaterial({ color: 0xf2f1ed, roughness: 0.82, metalness: 0 }),
    betonGris: new THREE.MeshStandardMaterial({ color: 0xd9d8d3, roughness: 0.9 }),
    verre: new THREE.MeshStandardMaterial({ color: 0x4f5f68, roughness: 0.03, metalness: 0.6, transparent: true, opacity: 0.66, envMapIntensity: 1.5, depthWrite: false }),
    gardecorps: new THREE.MeshStandardMaterial({ color: 0xc9d4d8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.28, depthWrite: false }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8c8371, roughness: 0.38, metalness: 0.85 }),
    noir: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.6 }),
    sol: new THREE.MeshStandardMaterial({ color: 0xe7e1d6, roughness: 0.75 }),
    mur: new THREE.MeshStandardMaterial({ color: 0xfbfaf8, roughness: 0.9 }),
    meuble: new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.85 }),
    eau: new THREE.MeshStandardMaterial({ color: 0x4f93a8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85, envMapIntensity: 2 }),
    herbe: new THREE.MeshStandardMaterial({ color: 0xd5ddcc, roughness: 1 }),
    arbre: new THREE.MeshStandardMaterial({ color: 0xe4e6e0, roughness: 0.95, flatShading: true }),
    lumiere: new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0 })
  };
}

/* Fusion de boîtes : on empile des pavés (w,h,d centrés en x,y,z),
   on obtient UNE géométrie. */
export class Fusion {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; this.n = 0; }
  boite(w, h, d, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    this.ajouter(g);
    g.dispose();
    return this;
  }
  ajouter(g) {
    const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      this.pos.push(p.getX(i), p.getY(i), p.getZ(i));
      this.nor.push(nn.getX(i), nn.getY(i), nn.getZ(i));
      this.uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
    }
    const ix = g.index;
    if (ix) for (let i = 0; i < ix.count; i++) this.idx.push(ix.getX(i) + this.n);
    else for (let i = 0; i < p.count; i++) this.idx.push(i + this.n);
    this.n += p.count;
  }
  geometrie() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
  maillage(mat, ombres = true) {
    const m = new THREE.Mesh(this.geometrie(), mat);
    m.castShadow = ombres; m.receiveShadow = true;
    return m;
  }
}

/* Arbre de maquette : un tronc fin, une couronne en facettes blanches. */
export function arbres(liste, mat) {
  const f = new Fusion();
  liste.forEach(([x, z, s = 1]) => {
    f.boite(0.14 * s, 2.6 * s, 0.14 * s, x, 1.3 * s, z);
    const c = new THREE.IcosahedronGeometry(1.15 * s, 0);
    c.scale(1, 1.35, 1); c.translate(x, 3.9 * s, z);
    f.ajouter(c);
  });
  return f.maillage(mat);
}

/* Traits d'architecte : les arêtes d'un maillage, dessinables
   progressivement (drawRange) pour les transitions plan ↔ volume. */
export function traits(mesh, couleur = 0x1b1c1e, seuil = 30) {
  const e = new THREE.EdgesGeometry(mesh.geometry, seuil);
  const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: couleur, transparent: true, opacity: 0.9 }));
  l.position.copy(mesh.position); l.rotation.copy(mesh.rotation); l.scale.copy(mesh.scale);
  l.userData.total = e.attributes.position.count;
  return l;
}

/* Fondu d'un groupe : chaque matériau est cloné une fois par groupe
   pour pouvoir estomper un étage sans toucher aux autres. */
export function prepareFondu(group) {
  group.traverse((o) => {
    if (!o.material || o.isLineSegments) return;
    o.material = o.material.clone();
    o.material.userData.base = o.material.opacity;
    o.material.userData.transBase = o.material.transparent;
  });
  group.userData.fondu = 1;
}
export function appliquerFondu(group, a) {
  group.userData.fondu = a;
  group.traverse((o) => {
    if (!o.material || o.isLineSegments || o.userData.horsFondu) return;
    const m = o.material, base = m.userData.base ?? 1, f = a * (o.userData.facteur ?? 1);
    m.opacity = base * f;
    m.transparent = m.userData.transBase || f < 0.999;
    m.depthWrite = !m.userData.transBase && f > 0.6;
    o.castShadow = f > 0.5 && o.userData.ombre !== false;
    o.visible = f > 0.01;
  });
}

/* Animateur : une liste de tâches interpolées, une seule boucle. */
export class Animateur {
  constructor() { this.taches = new Set(); }
  vers(duree, maj, fin) {
    const t = { debut: performance.now(), duree: CALME ? 1 : duree, maj, fin };
    this.taches.add(t);
    return t;
  }
  annuler(t) { this.taches.delete(t); }
  tick(now) {
    let actif = false;
    this.taches.forEach((t) => {
      const k = Math.min(1, (now - t.debut) / t.duree);
      t.maj(easeInOut(k), k);
      actif = true;
      if (k >= 1) { this.taches.delete(t); t.fin && t.fin(); }
    });
    return actif;
  }
}

/* Caméra en coordonnées sphériques autour d'une cible, interpolable. */
export class Orbite {
  constructor(camera) {
    this.camera = camera;
    this.cible = new THREE.Vector3();
    this.az = 0; this.el = 0.2; this.dist = 60;
    this.decalAz = 0; this.decalEl = 0; /* parallaxe souris */
  }
  appliquer() {
    const az = this.az + this.decalAz, el = this.el + this.decalEl;
    this.camera.position.set(
      this.cible.x + this.dist * Math.cos(el) * Math.sin(az),
      this.cible.y + this.dist * Math.sin(el),
      this.cible.z + this.dist * Math.cos(el) * Math.cos(az)
    );
    this.camera.lookAt(this.cible);
  }
  etat() { return { az: this.az, el: this.el, dist: this.dist, cible: this.cible.clone() }; }
  aller(anim, vers, duree = 1300, fin) {
    const de = this.etat();
    if (this._t) anim.annuler(this._t);
    this._t = anim.vers(duree, (k) => {
      this.az = de.az + (vers.az - de.az) * k;
      this.el = de.el + (vers.el - de.el) * k;
      this.dist = de.dist + (vers.dist - de.dist) * k;
      this.cible.lerpVectors(de.cible, vers.cible, k);
    }, fin);
  }
}

/* Glisser pour tourner, molette / pincement pour approcher. */
export function controles(el, orbite, opts) {
  let actif = false, x0 = 0, y0 = 0, az0 = 0, el0 = 0, bouge = 0;
  const pts = new Map();
  let pinch0 = 0, dist0 = 0;
  el.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, e);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); dist0 = orbite.dist;
    }
    actif = true; bouge = 0; x0 = e.clientX; y0 = e.clientY; az0 = orbite.az; el0 = orbite.el;
  });
  el.addEventListener("pointermove", (e) => {
    if (!actif) return;
    pts.set(e.pointerId, e);
    if (pts.size === 2 && opts.zoom) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      orbite.dist = Math.min(opts.distMax, Math.max(opts.distMin, dist0 * pinch0 / d));
      opts.change && opts.change();
      return;
    }
    const dx = e.clientX - x0, dy = e.clientY - y0;
    bouge = Math.max(bouge, Math.abs(dx) + Math.abs(dy));
    if (bouge < 6) return;
    if (e.pointerType === "touch" && !opts.toucherLibre && Math.abs(dy) > Math.abs(dx)) return; /* laisse défiler la page */
    el.setPointerCapture?.(e.pointerId);
    orbite.az = Math.min(opts.azMax, Math.max(opts.azMin, az0 - dx * 0.006));
    if (opts.elMin !== undefined) orbite.el = Math.min(opts.elMax, Math.max(opts.elMin, el0 + dy * 0.004));
    opts.change && opts.change();
  });
  const fin = (e) => { pts.delete(e.pointerId); if (!pts.size) actif = false; };
  el.addEventListener("pointerup", fin);
  el.addEventListener("pointercancel", fin);
  if (opts.zoom) el.addEventListener("wheel", (e) => {
    if (!opts.zoomActif || !opts.zoomActif()) return;
    e.preventDefault();
    orbite.dist = Math.min(opts.distMax, Math.max(opts.distMin, orbite.dist * (1 + e.deltaY * 0.0012)));
    opts.change && opts.change();
  }, { passive: false });
  return { aBouge: () => bouge > 6 };
}

/* Boucle de rendu qui dort quand la scène est hors écran. */
export function boucle(el, frame) {
  let visible = false, raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: "100px" });
  io.observe(el);
  function tick(now) {
    raf = 0;
    if (!visible) return;
    frame(now);
    raf = requestAnimationFrame(tick);
  }
  return { reveiller() { if (visible && !raf) raf = requestAnimationFrame(tick); } };
}

export function webglDispo() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}
