/* PULSE — la semaine en relief.
   Le planning du studio posé au sol : sept colonnes (les jours), le temps
   qui avance du fond (le matin) vers soi (le soir). Chaque cours est un bloc :
   sa longueur = sa durée, sa hauteur = son intensité, sa couleur = sa famille.
   Un battement traverse la semaine toutes les quelques secondes.

   Survol = le cours, clic ou toucher = réservation (événement « pulse:choisir »,
   géré par site.js). Les filtres de la page aplatissent ce qui ne correspond pas.

   Seule dépendance : Three.js r170, servi en local (vendor/). */
import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const P = window.PULSE;
const html = document.documentElement;
const toile = document.getElementById('s3d');
const zone = document.getElementById('semaine');
const bulle = document.getElementById('s3d-bulle');
const calques = document.getElementById('s3d-etiquettes');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const souris = matchMedia('(hover: hover) and (pointer: fine)').matches;
const estMobile = () => innerWidth <= 820;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const amortir = (v, c, k, dt) => lerp(v, c, 1 - Math.exp(-k * dt));
const ioc = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ------------------------------------------------------------ moteur */
let rendu;
try {
  rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  html.classList.add('sans-3d');
  throw e;
}
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.NeutralToneMapping;
rendu.toneMappingExposure = 1.2;
rendu.shadowMap.enabled = !estMobile();
rendu.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x140b0a, 26, 52);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

/* ------------------------------------------------------------ géométrie de la semaine */
const COL = 1.82;            // écart entre deux jours
const LARGE = 1.36;          // largeur d'un bloc
const PAR_H = 0.62;          // profondeur d'une heure
const H0 = 6.5 * 60, H1 = 21.5 * 60;
const zDe = (m) => (m - (H0 + H1) / 2) / 60 * PAR_H;   // matin au fond (z négatif), soir devant
const xDe = (j) => (j - 3) * COL;
const hDe = (int) => 0.12 + int * 0.21;

/* éclairage : un ciel chaud qui débouche les flancs (sinon l'ambre vire au brun),
   une clé de face à gauche, un contre-jour vermillon */
const lumAmb = new THREE.HemisphereLight(0xfff0e4, 0x3a1a12, 1.55);
scene.add(lumAmb);
const cle = new THREE.DirectionalLight(0xffdcb8, 2.5);
cle.position.set(-5, 12, 9);
cle.castShadow = true;
cle.shadow.mapSize.set(1536, 1536);
Object.assign(cle.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
cle.shadow.bias = -0.0006;
cle.shadow.radius = 5;
scene.add(cle);
const contre = new THREE.DirectionalLight(0xff6a3d, 1.1);
contre.position.set(6, 4, -9);
scene.add(contre);

/* le sol : caoutchouc sombre et un tracé discret jours / heures */
const sol = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ color: 0x1b0f0d, roughness: 0.94, metalness: 0 })
);
sol.rotation.x = -Math.PI / 2;
sol.receiveShadow = true;
scene.add(sol);

const traits = [];
const zMin = zDe(H0), zMax = zDe(H1);
for (let j = 0; j <= 7; j++) {
  const x = (j - 3.5) * COL;
  traits.push(x, 0.002, zMin, x, 0.002, zMax);
}
for (let h = 7; h <= 21; h++) {
  const z = zDe(h * 60);
  traits.push(-3.5 * COL, 0.002, z, 3.5 * COL, 0.002, z);
}
const grille = new THREE.LineSegments(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(traits, 3)),
  new THREE.LineBasicMaterial({ color: 0x4a2a24, transparent: true, opacity: 0.55 })
);
scene.add(grille);

/* le repère d'aujourd'hui : une bande de lumière au sol */
const bande = new THREE.Mesh(
  new THREE.PlaneGeometry(COL * 0.96, zMax - zMin),
  new THREE.MeshBasicMaterial({ color: 0xff5a2e, transparent: true, opacity: 0.07, depthWrite: false })
);
bande.rotation.x = -Math.PI / 2;
bande.position.set(xDe(P.aujourdhui), 0.004, (zMin + zMax) / 2);
scene.add(bande);

/* les blocs */
const geo = new RoundedBoxGeometry(1, 1, 1, 4, 0.07);
geo.translate(0, 0.5, 0);          // pivot au sol : on règle la hauteur par scale.y
const gris = new THREE.Color(0x8c8480);   // un cours complet passe au gris chaud

/* ombre de contact : une tache douce sous chaque bloc */
const tacheTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  d.addColorStop(0, 'rgba(0,0,0,0.75)'); d.addColorStop(0.55, 'rgba(0,0,0,0.35)'); d.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = d; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const tacheGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/* deux cours qui se chevauchent le même jour se rangent côte à côte */
const couloirs = {};
for (let j = 0; j < 7; j++) {
  const jour = P.COURS.filter((c) => c.j === j).sort((a, b) => P.minutes(a.h) - P.minutes(b.h));
  const fins = [];
  jour.forEach((c) => {
    const d = P.minutes(c.h);
    let k = fins.findIndex((f) => f <= d);
    if (k < 0) { k = fins.length; fins.push(0); }
    fins[k] = d + c.min;
    couloirs[c.id] = { k };
  });
  jour.forEach((c) => {
    const d = P.minutes(c.h), f = d + c.min;
    const n = 1 + jour.filter((o) => o !== c && P.minutes(o.h) < f && P.minutes(o.h) + o.min > d).length;
    couloirs[c.id].n = Math.min(n, fins.length);
  });
}
const blocs = [];
const groupe = new THREE.Group();
scene.add(groupe);

P.COURS.forEach((c) => {
  const debut = P.minutes(c.h);
  const prof = (c.min / 60) * PAR_H * 0.88;
  const base = new THREE.Color(P.FAMILLES[c.fam].couleur);
  const mat = new THREE.MeshStandardMaterial({ color: base.clone(), roughness: 0.46, metalness: 0.02, emissive: base.clone(), emissiveIntensity: 0.1, transparent: true });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  const { k, n } = couloirs[c.id];
  const large = (LARGE - (n - 1) * 0.08) / n;
  const x = xDe(c.j) - LARGE / 2 + large / 2 + k * (large + 0.08);
  const z = zDe(debut) + prof / 2;
  m.scale.set(large, 0.001, prof);
  m.position.set(x, 0, z);
  const tache = new THREE.Mesh(tacheGeo, new THREE.MeshBasicMaterial({ map: tacheTex, transparent: true, depthWrite: false, opacity: 0 }));
  tache.position.set(x, 0.006, z);
  tache.scale.set(large + 0.55, 1, prof + 0.55);
  groupe.add(tache);
  m.userData = {
    cours: c, base, haut: hDe(c.int), cible: hDe(c.int), h: 0, tache,
    semaine: { x, z, sx: large, sz: prof }, ici: { x, z, sx: large, sz: prof },
    visible: 1, lev: 0, levCible: 0, retard: (c.j * 0.09 + (debut - H0) / 900 * 0.35)
  };
  groupe.add(m);
  blocs.push(m);
});

/* ------------------------------------------------------------ état */
let jourVise = -1;        // -1 = toute la semaine
let filtre = () => true;
let survol = null;
let montee = calme ? 1 : 0;           // 0 → 1 : les blocs sortent du sol
let monteeEnCours = false;
let t0 = performance.now();
let yaw = 0, yawCible = 0, tir = 0, tirCible = 0, angBase = -0.22;
let glisse = null;
let visibleEcran = true;
let demande = false, dernier = performance.now();

function teinte(m) {
  const c = m.userData.cours;
  const reste = P.libres(c);
  const mat = m.material;
  mat.color.copy(m.userData.base);
  const plein = reste === 0 && !P.reserve(c.id);
  if (plein) mat.color.lerp(gris, 0.88);
  m.userData.plein = plein;
  mat.emissive.copy(mat.color);
  mat.emissiveIntensity = P.reserve(c.id) ? 0.32 : (plein ? 0.04 : 0.1);
}
function rafraichir() { blocs.forEach(teinte); demander(); }
P.surChange(rafraichir);
rafraichir();

/* ------------------------------------------------------------ téléphone : un jour à la fois
   Sur petit écran, les cours du jour choisi se rangent en une rangée de
   blocs larges (le doigt doit pouvoir les toucher), les autres rentrent au sol. */
const PAS_MOB = 2.05;
function placerMobile() {
  const mob = estMobile();
  const jour = mob && jourVise >= 0 ? blocs.filter((b) => b.userData.cours.j === jourVise)
    .sort((a, b) => P.minutes(a.userData.cours.h) - P.minutes(b.userData.cours.h)) : [];
  blocs.forEach((b) => {
    const u = b.userData, i = jour.indexOf(b);
    u.ici = i < 0 ? u.semaine : { x: (i - (jour.length - 1) / 2) * PAS_MOB, z: 0, sx: 1.72, sz: 1.5 };
    u.horsJour = mob && i < 0;
  });
  return jour.length;
}
let nJour = 0;

/* ------------------------------------------------------------ cadrage */
let L = 1, H = 1;
const cam = { x: 0, z: 0, dist: 27 };
const camCible = { x: 0, z: 0, dist: 15 };
function cadrage() {
  const mob = estMobile();
  nJour = placerMobile();
  if (mob && jourVise >= 0) {
    const fovH = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * (L / H));
    camCible.x = 0; camCible.z = 0;
    camCible.dist = Math.max(9, ((Math.max(nJour, 3) * PAS_MOB) / 2 + 0.7) / Math.tan(fovH / 2));
  } else if (jourVise >= 0) {
    camCible.x = xDe(jourVise);
    camCible.z = 0.2;
    camCible.dist = mob ? 21 : 19;
  } else {
    camCible.x = 0; camCible.z = 0;
    camCible.dist = mob ? (L / H > 1.2 ? 21 : 31) : (L / H < 1.3 ? 27 : 27);
  }
}
function dimensionner() {
  const r = zone.getBoundingClientRect();
  L = Math.max(1, toile.clientWidth); H = Math.max(1, toile.clientHeight);
  rendu.setPixelRatio(Math.min(devicePixelRatio, estMobile() ? 1.5 : 1.75));
  rendu.setSize(L, H, false);
  camera.aspect = L / H;
  /* sur grand écran, la semaine se décale à droite pour laisser le titre respirer */
  if (innerWidth > 1100) camera.setViewOffset(L, H, -L * 0.14, H * 0.07, L, H);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  cadrage();
  demander();
  void r;
}
addEventListener('resize', dimensionner);

/* ------------------------------------------------------------ étiquettes (HTML projeté) */
const etiquettes = [];
P.COURTS.forEach((nom, j) => {
  const e = document.createElement('span');
  e.className = 's3d-jour' + (j === P.aujourdhui ? ' auj' : '');
  e.textContent = j === P.aujourdhui ? nom + ' · auj.' : nom;
  e.dataset.j = j;
  calques.appendChild(e);
  etiquettes.push({ e, v: new THREE.Vector3(xDe(j), 0, zMax + 0.55) });
});
[7, 12, 18, 21].forEach((h) => {
  const e = document.createElement('span');
  e.className = 's3d-heure';
  e.textContent = String(h).padStart(2, '0') + ' h';
  calques.appendChild(e);
  etiquettes.push({ e, v: new THREE.Vector3(3.5 * COL + 0.6, 0, zDe(h * 60)) });
});
blocs.forEach((b) => {
  const e = document.createElement('span');
  e.className = 's3d-bloc';
  e.innerHTML = `<b>${b.userData.cours.h}</b>${b.userData.cours.nom}`;
  calques.appendChild(e);
  b.userData.etiq = e;
});
const tmp = new THREE.Vector3();
function projeter(v) {
  tmp.copy(v).project(camera);
  return { x: (tmp.x * 0.5 + 0.5) * L, y: (-tmp.y * 0.5 + 0.5) * H, dedans: tmp.z < 1 };
}
function placerEtiquettes() {
  const mobJour = estMobile() && jourVise >= 0;
  calques.classList.toggle('mob-jour', mobJour);
  if (mobJour) {
    blocs.forEach((b) => {
      const e = b.userData.etiq;
      if (b.userData.horsJour) { e.style.opacity = '0'; return; }
      tmp.set(b.position.x, 0, b.position.z + b.scale.z / 2 + 0.25);
      const p = projeter(tmp);
      e.style.opacity = '1';
      e.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,0)`;
    });
    return;
  }
  etiquettes.forEach(({ e, v }) => {
    const p = projeter(v);
    e.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-50%)`;
    e.style.opacity = p.dedans && p.x > 4 && p.x < L - 4 ? '' : '0';
  });
}

/* ------------------------------------------------------------ bulle */
function montrerBulle(m) {
  if (!m) { bulle.hidden = true; return; }
  const c = m.userData.cours;
  const reste = P.libres(c);
  const moi = P.reserve(c.id);
  bulle.innerHTML =
    `<span class="b-heure">${P.COURTS[c.j]} ${c.h} – ${P.fin(c)}</span>` +
    `<b>${c.nom}</b>` +
    `<span class="b-info">${c.coach} · ${P.SALLES[c.salle]} · intensité ${c.int}/5</span>` +
    `<span class="b-etat${reste === 0 && !moi ? ' plein' : ''}">${moi ? 'Réservé pour vous' : reste === 0 ? 'Complet' : reste + (reste > 1 ? ' places' : ' place') + ' · cliquer pour réserver'}</span>`;
  bulle.hidden = false;
  placerBulle(m);
}
function placerBulle(m) {
  if (!m || bulle.hidden) return;
  tmp.set(m.position.x, m.scale.y + m.position.y + 0.2, m.position.z);
  const p = projeter(tmp);
  const x = clamp(p.x, 120, L - 120), y = Math.max(70, p.y);
  bulle.style.transform = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px) translate(-50%,-100%)`;
}

/* ------------------------------------------------------------ pointeur */
const rayon = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function viser(ev) {
  const r = toile.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  rayon.setFromCamera(ndc, camera);
  const touches = rayon.intersectObjects(blocs.filter((b) => b.userData.visible > 0.5 && !b.userData.horsJour && (jourVise < 0 || b.userData.cours.j === jourVise)), false);
  return touches.length ? touches[0].object : null;
}
function changerSurvol(m) {
  if (m === survol) return;
  if (survol) survol.userData.levCible = 0;
  survol = m;
  if (m) m.userData.levCible = 1;
  toile.style.cursor = m ? 'pointer' : '';
  montrerBulle(m);
  demander();
}
toile.addEventListener('pointermove', (ev) => {
  if (ev.pointerType !== 'mouse') return;
  const r = toile.getBoundingClientRect();
  tirCible = ((ev.clientY - r.top) / r.height - 0.5) * 0.08;
  if (glisse) {
    yawCible = clamp(glisse.yaw + (ev.clientX - glisse.x) / r.width * 1.6, -0.75, 0.75);
    glisse.bouge = glisse.bouge || Math.abs(ev.clientX - glisse.x) > 4;
  } else {
    yawCible = calme ? 0 : ((ev.clientX - r.left) / r.width - 0.5) * 0.16;
    changerSurvol(viser(ev));
  }
  demander();
});
toile.addEventListener('pointerleave', () => { changerSurvol(null); if (!glisse) { yawCible = 0; tirCible = 0; } });
toile.addEventListener('pointerdown', (ev) => {
  if (ev.pointerType === 'mouse' && souris) { glisse = { x: ev.clientX, yaw: yawCible, bouge: false }; toile.setPointerCapture(ev.pointerId); }
});
toile.addEventListener('pointerup', (ev) => {
  const g = glisse; glisse = null;
  if (g && g.bouge) return;                        // c'était une rotation, pas un clic
  const m = viser(ev);
  if (m) document.dispatchEvent(new CustomEvent('pulse:choisir', { detail: { id: m.userData.cours.id } }));
  else if (ev.pointerType !== 'mouse') changerSurvol(null);
});
toile.addEventListener('dblclick', () => { yawCible = 0; demander(); });

/* ------------------------------------------------------------ boucle */
function demander() { if (!demande && visibleEcran) { demande = true; requestAnimationFrame(image); } }

function image(maintenant) {
  demande = false;
  const dt = Math.min(0.05, (maintenant - dernier) / 1000); dernier = maintenant;
  let actif = false;

  if (monteeEnCours) {
    montee = clamp((maintenant - t0) / 2200, 0, 1);
    if (montee >= 1) monteeEnCours = false; else actif = true;
  }
  const temps = (maintenant - t0) / 1000;
  /* le battement : une onde qui traverse la semaine de gauche à droite toutes les 3,2 s */
  const cycle = calme ? -1 : (temps % 3.2) / 1.5;

  blocs.forEach((m) => {
    const u = m.userData;
    const m0 = clamp((montee * 1.6 - u.retard), 0, 1);
    const cible = (u.horsJour ? 0.001 : u.visible ? u.cible : 0.05) * ioc(m0);
    const avX = m.position.x;
    m.position.x = amortir(m.position.x, u.ici.x, 7, dt);
    m.position.z = amortir(m.position.z, u.ici.z, 7, dt);
    m.scale.x = amortir(m.scale.x, u.ici.sx, 7, dt);
    m.scale.z = amortir(m.scale.z, u.ici.sz, 7, dt);
    if (Math.abs(avX - u.ici.x) > 0.002 || Math.abs(m.scale.x - u.ici.sx) > 0.002) actif = true;
    const avant = u.h;
    u.h = amortir(u.h, cible, 9, dt);
    u.lev = amortir(u.lev, u.levCible, 12, dt);
    let coup = 0;
    if (cycle >= 0 && cycle <= 1.2 && u.visible) {
      const front = cycle * 8 - 1, d = (u.cours.j + 0.5) - front;
      coup = Math.exp(-d * d * 3) * 0.16 * (u.cours.int / 5);
    }
    m.scale.y = Math.max(0.001, u.h + coup);
    m.position.y = u.lev * 0.14;
    const opa = (u.horsJour ? 0 : !u.visible ? 0.35 : (jourVise < 0 || u.cours.j === jourVise ? 1 : 0.12)) * (u.plein ? 0.6 : 1);
    const t = u.tache;
    t.position.x = m.position.x; t.position.z = m.position.z;
    t.scale.set(m.scale.x + 0.55, 1, m.scale.z + 0.55);
    t.material.opacity = Math.min(1, m.scale.y * 1.6) * 0.55 * m.material.opacity;
    if (Math.abs(avant - u.h) > 0.0008 || Math.abs(u.lev - u.levCible) > 0.002) actif = true;
    const o = m.material.opacity; m.material.opacity = amortir(o, opa, 8, dt);
    if (Math.abs(o - opa) > 0.005) actif = true;
    m.material.depthWrite = m.material.opacity > 0.9;
  });
  if (!calme) actif = true;           // le battement continue tant que la scène est à l'écran

  const mobJour = estMobile() && jourVise >= 0;
  const angVise = estMobile() ? 0 : (jourVise < 0 ? -0.22 : -0.08);
  grille.material.opacity = amortir(grille.material.opacity, mobJour ? 0 : 0.55, 6, dt);
  bande.visible = !mobJour;
  cam.x = amortir(cam.x, camCible.x, 4, dt);
  cam.z = amortir(cam.z, camCible.z, 4, dt);
  cam.dist = amortir(cam.dist, camCible.dist, 4, dt);
  yaw = amortir(yaw, yawCible, 5, dt);
  tir = amortir(tir, tirCible, 5, dt);
  if (Math.abs(angBase - angVise) > 0.001 || Math.abs(cam.dist - camCible.dist) > 0.01 || Math.abs(cam.x - camCible.x) > 0.005 || Math.abs(yaw - yawCible) > 0.001) actif = true;

  angBase = amortir(angBase, angVise, 4, dt);
  const ang = angBase + yaw;
  const elev = (mobJour ? 0.5 : 0.9) + tir;
  camera.position.set(
    cam.x + Math.sin(ang) * Math.cos(elev) * cam.dist,
    Math.sin(elev) * cam.dist,
    cam.z + Math.cos(ang) * Math.cos(elev) * cam.dist
  );
  camera.lookAt(cam.x, 0.4, cam.z);

  bande.material.opacity = 0.05 + (calme ? 0 : Math.max(0, Math.sin(temps * 2.4)) * 0.035);
  rendu.render(scene, camera);
  placerEtiquettes();
  placerBulle(survol);
  if (actif) demander();
}

/* ------------------------------------------------------------ pause hors écran */
new IntersectionObserver((e) => {
  visibleEcran = e[0].isIntersecting;
  if (visibleEcran) { dernier = performance.now(); demander(); }
}, { rootMargin: '80px' }).observe(zone);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { dernier = performance.now(); demander(); } });

/* ------------------------------------------------------------ API pour site.js */
window.PULSE3D = {
  monter() {
    if (calme) { montee = 1; demander(); return; }
    t0 = performance.now(); montee = 0; monteeEnCours = true; demander();
  },
  jour(j) { jourVise = j; cadrage(); if (survol) changerSurvol(null); demander(); },
  filtrer(fn) {
    filtre = fn;
    blocs.forEach((m) => { m.userData.visible = filtre(m.userData.cours) ? 1 : 0; });
    if (survol && !survol.userData.visible) changerSurvol(null);
    demander();
  }
};
dimensionner();
html.classList.add('s3d-pret');
document.dispatchEvent(new CustomEvent('pulse:3d-pret'));
