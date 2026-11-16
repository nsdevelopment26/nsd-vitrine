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

/* Un pétale : longueur selon +Y, face intérieure vers -Z.
   creux = les bords remontent vers le cœur ; courbe = la pointe se replie (− vers le cœur, + vers l'extérieur) */
function petale({ l = 0.3, w = 0.2, creux = 0.5, courbe = 0, pointe = 0.15, bas = '#fff', haut = '#fff', ombre = 0.45, segU = 6, segV = 7, alea = null }) {
  const g = new THREE.PlaneGeometry(1, 1, segU, segV);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2;           // -1 → 1
    const v = p.getY(i) + 0.5;          // 0 → 1
    /* contour : onglet étroit à la base, bout arrondi (ellipse), un peu pointu si « pointe » */
    const e = Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.42) / 0.58, 2)));
    const pointu = Math.max(0, 1 - Math.pow(v, 1.4));
    let larg = lerp(e, pointu, pointe * v);
    larg *= 0.3 + 0.7 * Math.min(1, v / 0.3);
    const ondule = alea ? Math.sin(u * 7 + alea * 9) * 0.012 * v : 0;
    const x = u * w * 0.5 * larg;
    const y = v * l;
    const z = -creux * w * 0.5 * u * u * larg - courbe * l * v * v + ondule;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return peindre(g, bas, haut, ombre);
}
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), U = new THREE.Vector3(1, 1, 1);
/* place un pétale : inclinaison depuis l'axe, puis rotation autour de l'axe */
function placer(g, incl, azi, haut = 0, rayon = 0) {
  g = g.clone();
  g.applyMatrix4(new THREE.Matrix4().makeRotationX(incl));
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(0, haut, rayon));
  g.applyMatrix4(new THREE.Matrix4().makeRotationY(azi));
  return g;
}
const OR = Math.PI * (3 - Math.sqrt(5));

/* ------------------------------------------------------------ les six fleurs */
const fines = estMobile();
function tetePivoine() {
  const r = graine('pivoine'), morceaux = [];
  const N = fines ? 40 : 60;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);                      // 0 = cœur, 1 = extérieur
    const g = petale({ l: lerp(0.11, 0.26, t), w: lerp(0.13, 0.3, t), creux: lerp(1.0, 0.55, t), courbe: lerp(0.35, -0.08, t), pointe: 0.05,
      bas: '#d4555c', haut: t < 0.4 ? '#f39a84' : '#f8ae98', ombre: lerp(0.5, 0.22, t), segU: 8, segV: 8, alea: r() });
    morceaux.push(placer(g, lerp(0.15, 1.38, Math.pow(t, 0.75)) + (r() - 0.5) * 0.12, i * OR + r() * 0.3, lerp(0.07, -0.02, t), 0));
  }
  return fusion(morceaux);
}
function teteRenoncule() {
  const r = graine('renoncule'), morceaux = [];
  const N = fines ? 44 : 70;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const g = petale({ l: lerp(0.05, 0.17, t), w: lerp(0.07, 0.17, t), creux: 1.2, courbe: lerp(0.5, 0.05, t), pointe: 0,
      bas: '#d8b97e', haut: t < 0.3 ? '#efdcae' : '#fdf5e4', ombre: 0.35, segU: 6, segV: 6 });
    morceaux.push(placer(g, lerp(0.05, 1.45, Math.pow(t, 0.9)), i * OR, lerp(0.05, -0.01, t), lerp(0, 0.01, t)));
  }
  /* un petit cœur vert, visible dans les plus ouvertes */
  morceaux.push(peindre(new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.06, 0), '#5f7a3c', '#9fb06a', 0.2));
  return fusion(morceaux);
}
function teteAnemone() {
  const r = graine('anemone'), morceaux = [];
  for (let i = 0; i < 6; i++) {
    const g = petale({ l: 0.22, w: 0.2, creux: 0.45, courbe: 0.08 * (i % 2 ? 1 : -0.4), pointe: 0.05,
      bas: '#ddd5e2', haut: '#ffffff', ombre: 0.15, segU: 10, segV: 10, alea: r() });
    morceaux.push(placer(g, 1.12 + (i % 2) * 0.12, (i / 6) * Math.PI * 2 + r() * 0.2, 0, 0.02));
  }
  /* cœur noir velouté et couronne d'étamines */
  const coeur = new THREE.SphereGeometry(0.055, 14, 10); coeur.scale(1, 0.7, 1); coeur.translate(0, 0.02, 0);
  morceaux.push(peindre(coeur, '#0d0a10', '#2a2036', 0.2));
  const N = fines ? 18 : 30;
  for (let i = 0; i < N; i++) {
    const a = i * OR, d = 0.065 + r() * 0.025;
    const e = new THREE.SphereGeometry(0.009, 5, 4).translate(Math.cos(a) * d, 0.035, Math.sin(a) * d);
    morceaux.push(peindre(e, '#1a1320', '#3a2c4a', 0));
  }
  return fusion(morceaux);
}
function teteTulipe() {
  const r = graine('tulipe'), morceaux = [];
  for (let i = 0; i < 6; i++) {
    const ext = i % 2 === 0;
    const g = petale({ l: ext ? 0.32 : 0.3, w: 0.22, creux: 0.6, courbe: -0.05, pointe: 0.04,
      bas: '#d99a1a', haut: '#fbdb6a', ombre: 0.3, segU: 9, segV: 10, alea: r() });
    morceaux.push(placer(g, ext ? 0.32 : 0.2, (i / 6) * Math.PI * 2 + (ext ? 0 : 0.5), -0.02, ext ? 0.03 : 0.012));
  }
  return fusion(morceaux);
}
function teteChardon() {
  const morceaux = [];
  const boule = new THREE.IcosahedronGeometry(0.075, 1);
  morceaux.push(peindre(boule, '#2c3a66', '#56699f', 0.3));
  const p = new THREE.IcosahedronGeometry(0.075, fines ? 1 : 2).attributes.position;
  const vus = new Set();
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i); const cle = V.toArray().map((x) => x.toFixed(3)).join();
    if (vus.has(cle)) continue; vus.add(cle);
    const n = V.clone().normalize();
    const pic = new THREE.ConeGeometry(0.011, 0.05, 4, 1);
    pic.translate(0, 0.025, 0);
    pic.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n));
    pic.translate(n.x * 0.07, n.y * 0.07, n.z * 0.07);
    morceaux.push(peindre(pic, '#3e528c', '#a8b8e6', 0.2, 1));
  }
  const g = fusion(morceaux); g.translate(0, 0.07, 0);
  return g;
}
function teteEucalyptus() {
  /* un rameau : sa propre tige et des feuilles rondes alternées */
  const r = graine('eucalyptus'), morceaux = [];
  const tige = new THREE.CylinderGeometry(0.008, 0.011, 0.62, 5, 1); tige.translate(0, 0.31, 0);
  morceaux.push(peindre(tige, '#6f6457', '#8a8070', 0.2));
  const N = 16;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const rl = lerp(0.05, 0.028, t);
    const f = new THREE.CircleGeometry(rl, 14);
    const pos = f.attributes.position;  // légèrement bombée, la feuille part de la tige vers l'extérieur
    for (let k = 0; k < pos.count; k++) { const x = pos.getX(k), y = pos.getY(k); pos.setXYZ(k, x + rl * 1.05, y * 0.92, -(x * x + y * y) * 2.2); }
    f.computeVertexNormals();
    f.rotateX(Math.PI / 2 - 0.25);
    f.rotateZ(0.5 + r() * 0.25);
    f.rotateY((i % 2 ? Math.PI : 0) + i * 0.55 + (r() - 0.5) * 0.4);
    f.translate(0, 0.05 + t * 0.56, 0);
    morceaux.push(peindre(f, '#557670', '#a3bcb5', 0.25, 0));
  }
  return fusion(morceaux);
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
const tiges3d = new THREE.InstancedMesh(geoTige, matTige, S.MAX_TIGES + 4);
tiges3d.count = 0; tiges3d.frustumCulled = false; bouquet.add(tiges3d);

/* ------------------------------------------------------------ papier de soie et lien */
function feuillePapier(debut, fin, r0, r1, h0, h1, plis, decal, seed) {
  const r = graine(seed);
  const SU = 40, SV = 10, pos = [], idx = [];
  for (let j = 0; j <= SV; j++) {
    const t = j / SV;
    for (let i = 0; i <= SU; i++) {
      const a = lerp(debut, fin, i / SU);
      const bord = 0.16 * Math.pow(Math.sin(Math.PI * i / SU), 0.5) + 0.05 * Math.sin(a * 3 + decal);
      const rr = lerp(r0, r1, Math.pow(t, 0.85)) * (1 + 0.07 * Math.sin(a * plis + decal) * t);
      const y = lerp(h0, h1 + bord, t);
      pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
    }
  }
  for (let j = 0; j < SV; j++) for (let i = 0; i < SU; i++) {
    const a = j * (SU + 1) + i, b = a + 1, c = a + SU + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const matPapier = new THREE.MeshStandardMaterial({ color: '#b9b5be', roughness: 0.92, side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
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
    const rr = R * Math.sqrt((i + 0.6) / Math.max(N, 1)) * (s.type === 'eucalyptus' ? 1.12 : 1);
    const th = i * OR * 1.0 + 0.4;
    const H = 0.8 + (s.type === 'tulipe' ? 0.06 : 0) + (s.type === 'eucalyptus' ? -0.3 : 0) + (s.r() - 0.5) * 0.08;
    const tete = new THREE.Vector3(Math.cos(th) * rr, H - 0.95 * rr * rr, Math.sin(th) * rr);
    /* la fleur regarde un peu plus vers l'extérieur que sa tige */
    const dir = tete.clone().normalize();
    const vise = new THREE.Vector3(tete.x * 1.9, tete.y, tete.z * 1.9).normalize();
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

const dir = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), q2 = new THREE.Quaternion(), sca = new THREE.Vector3();
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
    /* tige : du pied (sous le lien, de l'autre côté) jusqu'à la fleur */
    const pied = o.d.clone().multiplyScalar(-0.62 * g);
    const tete = o.p.clone().multiplyScalar(g);
    tete.x += souffle; tete.z += souffle * 0.6;
    dir.subVectors(tete, pied); const L = dir.length(); dir.normalize();
    q2.setFromUnitVectors(haut, dir);
    sca.set(1, L - (o.type === 'eucalyptus' ? 0.05 : 0.04 * TAILLE[o.type]) * g, 1);
    M.compose(pied, q2, sca);
    tiges3d.setMatrixAt(nTige++, M);

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
