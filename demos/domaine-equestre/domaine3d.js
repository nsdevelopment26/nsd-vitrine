/* ============================================================================
   Domaine de Valombre : le domaine en relief (Three.js r170, local, MIT).
   Une maquette topographique posée sur son socle : relief et courbes de niveau,
   écuries, manège, carrière, prés, forêt, chevaux en figurines, brume qui
   remplit les creux, lumière qui suit l'heure du jour, balades tracées.
   Tout est dessiné en code : aucun modèle externe, aucune autre librairie.

   Écoute : valombre:lieu {id}, valombre:heure {h}, valombre:balade {id},
            valombre:journee {actif, h, lieu}, valombre:passer
   Émet   : valombre:pret, valombre:choix {id}, valombre:intro-fin
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { clone as clonerSquelette } from './vendor/SkeletonUtils.js';

const D = window.VALOMBRE;
const doc = document.documentElement;
const scene3d = document.getElementById('scene3d');
const stage = document.getElementById('vue');
const pinsBox = document.getElementById('pins');
if (!scene3d || !stage) throw new Error('scène absente');

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const petit = () => innerWidth < 820;
const MOBILE = petit();

/* ---------- bruit (relief) ---------- */
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x, z) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* Le relief naturel : plateau devant, colline boisée derrière (z négatif). */
function naturel(x, z) {
  const fond = lisse(8, -46, z);
  let h = fond * fond * 15;
  h += fbm(x * 0.034 + 3.1, z * 0.034 - 1.7) * 4.2 * (0.35 + fond);
  h += Math.sin(x * 0.055 + 0.6) * 1.4 * fond;
  h -= lisse(18, 42, z) * 1.6;
  return h;
}

/* Les zones aplanies (bâtiments, carrière, prés). */
const ZONES = [
  { id: 'ecuries', cx: -14, cz: 4, w: 25, d: 9, m: 6 },
  { id: 'manege', cx: 8, cz: 0, w: 20, d: 13, m: 6 },
  { id: 'carriere', cx: 16, cz: 16, w: 21, d: 14, m: 5 },
  { id: 'pres', cx: 0, cz: 30, w: 26, d: 13, m: 6 },
  { id: 'poneys', cx: -27, cz: 18, w: 15, d: 13, m: 5 },
  { id: 'club', cx: -30, cz: 9, w: 7, d: 6, m: 4 }
];
ZONES.forEach(z => { z.h = naturel(z.cx, z.cz); });
const LIEUX = Object.fromEntries(D.lieux.map(l => [l.id, l]));

function hauteur(x, z) {
  let h = naturel(x, z);
  for (const zo of ZONES) {
    const dx = Math.max(0, Math.abs(x - zo.cx) - zo.w / 2), dz = Math.max(0, Math.abs(z - zo.cz) - zo.d / 2);
    const f = 1 - lisse(0, zo.m, Math.hypot(dx, dz));
    h = h + (zo.h - h) * f;
  }
  return h;
}
function dansZone(x, z, marge = 0) {
  return ZONES.some(zo => Math.abs(x - zo.cx) < zo.w / 2 + marge && Math.abs(z - zo.cz) < zo.d / 2 + marge);
}

/* L'allée : du bord sud jusqu'aux écuries. */
const ALLEE = [[-16, 44], [-16, 15], [-13, 9]];
function distSeg(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(px - ax - vx * t, pz - az - vz * t);
}
function distPoly(px, pz, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }

/* ---------- moteur ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: scene3d, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe4eaee, 150, 330);
const camera = new THREE.PerspectiveCamera(30, 1, 1, 900);

const hemi = new THREE.HemisphereLight(0xdfe8ef, 0x5d5a3e, 1.1);
scene.add(hemi);
const soleil = new THREE.DirectionalLight(0xffffff, 2.4);
soleil.castShadow = true;
soleil.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
const sc = soleil.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 400;
soleil.shadow.bias = -0.0006; soleil.shadow.normalBias = 0.4;
scene.add(soleil, soleil.target);

const C = c => new THREE.Color(c);

/* ---------- le relief ---------- */
const W = 124, P = 104, X0 = 0, Z0 = -10;
const segX = MOBILE ? 124 : 186, segZ = MOBILE ? 104 : 156;
const geoT = new THREE.PlaneGeometry(W, P, segX, segZ);
geoT.rotateX(-Math.PI / 2);
geoT.translate(X0, 0, Z0);
const pos = geoT.attributes.position;
const cols = new Float32Array(pos.count * 3);
const herbe = C('#8f9c68'), herbe2 = C('#7c8a55'), sous = C('#6c6a45'), sable = C('#d9ccb1'), gravier = C('#b9b4a8'), pre = C('#93a26a');
const tmp = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i);
  const h = hauteur(x, z);
  pos.setY(i, h);
  const n = fbm(x * 0.09, z * 0.09);
  tmp.copy(herbe).lerp(herbe2, 0.5 + n * 0.5);
  const bois = lisse(-6, -20, z);
  tmp.lerp(sous, bois * 0.75);
  const pz = ZONES.find(zo => zo.id === 'pres'), po = ZONES.find(zo => zo.id === 'poneys');
  if (Math.abs(x - pz.cx) < pz.w / 2 && Math.abs(z - pz.cz) < pz.d / 2) tmp.lerp(pre, 0.6);
  if (Math.abs(x - po.cx) < po.w / 2 && Math.abs(z - po.cz) < po.d / 2) tmp.lerp(pre, 0.5);
  const ca = ZONES.find(zo => zo.id === 'carriere');
  if (Math.abs(x - ca.cx) < 9 && Math.abs(z - ca.cz) < 5.5) tmp.copy(sable);
  const dA = distPoly(x, z, ALLEE);
  if (dA < 1.3) tmp.lerp(gravier, 1 - lisse(0.7, 1.3, dA));
  if (Math.abs(x + 14) < 13 && Math.abs(z - 9) < 2.2) tmp.lerp(gravier, 0.85);
  cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
}
geoT.setAttribute('color', new THREE.BufferAttribute(cols, 3));
geoT.computeVertexNormals();

const matT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
const uCourbes = { value: 1 };
matT.onBeforeCompile = sh => {
  sh.uniforms.uCourbes = uCourbes;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vH;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vH;\nuniform float uCourbes;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      float pas = 1.6;
      float f = abs(fract(vH / pas + 0.5) - 0.5) * pas;
      float w = fwidth(vH) * 1.1;
      float ligne = 1.0 - smoothstep(0.0, w, f);
      float maj = 1.0 - step(0.5, abs(mod(floor(vH / pas + 0.5), 5.0)));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.78 - 0.1 * maj), ligne * uCourbes * 0.55);`);
};
matT.customProgramCacheKey = () => 'valombre-relief';
const relief = new THREE.Mesh(geoT, matT);
relief.receiveShadow = true;
scene.add(relief);

/* Les tranches de la maquette et le socle. */
(function tranches() {
  const bas = -5.5, verts = [], idx = [];
  const bords = [];
  const nx = segX + 1, nz = segZ + 1;
  const at = (ix, iz) => { const k = iz * nx + ix; return [pos.getX(k), pos.getY(k), pos.getZ(k)]; };
  bords.push([...Array(nx).keys()].map(i => at(i, nz - 1)));             // sud
  bords.push([...Array(nz).keys()].map(i => at(nx - 1, nz - 1 - i)));    // est
  bords.push([...Array(nx).keys()].map(i => at(nx - 1 - i, 0)));         // nord
  bords.push([...Array(nz).keys()].map(i => at(0, i)));                  // ouest
  for (const b of bords) {
    const base = verts.length / 3;
    b.forEach(([x, y, z]) => { verts.push(x, y, z, x, bas, z); });
    for (let i = 0; i < b.length - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: '#6e5442', roughness: 1, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvY = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vY;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float s = step(0.5, fract(vY * 0.62));
        diffuseColor.rgb *= mix(0.86, 1.0, s) * mix(0.75, 1.0, smoothstep(-5.5, 2.0, vY));`);
  };
  m.customProgramCacheKey = () => 'valombre-tranche';
  scene.add(new THREE.Mesh(g, m));
  const socle = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 1.4, P + 3), new THREE.MeshStandardMaterial({ color: '#2b1d15', roughness: 0.6 }));
  socle.position.set(X0, bas - 0.7, Z0);
  socle.receiveShadow = true;
  scene.add(socle);
})();

/* ---------- bâtiments ---------- */
const pierre = new THREE.MeshStandardMaterial({ color: '#d4d2c9', roughness: 0.9 });
const ardoise = new THREE.MeshStandardMaterial({ color: '#4d5762', roughness: 0.7 });
const bardage = new THREE.MeshStandardMaterial({ color: '#5e4c3d', roughness: 0.9 });
const chene = new THREE.MeshStandardMaterial({ color: '#8b6a47', roughness: 0.8 });
const lisseBlanche = new THREE.MeshStandardMaterial({ color: '#f2f3f0', roughness: 0.6 });
const piquet = new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.9 });

function batiment(cx, cz, w, d, hm, ht, murs, rot = 0) {
  const g = new THREE.Group();
  const y0 = hauteur(cx, cz);
  const corps = new THREE.Mesh(new THREE.BoxGeometry(w, hm, d), murs);
  corps.position.y = hm / 2;
  const forme = new THREE.Shape();
  forme.moveTo(-d / 2 - 0.5, 0); forme.lineTo(d / 2 + 0.5, 0); forme.lineTo(0, ht); forme.closePath();
  const tg = new THREE.ExtrudeGeometry(forme, { depth: w + 0.8, bevelEnabled: false });
  tg.rotateY(Math.PI / 2); tg.translate(-(w + 0.8) / 2, hm, 0);
  const toit = new THREE.Mesh(tg, ardoise);
  g.add(corps, toit);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(cx, y0, cz); g.rotation.y = rot;
  scene.add(g);
  return g;
}
const ecuries = batiment(-14, 4, 22, 6, 2.6, 2.4, pierre);
/* le manège : un hangar en bois ouvert au sud sur les prés, comme sur la photo */
const manege = (function () {
  const g = new THREE.Group(), w = 18, d = 11, hm = 4.2, ht = 3.4;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(w - 0.4, 0.06, d - 0.4), new THREE.MeshStandardMaterial({ color: '#d9ccb1', roughness: 1 }), 0, 0.03, 0);
  add(new THREE.BoxGeometry(w, hm, 0.3), bardage, 0, hm / 2, -d / 2 + 0.15);
  add(new THREE.BoxGeometry(0.3, hm, d), bardage, -w / 2 + 0.15, hm / 2, 0);
  add(new THREE.BoxGeometry(0.3, hm, d), bardage, w / 2 - 0.15, hm / 2, 0);
  add(new THREE.BoxGeometry(w, 0.9, 0.16), bardage, 0, 0.45, d / 2 - 0.1);
  for (let i = 0; i <= 6; i++) add(new THREE.BoxGeometry(0.34, hm, 0.34), chene, -w / 2 + 0.2 + i * (w - 0.4) / 6, hm / 2, d / 2 - 0.1);
  add(new THREE.BoxGeometry(w, 0.4, 0.36), chene, 0, hm - 0.2, d / 2 - 0.1);
  const forme = new THREE.Shape();
  forme.moveTo(-d / 2 - 0.5, 0); forme.lineTo(d / 2 + 0.5, 0); forme.lineTo(0, ht); forme.closePath();
  const tg = new THREE.ExtrudeGeometry(forme, { depth: w + 0.8, bevelEnabled: false });
  tg.rotateY(Math.PI / 2); tg.translate(-(w + 0.8) / 2, hm, 0);
  g.add(new THREE.Mesh(tg, ardoise));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(8, hauteur(8, 0), 0); scene.add(g);
  return g;
})();
const club = batiment(-30, 9, 5, 4, 2.2, 1.8, pierre);
/* portes des boxes */
(function portes() {
  const n = 9, g = new THREE.BoxGeometry(1.0, 1.7, 0.12);
  const im = new THREE.InstancedMesh(g, chene, n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.makeTranslation(-14 - 9 + i * 2.25, hauteur(-14, 4) + 0.85, 4 + 3.02); im.setMatrixAt(i, m); }
  scene.add(im);
})();
/* abri du pré */
(function abri() {
  const g = new THREE.Group(), x = 8, z = 33.2, y = hauteur(x, z);
  const t = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 3.6), ardoise); t.position.y = 2.3; t.rotation.x = 0.12; g.add(t);
  const fond = new THREE.Mesh(new THREE.BoxGeometry(6, 2.1, 0.2), bardage); fond.position.set(0, 1.05, -1.6); g.add(fond);
  [[-2.8, 1.6], [2.8, 1.6]].forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.22), chene); p.position.set(px, 1.1, pz); g.add(p); });
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(x, y, z); scene.add(g);
})();

/* lanternes de l'écurie : elles s'allument le soir */
const lanternes = new THREE.MeshBasicMaterial({ color: '#ffd59a', transparent: true, opacity: 0 });
(function () {
  const g = new THREE.SphereGeometry(0.16, 8, 6), n = 8, im = new THREE.InstancedMesh(g, lanternes, n), m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.makeTranslation(-14 - 8.7 + i * 2.5, hauteur(-14, 4) + 2.1, 4 + 3.2); im.setMatrixAt(i, m); }
  scene.add(im);
})();

/* ---------- clôtures ---------- */
function cloture(pts, matPiquet, matLisse, ecart = 2.2, hauteurs = [0.55, 0.95]) {
  const poteaux = [], lisses = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / ecart));
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const p0 = [ax + (bx - ax) * t0, az + (bz - az) * t0], p1 = [ax + (bx - ax) * t1, az + (bz - az) * t1];
      poteaux.push(p0);
      lisses.push([p0, p1]);
    }
  }
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  const ip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.15, 0.16), matPiquet, poteaux.length);
  poteaux.forEach(([x, z], i) => { mm.makeTranslation(x, hauteur(x, z) + 0.5, z); ip.setMatrixAt(i, mm); });
  ip.castShadow = true;
  const il = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.08, 0.06), matLisse, lisses.length * hauteurs.length);
  let j = 0;
  for (const [[x0, z0], [x1, z1]] of lisses) {
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(-(z1 - z0), x1 - x0);
    const y0 = hauteur(x0, z0), y1 = hauteur(x1, z1), pente = Math.atan2(y1 - y0, L);
    q.setFromEuler(new THREE.Euler(0, ang, pente, 'YZX'));
    for (const hh of hauteurs) {
      v.set((x0 + x1) / 2, (y0 + y1) / 2 + hh, (z0 + z1) / 2); s.set(L, 1, 1);
      mm.compose(v, q, s); il.setMatrixAt(j++, mm);
    }
  }
  il.castShadow = true;
  scene.add(ip, il);
}
const rect = (cx, cz, w, d) => [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx + w / 2, cz + d / 2], [cx - w / 2, cz + d / 2], [cx - w / 2, cz - d / 2]];
cloture(rect(16, 16, 18, 11), lisseBlanche, lisseBlanche, 2.5, [0.45, 0.9]);
cloture(rect(0, 30, 24, 11), piquet, piquet);
cloture(rect(-27, 18, 13, 11), piquet, piquet);
cloture([[-24, -3], [-24, 0.4], [-4, 0.4]], piquet, piquet);

/* ---------- arbres ---------- */
const PATHS = D.balades.map(b => b.points);
(function arbres() {
  const max = MOBILE ? 380 : 700;
  const pal = ['#9a7b3c', '#b06a33', '#6f7b47', '#8b9055', '#c29b4b', '#7d6a3a', '#5f6d40'].map(C);
  const couronnes = [], rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  // chênes de l'allée
  for (let z = 16; z <= 40; z += 3.4) { couronnes.push([-19, z, 1.5 + rnd() * 0.3, 'chene']); couronnes.push([-13.4, z + 1.2, 1.35 + rnd() * 0.25, 'chene']); }
  let essais = 0;
  while (couronnes.length < max && essais < max * 12) {
    essais++;
    const x = -60 + rnd() * 120, z = -60 + rnd() * 98;
    const foret = lisse(-8, -22, z) * (0.7 + 0.3 * fbm(x * 0.06, z * 0.06));
    const haie = Math.exp(-Math.pow((z - 37) / 1.8, 2)) * 0.28 + Math.exp(-Math.pow((x - 52) / 4, 2)) * 0.35 * lisse(30, 0, z) + Math.exp(-Math.pow((x + 50) / 4, 2)) * 0.35;
    const p = Math.max(foret, haie);
    if (rnd() > p) continue;
    if (dansZone(x, z, 2.2)) continue;
    if (distPoly(x, z, ALLEE) < 2.2) continue;
    if (PATHS.some(pts => distPoly(x, z, pts) < 1.7)) continue;
    couronnes.push([x, z, 1.0 + rnd() * 1.1, 'bois']);
  }
  const n = couronnes.length;
  // une couronne = trois masses lisses (plus une sphère à facettes)
  const masses = [[0, 0, 0, 1], [0.58, -0.28, 0.22, 0.7], [-0.5, -0.22, -0.3, 0.68]];
  const pos = [], nor = [];
  for (const [mx, my, mz, mr] of masses) {
    const sg = new THREE.IcosahedronGeometry(mr, 2);
    const p = sg.attributes.position, nn = sg.attributes.normal;
    for (let k = 0; k < p.count; k++) { pos.push(p.getX(k) + mx, p.getY(k) * 1.08 + my, p.getZ(k) + mz); nor.push(nn.getX(k), nn.getY(k), nn.getZ(k)); }
    sg.dispose();
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  cg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const tg = new THREE.CylinderGeometry(0.12, 0.18, 1, 5); tg.translate(0, 0.5, 0);
  const mc = new THREE.MeshStandardMaterial({ roughness: 0.92 });
  const mt = new THREE.MeshStandardMaterial({ color: '#4a3b2e', roughness: 1 });
  const ic = new THREE.InstancedMesh(cg, mc, n), it = new THREE.InstancedMesh(tg, mt, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  couronnes.forEach(([x, z, r, k], i) => {
    const y = hauteur(x, z), tronc = r * 1.1;
    v.set(x, y + tronc + r * 0.9, z); q.setFromEuler(new THREE.Euler(0, rnd() * 6, 0)); s.set(r, r, r);
    m.compose(v, q, s); ic.setMatrixAt(i, m);
    ic.setColorAt(i, pal[Math.floor(rnd() * pal.length)].clone().multiplyScalar(k === 'chene' ? 0.95 : 0.85 + rnd() * 0.25));
    v.set(x, y, z); s.set(1, tronc + r * 0.4, 1); m.compose(v, q, s); it.setMatrixAt(i, m);
  });
  ic.castShadow = true; ic.receiveShadow = true; it.castShadow = true;
  scene.add(ic, it);
})();

/* ---------- chevaux en figurines ----------
   « Horse » de Quaternius (CC0, via poly.pizza), allégé à 4 animations : on le charge une fois,
   on le clone par cheval (squelette compris) et on le teinte selon la robe. */
const ROBES = {
  bai: { Main: '#6e3a1f', Main_Dark: '#2a1d16', Hair: '#17110e', Muzzle: '#2a1d16', Hooves: '#2b2622', Main_Light: '#7d4528' },
  gris: { Main: '#c9c9c4', Main_Dark: '#8e8f8c', Hair: '#e4e4e0', Muzzle: '#4f4f4d', Hooves: '#4a4642', Main_Light: '#d8d8d4' },
  alezan: { Main: '#94532c', Main_Dark: '#7a4223', Hair: '#a8663a', Muzzle: '#5e3420', Hooves: '#6a5a4a', Main_Light: '#a0603a' },
  noir: { Main: '#211e1d', Main_Dark: '#151313', Hair: '#0e0d0d', Muzzle: '#1a1817', Hooves: '#262321', Main_Light: '#2a2625' },
  poney: { Main: '#4a2c1c', Main_Dark: '#231812', Hair: '#1a120e', Muzzle: '#231812', Hooves: '#2b2622', Main_Light: '#553322' }
};
const matsRobe = {};
function materiauRobe(robe, m) {
  const k = robe + '|' + m.name;
  if (!matsRobe[k]) {
    const c = m.clone();
    if (ROBES[robe][m.name]) c.color.set(ROBES[robe][m.name]);
    c.roughness = 0.72; c.metalness = 0;
    matsRobe[k] = c;
  }
  return matsRobe[k];
}
const ECHELLE_CHEVAL = 2.35 / 5.69;   // le modèle mesure 5,69 unités du nez à la queue
const chevaux = [], melangeurs = [];
function cheval(robe, anim = 'Idle', cavalier = false, echelle = 1) {
  const g = new THREE.Group();
  chevaux.push({ g, robe, anim, cavalier, echelle });
  return g;
}
function poser(g, x, z, rot) { g.position.set(x, hauteur(x, z), z); g.rotation.y = rot; scene.add(g); return g; }
poser(cheval('bai', 'Eating'), -6, 29, 0.4);
poser(cheval('gris', 'Eating'), 2, 32.5, 2.6);
poser(cheval('alezan', 'Idle_Headlow'), 7, 27.5, -0.9);
poser(cheval('noir', 'Idle'), -8.5, 33, 1.2);
poser(cheval('poney', 'Eating', false, 0.72), -29, 19, 0.8);
poser(cheval('poney', 'Idle', false, 0.72), -24.5, 21, 2.2);
poser(cheval('gris', 'Idle_Headlow'), -18, -1.4, 0.1);
const reprise = poser(cheval('gris', 'Walk', true), 16, 16, 0);

/* Les cavaliers de la balade, sur le tracé choisi. */
const cortege = [cheval('bai', 'Walk', true), cheval('gris', 'Walk', true)];
cortege.forEach(c => { c.visible = false; scene.add(c); });

/* Le cavalier : figurine simple mais assise (selle, cuisses, bottes, buste, bombe, bras aux rênes). */
const tenue = {
  veste: new THREE.MeshStandardMaterial({ color: '#232c3f', roughness: 0.8 }),
  culotte: new THREE.MeshStandardMaterial({ color: '#cfc6b4', roughness: 0.85 }),
  bottes: new THREE.MeshStandardMaterial({ color: '#151313', roughness: 0.45 }),
  bombe: new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.35 }),
  peau: new THREE.MeshStandardMaterial({ color: '#c99b7f', roughness: 0.8 }),
  tapis: new THREE.MeshStandardMaterial({ color: '#eceee9', roughness: 0.9 })
};
function cavalierFig() {
  const r = new THREE.Group();
  const add = (geo, mat, x, y, z, rz = 0, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; r.add(m); return m; };
  add(new THREE.BoxGeometry(0.5, 0.04, 0.5), tenue.tapis, 0, -0.02, 0);
  add(new THREE.CapsuleGeometry(0.075, 0.24, 3, 8), tenue.culotte, 0.1, 0.03, 0.15, -1.25, 0.25);
  add(new THREE.CapsuleGeometry(0.075, 0.24, 3, 8), tenue.culotte, 0.1, 0.03, -0.15, -1.25, -0.25);
  add(new THREE.CapsuleGeometry(0.058, 0.3, 3, 8), tenue.bottes, 0.2, -0.26, 0.22, 0.12, 0.1);
  add(new THREE.CapsuleGeometry(0.058, 0.3, 3, 8), tenue.bottes, 0.2, -0.26, -0.22, 0.12, -0.1);
  add(new THREE.CapsuleGeometry(0.12, 0.26, 3, 10), tenue.veste, 0.0, 0.27, 0, -0.1);
  add(new THREE.SphereGeometry(0.075, 12, 10), tenue.peau, 0.06, 0.56, 0);
  add(new THREE.SphereGeometry(0.085, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), tenue.bombe, 0.05, 0.585, 0);
  add(new THREE.CapsuleGeometry(0.038, 0.24, 3, 6), tenue.veste, 0.14, 0.3, 0.13, -0.95);
  add(new THREE.CapsuleGeometry(0.038, 0.24, 3, 6), tenue.veste, 0.14, 0.3, -0.13, -0.95);
  return r;
}

new GLTFLoader().load('modeles/cheval.glb', gltf => {
  const clips = Object.fromEntries(gltf.animations.map(a => [a.name, a]));
  const v = new THREE.Vector3();
  chevaux.forEach(({ g, robe, anim, cavalier, echelle }, i) => {
    const o = clonerSquelette(gltf.scene);
    o.traverse(m => { if (m.isMesh) { m.material = materiauRobe(robe, m.material); m.castShadow = true; m.frustumCulled = false; } });
    o.scale.setScalar(ECHELLE_CHEVAL * echelle);
    if (robe === 'poney') o.scale.y *= 0.86;   // un poney est plus trapu qu'un petit cheval
    o.rotation.y = Math.PI / 2;           // le modèle regarde +z, la scène attend +x
    g.add(o);
    const mx = new THREE.AnimationMixer(o);
    const act = mx.clipAction(clips[anim] || clips.Idle);
    act.play(); act.time = (i * 0.83) % act.getClip().duration;
    mx.update(0);
    melangeurs.push(mx);
    if (cavalier) {
      g.updateMatrixWorld(true);
      const dos = o.getObjectByName('Torso2') || o.getObjectByName('Torso');   // le creux du dos, là où va la selle
      dos.getWorldPosition(v); g.worldToLocal(v);
      const fig = cavalierFig();
      fig.position.set(v.x + 0.02, v.y + 0.29 * echelle, 0);
      g.add(fig);
      g.updateMatrixWorld(true);
      dos.attach(fig);                   // le cavalier suit le dos du cheval au pas
    }
  });
}, undefined, e => console.warn('cheval', e));

/* ---------- balades ---------- */
const accent = C('#c3cf86'), accentFonce = C('#4f5d1c');
const traces = D.balades.map(b => {
  const pts = b.points.map(([x, z]) => new THREE.Vector3(x, hauteur(x, z) + 0.2, z));
  const courbe = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4);
  const fins = courbe.getSpacedPoints(Math.max(120, Math.round(courbe.getLength() * 2)));
  fins.forEach(p => { p.y = hauteur(p.x, p.z) + 0.22; });
  const lisseC = new THREE.CatmullRomCurve3(fins);
  const longueur = lisseC.getLength();
  const geo = new THREE.TubeGeometry(lisseC, fins.length, 0.34, 6, false);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uP: { value: 0 }, uA: { value: 0 }, uC: { value: C('#e2ec9f') }, uL: { value: longueur }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uP, uA, uL, uT; uniform vec3 uC;
      void main(){
        if (vUv.x > uP) discard;
        float d = fract(vUv.x * uL / 2.4 - uT * 0.4);
        float tiret = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.62, 0.7, d));
        float tete = smoothstep(uP - 0.02, uP, vUv.x);
        gl_FragColor = vec4(mix(uC, vec3(1.0), tete * 0.7), uA * mix(0.45, 1.0, tiret));
      }`
  });
  const tube = new THREE.Mesh(geo, mat);
  tube.renderOrder = 3;
  scene.add(tube);
  return { id: b.id, courbe: lisseC, longueur, mat, cible: 0, actif: false };
});

/* ---------- anneaux des lieux ---------- */
const TAILLES = { ecuries: [15, 6], manege: [12, 9], carriere: [13, 9], pres: [15, 9], poneys: [9, 8], foret: [22, 14] };
const anneaux = {}, cibles = {};
for (const l of D.lieux) {
  const [rx, rz] = TAILLES[l.id];
  const g = new THREE.RingGeometry(0.94, 1, 96); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false });
  const r = new THREE.Mesh(g, m);
  r.scale.set(rx, 1, rz);
  r.position.set(l.x, hauteur(l.x, l.z) + (l.id === 'foret' ? 6 : 0.35), l.z);
  r.renderOrder = 2;
  scene.add(r);
  anneaux[l.id] = r;
  // zone de clic invisible
  const hb = new THREE.Mesh(new THREE.BoxGeometry(rx * 1.6, l.id === 'foret' ? 12 : 6, rz * 1.6), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  hb.position.set(l.x, hauteur(l.x, l.z) + 2, l.z);
  hb.userData.lieu = l.id;
  scene.add(hb);
  cibles[l.id] = hb;
}

/* ---------- brume ---------- */
const HM = 96;
const hData = new Float32Array(HM * HM);
for (let j = 0; j < HM; j++) for (let i = 0; i < HM; i++) hData[j * HM + i] = hauteur(-62 + 124 * i / (HM - 1), -62 + 104 * j / (HM - 1));
const hTex = new THREE.DataTexture(hData, HM, HM, THREE.RedFormat, THREE.FloatType);
hTex.magFilter = THREE.LinearFilter; hTex.minFilter = THREE.LinearFilter; hTex.needsUpdate = true;
const uBrume = { value: 1 }, uTemps = { value: 0 }, uCouleurB = { value: C('#eef2f3') };
const brumes = [];
[0.9, 2.2, 3.8, 5.6].forEach((y, k) => {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uH: { value: hTex }, uY: { value: y }, uD: uBrume, uT: uTemps, uC: uCouleurB, uK: { value: k } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform sampler2D uH; uniform float uY, uD, uT, uK; uniform vec3 uC;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fb(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*n(p); p *= 2.02; a *= 0.5; } return s; }
      void main(){
        vec2 uv = vec2((vW.x + 62.0) / 124.0, (vW.z + 62.0) / 104.0);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
        float sol = texture2D(uH, uv).r;
        float ep = smoothstep(0.0, 1.6, uY - sol);
        float bord = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x) * smoothstep(0.0, 0.06, uv.y) * smoothstep(1.0, 0.94, uv.y);
        vec2 q = vW.xz * 0.045 + vec2(uT * 0.012 + uK * 3.1, uT * 0.007 - uK * 1.7);
        float nn = fb(q + fb(q * 1.7 + uT * 0.01));
        float a = smoothstep(0.32, 0.85, nn) * ep * bord * uD * (0.55 - uK * 0.09);
        gl_FragColor = vec4(uC, a);
      }`
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(124, 104, 1, 1), mat);
  p.rotation.x = -Math.PI / 2; p.position.set(0, y, -10); p.renderOrder = 4;
  scene.add(p); brumes.push(p);
});

/* ---------- l'heure du jour ---------- */
const CLES = [
  { h: 6, soleil: '#ffb98c', i: 0.7, ciel: '#c3ccd8', horizon: '#e9d9d2', hs: '#c9d2dc', hg: '#4f4b3b', hi: 0.8, brume: 1.25, lampes: 1 },
  { h: 7.5, soleil: '#ffd2ad', i: 1.5, ciel: '#c8d3dd', horizon: '#ece2dc', hs: '#d6dfe7', hg: '#5a5640', hi: 0.95, brume: 1.0, lampes: 0.5 },
  { h: 10, soleil: '#fff2e0', i: 2.5, ciel: '#bccdda', horizon: '#e6ecef', hs: '#dfe8ef', hg: '#5d5a3e', hi: 1.1, brume: 0.38, lampes: 0 },
  { h: 13, soleil: '#ffffff', i: 2.9, ciel: '#adc4d7', horizon: '#e2eaef', hs: '#e3ecf3', hg: '#605d40', hi: 1.15, brume: 0.12, lampes: 0 },
  { h: 16, soleil: '#ffe4c2', i: 2.4, ciel: '#b7c6d4', horizon: '#ebe7e3', hs: '#e1e5ea', hg: '#5f5940', hi: 1.05, brume: 0.2, lampes: 0 },
  { h: 18, soleil: '#ffb886', i: 1.5, ciel: '#8d9ab0', horizon: '#e8cdbd', hs: '#c6cbd8', hg: '#4c4535', hi: 0.85, brume: 0.45, lampes: 0.8 },
  { h: 19.5, soleil: '#ff9566', i: 0.7, ciel: '#66738c', horizon: '#d9b29e', hs: '#a3abc0', hg: '#3d3730', hi: 0.7, brume: 0.7, lampes: 1 }
];
const c1 = new THREE.Color(), c2 = new THREE.Color();
function mixC(a, b, t, out) { c1.set(a); c2.set(b); return out.copy(c1).lerp(c2, t); }
const etat = { ciel: new THREE.Color(), horizon: new THREE.Color() };
function appliquerHeure(h, brumeExtra = 0) {
  let k = 0; while (k < CLES.length - 2 && h > CLES[k + 1].h) k++;
  const a = CLES[k], b = CLES[k + 1], t = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)));
  mixC(a.soleil, b.soleil, t, soleil.color); soleil.intensity = a.i + (b.i - a.i) * t;
  mixC(a.hs, b.hs, t, hemi.color); mixC(a.hg, b.hg, t, hemi.groundColor); hemi.intensity = a.hi + (b.hi - a.hi) * t;
  mixC(a.ciel, b.ciel, t, etat.ciel); mixC(a.horizon, b.horizon, t, etat.horizon);
  scene.fog.color.copy(etat.horizon);
  uCouleurB.value.copy(etat.horizon).lerp(C('#ffffff'), 0.45);
  uBrume.value = a.brume + (b.brume - a.brume) * t + brumeExtra;
  lanternes.opacity = a.lampes + (b.lampes - a.lampes) * t;
  const u = (h - 6) / 14, ang = Math.PI * Math.min(1, Math.max(0, u));
  const el = Math.sin(ang) * 0.85 + 0.12;
  soleil.position.set(Math.cos(ang) * 110, el * 120, 55 - Math.sin(ang) * 20);
  soleil.target.position.set(0, 0, -6);
  doc.style.setProperty('--ciel-haut', '#' + etat.ciel.getHexString());
  doc.style.setProperty('--ciel-bas', '#' + etat.horizon.getHexString());
}

/* ---------- caméra ---------- */
const BASE = { az: 0.42, el: 0.58, cible: new THREE.Vector3(0, 1, -8) };
const cam = { az: BASE.az, el: BASE.el, r: 140, cible: BASE.cible.clone() };
const but = { az: BASE.az, el: BASE.el, r: 140, cible: BASE.cible.clone() };
let tirage = 0, parX = 0, parY = 0, decalage = 0, rBase = 140;
let heure = 7.2, heureBut = 9, brumeExtra = 0;
let lieuActif = null, survol = null, baladeActive = null, journee = null;

function cadrer() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const large = w >= 980;
  decalage = large ? Math.min(w * 0.44, 640) : 0;
  BASE.el = large ? 0.58 : 0.8;          // téléphone : vue plus plongeante, repères moins tassés
  if (decalage) camera.setViewOffset(w + decalage, h, 0, 0, w, h); else camera.clearViewOffset();
  const asp = (w - decalage * 0.5) / h;
  rBase = 212 / Math.min(1.05, Math.max(0.55, asp / 1.55));
  if (asp < 1) rBase *= 0.97;
  scene.fog.near = rBase * 0.95; scene.fog.far = rBase * 2.3;
  camera.far = rBase * 4;
  if (!lieuActif && !journee) { but.r = rBase; but.el = BASE.el; }
  camera.updateProjectionMatrix();
}
new ResizeObserver(cadrer).observe(stage);
cadrer();
cam.r = rBase; cam.el = but.el = BASE.el;

function viser(id) {
  if (!id) { but.az = BASE.az; but.el = BASE.el; but.r = rBase; but.cible.copy(BASE.cible); return; }
  const l = LIEUX[id];
  but.cible.set(l.x, hauteur(l.x, l.z) + (id === 'foret' ? 4 : 1), l.z);
  but.r = id === 'foret' ? rBase * 0.86 : rBase * 0.56;
  but.el = id === 'foret' ? 0.98 : 0.6;
  but.az = BASE.az + (l.x < -10 ? -0.25 : l.x > 6 ? 0.25 : 0);
}

/* ---------- interactions ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const listeCibles = Object.values(cibles);
function pointe(e) {
  const r = scene3d.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(listeCibles, false)[0];
  return hit ? hit.object.userData.lieu : null;
}
let appui = null;
scene3d.addEventListener('pointerdown', e => { appui = { x: e.clientX, y: e.clientY, az: tirage, glisse: false }; });
addEventListener('pointerup', e => {
  if (!appui) return;
  const etait = appui; appui = null;
  if (etait.glisse || journee) return;
  if (e.target !== scene3d) return;
  const id = pointe(e);
  if (id) choisir(id);
});
scene3d.addEventListener('pointermove', e => {
  const r = scene3d.getBoundingClientRect();
  if (e.pointerType === 'mouse') { parX = ((e.clientX - r.left) / r.width) * 2 - 1; parY = ((e.clientY - r.top) / r.height) * 2 - 1; }
  if (appui) {
    const dx = e.clientX - appui.x;
    if (Math.abs(dx) > 6) appui.glisse = true;
    if (appui.glisse && !journee) tirage = Math.max(-1.1, Math.min(1.1, appui.az + dx * 0.006));
    return;
  }
  if (e.pointerType === 'mouse' && !journee) {
    const id = pointe(e);
    if (id !== survol) { survol = id; scene3d.style.cursor = id ? 'pointer' : 'grab'; majPins(); }
  }
});
scene3d.addEventListener('pointerleave', () => { parX = parY = 0; if (survol) { survol = null; majPins(); } });
scene3d.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { tirage = Math.max(-1.1, tirage - 0.15); e.preventDefault(); }
  if (e.key === 'ArrowRight') { tirage = Math.min(1.1, tirage + 0.15); e.preventDefault(); }
});

function choisir(id) { document.dispatchEvent(new CustomEvent('valombre:choix', { detail: { id } })); }

/* Les repères HTML (de vrais boutons, accessibles au clavier). */
const pins = {};
if (pinsBox) {
  D.lieux.forEach((l, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin'; b.dataset.lieu = l.id;
    b.innerHTML = `<span class="pin-n">${i + 1}</span><span class="pin-t"><b>${l.nom}</b><small>${l.offre}</small></span>`;
    b.setAttribute('aria-label', `${l.nom}, ${l.offre}`);
    b.addEventListener('click', () => choisir(l.id));
    b.addEventListener('mouseenter', () => { survol = l.id; majPins(); });
    b.addEventListener('mouseleave', () => { survol = null; majPins(); });
    pinsBox.appendChild(b);
    pins[l.id] = { el: b, v: new THREE.Vector3(l.x, hauteur(l.x, l.z) + (l.id === 'foret' ? 9 : l.id === 'manege' ? 9 : 5), l.z) };
  });
}
function majPins() {
  for (const [id, p] of Object.entries(pins)) {
    p.el.classList.toggle('chaud', survol === id);
    p.el.classList.toggle('actif', lieuActif === id);
    p.el.setAttribute('aria-pressed', lieuActif === id ? 'true' : 'false');
  }
}
const vp = new THREE.Vector3();
function placerPins() {
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const [id, p] of Object.entries(pins)) {
    vp.copy(p.v).project(camera);
    const x = (vp.x * 0.5 + 0.5) * w, y = (-vp.y * 0.5 + 0.5) * h;
    const cache = (journee ? journee.lieu !== id : false) || (decalage > 0 && x < decalage * 1.04)
      || y < 86 || (decalage > 0 && y > h - 130 && x > w - 520);
    p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    p.el.classList.toggle('cache', cache || vp.z > 1);
  }
}

/* ---------- événements du site ---------- */
document.addEventListener('valombre:lieu', e => {
  lieuActif = e.detail && e.detail.id || null;
  if (!journee) { viser(lieuActif); tirage = 0; }
  if (lieuActif !== 'foret' && baladeActive) montrerBalade(null);
  majPins();
});
document.addEventListener('valombre:heure', e => { heureBut = e.detail.h; });
function montrerBalade(id) {
  baladeActive = id;
  traces.forEach(t => { t.actif = t.id === id; if (t.actif) t.mat.uniforms.uP.value = 0; });
  cortege.forEach(c => { c.visible = !!id; });
}
document.addEventListener('valombre:balade', e => montrerBalade(e.detail && e.detail.id || null));
document.addEventListener('valombre:journee', e => {
  const d = e.detail;
  if (d && d.actif) {
    journee = d; heureBut = d.h;
    const l = LIEUX[d.lieu];
    but.cible.set(l.x, hauteur(l.x, l.z) + 1, l.z);
    but.r = rBase * (d.lieu === 'foret' ? 0.86 : 0.5); but.el = d.lieu === 'foret' ? 0.95 : 0.5; but.az = BASE.az + (d.az || 0);
    tirage = 0;
    if (d.lieu === 'foret') montrerBalade('hetraie'); else if (baladeActive) montrerBalade(null);
  } else if (journee) {
    journee = null; viser(lieuActif);
    if (baladeActive && lieuActif !== 'foret') montrerBalade(null);
  }
  majPins();
});

/* ---------- ouverture ---------- */
let intro = doc.classList.contains('en-intro') && !calme;
let tIntro = 0;
const DUREE_INTRO = 5.2;
if (intro) { cam.r = rBase * 1.9; cam.el = 1.25; cam.az = BASE.az - 0.9; heure = 6; heureBut = 6; brumeExtra = 1.4; }
function finIntro() {
  if (!intro) return;
  intro = false; brumeExtra = 0; heureBut = 9;
  document.dispatchEvent(new CustomEvent('valombre:intro-fin'));
}
document.addEventListener('valombre:passer', () => {
  if (!intro) return;
  cam.r = rBase; cam.el = BASE.el; cam.az = BASE.az; heure = 8.5;
  finIntro();
});

/* ---------- boucle ---------- */
let visible = true, horloge = new THREE.Clock(), t = 0;
new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(stage);
const ve = new THREE.Vector3();
function cycle() {
  requestAnimationFrame(cycle);
  if (!visible || document.hidden) { horloge.getDelta(); return; }
  const dt = Math.min(0.05, horloge.getDelta());
  t += calme ? 0 : dt;
  uTemps.value = t;

  if (intro) {
    tIntro += dt;
    const p = Math.min(1, tIntro / DUREE_INTRO), e = 1 - Math.pow(1 - p, 3);
    cam.r = rBase * (1.9 - 0.9 * e); cam.el = 1.25 - (1.25 - BASE.el) * e; cam.az = BASE.az - 0.9 * (1 - e);
    heure = 6 + 2.6 * e; heureBut = heure; brumeExtra = 1.4 * (1 - e);
    if (p >= 1) finIntro();
  } else {
    const k = 1 - Math.exp(-dt * (journee ? 2.2 : 3));
    cam.az += (but.az + tirage + parX * 0.07 - cam.az) * k;
    cam.el += (but.el - parY * 0.04 - cam.el) * k;
    cam.r += (but.r - cam.r) * k;
    cam.cible.lerp(but.cible, k);
    heure += (heureBut - heure) * (1 - Math.exp(-dt * 2.4));
  }
  appliquerHeure(heure, brumeExtra);

  const ce = Math.cos(cam.el);
  camera.position.set(cam.cible.x + Math.sin(cam.az) * ce * cam.r, cam.cible.y + Math.sin(cam.el) * cam.r, cam.cible.z + Math.cos(cam.az) * ce * cam.r);
  camera.lookAt(cam.cible);

  // anneaux
  for (const [id, r] of Object.entries(anneaux)) {
    const cible = id === 'foret' ? 0 : (journee ? journee.lieu === id : lieuActif === id) ? 0.95 : survol === id ? 0.6 : 0;
    r.material.opacity += (cible - r.material.opacity) * Math.min(1, dt * 6);
    const s = 1 + (cible > 0 ? Math.sin(t * 2.2) * 0.015 : 0);
    r.scale.x = TAILLES[id][0] * s; r.scale.z = TAILLES[id][1] * s;
  }
  uCourbes.value = 0.9;

  // tracés
  traces.forEach(tr => {
    const u = tr.mat.uniforms;
    u.uA.value += ((tr.actif ? 1 : 0) - u.uA.value) * Math.min(1, dt * 4);
    if (tr.actif) u.uP.value = Math.min(1.001, u.uP.value + dt * (calme ? 10 : 0.45));
    u.uT.value = t;
  });
  // la reprise en carrière
  if (!calme) melangeurs.forEach(m => m.update(dt));
  const a = t * 0.2;
  const rx = 16 + Math.cos(a) * 6.2, rz = 16 + Math.sin(a) * 3.2;
  reprise.position.set(rx, hauteur(rx, rz), rz);
  reprise.rotation.y = Math.atan2(-(Math.cos(a) * 3.2), -Math.sin(a) * 6.2);
  // le cortège de la balade
  if (baladeActive) {
    const tr = traces.find(x => x.id === baladeActive);
    cortege.forEach((c, i) => {
      const u = ((t * 1.25 / tr.longueur) - i * 2.6 / tr.longueur + 1) % 1;
      const p = tr.courbe.getPointAt(u), tg = tr.courbe.getTangentAt(u);
      c.position.set(p.x + tg.z * (i ? 0.6 : -0.6), hauteur(p.x, p.z), p.z - tg.x * (i ? 0.6 : -0.6));
      c.rotation.y = Math.atan2(-tg.z, tg.x);
    });
  }
  renderer.render(scene, camera);
  placerPins();
}
appliquerHeure(heure);
majPins();
cycle();
document.dispatchEvent(new CustomEvent('valombre:pret'));
if (!intro && doc.classList.contains('en-intro')) finIntro();
