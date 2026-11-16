/* Halvren : « Derrière le mur ».
   Un pan de couloir la nuit. La lampe torche (souris, doigt ou clavier) ouvre le plâtre là où elle
   éclaire et montre ce qui passe dedans : cuivre de l'eau et du chauffage, gaines électriques,
   mécanisme de la serrure. Quatre pannes sont posées dans le mur ; les toucher ouvre le diagnostic.
   Three.js r170 en local, aucune autre librairie. Rendu en pause hors écran ou onglet caché.
   Écoute : halvren:viser {id}, halvren:intro. Émet : halvren:panne {id}, halvren:pret. */
import * as THREE from "./vendor/three.module.min.js";

const H = window.HALVREN || { pannes: [] };
const scene3d = document.querySelector("[data-mur]");
const canvas = scene3d && scene3d.querySelector("canvas");
if (!scene3d || !canvas) throw new Error("pas de mur");

const html = document.documentElement;
const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
const tactile = matchMedia("(hover: none)").matches;
const focus = scene3d.dataset.focus || "";                       // page métier : la panne mise en avant
const visibles = (scene3d.dataset.pannes || "fuite chauffage courant porte").split(" ");

/* ------------------------------------------------------------------ rendu */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, tactile ? 1.6 : 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const NUIT = new THREE.Color("#0e1626");
scene.background = NUIT;
scene.fog = new THREE.Fog(NUIT, 9, 16);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

/* Reflets : une petite pièce faite d'aplats lumineux (sans fichier HDR) */
{
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color("#141c2c");
  const pan = (c, w, h, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...p); m.rotation.set(...r); env.add(m); };
  pan("#ffd6a0", 3, 2, [0, 1, 4], [0, Math.PI, 0]);          // la lampe, devant
  pan("#5f7bb8", 6, 3, [-4, 2, 0], [0, Math.PI / 2, 0]);     // fenêtre bleue, à gauche
  pan("#2a3550", 8, 8, [0, 5, 0], [Math.PI / 2, 0, 0]);
  pan("#3a2e26", 8, 8, [0, -2, 0], [-Math.PI / 2, 0, 0]);
  scene.environment = pm.fromScene(env, 0.04).texture;
  pm.dispose();
}

/* ------------------------------------------------------------------ lumières */
scene.add(new THREE.HemisphereLight("#4d6fb4", "#2a2018", 0.3));
const lune = new THREE.DirectionalLight("#8fb0f0", 0.42);
lune.position.set(-6, 4, 5);
scene.add(lune);
const lampe = new THREE.SpotLight("#ffe0b5", 0, 0, 0.2, 0.9, 0);
scene.add(lampe, lampe.target);
const creux = new THREE.PointLight("#ffcf95", 0, 2.2, 1.6);     // éclaire l'intérieur du mur
scene.add(creux);

/* ------------------------------------------------------------------ le plâtre qui s'ouvre */
const U = {
  uT: { value: new THREE.Vector2(-9, -9) },   // centre de la lampe sur le mur
  uR: { value: 0 },                           // rayon d'ouverture
  uTache: { value: new THREE.Vector3(-3.0, 1.62, 0.55) },
};
const PORTE = { x0: 2.45, x1: 3.55, y1: 2.12 };

function platre(couleur, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vW;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vW;\nuniform vec2 uT;\nuniform float uR;\nuniform vec3 uTache;")
      .replace("void main() {", `void main() {
        ${opts.porte ? `if (vW.x > ${PORTE.x0.toFixed(2)} && vW.x < ${PORTE.x1.toFixed(2)} && vW.y < ${PORTE.y1.toFixed(2)}) discard;` : ""}
        vec2 dv = vW.xy - uT;
        float an = atan(dv.y, dv.x);
        float d = length(dv);
        float rr = uR * (1.0 + 0.07 * sin(an * 7.0 + 1.3) + 0.04 * sin(an * 17.0 + 0.4) + 0.025 * sin(an * 31.0));
        if (uR > 0.001 && d < rr) discard;
        float bord = uR > 0.001 ? 1.0 - smoothstep(rr, rr + 0.014, d) : 0.0;
        float ombre = uR > 0.001 ? 1.0 - smoothstep(rr, rr + 0.09, d) : 0.0;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        ${opts.tache ? "float tc = 1.0 - smoothstep(0.0, uTache.z, length((vW.xy - uTache.xy) * vec2(1.0, 0.8))); diffuseColor.rgb *= 1.0 - 0.32 * tc;" : ""}
        diffuseColor.rgb *= 1.0 - 0.35 * ombre;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.94, 0.92), bord * 0.85);`);
  };
  m.customProgramCacheKey = () => "platre-" + JSON.stringify(opts);   // le mur et la porte n'ont pas le même shader
  return m;
}

/* ------------------------------------------------------------------ matières */
const M = {
  cuivre: new THREE.MeshStandardMaterial({ color: "#c27a4c", metalness: 1, roughness: 0.3, envMapIntensity: 1.4 }),
  laiton: new THREE.MeshStandardMaterial({ color: "#c9a25a", metalness: 1, roughness: 0.35, envMapIntensity: 1.3 }),
  acier: new THREE.MeshStandardMaterial({ color: "#7f8892", metalness: 0.9, roughness: 0.42, envMapIntensity: 0.9 }),
  rail: new THREE.MeshStandardMaterial({ color: "#6f7782", metalness: 0.7, roughness: 0.5 }),
  gaine: new THREE.MeshStandardMaterial({ color: "#8b929b", roughness: 0.65 }),
  fond: new THREE.MeshStandardMaterial({ color: "#232a38", roughness: 1 }),
  laine: new THREE.MeshStandardMaterial({ color: "#a58a55", roughness: 1 }),
  blanc: new THREE.MeshStandardMaterial({ color: "#e9ecee", roughness: 0.45 }),
  blancMat: new THREE.MeshStandardMaterial({ color: "#dfe3e6", roughness: 0.7 }),
  sol: new THREE.MeshStandardMaterial({ color: "#9a7658", roughness: 0.42, envMapIntensity: 0.9 }),
  sombre: new THREE.MeshStandardMaterial({ color: "#2c3138", roughness: 0.6 }),
  bleu: new THREE.MeshStandardMaterial({ color: "#2f6fc9", roughness: 0.5 }),
  rouge: new THREE.MeshStandardMaterial({ color: "#c43c2e", roughness: 0.5 }),
  brun: new THREE.MeshStandardMaterial({ color: "#7a4a2a", roughness: 0.5 }),
  vertJaune: new THREE.MeshStandardMaterial({ color: "#9cae3a", roughness: 0.5 }),
  eau: new THREE.MeshStandardMaterial({ color: "#bcd6f2", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.85 }),
  mouille: new THREE.MeshStandardMaterial({ color: "#151b27", roughness: 0.25 }),
};
const signal = new THREE.MeshStandardMaterial({ color: "#e08a55", emissive: "#d9692f", emissiveIntensity: 0.6, roughness: 0.4 });

const monde = new THREE.Group();
scene.add(monde);
const boite = (w, h, d, mat, x, y, z, parent = monde) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
const cyl = (r, h, mat, x, y, z, rot, parent = monde, seg = 18) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); parent.add(m); return m; };

/* Tube qui suit des points avec des coudes arrondis */
function tube(points, r, mat, coude = 0.09, parent = monde) {
  const path = new THREE.CurvePath();
  const P = points.map((p) => new THREE.Vector3(...p));
  let prev = P[0];
  for (let i = 1; i < P.length; i++) {
    const cur = P[i];
    if (i < P.length - 1) {
      const a = cur.clone().add(prev.clone().sub(cur).setLength(Math.min(coude, prev.distanceTo(cur) / 2)));
      const b = cur.clone().add(P[i + 1].clone().sub(cur).setLength(Math.min(coude, P[i + 1].distanceTo(cur) / 2)));
      path.add(new THREE.LineCurve3(prev, a));
      path.add(new THREE.QuadraticBezierCurve3(a, cur, b));
      prev = b;
    } else path.add(new THREE.LineCurve3(prev, cur));
  }
  const n = Math.max(24, Math.round(path.getLength() * 30));
  const m = new THREE.Mesh(new THREE.TubeGeometry(path, n, r, 10, false), mat);
  parent.add(m);
  return m;
}
const collier = (x, y, z, vertical) => boite(vertical ? 0.07 : 0.025, vertical ? 0.025 : 0.07, 0.05, M.rail, x, y, z);

/* ------------------------------------------------------------------ le mur */
const L = 9.6, HT = 4.2;
const mur = new THREE.Mesh(new THREE.PlaneGeometry(L, HT), platre("#a2aebf", { porte: true, tache: true }));
mur.position.set(0, HT / 2, 0);
monde.add(mur);
boite(L, 0.09, 0.018, M.blancMat, 0, 0.045, 0.01);                  // plinthe
const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), M.sol);
sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, 15);
monde.add(sol);

/* L'intérieur : fond, rails métalliques, laine par endroits */
const fond = new THREE.Mesh(new THREE.PlaneGeometry(L, HT), M.fond);
fond.position.set(0, HT / 2, -0.32);
monde.add(fond);
for (let x = -4.5; x <= 4.6; x += 0.6) {
  if (x > PORTE.x0 - 0.1 && x < PORTE.x1 + 0.1) continue;
  boite(0.05, HT, 0.12, M.rail, x, HT / 2, -0.24);
}
boite(L, 0.05, 0.12, M.rail, 0, 0.03, -0.24);
boite(L, 0.05, 0.12, M.rail, 0, HT - 0.03, -0.24);

/* ------------------------------------------------------------------ EAU : colonne, vanne, coude qui fuit */
const zEau = -0.13;
tube([[-3.75, -0.1, zEau], [-3.75, 1.62, zEau], [-2.55, 1.62, zEau], [-2.55, 2.9, zEau], [-0.2, 2.9, zEau]], 0.024, M.cuivre);           // froide
tube([[-3.55, -0.1, zEau - 0.06], [-3.55, 1.42, zEau - 0.06], [-2.75, 1.42, zEau - 0.06], [-2.75, 2.75, zEau - 0.06], [-0.2, 2.75, zEau - 0.06]], 0.024, M.cuivre); // chaude
cyl(0.03, 0.04, M.bleu, -3.75, 0.35, zEau);
cyl(0.03, 0.04, M.rouge, -3.55, 0.35, zEau - 0.06);
// vanne d'arrêt à levier rouge
cyl(0.045, 0.12, M.laiton, -3.75, 0.62, zEau);
boite(0.16, 0.03, 0.03, M.rouge, -3.67, 0.66, zEau + 0.045);
[0.25, 1.1, 2.2].forEach((y) => { collier(-3.75, y, zEau - 0.02, true); collier(-3.55, y, zEau - 0.08, true); });
// le raccord qui goutte (coude laiton) et l'eau qui coule dans le creux
const raccord = cyl(0.04, 0.09, M.laiton, -3.0, 1.62, zEau, [0, 0, Math.PI / 2]);
const gouttes = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M.eau);
  g.scale.y = 1.5; g.position.set(-3.0 + (i % 2) * 0.03, 1.55, zEau); monde.add(g); gouttes.push({ m: g, t: i / 4 });
}
const flaque = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), M.mouille);
flaque.rotation.x = -Math.PI / 2; flaque.position.set(-2.98, 0.07, -0.18); flaque.scale.set(1.4, 0.5, 1);
monde.add(flaque);

/* ------------------------------------------------------------------ CHAUFFAGE : radiateur et purgeur */
const rad = new THREE.Group(); rad.position.set(-1.7, 0.2, 0.05); monde.add(rad);
boite(1.0, 0.62, 0.05, M.blanc, 0, 0.31, 0, rad);
for (let i = 0; i < 16; i++) boite(0.035, 0.6, 0.02, M.blancMat, -0.465 + i * 0.062, 0.31, 0.035, rad);
boite(1.0, 0.03, 0.08, M.blanc, 0, 0.635, 0.005, rad);
cyl(0.03, 0.11, M.blanc, -0.56, 0.1, 0.02, [0, 0, 0], rad);               // tête thermostatique
const purgeur = cyl(0.014, 0.05, M.laiton, 0.52, 0.58, 0.02, [0, 0, Math.PI / 2], rad);
// départ et retour : sous le radiateur, dans le mur, jusqu'à la chaufferie
tube([[-1.58, 0.21, 0.05], [-1.58, 0.12, 0.05], [-1.58, 0.12, -0.08], [-0.6, 0.12, -0.08], [-0.6, 0.12, -0.08], [1.2, 0.12, -0.08]], 0.018, M.cuivre);
tube([[-1.82, 0.21, 0.05], [-1.82, 0.2, 0.05], [-1.82, 0.2, -0.16], [1.2, 0.2, -0.16]], 0.018, M.cuivre);
cyl(0.023, 0.03, M.rouge, -0.9, 0.12, -0.08, [0, 0, Math.PI / 2]);
cyl(0.023, 0.03, M.bleu, -0.9, 0.2, -0.16, [0, 0, Math.PI / 2]);
tube([[1.2, 0.12, -0.08], [1.5, 0.12, -0.08]], 0.018, M.cuivre);

/* ------------------------------------------------------------------ ÉLECTRICITÉ : tableau, gaines, interrupteur, prise */
const tab = new THREE.Group(); tab.position.set(1.55, 1.62, 0.04); monde.add(tab);
boite(0.62, 0.74, 0.08, M.blanc, 0, 0, 0, tab);
boite(0.56, 0.68, 0.02, M.sombre, 0, 0, 0.035, tab);
const porteTab = new THREE.Group(); porteTab.position.set(0.31, 0, 0.045); tab.add(porteTab);
boite(0.6, 0.72, 0.015, M.blanc, -0.3, 0, 0, porteTab).position.x = 0.3;
porteTab.rotation.y = -1.9;
let manette = null;
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 8; c++) {
    const x = -0.235 + c * 0.067, y = 0.22 - r * 0.22;
    boite(0.058, 0.13, 0.05, M.blanc, x, y, 0.06, tab);
    const tombe = r === 1 && c === 5;
    const k = boite(0.018, 0.035, 0.02, tombe ? signal : M.sombre, x, y + (tombe ? -0.03 : 0.03), 0.09, tab);
    if (tombe) manette = k;
  }
}
// gaines grises et fils dans le mur
const zEl = -0.07;
[[1.35, 2.1, zEl, 3.25], [1.55, 2.1, zEl - 0.05, 3.25], [1.75, 2.1, zEl, 3.25]].forEach(([x, y, z, top]) => tube([[x, y, z], [x, top, z]], 0.02, M.gaine));
tube([[1.4, 1.25, zEl], [1.4, 1.05, zEl], [0.35, 1.05, zEl], [0.35, 1.2, zEl]], 0.02, M.gaine);       // vers l'interrupteur
tube([[1.62, 1.25, zEl - 0.05], [1.62, 0.6, zEl - 0.05], [0.9, 0.6, zEl - 0.05], [0.9, 0.36, zEl - 0.05]], 0.02, M.gaine); // vers la prise
// boîtes d'encastrement + fils colorés
[[0.35, 1.3], [0.9, 0.3]].forEach(([x, y]) => {
  cyl(0.065, 0.06, M.gaine, x, y, -0.035, [Math.PI / 2, 0, 0]);
  [M.brun, M.bleu, M.vertJaune].forEach((mat, i) => tube([[x - 0.03 + i * 0.03, y - 0.04, -0.06], [x - 0.03 + i * 0.03, y - 0.13, -0.09], [x - 0.08 + i * 0.05, y - 0.2, -0.12]], 0.006, mat, 0.04));
});
boite(0.13, 0.13, 0.012, M.blanc, 0.35, 1.3, 0.006);                 // interrupteur
boite(0.05, 0.07, 0.008, M.blancMat, 0.35, 1.3, 0.014);
boite(0.13, 0.13, 0.012, M.blanc, 0.9, 0.3, 0.006);                  // prise
cyl(0.03, 0.01, M.blancMat, 0.9, 0.3, 0.015, [Math.PI / 2, 0, 0]);

/* ------------------------------------------------------------------ SERRURE : porte, mécanisme multipoint */
const cadre = new THREE.Group(); monde.add(cadre);
boite(0.06, PORTE.y1 + 0.03, 0.12, M.blanc, PORTE.x0 - 0.03, (PORTE.y1 + 0.03) / 2, 0, cadre);
boite(0.06, PORTE.y1 + 0.03, 0.12, M.blanc, PORTE.x1 + 0.03, (PORTE.y1 + 0.03) / 2, 0, cadre);
boite(PORTE.x1 - PORTE.x0 + 0.12, 0.06, 0.12, M.blanc, (PORTE.x0 + PORTE.x1) / 2, PORTE.y1 + 0.03, 0, cadre);
const vantail = new THREE.Mesh(new THREE.PlaneGeometry(PORTE.x1 - PORTE.x0, PORTE.y1), platre("#4a5260"));
vantail.position.set((PORTE.x0 + PORTE.x1) / 2, PORTE.y1 / 2, 0.02);
monde.add(vantail);
boite(PORTE.x1 - PORTE.x0 - 0.02, PORTE.y1 - 0.02, 0.01, new THREE.MeshStandardMaterial({ color: "#5a4c40", roughness: 0.95 }), (PORTE.x0 + PORTE.x1) / 2, PORTE.y1 / 2, -0.05);  // âme de la porte (bois)
const xs = PORTE.x0 + 0.13;                                                  // côté serrure
boite(0.03, 0.2, 0.22, M.acier, xs - 0.05, 1.02, 0.07);                       // béquille (rosace)
boite(0.16, 0.025, 0.03, M.acier, xs + 0.03, 1.1, 0.09);                      // poignée
boite(0.09, 0.3, 0.03, M.rail, xs, 1.0, -0.03);                              // boîtier
const cylindre = cyl(0.032, 0.11, M.laiton, xs, 0.94, -0.005, [Math.PI / 2, 0, 0]);
for (let i = 0; i < 5; i++) cyl(0.006, 0.05, M.laiton, xs - 0.02 + i * 0.01, 0.985, -0.012, null);   // goupilles
cyl(0.004, 1.85, M.acier, xs + 0.012, 1.08, -0.025);                           // tringle multipoint
[0.3, 1.85].forEach((y) => boite(0.11, 0.035, 0.025, M.laiton, xs - 0.08, y, -0.02));   // pênes hauts et bas
const pene = boite(0.08, 0.025, 0.022, M.laiton, xs - 0.06, 0.97, -0.02);

/* ------------------------------------------------------------------ les quatre pannes */
const POINTS = {
  fuite: { p: new THREE.Vector3(-3.0, 1.62, 0), cible: raccord },
  chauffage: { p: new THREE.Vector3(-1.18, 0.78, 0), cible: purgeur },
  courant: { p: new THREE.Vector3(1.55, 1.62, 0), cible: manette },
  porte: { p: new THREE.Vector3(xs, 0.96, 0), cible: cylindre },
};
const pannes = H.pannes.filter((p) => POINTS[p.id] && visibles.includes(p.id));

/* Repères cliquables (de vrais boutons, au-dessus de la toile, accessibles au clavier) */
const calque = document.createElement("div");
calque.className = "mur-points";
scene3d.appendChild(calque);
const boutons = {};
pannes.forEach((p, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "mur-point";
  b.dataset.id = p.id;
  b.setAttribute("aria-label", "Voir dans le mur : " + p.court);
  b.innerHTML = `<i aria-hidden="true">${i + 1}</i><span>${p.court}</span>`;
  b.addEventListener("click", () => choisir(p.id, true));
  calque.appendChild(b);
  boutons[p.id] = b;
});

/* ------------------------------------------------------------------ état */
const etat = {
  cible: new THREE.Vector2(-3.0, 1.62),
  lampe: new THREE.Vector2(-5.5, 1.6),
  rayon: 0, rayonCible: 0, force: 0, forceCible: 0,
  choisi: null, verrou: 0, dernier: 0, intro: null, actif: true,
  camX: 0, souris: new THREE.Vector2(),
};
const RAYON = () => (W < 700 ? 0.52 : 0.68);
let W = 1, Hh = 1, demiL = 4.8, panneau = 0, decal = 0;
const texte = document.querySelector(scene3d.dataset.panneau || "#_aucun");

function choisir(id, venuDuMur) {
  const pt = POINTS[id];
  if (!pt) return;
  etat.choisi = id;
  etat.cible.set(pt.p.x, pt.p.y);
  etat.verrou = performance.now() + (tactile ? 1e9 : 2600);
  Object.keys(boutons).forEach((k) => boutons[k].setAttribute("aria-pressed", k === id ? "true" : "false"));
  if (venuDuMur) document.dispatchEvent(new CustomEvent("halvren:panne", { detail: { id } }));
}
document.addEventListener("halvren:viser", (e) => choisir(e.detail && e.detail.id, false));

/* ------------------------------------------------------------------ cadrage */
function cadrer() {
  const r = scene3d.getBoundingClientRect();
  W = Math.max(1, r.width); Hh = Math.max(1, r.height);
  renderer.setSize(W, Hh, false);
  camera.aspect = W / Hh;
  // sur grand écran, le texte est posé sur la gauche : le mur se cadre dans ce qui reste
  panneau = texte && W >= 820 ? texte.getBoundingClientRect().width : 0;
  const vis = Math.max(1, W - panneau);
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // largeur de mur visible : tout le mur sur grand écran, une portion sur téléphone (la caméra suit la lampe)
  // on cadre la hauteur (le haut du mur sort du champ) ; la caméra suit la lampe le long du mur
  const demiH = W < 700 ? 1.55 : focus ? 1.95 : 2.2;
  camera.userData.d = demiH / t;
  demiL = Math.min(L / 2, demiH * (vis / Hh));
  scene.fog.near = camera.userData.d * 1.1; scene.fog.far = camera.userData.d * 2.4;
  camera.updateProjectionMatrix();
}
new ResizeObserver(cadrer).observe(scene3d);
cadrer();

/* ------------------------------------------------------------------ pointeur */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plan = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
function versMur(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(plan, hit) ? hit : null;
}
canvas.addEventListener("pointermove", (e) => {
  if (etat.intro) return;
  const r = canvas.getBoundingClientRect();
  etat.souris.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  if (e.pointerType === "mouse" && performance.now() < etat.verrou) return;
  const p = versMur(e.clientX, e.clientY);
  if (!p) return;
  etat.cible.set(THREE.MathUtils.clamp(p.x, -4.6, 4.6), THREE.MathUtils.clamp(p.y, 0.15, HT - 0.2));
  etat.dernier = performance.now();
  if (e.pointerType !== "mouse") etat.verrou = 0;
});
canvas.addEventListener("click", (e) => {
  if (etat.intro) return;
  const p = versMur(e.clientX, e.clientY);
  if (!p) return;
  let best = null, bd = 0.75;
  pannes.forEach((pa) => { const d = Math.hypot(POINTS[pa.id].p.x - p.x, POINTS[pa.id].p.y - p.y); if (d < bd) { bd = d; best = pa.id; } });
  if (best) choisir(best, true);
  else { etat.cible.set(p.x, p.y); etat.dernier = performance.now(); }
});
canvas.addEventListener("pointerleave", () => { etat.dernier = 0; });
// clavier : la toile est focalisable, les flèches promènent la lampe
canvas.addEventListener("keydown", (e) => {
  const pas = 0.25, k = e.key;
  if (!/^Arrow/.test(k)) return;
  e.preventDefault();
  etat.cible.x = THREE.MathUtils.clamp(etat.cible.x + (k === "ArrowRight" ? pas : k === "ArrowLeft" ? -pas : 0), -4.6, 4.6);
  etat.cible.y = THREE.MathUtils.clamp(etat.cible.y + (k === "ArrowUp" ? pas : k === "ArrowDown" ? -pas : 0), 0.15, HT - 0.2);
  etat.dernier = performance.now();
  etat.verrou = 0;
});

/* ------------------------------------------------------------------ ouverture : la lampe s'allume dans le noir */
function lancerIntro() {
  etat.intro = { t0: performance.now() };
  etat.force = 0; etat.rayon = 0;
  etat.lampe.set(-4.6, 2.3); etat.cible.copy(etat.lampe);
}
document.addEventListener("halvren:intro", lancerIntro);
document.addEventListener("halvren:intro-fin", () => { if (etat.intro) finIntro(); });
function finIntro() {
  etat.intro = null;
  etat.forceCible = 1; etat.rayonCible = RAYON();
  choisir(focus || "fuite", false);
  etat.verrou = performance.now() + 1200;
}
const CHEMIN = [[-4.6, 2.3], [-3.0, 1.62], [-1.2, 0.8], [0.4, 1.3], [1.55, 1.62], [2.6, 1.0]];
function animIntro(now) {
  const t = (now - etat.intro.t0) / 1000;
  // déclic + deux hésitations de l'ampoule, puis la lampe balaie le mur et trouve chaque réseau
  etat.forceCible = t < 0.5 ? 0 : t < 0.58 ? 1 : t < 0.66 ? 0.15 : t < 0.8 ? 1 : t < 0.86 ? 0.4 : 1;
  etat.force = etat.forceCible;
  etat.rayonCible = t < 0.5 ? 0 : RAYON();
  const u = THREE.MathUtils.clamp((t - 0.9) / 3.0, 0, 1);
  const f = u * (CHEMIN.length - 1), i = Math.min(CHEMIN.length - 2, Math.floor(f)), k = f - i;
  const e = k * k * (3 - 2 * k);
  etat.cible.set(CHEMIN[i][0] + (CHEMIN[i + 1][0] - CHEMIN[i][0]) * e, CHEMIN[i][1] + (CHEMIN[i + 1][1] - CHEMIN[i][1]) * e);
  etat.lampe.lerp(etat.cible, 0.2);
  if (t > 4.4) finIntro();
}

/* ------------------------------------------------------------------ boucle */
const v = new THREE.Vector3();
let visible = true, prev = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { prev = now; return; }
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;

  if (etat.intro) animIntro(now);
  else {
    // sans pointeur depuis un moment : la lampe se promène d'une panne à l'autre
    if (!etat.choisi && now - etat.dernier > 3000) etat.cible.set(-3 + Math.sin(now / 2600) * 1.6, 1.4 + Math.sin(now / 1700) * 0.5);
    else if (etat.choisi && now > etat.verrou && now - etat.dernier > 4000 && !tactile) {
      const p = POINTS[etat.choisi].p; etat.cible.set(p.x + Math.sin(now / 1500) * 0.08, p.y + Math.cos(now / 1900) * 0.05);
    }
    etat.lampe.lerp(etat.cible, calme ? 1 : 1 - Math.pow(0.0009, dt));
    etat.force += (etat.forceCible - etat.force) * Math.min(1, dt * 4);
  }
  etat.rayon += (etat.rayonCible - etat.rayon) * (calme ? 1 : Math.min(1, dt * 5));

  // le plâtre s'ouvre là où la lampe éclaire
  U.uT.value.copy(etat.lampe);
  U.uR.value = etat.rayon;

  // caméra : léger parallaxe au bureau, suit la lampe sur téléphone
  const d = camera.userData.d;
  const cy = W < 700 ? 1.3 : 1.55;
  const cx = THREE.MathUtils.clamp(etat.lampe.x, -L / 2 + demiL, L / 2 - demiL);
  etat.camX += (cx - etat.camX) * (calme ? 1 : Math.min(1, dt * 1.6));
  const px = calme ? 0 : etat.souris.x * 0.25, py = calme ? 0 : -etat.souris.y * 0.12;
  camera.position.set(etat.camX + px, cy + 0.25 + py, d);
  camera.lookAt(etat.camX, cy, 0);
  // décalage de l'image vers la droite quand le texte est affiché (glisse à la fin de l'ouverture)
  const vise = panneau && !html.classList.contains("en-intro") ? -panneau / 2 : 0;
  decal += (vise - decal) * (calme ? 1 : Math.min(1, dt * 3));
  if (Math.abs(decal) > 0.5) camera.setViewOffset(W, Hh, decal, 0, W, Hh); else camera.clearViewOffset();

  // la lampe : un faisceau chaud qui vient de la main, un peu de lumière dans le creux
  lampe.position.set(etat.camX + 0.6, 1.5, d * 0.7);
  lampe.target.position.set(etat.lampe.x, etat.lampe.y, 0);
  lampe.angle = Math.atan((etat.rayon * 2.4 + 0.2) / lampe.position.distanceTo(lampe.target.position));
  lampe.intensity = 2.9 * etat.force;
  creux.position.set(etat.lampe.x, etat.lampe.y, 0.25);
  creux.intensity = 1.6 * etat.force * (etat.rayon / 0.6);

  // les gouttes tombent du raccord, la manette tombée et le purgeur respirent
  gouttes.forEach((g) => {
    g.t = (g.t + dt * 0.55) % 1;
    const tt = g.t;
    g.m.position.y = tt < 0.35 ? 1.57 : 1.57 - Math.pow((tt - 0.35) / 0.65, 2) * 1.5;
    g.m.scale.setScalar(tt < 0.35 ? 0.4 + tt * 1.7 : 1);
    g.m.scale.y *= 1.5;
  });
  const pulse = 0.45 + 0.35 * Math.sin(now / 380);
  signal.emissiveIntensity = pulse;
  porteTab.rotation.y = -1.9;

  renderer.render(scene, camera);

  // repères DOM : projetés sur le mur, cachés hors champ
  for (const id in boutons) {
    v.copy(POINTS[id].p).project(camera);
    const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * Hh;
    const dans = x > 12 + (html.classList.contains("en-intro") ? 0 : panneau) && x < W - 12 && y > 12 && y < Hh - 12 && !etat.intro;
    const b = boutons[id];
    b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    b.classList.toggle("cache", !dans);
    b.classList.toggle("eclaire", Math.hypot(POINTS[id].p.x - etat.lampe.x, POINTS[id].p.y - etat.lampe.y) < etat.rayon * 0.5);
    b.tabIndex = dans ? 0 : -1;
  }
}

new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: "120px" }).observe(scene3d);

html.classList.add("a-3d");
if (html.classList.contains("en-intro") && !window.HALVREN_INTRO_FINIE) lancerIntro();
else finIntro();
requestAnimationFrame(frame);
document.dispatchEvent(new CustomEvent("halvren:pret"));
window.HALVREN_MUR = { choisir, etat };
