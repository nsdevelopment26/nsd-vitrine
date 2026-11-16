/* Ashcombe Lorant : le fichier des dossiers, en relief.
   Six chemises cartonnées à onglets, debout dans un tiroir en noyer, chacune un domaine du cabinet.
   Ouverture : dans le noir, une lumière rasante balaie une feuille de papier épais et fait lever le
   monogramme gaufré (carte de normales calculée en code, aucune image) ; la feuille rejoint son dossier,
   le fichier se déploie. Survol : la chemise se soulève ; clic : elle sort, se présente et s'ouvre sur sa
   page de garde, que le tampon violet vient viser.
   À l'envoi du premier contact, une seconde scène plie la lettre en trois et la tamponne.
   Tout est dessiné en code. Three.js r170 en local (licence MIT), aucune autre librairie. */
import * as THREE from './vendor/three.module.min.js';

const A = window.ASHCOMBE;
const html = document.documentElement;
const toile = document.getElementById('fichier');
const scene3 = document.getElementById('scene');
if (!A || !toile) throw new Error('fichier absent');

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const estMobile = () => innerWidth <= 820;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const amortir = (v, c, k, dt) => lerp(v, c, 1 - Math.exp(-k * dt));
const ioc = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const sortie = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const emettre = (nom, detail) => document.dispatchEvent(new CustomEvent(nom, { detail }));

const ENCRE = '#14161c', VIOLET = '#5b3e9e';

/* ------------------------------------------------------------ polices prêtes avant de dessiner */
await Promise.race([
  Promise.all([
    document.fonts.load('400 120px "Libre Caslon Display"'),
    document.fonts.load('600 40px "Public Sans"'),
    document.fonts.load('400 40px "Public Sans"')
  ]),
  new Promise((r) => setTimeout(r, 1600))
]);
const F_TITRE = '"Libre Caslon Display", "Times New Roman", serif';
const F_TEXTE = '"Public Sans", system-ui, sans-serif';

/* ------------------------------------------------------------ textures dessinées */
function toileCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texture(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
/* bruit stable */
function graine(n) { let s = n >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* Carte de normales d'un gaufrage : dessin en blanc sur noir → hauteur floutée → normales (Sobel).
   La fibre du papier est ajoutée à la hauteur, pour que la lumière rasante accroche le grain. */
function gaufrage(w, h, dessin, { flou = 3, fibre = 0.035, force = 5 } = {}) {
  const c = toileCanvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff'; x.strokeStyle = '#fff';
  dessin(x, w, h);
  const src = x.getImageData(0, 0, w, h).data;
  let H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = src[i * 4] / 255;
  // flou en boîte séparable (deux passes), sans ctx.filter (absent de Safari)
  const tmp = new Float32Array(w * h);
  for (let p = 0; p < 2; p++) {
    for (let yy = 0; yy < h; yy++) { let s = 0; for (let k = -flou; k <= flou; k++) s += H[yy * w + clamp(k, 0, w - 1)]; for (let xx = 0; xx < w; xx++) { tmp[yy * w + xx] = s / (2 * flou + 1); s += H[yy * w + clamp(xx + flou + 1, 0, w - 1)] - H[yy * w + clamp(xx - flou, 0, w - 1)]; } }
    for (let xx = 0; xx < w; xx++) { let s = 0; for (let k = -flou; k <= flou; k++) s += tmp[clamp(k, 0, h - 1) * w + xx]; for (let yy = 0; yy < h; yy++) { H[yy * w + xx] = s / (2 * flou + 1); s += tmp[clamp(yy + flou + 1, 0, h - 1) * w + xx] - tmp[clamp(yy - flou, 0, h - 1) * w + xx]; } }
  }
  const r = graine(7);
  for (let i = 0; i < w * h; i++) H[i] += (r() - 0.5) * fibre;
  const out = x.createImageData(w, h), o = out.data;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const g = (a, b) => H[clamp(b, 0, h - 1) * w + clamp(a, 0, w - 1)];
    const dx = (g(xx + 1, yy - 1) + 2 * g(xx + 1, yy) + g(xx + 1, yy + 1)) - (g(xx - 1, yy - 1) + 2 * g(xx - 1, yy) + g(xx - 1, yy + 1));
    const dy = (g(xx - 1, yy + 1) + 2 * g(xx, yy + 1) + g(xx + 1, yy + 1)) - (g(xx - 1, yy - 1) + 2 * g(xx, yy - 1) + g(xx + 1, yy - 1));
    let nx = -dx * force, ny = dy * force, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (yy * w + xx) * 4;
    o[i] = (nx * 0.5 + 0.5) * 255; o[i + 1] = (ny * 0.5 + 0.5) * 255; o[i + 2] = (nz * 0.5 + 0.5) * 255; o[i + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  return texture(c, false);
}

/* le monogramme : A et L en Caslon, entrelacés sur un filet */
function dessinerMonogramme(x, cx, cy, taille) {
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = `400 ${taille}px ${F_TITRE}`;
  x.fillText('A', cx - taille * 0.17, cy + taille * 0.3);
  x.fillText('L', cx + taille * 0.24, cy + taille * 0.3);
  x.fillRect(cx - taille * 0.52, cy + taille * 0.43, taille * 1.04, Math.max(2, taille * 0.018));
}

/* papier : un aplat à peine nuancé, des fibres */
function papier(c, x, fond) {
  x.fillStyle = fond; x.fillRect(0, 0, c.width, c.height);
  const r = graine(3);
  for (let i = 0; i < c.width * c.height / 260; i++) {
    x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '20,22,28'},${0.018 + r() * 0.02})`;
    x.fillRect(r() * c.width, r() * c.height, 1 + r() * 2.5, 1);
  }
}

/* ------------------------------------------------------------ rendu */
const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'high-performance' });
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);

/* éclairage : un plafonnier froid au-dessus du tiroir, une lampe de bureau chaude, un liseré violet très bas */
const ambiance = new THREE.HemisphereLight(0xdfe3ec, 0x0b0c10, 0.5); scene.add(ambiance);
const cle = new THREE.DirectionalLight(0xf1f2f6, 2.6);
cle.position.set(-1.6, 3.2, 2.2); cle.castShadow = true;
cle.shadow.mapSize.set(estMobile() ? 1024 : 2048, estMobile() ? 1024 : 2048);
Object.assign(cle.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.2, near: 0.5, far: 8 });
cle.shadow.bias = -0.0004; cle.shadow.normalBias = 0.02;
scene.add(cle); scene.add(cle.target); cle.target.position.set(0, 0.3, -0.2);
const lampe = new THREE.PointLight(0xffd9b0, 1.6, 6, 1.6); lampe.position.set(1.4, 1.5, 0.8); scene.add(lampe);
const lisere = new THREE.DirectionalLight(0xb9a6f0, 0.55); lisere.position.set(2, 0.6, -2.5); scene.add(lisere);
/* la lumière rasante de l'ouverture */
const rasante = new THREE.SpotLight(0xf4f1ea, 0, 6, 0.5, 0.65, 1.2);
scene.add(rasante); scene.add(rasante.target);

/* ------------------------------------------------------------ le tiroir et la table */
const LW = 1.22, LD = 0.92, LH = 0.3;          // tiroir : largeur, profondeur, hauteur des parois
const noyer = new THREE.MeshStandardMaterial({ color: 0x2a1d16, roughness: 0.55, metalness: 0.0 });
const noyerFin = new THREE.MeshStandardMaterial({ color: 0x3a281d, roughness: 0.5 });
const tiroir = new THREE.Group(); scene.add(tiroir);
function paroi(w, h, d, x, y, z, m = noyer) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; tiroir.add(b); return b; }
paroi(LW + 0.06, 0.03, LD + 0.06, 0, -0.015, -LD / 2 + 0.06);                 // fond
paroi(0.03, LH, LD, -LW / 2 - 0.015, LH / 2, -LD / 2 + 0.06);                 // côté gauche
paroi(0.03, LH, LD, LW / 2 + 0.015, LH / 2, -LD / 2 + 0.06);                  // côté droit
paroi(LW + 0.06, LH, 0.03, 0, LH / 2, -LD + 0.075);                            // fond arrière
paroi(LW + 0.06, LH * 0.62, 0.035, 0, LH * 0.31, 0.11, noyerFin);              // façade basse
const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.018, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a1b1f, roughness: 0.35, metalness: 0.6 }));
poignee.position.set(0, LH * 0.38, 0.14); tiroir.add(poignee);
/* deux tringles sur lesquelles les chemises sont suspendues */
const tringleM = new THREE.MeshStandardMaterial({ color: 0x45474e, roughness: 0.35, metalness: 0.7 });
[-LW / 2 + 0.02, LW / 2 - 0.02].forEach((x) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, LD - 0.05, 8), tringleM); t.rotation.x = Math.PI / 2; t.position.set(x, LH - 0.01, -LD / 2 + 0.06); tiroir.add(t); });

const table = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.9 }));
table.rotation.x = -Math.PI / 2; table.position.y = -0.03; table.receiveShadow = true; scene.add(table);

/* ------------------------------------------------------------ les chemises */
const FW = 1.12, FH = 0.78, TW = 0.28, TH = 0.085, EP = 0.005;
const TEINTES = [
  { carton: '#d4d6dc', texte: ENCRE },
  { carton: '#5f6572', texte: '#eef0f4' },
  { carton: '#c0c3cb', texte: ENCRE },
  { carton: '#2c303a', texte: '#eef0f4' },
  { carton: '#dedfe3', texte: ENCRE },
  { carton: '#868b97', texte: '#10121a' }
];

/* gaufrage partagé des couvertures : le monogramme, petit, en bas à droite */
const normCouv = gaufrage(512, 360, (x, w, h) => { dessinerMonogramme(x, w * 0.84, h * 0.72, 70); }, { flou: 3, fibre: 0.003, force: 1.1 });

function formeDos(tabX) {
  const s = new THREE.Shape();
  const r = 0.012, x0 = -FW / 2, x1 = FW / 2, t0 = tabX, t1 = tabX + TW;
  s.moveTo(x0, 0); s.lineTo(x1, 0); s.lineTo(x1, FH);
  s.lineTo(t1 + 0.02, FH);
  s.quadraticCurveTo(t1, FH, t1 - 0.004, FH + TH - r);
  s.quadraticCurveTo(t1 - 0.008, FH + TH, t1 - 0.008 - r, FH + TH);
  s.lineTo(t0 + 0.008 + r, FH + TH);
  s.quadraticCurveTo(t0 + 0.008, FH + TH, t0 + 0.004, FH + TH - r);
  s.quadraticCurveTo(t0, FH, t0 - 0.02, FH);
  s.lineTo(x0, FH); s.lineTo(x0, 0);
  return new THREE.ExtrudeGeometry(s, { depth: EP, bevelEnabled: false, curveSegments: 6 });
}
function etiquette(d, teinte) {
  const c = toileCanvas(512, 160), x = c.getContext('2d');
  x.fillStyle = teinte.carton; x.fillRect(0, 0, 512, 160);
  x.fillStyle = teinte.texte;
  x.font = `600 46px ${F_TEXTE}`; x.textBaseline = 'middle';
  x.globalAlpha = 0.65; x.fillText(d.n, 30, 86); x.globalAlpha = 1;
  const lib = d.onglet;
  x.font = `600 ${lib.length > 11 ? 50 : 60}px ${F_TEXTE}`;
  x.fillText(lib, 108, 86);
  return texture(c);
}
/* la page de garde : ce qu'on voit quand le dossier s'ouvre */
function pageDeGarde(d) {
  const c = toileCanvas(1024, 704), x = c.getContext('2d');
  papier(c, x, '#f4f5f7');
  x.fillStyle = ENCRE;
  x.font = `600 26px ${F_TEXTE}`; x.textBaseline = 'alphabetic';
  x.fillText('ASHCOMBE LORANT', 70, 92);
  x.globalAlpha = 0.6; x.font = `400 24px ${F_TEXTE}`; x.fillText('Avocats d\'affaires · Luxembourg', 70, 128); x.globalAlpha = 1;
  x.fillRect(70, 160, 884, 2);
  x.font = `400 30px ${F_TEXTE}`; x.globalAlpha = 0.65; x.fillText('Dossier ' + d.n, 70, 236); x.globalAlpha = 1;
  x.font = `400 ${d.titre.length > 22 ? 74 : 84}px ${F_TITRE}`;
  x.fillText(d.titre, 66, 330);
  x.font = `400 28px ${F_TEXTE}`; x.globalAlpha = 0.72;
  const a = A.associes.find((p) => p.id === d.associe);
  x.fillText('Tenu par ' + a.nom + ' · ' + a.role, 70, 392); x.globalAlpha = 1;
  x.globalAlpha = 0.16;
  for (let i = 0; i < 5; i++) x.fillRect(70, 470 + i * 44, 560 - (i % 2) * 120, 2);
  x.globalAlpha = 1;
  return texture(c);
}
/* le tampon violet, avec l'encre qui manque par endroits */
function tamponTexture(haut, bas, centre) {
  const c = toileCanvas(512, 512), x = c.getContext('2d');
  x.translate(256, 256);
  x.strokeStyle = x.fillStyle = VIOLET;
  x.lineWidth = 12; x.beginPath(); x.arc(0, 0, 228, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 196, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(0, 0, 120, 0, Math.PI * 2); x.stroke();
  const arc = (txt, rayon, debut, sens) => {
    x.font = `700 40px ${F_TEXTE}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const pas = 0.155, n = txt.length, a0 = debut - sens * pas * (n - 1) / 2;
    for (let i = 0; i < n; i++) { x.save(); const a = a0 + sens * i * pas; x.rotate(a); x.translate(0, -rayon * sens); x.fillText(txt[i], 0, 0); x.restore(); }
  };
  arc(haut, 158, 0, 1);
  arc(bas, 158, 0, -1);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `400 104px ${F_TITRE}`; x.fillText('AL', 0, -8);
  x.font = `700 26px ${F_TEXTE}`; x.fillText(centre, 0, 62);
  // encre irrégulière : on gomme des grains
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'destination-out';
  const r = graine(11);
  for (let i = 0; i < 2600; i++) { x.globalAlpha = 0.25 + r() * 0.6; x.fillRect(r() * 512, r() * 512, 1 + r() * 4, 1 + r() * 3); }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  return texture(c);
}

const auj = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dossiers = A.domaines.map((d, i) => {
  const teinte = TEINTES[i % TEINTES.length];
  const racine = new THREE.Group();           // position dans le tiroir / présentation
  const pivot = new THREE.Group();            // inclinaison (charnière au pied)
  racine.add(pivot); scene.add(racine);
  const carton = new THREE.MeshStandardMaterial({ color: teinte.carton, roughness: 0.82, metalness: 0, normalMap: normCouv, normalScale: new THREE.Vector2(0.7, 0.7) });
  const cartonDos = new THREE.MeshStandardMaterial({ color: teinte.carton, roughness: 0.85 });
  const tabX = -FW / 2 + 0.035 + i * ((FW - 0.07 - TW) / (A.domaines.length - 1));
  const dos = new THREE.Mesh(formeDos(tabX), cartonDos);
  dos.castShadow = dos.receiveShadow = true; pivot.add(dos);
  const etq = new THREE.Mesh(new THREE.PlaneGeometry(TW - 0.03, (TW - 0.03) * 160 / 512), new THREE.MeshStandardMaterial({ map: etiquette(d, teinte), roughness: 0.8 }));
  etq.position.set(tabX + TW / 2, FH + TH * 0.47, EP + 0.0008); pivot.add(etq);
  // feuillets
  const feuilleM = new THREE.MeshStandardMaterial({ color: 0xeef0f3, roughness: 0.9 });
  for (let k = 0; k < 3; k++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(FW - 0.05 - k * 0.012, FH - 0.035 - k * 0.018, 0.0016), feuilleM);
    f.position.set((k - 1) * 0.004, (FH - 0.035 - k * 0.018) / 2, EP + 0.0012 + k * 0.0018); f.castShadow = f.receiveShadow = true; pivot.add(f);
  }
  const garde = new THREE.Mesh(new THREE.PlaneGeometry(FW - 0.07, FH - 0.07), new THREE.MeshStandardMaterial({ map: pageDeGarde(d), roughness: 0.88 }));
  garde.position.set(0, (FH - 0.07) / 2 + 0.012, EP + 0.0072); garde.receiveShadow = true; pivot.add(garde);
  // le tampon qui vise la page de garde à l'ouverture
  const tamp = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), new THREE.MeshBasicMaterial({ map: tamponTexture('ASHCOMBE · LORANT', 'CONFIDENTIEL', auj), transparent: true, opacity: 0, depthWrite: false }));
  tamp.position.set(FW / 2 - 0.2, 0.2, EP + 0.0085); tamp.rotation.z = 0.18 - i * 0.05; pivot.add(tamp);
  // couverture avant : charnière au pied, un peu plus basse que le dos pour laisser voir l'onglet
  const charniere = new THREE.Group(); charniere.position.set(0, 0, EP + 0.0105); pivot.add(charniere);
  const couv = new THREE.Mesh(new THREE.BoxGeometry(FW, FH - 0.045, EP), [cartonDos, cartonDos, cartonDos, cartonDos, carton, cartonDos]);
  couv.position.set(0, (FH - 0.045) / 2, EP / 2); couv.castShadow = couv.receiveShadow = true; charniere.add(couv);
  const repos = { x: 0, y: 0.03, z: -0.06 - i * 0.12, inc: -(0.06 + i * 0.05) };
  racine.position.set(repos.x, repos.y, repos.z); pivot.rotation.x = repos.inc;
  const objets = [];
  pivot.traverse((o) => { if (o.isMesh) { o.userData.dossier = i; objets.push(o); } });
  return { d, i, racine, pivot, charniere, tamp, repos, objets, survol: 0, sortie: 0, ouvre: 0, deploie: 0 };
});
const touchables = dossiers.flatMap((f) => f.objets);

/* ------------------------------------------------------------ la feuille de l'ouverture */
const normLettre = gaufrage(720, 1000, (x, w, h) => {
  dessinerMonogramme(x, w / 2, h * 0.22, 230);
  x.textAlign = 'center'; x.font = `600 40px ${F_TEXTE}`;
  const txt = 'ASHCOMBE  LORANT'; x.save(); x.translate(w / 2, h * 0.39); x.fillText(txt, 0, 0); x.restore();
  x.font = `400 26px ${F_TEXTE}`; x.fillText('AVOCATS  D\'AFFAIRES  ·  LUXEMBOURG', w / 2, h * 0.43);
}, { flou: 6, fibre: 0.002, force: 0.9 });
const lettre = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.003),
  [null, null, null, null, null, null].map((_, k) => new THREE.MeshStandardMaterial({ color: 0xe9eaee, roughness: 0.95, normalMap: k === 4 ? normLettre : null, normalScale: new THREE.Vector2(0.85, 0.85) })));
lettre.castShadow = true; scene.add(lettre);

/* ------------------------------------------------------------ état */
let W = 0, H = 0, offset = 0, offsetCible = 0;
let actif = -1, vise = -1, visePage = -1;
let introT = calme || !html.classList.contains('en-intro') ? 99 : 0;
let introFin = introT > 50;
let mx = 0, my = 0, smx = 0, smy = 0;
const camPos = new THREE.Vector3(), camVise = new THREE.Vector3();
const restePos = new THREE.Vector3(), resteVise = new THREE.Vector3(0, 0.42, -0.32);

function dimensionner() {
  const r = toile.getBoundingClientRect();
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  rendu.setPixelRatio(Math.min(devicePixelRatio, estMobile() ? 1.75 : 2));
  rendu.setSize(W, H, false);
  camera.aspect = W / H;
  // bureau : le fichier se range à droite du volet de texte
  offsetCible = !estMobile() && !html.classList.contains('en-intro') ? -0.19 : 0;
  if (estMobile()) offset = 0;
  // distance qui fait tenir le tiroir dans la largeur utile
  const aspectUtile = estMobile() ? camera.aspect : camera.aspect * 0.62;
  const d = Math.max(2.25, (estMobile() && camera.aspect < 1 ? 1.42 : 1.85) / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * aspectUtile));
  restePos.set(0, 0.42, -0.32).add(new THREE.Vector3(0, 0.72, 0.86).normalize().multiplyScalar(d));
  camera.updateProjectionMatrix();
}
dimensionner();
offset = offsetCible;
new ResizeObserver(dimensionner).observe(toile);
addEventListener('resize', dimensionner);

/* ------------------------------------------------------------ interactions */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function viser(cx, cy) {
  const r = toile.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(touchables, false)[0];
  return h ? h.object.userData.dossier : -1;
}
function marquer(i) {
  if (i === vise) return;
  vise = i;
  toile.classList.toggle('main', i > -1);
  emettre('ashcombe:survol', { id: i > -1 ? A.domaines[i].id : null });
}
let glisse = null;
toile.addEventListener('pointermove', (e) => {
  const r = toile.getBoundingClientRect();
  mx = ((e.clientX - r.left) / r.width) * 2 - 1; my = ((e.clientY - r.top) / r.height) * 2 - 1;
  if (e.pointerType === 'touch') {
    if (glisse && Math.abs(e.clientX - glisse.x) > 12 && actif < 0) {
      glisse.balaye = true;
      marquer(clamp(glisse.depart + Math.round((e.clientX - glisse.x) / 46), 0, dossiers.length - 1));
    }
    return;
  }
  if (introFin) marquer(viser(e.clientX, e.clientY));
});
toile.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { marquer(-1); mx = my = 0; } });
toile.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') glisse = { x: e.clientX, depart: vise > -1 ? vise : 2, balaye: false }; });
toile.addEventListener('pointerup', (e) => {
  if (!introFin) return;
  if (e.pointerType === 'touch' && glisse && glisse.balaye) { glisse = null; return; }
  glisse = null;
  const i = viser(e.clientX, e.clientY);
  if (i > -1 && i !== actif) emettre('ashcombe:demande', { id: A.domaines[i].id });
  else if (i === -1 && actif > -1) emettre('ashcombe:demande', { id: null });
});
document.addEventListener('ashcombe:viser', (e) => { const id = e.detail && e.detail.id; marquer(id ? A.domaines.findIndex((d) => d.id === id) : -1); });
document.addEventListener('ashcombe:afficher', (e) => {
  const id = e.detail && e.detail.id;
  actif = id ? A.domaines.findIndex((d) => d.id === id) : -1;
  dossiers.forEach((f) => { if (f.i !== actif) f.ouvre = Math.min(f.ouvre, 0.4); });
  html.classList.toggle('dossier-ouvert', actif > -1);
});
document.addEventListener('ashcombe:intro-fin', () => {
  introFin = true;
  if (introT < 3.6) introT = 3.6; // on saute à la sortie de la feuille
  setTimeout(dimensionner, 650);
});

/* ------------------------------------------------------------ la boucle */
let visible = true, ongletVisible = !document.hidden, dernier = performance.now(), premiere = true;
new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(scene3);
document.addEventListener('visibilitychange', () => { ongletVisible = !document.hidden; });

const presente = new THREE.Vector3(), tmpV = new THREE.Vector3(), P1 = new THREE.Vector3();
function boucle(t) {
  requestAnimationFrame(boucle);
  const dt = Math.min(0.05, (t - dernier) / 1000); dernier = t;
  if (!visible || !ongletVisible) return;

  /* ouverture : 0-3.4 s la feuille sous la lumière rasante ; 3.4-5 s elle descend, le fichier se déploie */
  if (introT < 99) introT += dt;
  const iT = introT;
  const feuille = 1 - ioc((iT - 3.5) / 1.1);       // 1 = feuille au premier plan
  const deploiement = ioc((iT - 3.7) / 1.5);
  lettre.visible = iT < 4.8;
  if (lettre.visible) {
    const f = dossiers[0];
    // de la présentation vers l'intérieur de la première chemise
    lettre.position.set(0, lerp(0.15, 0.62, feuille), lerp(-0.05, 0.62, feuille));
    lettre.rotation.set(lerp(-0.1, -0.08, feuille), 0, lerp(0.02, 0, feuille));
    lettre.scale.setScalar(lerp(0.85, 1, feuille));
    lettre.material.forEach((m) => { m.transparent = feuille < 0.2; m.opacity = clamp(feuille * 5, 0, 1); });
    void f;
  }
  // lumière rasante qui balaie la feuille de gauche à droite, puis s'efface
  const balai = ioc((iT - 0.4) / 2.6);
  rasante.intensity = iT < 99 ? lerp(0, 9, clamp(iT / 0.5, 0, 1)) * (1 - ioc((iT - 3.6) / 1.2)) : 0;
  rasante.position.set(lerp(-1.5, 1.7, balai), 1.0, 1.25);
  rasante.target.position.set(lerp(-0.2, 0.25, balai), 0.62, 0.62);
  const jour = ioc((iT - 3.2) / 1.6);
  cle.intensity = 2.6 * jour; lampe.intensity = 1.6 * jour; ambiance.intensity = lerp(0.04, 0.5, jour); lisere.intensity = 0.55 * jour;

  /* souris adoucie */
  smx = amortir(smx, mx, 3, dt); smy = amortir(smy, my, 3, dt);

  /* chemises */
  const ouvertK = actif > -1 ? 1 : 0;
  dossiers.forEach((f) => {
    f.deploie = deploiement;
    const cible = f.i === actif ? 1 : 0;
    f.sortie = amortir(f.sortie, cible, cible ? 2.6 : 3.4, dt);
    f.survol = amortir(f.survol, f.i === vise && actif < 0 ? 1 : 0, 9, dt);
    const ouv = cible && f.sortie > 0.7 ? 1 : 0;
    f.ouvre = amortir(f.ouvre, ouv, ouv ? 2.4 : 6, dt);
    const s = ioc(f.sortie);
    // pose au repos (avec déploiement en éventail depuis le fond du tiroir)
    const di = ioc((deploiement * 1.4) - f.i * 0.07);
    const ry = f.repos.y - (1 - di) * 0.5 + f.survol * 0.07 - (actif > -1 && f.i !== actif ? 0.035 : 0);
    const rz = f.repos.z;
    const rinc = lerp(0, f.repos.inc, di);
    // pose présentée : sortie du tiroir par le haut, puis vers soi
    const mobile = estMobile();
    presente.set(0, mobile ? 0.5 : 0.48, mobile ? 0.42 : 0.5);
    P1.set(f.repos.x, 1.2, rz + 0.1);
    // Bézier quadratique : repos → au-dessus du tiroir → présenté
    const u = s, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    tmpV.set(f.repos.x, ry, rz).multiplyScalar(a).addScaledVector(P1, b).addScaledVector(presente, c);
    f.racine.position.copy(tmpV);
    f.pivot.rotation.x = lerp(rinc, -0.42, s);
    f.racine.rotation.y = lerp(0, smx * 0.08, s);
    f.charniere.rotation.x = ioc(f.ouvre) * 1.95;
    // le tampon tombe quand la chemise est ouverte
    const tp = clamp((f.ouvre - 0.75) / 0.2, 0, 1);
    f.tamp.material.opacity = tp * 0.9;
    f.tamp.scale.setScalar(lerp(1.5, 1, sortie(tp)));
  });

  /* caméra : au repos elle suit doucement la souris ; dossier ouvert, elle se rapproche */
  const k = ioc(dossiers.reduce((m, f) => Math.max(m, f.sortie), 0));
  const ouvertePos = tmpV.set(0, 1.38, 3.2);
  if (estMobile()) ouvertePos.set(0, 1.25, 2.95);
  camPos.copy(restePos).lerp(ouvertePos, k);
  camPos.x += smx * 0.22 * (1 - k); camPos.y += -smy * 0.1 * (1 - k);
  camVise.copy(resteVise).lerp(tmpV.set(0, 0.7, 0.36), k);
  // ouverture : la caméra regarde la feuille de près
  const pres = feuille * (introT < 99 ? 1 : 0);
  if (pres > 0) {
    camPos.lerp(estMobile() ? tmpV.set(0.03, 0.62 + 0.25 * (0.8 / (0.536 * camera.aspect)), 0.6 + 0.96 * (0.8 / (0.536 * camera.aspect))) : tmpV.set(0.04, 0.72, 2.75), pres);
    camVise.lerp(tmpV.set(0, 0.47, 0.6), pres);
  }
  camera.position.copy(camPos); camera.lookAt(camVise);
  offset = amortir(offset, offsetCible, 2.2, dt);
  if (Math.abs(offset) > 0.0005) camera.setViewOffset(W, H, offset * W, 0, W, H); else camera.clearViewOffset();
  void ouvertK;

  rendu.render(scene, camera);
  if (premiere) { premiere = false; emettre('ashcombe:pret'); }
}
requestAnimationFrame(boucle);

/* ============================================================ LE PLI SCELLÉ (après l'envoi du premier contact) */
let pli = null;
document.addEventListener('ashcombe:sceller', (e) => { if (!pli) pli = creerPli(); pli.jouer(e.detail || {}); });

function creerPli() {
  const c = document.getElementById('pli3d');
  const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
  sc.add(new THREE.HemisphereLight(0xe6e9f0, 0x0b0c10, 0.7));
  const k = new THREE.DirectionalLight(0xffffff, 2.4); k.position.set(-1.2, 2.6, 1.4); k.castShadow = true; k.shadow.mapSize.set(1024, 1024);
  Object.assign(k.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1 }); sc.add(k);
  const l2 = new THREE.PointLight(0xffd9b0, 0.8, 5); l2.position.set(1.3, 1.2, 0.6); sc.add(l2);
  const plateau = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: 0x2a1d16, roughness: 0.6 }));
  plateau.rotation.x = -Math.PI / 2; plateau.receiveShadow = true; sc.add(plateau);

  // la lettre : trois volets d'un A4 (21 × 29,7 → 0,63 × 0,297 chacun), le volet du milieu à plat
  const LWd = 0.63, LT = 0.297;
  function volet(face, dos) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.PlaneGeometry(LWd, LT), new THREE.MeshStandardMaterial({ map: face, roughness: 0.92 }));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(LWd, LT), new THREE.MeshStandardMaterial({ map: dos, roughness: 0.92 }));
    a.rotation.x = -Math.PI / 2; b.rotation.x = Math.PI / 2; b.position.y = -0.0005;
    a.castShadow = b.castShadow = true; a.receiveShadow = true;
    g.add(a, b); return g;
  }
  function tiers(n) {
    const cv = toileCanvas(1024, 482), x = cv.getContext('2d');
    papier(cv, x, '#f4f5f7');
    x.fillStyle = ENCRE;
    if (n === 0) {
      x.font = `400 64px ${F_TITRE}`; x.textAlign = 'center'; x.fillText('AL', 512, 180);
      x.fillRect(452, 200, 120, 2);
      x.font = `600 22px ${F_TEXTE}`; x.fillText('ASHCOMBE LORANT', 512, 250);
      x.globalAlpha = 0.18; for (let i = 0; i < 3; i++) x.fillRect(90, 330 + i * 40, 700 - i * 90, 3);
    } else {
      x.globalAlpha = 0.18; for (let i = 0; i < 8; i++) x.fillRect(90, 50 + i * 50, (i % 3 === 2 ? 520 : 840), 3);
    }
    return texture(cv);
  }
  function verso(confidentiel) {
    const cv = toileCanvas(1024, 482), x = cv.getContext('2d');
    papier(cv, x, '#eceef1');
    if (confidentiel) { x.fillStyle = ENCRE; x.globalAlpha = 0.75; x.font = `600 26px ${F_TEXTE}`; x.fillText('CONFIDENTIEL · SECRET PROFESSIONNEL', 80, 410); }
    return texture(cv);
  }
  const milieu = volet(tiers(1), verso(false)); sc.add(milieu);
  const charBas = new THREE.Group(); charBas.position.set(0, 0.001, LT / 2); sc.add(charBas);
  const bas = volet(tiers(2), verso(false)); bas.position.z = LT / 2; charBas.add(bas);
  const charHaut = new THREE.Group(); charHaut.position.set(0, 0.002, -LT / 2); sc.add(charHaut);
  const haut = volet(tiers(0), verso(true)); haut.position.z = -LT / 2; charHaut.add(haut);

  // le tampon : poignée en noyer, semelle noire ; et l'empreinte qu'il laisse
  const tampon = new THREE.Group();
  const semelle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 48), new THREE.MeshStandardMaterial({ color: 0x1b1c21, roughness: 0.5 }));
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.14, 32), new THREE.MeshStandardMaterial({ color: 0x3a281d, roughness: 0.45 }));
  fut.position.y = 0.085;
  const pomme = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 16), fut.material); pomme.position.y = 0.17;
  [semelle, fut, pomme].forEach((m) => { m.castShadow = true; tampon.add(m); });
  sc.add(tampon);
  const empreinteM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const empreinte = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), empreinteM);
  empreinte.rotation.x = -Math.PI / 2; empreinte.rotation.z = 0.2; empreinte.position.set(0.15, 0.006, 0.02); sc.add(empreinte);

  let t0 = 0, enCours = false;
  function taille() {
    const rr = c.getBoundingClientRect();
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(Math.max(1, rr.width), Math.max(1, rr.height), false);
    cam.aspect = rr.width / Math.max(1, rr.height); cam.updateProjectionMatrix();
    const d = Math.max(1.05, 0.95 / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * cam.aspect));
    cam.position.set(0, d * 0.82, d * 0.6); cam.lookAt(0, 0, 0.02);
  }
  new ResizeObserver(taille).observe(c);
  function image(t) {
    const fBas = ioc(t / 0.8), fHaut = ioc((t - 0.75) / 0.8);
    charBas.rotation.x = -fBas * (Math.PI - 0.003);
    charHaut.rotation.x = fHaut * (Math.PI - 0.006);
    charHaut.position.y = 0.002 + fHaut * 0.002;
    // le tampon descend, appuie, remonte
    const desc = ioc((t - 1.75) / 0.5), rem = ioc((t - 2.45) / 0.6);
    tampon.position.set(lerp(0.55, 0.15, desc), lerp(0.7, 0.03, desc) + rem * 0.65, lerp(-0.3, 0.02, desc) - rem * 0.25);
    tampon.rotation.set(0, 0.2, lerp(-0.3, 0, desc));
    tampon.visible = t < 3.2;
    empreinte.position.y = 0.0125;
    empreinteM.opacity = t > 2.25 ? 0.92 : 0;
  }
  function anim(now) {
    const t = (now - t0) / 1000;
    image(t); r.render(sc, cam);
    if (t < 3.3) requestAnimationFrame(anim); else enCours = false;
  }
  return {
    jouer({ ref = '', date = auj }) {
      empreinteM.map = tamponTexture('ASHCOMBE · LORANT', 'REÇU · ' + date, ref.replace(/^AL-/, '')); empreinteM.needsUpdate = true;
      taille();
      if (calme) { image(9); r.render(sc, cam); return; }
      t0 = performance.now(); if (!enCours) { enCours = true; requestAnimationFrame(anim); }
    }
  };
}
