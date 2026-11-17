/* MOTORLINE — la scène.
   Un seul système pour trois effets : la porte de garage qui s'ouvre, la
   voiture qui suit la souris dans le showroom, puis la même voiture qui
   traverse le site au défilement. Une toile WebGL fixe, une caméra qui passe
   d'un réglage « showroom » à un réglage « vue haute », et des « voies »
   (tracés SVG posés dans les sections) qui disent où rouler.

   La toile est DERRIÈRE le contenu : ce sont les photos et les panneaux
   opaques qui masquent la voiture quand elle passe dessous. Aucun z-index
   à jongler pendant le défilement.

   Seule dépendance : Three.js (r170). Tout le reste est écrit ici. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const html = document.documentElement;
document.dispatchEvent(new CustomEvent('ml:scene-ok'));
let aRendre = true, pause = false;

const toile = document.getElementById('scene');
const intro = document.getElementById('intro');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const souris = matchMedia('(hover: hover) and (pointer: fine)').matches;
const estMobile = () => innerWidth <= 820;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lisse = (t) => t * t * (3 - 2 * t);
const ioc = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const amortir = (v, cible, vitesse, dt) => lerp(v, cible, 1 - Math.exp(-vitesse * dt));
const angle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

/* ------------------------------------------------------------- moteur */
const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'high-performance' });
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
let L = innerWidth, H = innerHeight;
function dimensionner() {
  L = innerWidth; H = innerHeight;
  rendu.setPixelRatio(Math.min(devicePixelRatio, estMobile() ? 1.5 : 1.75));
  rendu.setSize(L, H, false);
  [camera, camRoute].forEach((c) => { c.aspect = L / H; c.updateProjectionMatrix(); c.updateMatrixWorld(true); });
  voies.forEach((v) => (v.taille = null));
  choisirTraces();
  aRendre = true;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, L / H, 0.1, 200);
const camRoute = new THREE.PerspectiveCamera(24, L / H, 0.1, 200);
camRoute.position.set(0, 17, 16);
camRoute.lookAt(0, 0, 0);
camRoute.updateMatrixWorld(true);

/* ----------------------------------------------- environnement studio
   Les reflets d'une carrosserie, c'est ce qu'elle reflète. Base : un vrai
   studio photo (HDRI « Studio Small 09 », Poly Haven, CC0), auquel on ajoute
   de longues bandes lumineuses comme sur un tournage automobile. En attendant
   le fichier HDRI, le studio de bandes seul sert de carte d'environnement. */
function studio(hdr) {
  const s = new THREE.Scene();
  s.background = hdr || new THREE.Color(0x030304);
  if (hdr) s.backgroundIntensity = 0.22;
  const bande = (l, h, x, y, z, rx, ry, force, teinte = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(teinte).multiplyScalar(force), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  const k = hdr ? 0.6 : 1;
  bande(16, 0.55, 0, 7, -1.8, Math.PI / 2, 0, 7 * k);
  bande(16, 0.55, 0, 7, 1.8, Math.PI / 2, 0, 7 * k);
  bande(16, 0.3, 0, 7, 0, Math.PI / 2, 0, 3 * k);
  bande(12, 2.4, 0, 2.2, -13, 0, 0, 1.6, 0xdfe9ff);
  bande(12, 1.4, 0, 1.6, 13, 0, Math.PI, 1.1);
  bande(0.5, 7, -14, 3, 0, 0, Math.PI / 2, 3.2, 0xdfe9ff);
  bande(0.5, 7, 14, 3, 0, 0, -Math.PI / 2, 2.4);
  bande(30, 30, 0, -0.5, 0, Math.PI / 2, 0, 0.05);
  const pm = new THREE.PMREMGenerator(rendu);
  const t = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return t;
}
scene.environment = studio();
scene.environmentIntensity = 1;
new RGBELoader().load('env/studio-small-09-1k.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const ancien = scene.environment;
  scene.environment = studio(hdr);
  ancien.dispose(); hdr.dispose();
  aRendre = true;
});

/* --------------------------------------------------- textures peintes */
function texture(l, h, dessin) {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  dessin(c.getContext('2d'), l, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const texOmbre = texture(256, 256, (g, l, h) => {
  const r = g.createRadialGradient(l / 2, h / 2, 0, l / 2, h / 2, l / 2);
  r.addColorStop(0, 'rgba(0,0,0,.95)'); r.addColorStop(0.45, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, l, h);
});
const texFaisceau = texture(256, 512, (g, l, h) => {
  const v = g.createLinearGradient(0, h, 0, 0);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.5, 'rgba(255,255,255,.35)'); v.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = v; g.beginPath(); g.moveTo(l * 0.42, h); g.lineTo(l * 0.58, h); g.lineTo(l, 0); g.lineTo(0, 0); g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-in';
  const c = g.createLinearGradient(0, 0, l, 0);
  c.addColorStop(0, 'rgba(0,0,0,0)'); c.addColorStop(0.5, 'rgba(0,0,0,1)'); c.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = c; g.fillRect(0, 0, l, h);
});
const texLames = texture(64, 512, (g, l, h) => {
  g.fillStyle = '#2b2f35'; g.fillRect(0, 0, l, h);
  for (let y = 0; y < h; y += 16) {
    const d = g.createLinearGradient(0, y, 0, y + 16);
    d.addColorStop(0, '#454a52'); d.addColorStop(0.35, '#2a2e34'); d.addColorStop(0.8, '#1d2025'); d.addColorStop(1, '#101215');
    g.fillStyle = d; g.fillRect(0, y, l, 16);
  }
});
texLames.wrapS = texLames.wrapT = THREE.RepeatWrapping;
const texRainures = texture(32, 256, (g, l, h) => {
  g.fillStyle = '#30353b'; g.fillRect(0, 0, l, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = '#1a1d21'; g.fillRect(0, y + 14, l, 3);
    g.fillStyle = '#4a5058'; g.fillRect(0, y + 17, l, 1);
  }
});
texRainures.wrapS = texRainures.wrapT = THREE.RepeatWrapping;
const texSol = texture(512, 512, (g, l, h) => {
  g.fillStyle = '#0d0e10'; g.fillRect(0, 0, l, h);
  for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(Math.random() * l, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(l, h / 2); g.moveTo(l / 2, 0); g.lineTo(l / 2, h); g.stroke();
});
texSol.wrapS = texSol.wrapT = THREE.RepeatWrapping;
texSol.repeat.set(6, 6);

/* ------------------------------------------------------------ matières */
const XENON = new THREE.Color(0xd9e8ff);
const peinture = new THREE.MeshPhysicalMaterial({ color: 0x4a5058, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.25 });
const verre = new THREE.MeshPhysicalMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.04, transmission: 0, envMapIntensity: 1.6, clearcoat: 1 });
const caoutchouc = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.82, metalness: 0 });
const alu = new THREE.MeshStandardMaterial({ color: 0x9aa1aa, roughness: 0.22, metalness: 1, envMapIntensity: 1.4 });
const phare = new THREE.MeshStandardMaterial({ color: 0x101214, emissive: XENON, emissiveIntensity: 0 });
const feu = new THREE.MeshStandardMaterial({ color: 0x1a0606, emissive: new THREE.Color(0xff2b2b), emissiveIntensity: 0 });

/* ------------------------------------------------------------ voiture
   « monture » porte la position et l'orientation, « caisse » le roulis et
   le tangage (la voiture s'incline un peu quand elle tourne), « modele »
   le maillage, provisoire puis remplacé par le .glb dès qu'il arrive. */
const LONG = 4.6;
const monture = new THREE.Group();
const caisse = new THREE.Group();
monture.add(caisse);
scene.add(monture);
let modele = null, roues = [];

function voitureProvisoire() {
  const g = new THREE.Group();
  const profil = new THREE.Shape();
  profil.moveTo(2.32, 0.34);
  profil.lineTo(2.36, 0.56);
  profil.quadraticCurveTo(2.34, 0.7, 2.1, 0.74);
  profil.quadraticCurveTo(1.3, 0.84, 0.72, 0.9);
  profil.quadraticCurveTo(0.2, 1.22, -0.4, 1.27);
  profil.quadraticCurveTo(-1.2, 1.26, -1.75, 1.0);
  profil.quadraticCurveTo(-2.2, 0.9, -2.3, 0.82);
  profil.lineTo(-2.32, 0.36);
  profil.quadraticCurveTo(-2.3, 0.3, -2.1, 0.3);
  profil.lineTo(2.1, 0.3);
  profil.quadraticCurveTo(2.3, 0.3, 2.32, 0.34);
  const corps = new THREE.ExtrudeGeometry(profil, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 6, curveSegments: 24 });
  corps.translate(0, 0, -0.81);
  g.add(new THREE.Mesh(corps, peinture));
  const vitres = new THREE.Shape();
  vitres.moveTo(0.66, 0.93); vitres.quadraticCurveTo(0.18, 1.2, -0.4, 1.235);
  vitres.quadraticCurveTo(-1.1, 1.22, -1.6, 0.99); vitres.lineTo(0.66, 0.93);
  const v = new THREE.ExtrudeGeometry(vitres, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
  v.translate(0, 0.02, -0.75);
  g.add(new THREE.Mesh(v, verre));
  const bande = (l, h, p, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), m); b.position.set(x, y, z); g.add(b); };
  bande(0.06, 0.05, 0.42, 2.44, 0.66, 0.6, phare); bande(0.06, 0.05, 0.42, 2.44, 0.66, -0.6, phare);
  bande(0.05, 0.045, 1.7, -2.44, 0.8, 0, feu);
  const pneu = new THREE.CylinderGeometry(0.37, 0.37, 0.27, 40); pneu.rotateX(Math.PI / 2);
  const jante = new THREE.CylinderGeometry(0.26, 0.26, 0.28, 40); jante.rotateX(Math.PI / 2);
  [[1.45, 0.92], [1.45, -0.92], [-1.42, 0.92], [-1.42, -0.92]].forEach(([x, z]) => {
    const r = new THREE.Group(); r.position.set(x, 0.37, z);
    r.add(new THREE.Mesh(pneu, caoutchouc)); r.add(new THREE.Mesh(jante, alu));
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.02), alu); b.rotation.z = (i / 5) * Math.PI * 2; b.position.z = z > 0 ? 0.15 : -0.15; r.add(b); }
    g.add(r); r.userData.roue = true;
  });
  return g;
}

function installer(objet) {
  if (modele) caisse.remove(modele);
  modele = objet;
  caisse.add(modele);
  roues = [];
  modele.traverse((o) => { if (o.userData.roue) roues.push(o); });
  cuireOmbre();
  aRendre = true;
}
/* Le vrai modèle : « CarConcept » (Eric Chadwick / Darmstadt Graphics Group,
   Khronos glTF Sample Assets, CC BY 4.0), allégé pour le web (11,8 → 5,5 Mo :
   plaque, emblème du volant, essuie-glaces et pièces cachées retirés).
   On le remet à l'échelle, nez vers +x, posé au sol, avec nos matières. */
const AVANT = 1; // passer à -1 si le modèle arrive tourné à l'envers
const peinture2 = new THREE.MeshPhysicalMaterial({ color: 0x0a0b0c, metalness: 0.55, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
const cuir = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.62, metalness: 0.05 });
const vitrage = new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.62, envMapIntensity: 1.8, clearcoat: 1, depthWrite: false });
const AXE = new THREE.Vector3(0, 0, 1), qAxe = new THREE.Quaternion();
new GLTFLoader().load('voiture.glb', (gltf) => {
  const o = gltf.scene;
  let b = new THREE.Box3().setFromObject(o), t = b.getSize(new THREE.Vector3());
  if (t.z > t.x) o.rotation.y = Math.PI / 2;
  if (AVANT < 0) o.rotation.y += Math.PI;
  const r = new THREE.Group(); r.add(o);
  b = new THREE.Box3().setFromObject(r); t = b.getSize(new THREE.Vector3());
  r.scale.setScalar(LONG / t.x);
  b = new THREE.Box3().setFromObject(r);
  const c = b.getCenter(new THREE.Vector3());
  r.position.set(-c.x, -b.min.y, -c.z);
  o.traverse((m) => {
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const neufs = mats.map((x) => {
      const n = (x && x.name) || '';
      if (/^Paint 1/.test(n)) return peinture;
      if (/^Paint 2/.test(n)) return peinture2;
      if (n === 'Glass') return vitrage;
      if (n === 'Headlight') return phare;
      if (n === 'Brakelight') return feu;
      if (/^Interior 3/.test(n)) return cuir;
      if (x && x.transmission) { x.transmission = 0; x.transparent = true; x.opacity = 0.6; }
      return x;
    });
    m.material = Array.isArray(m.material) ? neufs : neufs[0];
  });
  const g = new THREE.Group(); g.add(r);
  installer(g);
  /* le modèle d'origine a les roues avant braquées : on les remet droites,
     dans l'orientation des roues arrière du même côté */
  const parNom = {}; o.traverse((w) => { if (w.name) parNom[w.name] = w; });
  ['L', 'R'].forEach((c) => {
    const av = parNom['WheelFront' + c], ar = parNom['WheelRear' + c];
    if (av && ar && av.parent === ar.parent) av.quaternion.copy(ar.quaternion);
  });
  /* on pose la voiture sur ses pneus, pas sur son point le plus bas : le
     dessous de caisse du modèle descend plus bas que les pneus, et la voiture
     paraissait flotter d'une quinzaine de centimètres */
  caisse.updateMatrixWorld(true);
  const invC = new THREE.Matrix4().copy(caisse.matrixWorld).invert(), mm = new THREE.Matrix4(), vv = new THREE.Vector3();
  let basPneu = Infinity;
  o.traverse((p) => {
    if (!p.isMesh || !/^Tire/.test((p.material && p.material.name) || '')) return;
    mm.multiplyMatrices(invC, p.matrixWorld);
    const pos = p.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) basPneu = Math.min(basPneu, vv.fromBufferAttribute(pos, i).applyMatrix4(mm).y);
  });
  if (isFinite(basPneu)) { r.position.y -= basPneu; g.updateMatrixWorld(true); }
  cuireOmbre();
  /* roues : on retrouve l'axe de chaque roue dans le repère de son parent */
  g.updateMatrixWorld(true);
  const inv = new THREE.Quaternion();
  o.traverse((w) => {
    if (!/^Wheel(Front|Rear)[LR]$/.test(w.name)) return;
    w.parent.getWorldQuaternion(inv); inv.invert();
    const qc = new THREE.Quaternion(); caisse.getWorldQuaternion(qc);
    w.userData.axe = AXE.clone().applyQuaternion(qc).applyQuaternion(inv).normalize();
    w.userData.base = w.quaternion.clone();
    w.userData.roue = true;
    roues.push(w);
  });
  document.dispatchEvent(new CustomEvent('ml:glb'));
}, undefined, () => { document.dispatchEvent(new CustomEvent('ml:glb')); /* pas de .glb : la voiture provisoire reste */ });

/* ombre de contact + faisceaux des phares (posés au sol, additifs) */
const ombre = new THREE.Mesh(new THREE.PlaneGeometry(LONG * 1.25, 2.6), new THREE.MeshBasicMaterial({ map: texOmbre, transparent: true, depthWrite: false, opacity: 0.55 }));
ombre.scale.set(1.25, 1.35, 1);
ombre.rotation.x = -Math.PI / 2; ombre.position.y = 0.012; ombre.renderOrder = 1;
monture.add(ombre);
const faisceaux = new THREE.Group();
[0.62, -0.62].forEach((z) => {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 7.5), new THREE.MeshBasicMaterial({ map: texFaisceau, color: XENON, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  f.rotation.x = -Math.PI / 2; f.rotation.z = -Math.PI / 2; f.position.set(2.3 + 3.6, 0.02, z * 1.4);
  faisceaux.add(f);
});
monture.add(faisceaux);
const spotsPhares = [0.62, -0.62].map((z) => {
  const s = new THREE.SpotLight(0xdfeaff, 0, 26, 0.42, 0.65, 1.4);
  s.position.set(2.2, 0.7, z); s.target.position.set(9, 0, z * 2.4);
  caisse.add(s); caisse.add(s.target); return s;
});

/* -------------------------------------------------------- le garage
   Showroom fermé par une porte sectionnelle : 8 panneaux qui montent dans
   leur rail, pivotent dans la courbe et filent à plat sous le plafond. */
const garage = new THREE.Group();
scene.add(garage);
const PORTE_Z = 5.6, PORTE_L = 8.2, PORTE_H = 3.6, RAYON = 0.55, N_PAN = 8, PAN_H = PORTE_H / N_PAN;
const matsGarage = [];
const mg = (m) => { m.transparent = true; matsGarage.push(m); return m; };

const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mg(new THREE.MeshStandardMaterial({ map: texSol, color: 0x1c1e21, roughness: 0.38, metalness: 0.2, opacity: 1, envMapIntensity: 0.12 })));
sol.rotation.x = -Math.PI / 2; garage.add(sol);
const mur = mg(new THREE.MeshStandardMaterial({ map: texLames, roughness: 0.48, metalness: 0.4, envMapIntensity: 0.3 }));
texLames.repeat.set(1, 6);
const murG = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), mur); murG.position.set(-6.2, 2.3, -0.8); murG.rotation.y = Math.PI / 2; garage.add(murG);
const murD = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), mur); murD.position.set(6.2, 2.3, -0.8); murD.rotation.y = -Math.PI / 2; garage.add(murD);
const fond = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 4.6), mg(new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.9 })));
fond.position.set(0, 2.3, -7.3); garage.add(fond);
const plafond = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 13), mg(new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 1 })));
plafond.rotation.x = Math.PI / 2; plafond.position.set(0, 4.6, -0.8); garage.add(plafond);
const facade = mg(new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.85, metalness: 0.1 }));
[[-(PORTE_L / 2 + 3), 2.6, 6, 5.2], [PORTE_L / 2 + 3, 2.6, 6, 5.2]].forEach(([x, y, l, h]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, 0.5), facade); m.position.set(x, y, PORTE_Z + 0.3); garage.add(m);
});
const linteau = new THREE.Mesh(new THREE.BoxGeometry(PORTE_L + 0.6, 1.6, 0.5), facade); linteau.position.set(0, PORTE_H + 0.8, PORTE_Z + 0.3); garage.add(linteau);
const rail = mg(new THREE.MeshStandardMaterial({ color: 0x5b616a, roughness: 0.3, metalness: 1 }));
[-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, PORTE_H + 0.2, 0.12), rail); r.position.set(s * (PORTE_L / 2 + 0.06), PORTE_H / 2, PORTE_Z - 0.06); garage.add(r); });

/* plafonniers : trois longues lignes de LED, plus une transversale au fond */
const tubes = [];
const matTube = () => mg(new THREE.MeshBasicMaterial({ color: 0xffffff }));
[[-2.2, 0, 11], [0, 0, 11], [2.2, 0, 11]].forEach(([x], i) => {
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 11), matTube()); t.position.set(x, 4.5, -1.2); garage.add(t); tubes.push({ m: t, i });
});
const tubeFond = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.07), matTube()); tubeFond.position.set(0, 3.9, -7.2); garage.add(tubeFond); tubes.push({ m: tubeFond, i: 3 });

const lumHaut = new THREE.SpotLight(0xe8efff, 0, 18, 0.75, 0.6, 1.2); lumHaut.position.set(0, 4.4, 0.6); lumHaut.target.position.set(0, 0, 0);
garage.add(lumHaut, lumHaut.target);
const lumMurs = [-4.6, 4.6].map((x) => { const p = new THREE.PointLight(0xdfe9ff, 0, 12, 1.6); p.position.set(x, 4, -1); garage.add(p); return p; });
const lumFace = new THREE.SpotLight(0xffffff, 0, 30, 0.5, 0.8, 1.3); lumFace.position.set(0, 7, 16); lumFace.target.position.set(0, 1.8, PORTE_Z);
garage.add(lumFace, lumFace.target);

/* les panneaux de la porte */
const matPorte = mg(new THREE.MeshStandardMaterial({ map: texRainures, color: 0xb9c0c9, roughness: 0.46, metalness: 0.72, envMapIntensity: 0.9 }));
texRainures.repeat.set(10, 1);
const panneaux = [];
for (let i = 0; i < N_PAN; i++) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(PORTE_L, PAN_H - 0.018, 0.07), matPorte);
  garage.add(p); panneaux.push(p);
}
function porte(ouverture) { // 0 fermée, 1 ouverte
  const course = (PORTE_H + RAYON * Math.PI / 2 + 0.2) * ouverture;
  panneaux.forEach((p, i) => {
    const s = i * PAN_H + PAN_H / 2 + course;
    let y, z, a;
    if (s <= PORTE_H) { y = s; z = PORTE_Z; a = 0; }
    else if (s <= PORTE_H + RAYON * Math.PI / 2) { a = (s - PORTE_H) / RAYON; y = PORTE_H + RAYON * Math.sin(a); z = PORTE_Z - RAYON * (1 - Math.cos(a)); }
    else { a = Math.PI / 2; y = PORTE_H + RAYON; z = PORTE_Z - RAYON - (s - PORTE_H - RAYON * Math.PI / 2); }
    p.position.set(0, y, z); p.rotation.x = -a;
  });
}
/* la lumière qui filtre sous la porte, puis s'étale dehors */
const fente = new THREE.Mesh(new THREE.PlaneGeometry(PORTE_L, 0.05), mg(new THREE.MeshBasicMaterial({ color: XENON, opacity: 0 })));
fente.position.set(0, 0.025, PORTE_Z + 0.04); garage.add(fente);
const flaque = new THREE.Mesh(new THREE.PlaneGeometry(PORTE_L * 1.6, 9), mg(new THREE.MeshBasicMaterial({ map: texFaisceau, color: XENON, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
flaque.rotation.x = -Math.PI / 2; flaque.rotation.z = Math.PI; flaque.position.set(0, 0.015, PORTE_Z + 4.4); garage.add(flaque);

/* ombre de contact : on projette au sol les sommets bas de la voiture dans
   une image, plus sombre là où la carrosserie frôle le sol, puis on la floute.
   Calculée une fois par modèle, attachée à la voiture (elle la suit). */
const OMB_L = LONG * 1.4, OMB_P = 3.0, OMB_RES = 512;
const toileOmbre = document.createElement('canvas'); toileOmbre.width = OMB_RES; toileOmbre.height = Math.round(OMB_RES * OMB_P / OMB_L);
const texOmbreContact = new THREE.CanvasTexture(toileOmbre);
const ombreContact = new THREE.Mesh(new THREE.PlaneGeometry(OMB_L, OMB_P),
  new THREE.MeshBasicMaterial({ map: texOmbreContact, transparent: true, depthWrite: false, opacity: 0 }));
ombreContact.rotation.x = -Math.PI / 2; ombreContact.position.y = 0.006; ombreContact.renderOrder = 2;
monture.add(ombreContact);
function cuireOmbre() {
  if (!modele) return;
  const W = toileOmbre.width, Hh = toileOmbre.height;
  /* deux couches : une ombre large et douce (toute la caisse), et un contact
     serré sous les pneus et le bas de caisse, là où la voiture touche le sol */
  const large = document.createElement('canvas'), serre = document.createElement('canvas');
  large.width = serre.width = W; large.height = serre.height = Hh;
  const gL = large.getContext('2d'), gS = serre.getContext('2d');
  caisse.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(caisse.matrixWorld).invert(), m = new THREE.Matrix4(), v = new THREE.Vector3();
  const HAUT = 0.8, CONTACT = 0.09;
  modele.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const pos = o.geometry.attributes.position; if (!pos) return;
    m.multiplyMatrices(inv, o.matrixWorld);
    const pas = Math.max(1, Math.floor(pos.count / 8000));
    for (let i = 0; i < pos.count; i += pas) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      if (v.y > HAUT) continue;
      const x = (v.x / OMB_L + 0.5) * W, y = (v.z / OMB_P + 0.5) * Hh;
      gL.fillStyle = 'rgba(0,0,0,' + (Math.pow(1 - v.y / HAUT, 2) * 0.16).toFixed(3) + ')';
      gL.fillRect(x - 2, y - 2, 4, 4);
      if (v.y < CONTACT) { gS.fillStyle = 'rgba(0,0,0,' + (0.5 * (1 - v.y / CONTACT)).toFixed(3) + ')'; gS.fillRect(x - 1.5, y - 1.5, 3, 3); }
    }
  });
  const c = toileOmbre.getContext('2d');
  c.clearRect(0, 0, W, Hh);
  c.filter = 'blur(16px)'; c.drawImage(large, 0, 0);
  c.filter = 'blur(6px)'; c.globalAlpha = 0.7; c.drawImage(large, 0, 0);
  c.filter = 'blur(2.5px)'; c.globalAlpha = 1; c.drawImage(serre, 0, 0); c.drawImage(serre, 0, 0);
  c.filter = 'none';
  texOmbreContact.needsUpdate = true;
  ombreContact.material.opacity = 1;
  aRendre = true;
}

installer(voitureProvisoire());

/* --------------------------------------------- réglages de caméra */
const camHero = { pos: new THREE.Vector3(), cible: new THREE.Vector3(), fov: 28 };
const camIntro = { pos: new THREE.Vector3(0, 1.55, 17.5), cible: new THREE.Vector3(0, 1.7, 0), fov: 30 };
function majCamHero(mx, my) {
  const m = estMobile(), portrait = L / H < 0.9;
  camHero.fov = portrait ? 46 : m ? 34 : 28;
  const d = portrait ? 11.5 : 11.8;
  camHero.pos.set(mx * 0.9, 1.45 + my * 0.25, d);
  camHero.cible.set(portrait ? 0 : -0.9, portrait ? -0.2 : 0.05, 0);
}

/* ----------------------------------------------------- les voies */
const voies = [...document.querySelectorAll('.voie')].map((el) => ({
  el,
  bureau: el.querySelector('.d-bureau'),
  mobile: el.querySelector('.d-mobile'),
  sansMobile: el.dataset.mobile === 'non',
  de: +(el.dataset.de || 0), a: +(el.dataset.a || 1),
  garer: el.hasAttribute('data-garer'),
  tBureau: +(el.dataset.taille || 0.24), tMobile: +(el.dataset.tailleMobile || el.dataset.taille || 0.5),
  pts: null, cum: null, taille: null, actif: true,
}));
function choisirTraces() {
  const m = estMobile();
  voies.forEach((v) => {
    const p = m ? (v.mobile || (v.sansMobile ? null : v.bureau)) : v.bureau;
    v.actif = !!p && !(m && v.sansMobile);
    if (!v.actif) return;
    if (v.chemin === p && v.pts) return;
    v.chemin = p;
    const n = 180, lg = p.getTotalLength();
    v.pts = [];
    for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((lg * i) / n); v.pts.push([q.x / 100, q.y / 100]); }
    v.taille = null;
  });
}
/* points en pixels écran + longueurs cumulées : vitesse régulière à l'écran */
function pointVoie(v, r, u, out) {
  if (!v.taille || v.taille[0] !== r.width || v.taille[1] !== r.height) {
    v.taille = [r.width, r.height]; v.cum = [0];
    for (let i = 1; i < v.pts.length; i++) {
      const dx = (v.pts[i][0] - v.pts[i - 1][0]) * r.width, dy = (v.pts[i][1] - v.pts[i - 1][1]) * r.height;
      v.cum.push(v.cum[i - 1] + Math.hypot(dx, dy));
    }
  }
  const total = v.cum[v.cum.length - 1], cible = clamp(u, 0, 1) * total;
  let i = 1; while (i < v.cum.length - 1 && v.cum[i] < cible) i++;
  const k = (cible - v.cum[i - 1]) / Math.max(1e-6, v.cum[i] - v.cum[i - 1]);
  out.x = r.left + lerp(v.pts[i - 1][0], v.pts[i][0], k) * r.width;
  out.y = r.top + lerp(v.pts[i - 1][1], v.pts[i][1], k) * r.height;
  return out;
}
const rayon = new THREE.Raycaster(), ndc = new THREE.Vector2(), plan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function versSol(x, y, out) { ndc.set((x / L) * 2 - 1, -(y / H) * 2 + 1); rayon.setFromCamera(ndc, camRoute); return rayon.ray.intersectPlane(plan, out); }

const poseRoute = { pos: new THREE.Vector3(), lacet: 0, echelle: 1, visible: false, garee: false };
const P0 = { x: 0, y: 0 }, P1 = { x: 0, y: 0 }, P2 = { x: 0, y: 0 }, W1 = new THREE.Vector3(), W2 = new THREE.Vector3(), W3 = new THREE.Vector3();
function calculerRoute(forcerPremiere) {
  poseRoute.visible = false; poseRoute.garee = false;
  for (let k = 0; k < voies.length; k++) {
    const v = voies[k];
    if (!v.actif) continue;
    const r = v.el.getBoundingClientRect();
    const p = (H - r.top) / (H + r.height);
    let u = (p - v.de) / (v.a - v.de);
    const enVue = r.bottom > 0 && r.top < H;
    if (forcerPremiere && k === 0) u = clamp(u, 0, 1);
    else if (u <= 0 || (u >= 1 && !(v.garer && enVue))) continue;
    u = clamp(u, 0, 1);
    if (v.garer) u = 1 - Math.pow(1 - u, 2.2);
    pointVoie(v, r, u, P0);
    pointVoie(v, r, u - 0.012, P1); pointVoie(v, r, u + 0.012, P2);
    if (!versSol(P0.x, P0.y, W1) || !versSol(P1.x, P1.y, W2) || !versSol(P2.x, P2.y, W3)) continue;
    poseRoute.pos.copy(W1);
    poseRoute.lacet = Math.atan2(-(W3.z - W2.z), W3.x - W2.x);
    const px = (estMobile() ? v.tMobile : v.tBureau) * L;
    versSol(P0.x - px / 2, P0.y, W2); versSol(P0.x + px / 2, P0.y, W3);
    poseRoute.echelle = W2.distanceTo(W3) / LONG;
    poseRoute.visible = true;
    poseRoute.garee = v.garer && u >= 0.999;
    /* en se garant, la voiture finit de braquer pour se présenter de trois quarts */
    if (v.garer) poseRoute.lacet = angle(poseRoute.lacet, -Math.PI / 2 - 0.6, lisse(clamp((u - 0.6) / 0.4, 0, 1)));
    return;
  }
}

/* --------------------------------------------------------- l'état */
let mx = 0, my = 0, smx = 0, smy = 0;
let lacetHero = -Math.PI / 2 + 0.62, lacetV = 0, lacet = lacetHero;
const posCar = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion();
let echelleCar = 1, phares = 0, lumieres = 0, ouverture = 0, roulis = 0, derniere = performance.now(), tPhase = 0;
let premierTrajet = true, distance = 0;

if (souris && !calme) {
  addEventListener('pointermove', (e) => { mx = (e.clientX / L) * 2 - 1; my = (e.clientY / H) * 2 - 1; aRendre = true; }, { passive: true });
}
addEventListener('scroll', () => { aRendre = true; }, { passive: true });
addEventListener('resize', dimensionner);
document.addEventListener('ml:modale', (e) => { pause = !!e.detail; aRendre = true; });
document.addEventListener('ml:mise-en-page', () => { aRendre = true; });
document.addEventListener('visibilitychange', () => { derniere = performance.now(); });

/* ---------------------------------------------------------- l'intro
   Noir. Un trait de lumière au ras du sol (il se remplit pendant le
   chargement). La façade sort de l'ombre, le nom apparaît. La porte monte,
   les plafonniers s'allument un par un, puis les phares, et la caméra entre. */
const enIntro = html.classList.contains('en-intro');
let tIntro = 0, debutOuverture = null, finIntro = null, introFinie = !enIntro, charge = 0, glbFini = false;
const etapes = { marque: false, sort: false };
let tubesEtat = tubes.map(() => 0);
document.addEventListener('ml:glb', () => { glbFini = true; });

function finirIntro(vite) {
  if (introFinie) return;
  introFinie = true;
  ouverture = 1; lumieres = 1; phares = 1;
  try { sessionStorage.setItem('ml-intro', '1'); } catch (e) {}
  if (intro) intro.classList.add('sort');
  html.classList.remove('en-intro');
  document.dispatchEvent(new CustomEvent('ml:intro-fin'));
  if (vite) camTransition = 0;
}
let camTransition = 1; // 1 = la caméra suit encore le plan de l'intro
if (!enIntro) { ouverture = 1; lumieres = 1; phares = 1; camTransition = 0; }
else {
  document.getElementById('intro-passer').addEventListener('click', () => finirIntro(true));
  addEventListener('wheel', () => finirIntro(true), { passive: true, once: true });
  addEventListener('touchmove', () => finirIntro(true), { passive: true, once: true });
  addEventListener('keydown', (e) => { if (/Escape|Enter| |ArrowDown|PageDown/.test(e.key)) finirIntro(true); });
}

function majIntro(dt) {
  tIntro += dt;
  charge = Math.min(1, charge + dt * (glbFini ? 2 : 0.4));
  if (!etapes.marque && tIntro > 0.5) { etapes.marque = true; intro && intro.classList.add('marque'); }
  if (debutOuverture === null && tIntro > 1.3 && (charge >= 1 || tIntro > 3)) debutOuverture = tIntro;
  if (debutOuverture === null) { ouverture = 0; camTransition = 1; return; }
  const t = tIntro - debutOuverture;
  /* moteur : léger à-coup au démarrage, puis montée régulière, ralenti en fin de course */
  const k = clamp(t / 2.6, 0, 1);
  ouverture = ioc(k) + (k > 0 && k < 1 ? Math.sin(t * 46) * 0.0016 * (1 - k) : 0);
  lumieres = clamp((t - 0.25) / 1, 0, 1);
  phares = clamp((t - 1.3) / 0.6, 0, 1);
  camTransition = 1 - ioc(clamp((t - 0.9) / 2.3, 0, 1));
  if (!etapes.sort && t > 0.8) { etapes.sort = true; intro && intro.classList.add('sort'); }
  if (t > 3.3) finirIntro(false);
}

/* --------------------------------------------------------- la boucle */
function image(now) {
  requestAnimationFrame(image);
  const dt = Math.min(0.05, (now - derniere) / 1000); derniere = now;
  if (pause) return;
  tPhase += dt;

  if (!introFinie) { majIntro(dt); aRendre = true; }

  const y = scrollY;
  const h = calme ? (y > H * 0.5 ? 1 : 0) : lisse(clamp(y / (H * 0.85), 0, 1)); // 0 showroom, 1 route
  const heroVisible = y < H * 1.05;

  /* souris amortie, avec un ressort pour l'orientation (un peu d'inertie) */
  smx = amortir(smx, introFinie ? mx : 0, 3.2, dt);
  smy = amortir(smy, introFinie ? my : 0, 3.2, dt);
  const auto = !souris && !calme ? Math.sin(tPhase * 0.4) * 0.22 : 0;
  const cibleLacet = lacetHero + smx * 0.48 + auto;
  const acc = (cibleLacet - lacet) * 22 - lacetV * 7.5;
  lacetV += acc * dt;
  const lacetShowroom = lacet + lacetV * dt;
  lacet = lacetShowroom;
  roulis = amortir(roulis, clamp(-lacetV * 0.05, -0.04, 0.04), 6, dt);

  /* route */
  let route = null;
  if (!calme && h > 0) {
    calculerRoute(h < 1);
    if (poseRoute.visible) route = poseRoute;
  }

  /* pose finale de la voiture : mélange showroom → route */
  let visible = true, cibleP = new THREE.Vector3(0, 0, 0), cibleY = lacetShowroom, cibleS = 1;
  if (h >= 1) {
    if (!route) visible = false;
    else { cibleP = route.pos; cibleY = route.lacet; cibleS = route.echelle; }
  } else if (route) {
    cibleP = new THREE.Vector3().lerpVectors(cibleP, route.pos, h);
    cibleY = angle(lacetShowroom, route.lacet, h);
    cibleS = lerp(1, route.echelle, h);
  }
  if (visible) {
    const saut = !monture.visible || premierTrajet;
    if (saut || h < 1) { posCar.copy(cibleP); }
    else {
      const avant = posCar.clone();
      posCar.x = amortir(posCar.x, cibleP.x, 16, dt); posCar.z = amortir(posCar.z, cibleP.z, 16, dt);
      distance += avant.distanceTo(posCar);
    }
    monture.position.copy(posCar);
    monture.rotation.y = h < 1 || saut ? cibleY : angle(monture.rotation.y, cibleY, 1 - Math.exp(-12 * dt));
    echelleCar = h < 1 || saut ? cibleS : amortir(echelleCar, cibleS, 10, dt);
    monture.scale.setScalar(echelleCar);
    premierTrajet = false;
  }
  monture.visible = visible;
  caisse.rotation.x = roulis * (1 - h);
  caisse.rotation.z = smy * -0.012 * (1 - h);
  const tour = -distance / (0.37 * echelleCar || 1);
  roues.forEach((r) => {
    if (r.userData.axe) { qAxe.setFromAxisAngle(r.userData.axe, tour); r.quaternion.copy(r.userData.base).premultiply(qAxe); }
    else r.rotation.z = tour;
  });

  /* phares, lumières, porte */
  phare.emissiveIntensity = phares * 3.2;
  feu.emissiveIntensity = phares * 2.4;
  faisceaux.children.forEach((f) => (f.material.opacity = phares * lerp(0.16, 0.42, h)));
  spotsPhares.forEach((s) => (s.intensity = phares * 7 * (1 - h)));
  porte(ouverture);
  const fadeG = 1 - h;
  garage.visible = fadeG > 0.002;
  matsGarage.forEach((m) => (m.opacity = (m.userData.base ?? (m.userData.base = m.opacity)) * fadeG));
  fente.material.opacity = (enIntro && !introFinie ? clamp(tIntro / 0.8, 0, 1) * (0.25 + 0.75 * charge) : 0) * (1 - ouverture * 1.4);
  flaque.material.opacity = clamp(ouverture * 1.6, 0, 1) * 0.5 * lumieres * fadeG;
  lumHaut.intensity = lumieres * 9 * fadeG;
  lumMurs.forEach((l) => (l.intensity = lumieres * 18 * fadeG));
  lumFace.intensity = (enIntro && !introFinie ? clamp((tIntro - 0.6) / 1.4, 0, 1) * 90 : 30 * (1 - ouverture * 0.6)) * fadeG;
  tubes.forEach((t, i) => {
    /* chaque plafonnier hésite deux fois avant de rester allumé */
    const s = lumieres * 6 - t.i * 0.55;
    const etat = s <= 0 ? 0 : s < 1 ? (Math.sin(s * 23 + i) > 0.2 ? 1 : 0.15) : 1;
    tubesEtat[i] = etat;
    t.m.material.color.setScalar(0.08 + etat * 2.6);
  });
  scene.environmentIntensity = lerp(0.35 + 0.85 * lumieres, 1.15, h);
  scene.environmentRotation.y = calme ? 0 : Math.sin(tPhase * 0.12) * 0.5;

  /* caméra : plan d'intro → showroom → vue haute de la route */
  majCamHero(smx, smy);
  const pos = new THREE.Vector3().lerpVectors(camHero.pos, camIntro.pos, camTransition);
  const cib = new THREE.Vector3().lerpVectors(camHero.cible, camIntro.cible, camTransition);
  camera.position.copy(pos); camera.lookAt(cib);
  qA.copy(camera.quaternion);
  if (h > 0) {
    qB.copy(camRoute.quaternion);
    camera.position.lerp(camRoute.position, h);
    tmpQ.slerpQuaternions(qA, qB, h); camera.quaternion.copy(tmpQ);
  }
  camera.fov = lerp(lerp(camHero.fov, camIntro.fov, camTransition), camRoute.fov, h);
  camera.updateProjectionMatrix();

  const bouge = !introFinie || (heroVisible && (Math.abs(smx - mx) > 0.002 || Math.abs(lacetV) > 0.0005 || !souris)) || monture.visible;
  if (!aRendre && !bouge) return;
  aRendre = false;
  if (!monture.visible && !garage.visible) { rendu.clear(); return; }
  rendu.setClearColor(0x08090b, garage.visible ? 1 : 0);
  rendu.render(scene, camera);
}

dimensionner();
if (/[?&]voies/.test(location.search)) window.__ml = { monture, poseRoute, voies, camera, garage, THREE, caisse, ombreContact };
choisirTraces();
requestAnimationFrame((t) => { derniere = t; image(t); });
