/* Sauvane : l'atelier en relief.
   Un bouquet noué à la main, entièrement dessiné en code (aucun modèle externe) :
   six fleurs construites pétale par pétale, tiges en spirale croisées sous le lien,
   papier de soie plissé. Chaque tige ajoutée pousse et le bouquet se réarrange.
   La souris le fait pivoter doucement, on peut aussi le tourner à la main (glisser).
   Three.js r170 en local (licence MIT), aucune autre librairie. */
import * as THREE from './vendor/three.module.min.js';

const S = window.SAUVANE;
const html = document.documentElement;
const zone = document.getElementById('atelier');
const toile = document.getElementById('bouquet');
if (!S || !zone || !toile) throw new Error('atelier absent');

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;
const estMobile = () => innerWidth < 820;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const amortir = (v, c, k, dt) => lerp(v, c, 1 - Math.exp(-k * dt));
const ioc = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sortie = (t) => 1 - Math.pow(1 - t, 3);

/* hasard reproductible : une tige garde sa personnalité quand le bouquet change */
function graine(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ------------------------------------------------------------ rendu */
const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'high-performance' });
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.18;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

/* éclairage de nature morte : une fenêtre chaude à gauche, une ombre mûre, un liseré froid */
scene.add(new THREE.AmbientLight(0xfff1ea, 0.35));
scene.add(new THREE.HemisphereLight(0xf6e4da, 0x2a1824, 1.0));
const fenetre = new THREE.DirectionalLight(0xffdcb8, 3.6); fenetre.position.set(-4, 3.2, 2.6); scene.add(fenetre);
const contre = new THREE.DirectionalLight(0xb9c4ff, 1.1); contre.position.set(3.5, 2.5, -3); scene.add(contre);
const face = new THREE.DirectionalLight(0xffeee6, 0.9); face.position.set(0.5, 0.6, 5); scene.add(face);

/* ------------------------------------------------------------ géométrie : outils */
const BAS = new THREE.Color(), HAUT = new THREE.Color(), C = new THREE.Color();

/* Fusionne des géométries non indexées porteuses de position, normal, color */
function fusion(liste) {
  let n = 0; for (const g of liste) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of liste) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return r;
}
/* Peint une géométrie d'un dégradé bas → haut (selon y local avant placement) */
function peindre(g, bas, haut, ombre = 0.35, axe = 1) {
  g = g.index ? g.toNonIndexed() : g;
  const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < p.count; i++) { const v = p.array[i * 3 + axe]; min = Math.min(min, v); max = Math.max(max, v); }
  BAS.set(bas); HAUT.set(haut);
  for (let i = 0; i < p.count; i++) {
    const t = (p.array[i * 3 + axe] - min) / (max - min || 1);
    C.copy(BAS).lerp(HAUT, Math.pow(t, 0.8)).multiplyScalar(lerp(1 - ombre, 1, Math.pow(t, 0.5)));
    col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

const fines = estMobile();
/* Un pétale : longueur selon +Y, face intérieure vers -Z.
   Contour : onglet étroit à la base, le plus large aux deux tiers, bout arrondi (le centre du bord dépasse).
   creux = le pétale se creuse en cuillère ; courbe = la pointe se replie (− vers le cœur, + vers l'extérieur) ;
   frise = le bord ondule près du bout. Grille fine et normales lissées : aucune facette. */
function petale({ l = 0.3, w = 0.2, creux = 0.8, courbe = 0, pointe = 0, frise = 0, bas = '#fff', haut = '#fff', ombre = 0.4, seg = 14, phase = 0 }) {
  const n = fines ? Math.max(7, Math.round(seg * 0.65)) : seg;
  const g = new THREE.PlaneGeometry(1, 1, n, n);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2;            // -1 → 1
    const v = p.getY(i) + 0.5;           // 0 → 1
    const monte = Math.sin(Math.PI / 2 * Math.min(v / 0.66, 1));
    let forme = 0.16 + 0.84 * monte;
    if (v > 0.66) forme *= Math.sqrt(1 - Math.pow((v - 0.66) / 0.34, 2) * 0.86);
    forme *= 1 - pointe * Math.pow(v, 3);
    const demi = w * 0.5 * forme;
    const x = u * demi;
    const bout = Math.max(0, (v - 0.72) / 0.28);
    const y = l * v + l * (0.12 - pointe * 0.08) * (1 - u * u) * bout * bout;
    let z = -creux * (x * x) / (w * 0.5) - courbe * l * v * v;
    z += frise * w * 0.07 * Math.sin(u * Math.PI * 2.5 + phase) * v * v;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return peindre(g, bas, haut, ombre);
}
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3();
/* place un pétale : inclinaison depuis l'axe, recul depuis le cœur, hauteur, puis rotation autour de l'axe */
function placer(g, incl, azi, haut = 0, rayon = 0) {
  g = g.clone();
  g.applyMatrix4(new THREE.Matrix4().makeRotationX(incl));
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(0, haut, rayon));
  g.applyMatrix4(new THREE.Matrix4().makeRotationY(azi));
  return g;
}
const OR = Math.PI * (3 - Math.sqrt(5));

/* Une coupe de pétales d'un seul tenant : une calotte de sphère posée sur son fond, festonnée en « lobes »
   (un lobe = un pétale, l'encoche les sépare). Au-delà de 90°, la calotte se referme vers le cœur.
   Plusieurs coupes emboîtées, de plus en plus petites et fermées, font une pivoine ou une renoncule :
   comme elles partagent le même fond, la plus petite reste toujours dedans, rien ne se traverse. */
function coupe({ R, phi, lobes, encoche = 0.28, frise = 0.03, decal = 0, etire = 1, bas: cb, haut: ch, ombre = 0.3, segT = 14 }) {
  const segA = (fines ? 9 : 14) * lobes, nT = fines ? Math.max(8, segT - 4) : segT;
  const pos = [], col = [], idx = [];
  BAS.set(cb); HAUT.set(ch);
  for (let j = 0; j <= nT; j++) {
    const sv = j / nT;
    for (let i = 0; i <= segA; i++) {
      const a = (i / segA) * Math.PI * 2;
      const lb = Math.pow(Math.abs(Math.cos(lobes * a / 2)), 0.75);
      const st = sv * (1 - encoche * (1 - lb));
      const f = st * phi;
      const rho = R * Math.sin(f) * (0.9 + 0.1 * lb);
      const y = (R * (1 - Math.cos(f)) + frise * R * Math.sin(a * lobes * 2 + decal * 3) * st * st * st) * etire;
      pos.push(Math.cos(a + decal) * rho, y, Math.sin(a + decal) * rho);
      C.copy(BAS).lerp(HAUT, Math.pow(st, 0.7)).multiplyScalar(lerp(1 - ombre, 1, Math.pow(st, 0.6)) * (0.94 + 0.06 * lb));
      col.push(C.r, C.g, C.b);
    }
  }
  for (let j = 0; j < nT; j++) for (let i = 0; i < segA; i++) {
    const a = j * (segA + 1) + i, b = a + 1, c = a + segA + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}


/* ------------------------------------------------------------ les six fleurs */
/* Pivoine : sept coupes emboîtées, les grandes ouvertes, les petites refermées en boule au cœur */
function tetePivoine() {
  const r = graine('pivoine'), m = [];
  const couches = [
    [0.23, 108, 5, '#c24b55', '#f5a28f'], [0.205, 116, 6, '#c94f59', '#f39a88'], [0.18, 124, 7, '#cc535e', '#f39886'],
    [0.155, 134, 7, '#cf5862', '#f49b89'], [0.13, 146, 8, '#d25c66', '#f6a291'], [0.1, 158, 7, '#d4606a', '#f7ab9a'], [0.07, 168, 6, '#d6646e', '#f8b4a4'],
  ];
  couches.forEach(([R, deg, lobes, cb, ch], k) => m.push(coupe({ R, phi: deg * Math.PI / 180, lobes, encoche: 0.3 - k * 0.015, frise: 0.05, decal: k * 0.9 + r(), bas: cb, haut: ch, ombre: 0.35 })));
  return fusion(m);
}
/* Renoncule : une douzaine de coupes fines et serrées, la rosette qu'on voit de dessus */
function teteRenoncule() {
  const r = graine('renoncule'), m = [];
  const N = fines ? 8 : 12;
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1);
    m.push(coupe({ R: lerp(0.15, 0.035, t), phi: lerp(98, 172, t) * Math.PI / 180, lobes: k % 2 ? 6 : 5, encoche: 0.18, frise: 0.02, decal: k * 1.3 + r(),
      bas: '#d3b071', haut: t > 0.7 ? '#ecd8a2' : '#fdf6e6', ombre: 0.32, segT: 10 }));
  }
  m.push(peindre(new THREE.SphereGeometry(0.022, 10, 8).translate(0, 0.055, 0), '#6c8340', '#a6b56e', 0.2));
  return fusion(m);
}
function teteAnemone() {
  const r = graine('anemone'), m = [];
  for (let i = 0; i < 6; i++) {
    const pe = petale({ l: 0.22, w: 0.21, creux: 0.38, courbe: 0.05, frise: 0.35, bas: '#ddd5e2', haut: '#ffffff', ombre: 0.14, phase: r() * 6 });
    m.push(placer(pe, 1.16 + (i % 2) * 0.1, (i / 6) * Math.PI * 2 + r() * 0.15, (i % 2) * 0.006, 0.02));
  }
  const coeur = new THREE.SphereGeometry(0.055, 16, 12); coeur.scale(1, 0.7, 1); coeur.translate(0, 0.02, 0);
  m.push(peindre(coeur, '#0d0a10', '#2a2036', 0.2));
  const N = fines ? 18 : 30;
  for (let i = 0; i < N; i++) {
    const a = i * OR, d = 0.065 + r() * 0.025;
    m.push(peindre(new THREE.SphereGeometry(0.009, 6, 5).translate(Math.cos(a) * d, 0.035, Math.sin(a) * d), '#1a1320', '#3a2c4a', 0));
  }
  return fusion(m);
}
/* Tulipe : deux coupes allongées de trois pétales chacune, la seconde tournée d'un sixième de tour */
function teteTulipe() {
  return fusion([
    coupe({ R: 0.115, phi: 1.32, lobes: 3, encoche: 0.36, frise: 0, etire: 2.25, bas: '#cf8c17', haut: '#fbdc6c', ombre: 0.3, segT: 16 }),
    coupe({ R: 0.102, phi: 1.26, lobes: 3, encoche: 0.34, frise: 0, decal: Math.PI / 3, etire: 2.3, bas: '#c9850f', haut: '#f8d35a', ombre: 0.35, segT: 16 }),
  ]);
}
function teteChardon() {
  const m = [];
  m.push(peindre(new THREE.IcosahedronGeometry(0.075, 2), '#2c3a66', '#56699f', 0.3));
  const p = new THREE.IcosahedronGeometry(0.075, fines ? 1 : 2).attributes.position;
  const vus = new Set();
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i); const cle = V.toArray().map((x) => x.toFixed(3)).join();
    if (vus.has(cle)) continue; vus.add(cle);
    const nrm = V.clone().normalize();
    const pic = new THREE.ConeGeometry(0.011, 0.05, 5, 1);
    pic.translate(0, 0.025, 0);
    pic.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm));
    pic.translate(nrm.x * 0.07, nrm.y * 0.07, nrm.z * 0.07);
    m.push(peindre(pic, '#3e528c', '#a8b8e6', 0.2, 1));
  }
  const g = fusion(m); g.translate(0, 0.07, 0);
  return g;
}
function teteEucalyptus() {
  /* un rameau : sa propre tige et des feuilles rondes alternées, qui partent de la tige vers l'extérieur */
  const r = graine('eucalyptus'), m = [];
  const tige = new THREE.CylinderGeometry(0.008, 0.011, 0.62, 6, 1); tige.translate(0, 0.31, 0);
  m.push(peindre(tige, '#6f6457', '#8a8070', 0.2));
  const N = 16;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const rl = lerp(0.05, 0.028, t);
    const f = new THREE.CircleGeometry(rl, 16);
    const pos = f.attributes.position;
    for (let k = 0; k < pos.count; k++) { const x = pos.getX(k), y = pos.getY(k); pos.setXYZ(k, x + rl * 1.05, y * 0.92, -(x * x + y * y) * 2.2); }
    f.computeVertexNormals();
    f.rotateX(Math.PI / 2 - 0.25);
    f.rotateZ(0.5 + r() * 0.25);
    f.rotateY((i % 2 ? Math.PI : 0) + i * 0.55 + (r() - 0.5) * 0.4);
    f.translate(0, 0.05 + t * 0.56, 0);
    m.push(peindre(f, '#557670', '#a3bcb5', 0.25, 0));
  }
  return fusion(m);
}

const fabriques = { pivoine: tetePivoine, renoncule: teteRenoncule, anemone: teteAnemone, tulipe: teteTulipe, chardon: teteChardon, eucalyptus: teteEucalyptus };
const matPetale = new THREE.MeshPhysicalMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffe6dc') });
/* un peu de lumière qui traverse le pétale : la couleur propre remonte dans les ombres (effet de pétale fin, pas de plastique) */
matPetale.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * 0.16;');
};
const matFeuille = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0 });
const matTige = new THREE.MeshStandardMaterial({ color: '#4f6b3a', roughness: 0.7 });

const groupe = new THREE.Group();
scene.add(groupe);
const bouquet = new THREE.Group();     // ce qui tourne
groupe.add(bouquet);

const MAXT = 14;
const tetes = {};
for (const t of S.tiges) {
  const g = fabriques[t.id]();
  const m = new THREE.InstancedMesh(g, t.id === 'eucalyptus' ? matFeuille : matPetale, MAXT);
  m.count = 0; m.frustumCulled = false;
  bouquet.add(m); tetes[t.id] = m;
}
const geoTige = new THREE.CylinderGeometry(0.011, 0.014, 1, 6, 1); geoTige.translate(0, 0.5, 0);
const tiges3d = new THREE.InstancedMesh(geoTige, matTige, S.MAX_TIGES * 2 + 8);
tiges3d.count = 0; tiges3d.frustumCulled = false; bouquet.add(tiges3d);

/* ------------------------------------------------------------ papier de soie et lien */
function feuillePapier(debut, fin, r0, r1, h0, h1, plis, decal, seed) {
  const r = graine(seed);
  const SU = 48, SV = 14, pos = [], uv = [], idx = [];
  for (let j = 0; j <= SV; j++) {
    const t = j / SV;
    for (let i = 0; i <= SU; i++) {
      const a = lerp(debut, fin, i / SU);
      const bord = 0.16 * Math.pow(Math.sin(Math.PI * i / SU), 0.5) + 0.05 * Math.sin(a * 3 + decal);
      const rr = lerp(r0, r1, Math.pow(t, 0.85)) * (1 + 0.07 * Math.sin(a * plis + decal) * t);
      const y = lerp(h0, h1 + bord, t);
      pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
      uv.push(i / SU * 2, t * 0.9);
    }
  }
  for (let j = 0; j < SV; j++) for (let i = 0; i < SU; i++) {
    const a = j * (SU + 1) + i, b = a + 1, c = a + SU + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/* papier de soie opaque, froissé : une carte de relief dessinée en code (plis au hasard, puis normales) */
function froisse(taille = 256) {
  const r = graine('froisse'), c = document.createElement('canvas'); c.width = c.height = taille;
  const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, taille, taille);
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI, cx = r() * taille, cy = r() * taille, L = taille * (0.25 + r() * 0.5);
    const dx = Math.cos(a) * L, dy = Math.sin(a) * L, clair = r() < 0.5;
    for (const [ox, oy] of [[0, 0], [taille, 0], [-taille, 0], [0, taille], [0, -taille]]) {
      const gr = x.createLinearGradient(cx + ox - dy * 0.06, cy + oy + dx * 0.06, cx + ox + dy * 0.06, cy + oy - dx * 0.06);
      gr.addColorStop(0, 'rgba(128,128,128,0)'); gr.addColorStop(0.5, clair ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(128,128,128,0)');
      x.strokeStyle = gr; x.lineWidth = taille * 0.12; x.beginPath(); x.moveTo(cx + ox - dx / 2, cy + oy - dy / 2); x.lineTo(cx + ox + dx / 2, cy + oy + dy / 2); x.stroke();
    }
  }
  const h = x.getImageData(0, 0, taille, taille).data, out = x.createImageData(taille, taille);
  const H = (i, j) => h[(((j + taille) % taille) * taille + ((i + taille) % taille)) * 4] / 255;
  for (let j = 0; j < taille; j++) for (let i = 0; i < taille; i++) {
    const nx = (H(i - 1, j) - H(i + 1, j)) * 3, ny = (H(i, j - 1) - H(i, j + 1)) * 3;
    const l = Math.hypot(nx, ny, 1), k = (j * taille + i) * 4;
    out.data[k] = (nx / l * 0.5 + 0.5) * 255; out.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; out.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[k + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const matPapier = new THREE.MeshStandardMaterial({ color: '#b9b5be', roughness: 0.88, side: THREE.DoubleSide, normalMap: froisse(), normalScale: new THREE.Vector2(0.55, 0.55) });
const papier = new THREE.Group();
papier.add(new THREE.Mesh(feuillePapier(Math.PI * 0.62, Math.PI * 2.32, 0.1, 0.62, -0.6, 0.2, 9, 0, 'p1'), matPapier));
papier.add(new THREE.Mesh(feuillePapier(Math.PI * 1.05, Math.PI * 2.85, 0.12, 0.68, -0.58, 0.06, 7, 1.7, 'p2'), matPapier));
bouquet.add(papier);
const matLien = new THREE.MeshStandardMaterial({ color: '#b49468', roughness: 0.9 });
const lien = new THREE.Group();
for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.009, 6, 28), matLien); t.rotation.x = Math.PI / 2 + (i - 1.5) * 0.06; t.position.y = -0.02 + i * 0.018; lien.add(t); }
const noeud = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), matLien); noeud.position.set(0, 0.01, 0.11); lien.add(noeud);
bouquet.add(lien);

/* ------------------------------------------------------------ composition : les tiges et leur place */
const TAILLE = { pivoine: 1.22, renoncule: 1.25, anemone: 1.25, tulipe: 1.25, chardon: 1.3, eucalyptus: 1.15 };
const ZONE = { pivoine: 0.0, renoncule: 0.35, anemone: 0.3, tulipe: 0.45, chardon: 0.5, eucalyptus: 0.95 };
let tiges = [];        // { id, type, cible:{p,d}, p, d, pousse }
const memo = new Map();

function recomposer(etat, premiere) {
  const liste = [];
  for (const t of S.tiges) for (let k = 0; k < (etat.tiges[t.id] || 0); k++) liste.push({ type: t.id, id: t.id + k });
  const N = liste.length;
  for (const s of liste) { const r = graine(s.id); s.cle = ZONE[s.type] + r() * 0.55; s.r = r; }
  liste.sort((a, b) => a.cle - b.cle);
  const R = 0.22 + 0.095 * Math.sqrt(Math.max(N, 1));
  let retard = 0;
  const suivants = liste.map((s, i) => {
    const rr = R * Math.sqrt((i + 0.6) / Math.max(N, 1)) * (s.type === 'eucalyptus' ? 1.0 : 1);
    const th = i * OR * 1.0 + 0.4;
    const H = 0.8 + (s.type === 'tulipe' ? 0.06 : 0) + (s.type === 'eucalyptus' ? -0.1 : 0) + (s.r() - 0.5) * 0.08;
    const tete = new THREE.Vector3(Math.cos(th) * rr, H - 0.95 * rr * rr, Math.sin(th) * rr);
    /* la fleur regarde un peu plus vers l'extérieur que sa tige */
    const dir = tete.clone().normalize();
    const vise = new THREE.Vector3(tete.x * 1.9, tete.y, tete.z * 1.9).normalize();
    /* l'eucalyptus monte : jamais à l'horizontale, il ne traverse pas le papier */
    if (s.type === 'eucalyptus') { vise.y = Math.max(vise.y, 0.65); vise.normalize(); }
    let ancien = memo.get(s.id);
    const o = ancien || { id: s.id, type: s.type, p: tete.clone(), d: dir.clone(), v: vise.clone(), pousse: 0, attente: 0, tour: s.r() * Math.PI * 2, phase: s.r() * 6 };
    o.cp = tete; o.cd = dir; o.cv = vise;
    if (!ancien) { o.attente = premiere ? retard : retard * 0.4; retard += premiere ? 0.07 : 0.05; if (calme) { o.pousse = 1; o.attente = 0; } }
    o.vivante = true;
    return o;
  });
  for (const [id, o] of memo) if (!suivants.includes(o)) { o.vivante = false; }
  tiges = suivants.concat([...memo.values()].filter((o) => !o.vivante && o.pousse > 0.01));
  memo.clear(); for (const o of tiges) memo.set(o.id, o);
  ajusterCadre(R);
  demande();
}

let rayonCible = 0.6, rayon = 0.6;
function ajusterCadre(R) { rayonCible = R; }

function papierCouleur(id) {
  const p = S.papier(id);
  papier.visible = !!p.couleur;
  if (p.couleur) matPapier.color.set(p.couleur);
  lien.scale.setScalar(p.couleur ? 1 : 0.75);
}

/* ------------------------------------------------------------ cadrage */
let largeur = 1, hauteur = 1;
function cadrer() {
  const r = toile.getBoundingClientRect();
  largeur = Math.max(1, r.width); hauteur = Math.max(1, r.height);
  rendu.setPixelRatio(Math.min(devicePixelRatio, estMobile() ? 1.6 : 1.75));
  rendu.setSize(largeur, hauteur, false);
  camera.aspect = largeur / hauteur;
  camera.updateProjectionMatrix();
  demande();
}

/* ------------------------------------------------------------ interaction : la souris guide, la main tourne */
let cible = { x: 0, y: 0 }, regard = { x: 0, y: 0 };
let lacet = -0.5, vitesse = 0, tient = false, dernierX = 0, dernierT = 0;
zone.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') {
    const r = zone.getBoundingClientRect();
    cible.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    cible.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    demande();
  }
}, { passive: true });
zone.addEventListener('pointerleave', () => { cible.x = cible.y = 0; });
toile.addEventListener('pointerdown', (e) => {
  tient = true; dernierX = e.clientX; dernierT = performance.now(); vitesse = 0;
  toile.setPointerCapture?.(e.pointerId); toile.classList.add('tenu'); demande();
});
toile.addEventListener('pointermove', (e) => {
  if (!tient) return;
  const t = performance.now(), dx = e.clientX - dernierX;
  lacet += dx * 0.011;
  vitesse = dx * 0.011 / Math.max(0.008, (t - dernierT) / 1000);
  dernierX = e.clientX; dernierT = t;
  zone.dispatchEvent(new CustomEvent('sauvane:tourne'));
  demande();
});
function lacher() { tient = false; toile.classList.remove('tenu'); }
toile.addEventListener('pointerup', lacher);
toile.addEventListener('pointercancel', lacher);
/* au clavier : flèches gauche / droite sur la toile */
toile.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); vitesse += (e.key === 'ArrowLeft' ? -1 : 1) * 2.2; demande(); }
});

/* ------------------------------------------------------------ boucle, en pause hors écran */
let enCours = false, visible = true, avant = 0, temps = 0, demarre = !html.classList.contains('en-intro');
function demande() { if (!enCours && visible && !document.hidden) { enCours = true; avant = performance.now(); requestAnimationFrame(image); } }

const dir = new THREE.Vector3(), hz = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), q2 = new THREE.Quaternion(), sca = new THREE.Vector3();
function image(maintenant) {
  const dt = Math.min(0.05, (maintenant - avant) / 1000);
  avant = maintenant; temps += dt;
  let encore = !calme && demarre;

  /* rotation : lente d'elle-même, inertie après un geste */
  if (!tient) {
    vitesse = amortir(vitesse, 0, 2.2, dt);
    lacet += (vitesse + (calme ? 0 : 0.16)) * dt;
    if (Math.abs(vitesse) > 0.01) encore = true;
  }
  regard.x = amortir(regard.x, tactile ? 0 : cible.x, 2.5, dt);
  regard.y = amortir(regard.y, tactile ? 0 : cible.y, 2.5, dt);
  if (Math.abs(regard.x - cible.x) > 0.002) encore = true;
  bouquet.rotation.y = lacet + regard.x * 0.55;
  groupe.rotation.x = -0.12 + regard.y * 0.12;
  rayon = amortir(rayon, rayonCible, 3, dt);

  /* caméra : assez loin pour que le bouquet entier respire dans le cadre */
  const mob = estMobile();
  /* la caméra recule juste assez pour que le bouquet tienne : en hauteur, et en largeur
     (sur grand écran, dans la colonne centrale seulement, entre le texte et le composeur) */
  const empile = innerWidth <= 1100, tg = Math.tan(THREE.MathUtils.degToRad(14));
  const V = (empile ? 1.12 : 1.2) * (0.74 + rayon * 0.48), W = rayon + 0.5;
  const dist = Math.max(V / tg, W / (tg * camera.aspect * (empile ? 0.92 : 0.4)));
  camera.position.set(0, 1.6, dist);
  camera.lookAt(0, 0.24, 0);
  if (mob) groupe.position.set(0, -0.05, 0);
  else groupe.position.set(camera.aspect > 1.5 ? -0.05 : 0, -0.08, 0);

  /* tiges : chacune pousse à son tour, puis glisse vers sa nouvelle place */
  const nTete = {}; for (const k in tetes) nTete[k] = 0;
  let nTige = 0;
  for (const o of tiges) {
    if (o.attente > 0) { o.attente -= dt; encore = true; continue; }
    const vise = o.vivante ? 1 : 0;
    if (Math.abs(o.pousse - vise) > 0.001) { o.pousse = clamp(o.pousse + (vise ? dt / 0.75 : -dt / 0.35), 0, 1); encore = true; }
    o.p.lerp(o.cp, 1 - Math.exp(-4 * dt)); o.d.lerp(o.cd, 1 - Math.exp(-4 * dt)).normalize(); o.v.lerp(o.cv, 1 - Math.exp(-4 * dt)).normalize();
    if (o.p.distanceToSquared(o.cp) > 1e-6) encore = true;
    const g = sortie(o.pousse);
    if (g <= 0.001) continue;

    /* un souffle léger, différent pour chaque tige */
    const souffle = calme ? 0 : Math.sin(temps * 1.3 + o.phase) * 0.018;
    /* tige en deux traits, comme un bouquet noué en spirale : du pied coupé (sous le papier, côté opposé,
       resserré) jusqu'au lien, puis du lien jusqu'à la fleur */
    const tete = o.p.clone().multiplyScalar(g);
    tete.x += souffle; tete.z += souffle * 0.6;
    hz.set(o.d.x, 0, o.d.z); if (hz.lengthSq() > 1e-6) hz.normalize();
    const lienP = hz.clone().multiplyScalar(0.03);
    const pied = new THREE.Vector3(-hz.x * 0.065, lerp(-0.1, -0.74, g), -hz.z * 0.065);
    for (const [a, b] of [[pied, lienP], [lienP, tete]]) {
      dir.subVectors(b, a); let L = dir.length(); dir.normalize();
      if (b === tete) L -= (o.type === 'eucalyptus' ? 0.05 : 0.04 * TAILLE[o.type]) * g;
      q2.setFromUnitVectors(haut, dir);
      sca.set(1, Math.max(L, 0.001), 1);
      M.compose(a, q2, sca);
      tiges3d.setMatrixAt(nTige++, M);
    }

    /* fleur : orientée vers l'extérieur, tournée sur elle-même */
    const v = o.v.clone(); v.x += souffle * 1.2;
    Q.setFromUnitVectors(haut, v.normalize());
    q2.setFromAxisAngle(haut, o.tour); Q.multiply(q2);
    const ech = (o.type === 'eucalyptus' ? g : Math.pow(g, 1.6)) * TAILLE[o.type];
    const m = tetes[o.type];
    if (nTete[o.type] < MAXT) {
      M.compose(o.type === 'eucalyptus' ? tete.clone().addScaledVector(v, -0.1) : tete, Q, sca.setScalar(ech));
      m.setMatrixAt(nTete[o.type]++, M);
    }
  }
  for (const k in tetes) { tetes[k].count = nTete[k]; tetes[k].instanceMatrix.needsUpdate = true; }
  tiges3d.count = nTige; tiges3d.instanceMatrix.needsUpdate = true;

  /* le papier s'élargit avec le bouquet */
  const ep = clamp(rayon / 0.53, 0.72, 1.3);
  papier.scale.set(ep, 0.92 + ep * 0.1, ep);

  rendu.render(scene, camera);
  enCours = false;
  if (encore) demande();
}

new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) demande(); }, { rootMargin: '60px' }).observe(zone);
document.addEventListener('visibilitychange', demande);
addEventListener('resize', cadrer);

/* ------------------------------------------------------------ branchement avec la page */
document.addEventListener('sauvane:bouquet', (e) => { papierCouleur(e.detail.papier); recomposer(e.detail, false); });
function premierBouquet() { demarre = true; recomposer(S.etat, true); }
papierCouleur(S.etat.papier);
cadrer();
if (html.classList.contains('en-intro') && !S.introFinie) document.addEventListener('sauvane:intro-fin', premierBouquet, { once: true });
else premierBouquet();
html.classList.add('a-3d');
/* vignette du panier : une vue du bouquet, réduite en 160 × 200 */
S.capture = () => {
  rendu.render(scene, camera);
  const c = document.createElement('canvas'); c.width = 160; c.height = 200;
  const x = c.getContext('2d'); x.fillStyle = '#1a0f17'; x.fillRect(0, 0, 160, 200);
  const w = toile.width, h = toile.height, sh = h * 0.94, sw = Math.min(w, sh * 0.8);
  x.drawImage(toile, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, 160, 200);
  return c.toDataURL('image/jpeg', 0.82);
};
