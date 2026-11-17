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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
lampe.castShadow = true;                                      // le bord du plâtre et les tuyaux portent leur ombre dans le creux
lampe.shadow.mapSize.set(tactile ? 768 : 1536, tactile ? 768 : 1536);
lampe.shadow.bias = -0.0003; lampe.shadow.normalBias = 0.006;
lampe.shadow.camera.near = 0.5; lampe.shadow.camera.far = 30;
scene.add(lampe, lampe.target);
const creux = new THREE.PointLight("#ffcf95", 0, 1.6, 1.8);     // un reste de lumière diffuse dans le creux
scene.add(creux);

/* ------------------------------------------------------------------ le plâtre qui s'ouvre */
const L_MUR = 9.6, H_MUR = 4.2;
const U = {
  uT: { value: new THREE.Vector2(-9, -9) },   // centre de la lampe sur le mur
  uR: { value: 0 },                           // rayon d'ouverture
  uTache: { value: new THREE.Vector3(-3.0, 1.62, 0.55) },
};
const PORTE = { x0: 2.45, x1: 3.55, y1: 2.12 };
const EP = 0.013;                                             // épaisseur de la plaque de plâtre (BA13)
/* Le contour cassé : même formule en JavaScript (la lèvre) et en GLSL (la découpe) */
const rayonA = (a, R) => R * (1 + 0.07 * Math.sin(a * 7 + 1.3) + 0.04 * Math.sin(a * 17 + 0.4) + 0.025 * Math.sin(a * 31));
const ecaille = (a) => 0.01 + 0.024 * (0.5 + 0.5 * Math.sin(a * 23 + 2.1)) * (0.5 + 0.5 * Math.sin(a * 5 + 0.3));
const GLSL_CONTOUR = `
  float rayonA(float a, float R) { return R * (1.0 + 0.07 * sin(a * 7.0 + 1.3) + 0.04 * sin(a * 17.0 + 0.4) + 0.025 * sin(a * 31.0)); }
  float ecaille(float a) { return 0.01 + 0.024 * (0.5 + 0.5 * sin(a * 23.0 + 2.1)) * (0.5 + 0.5 * sin(a * 5.0 + 0.3)); }`;
const DANS_PORTE = `(vW.x > ${PORTE.x0.toFixed(2)} && vW.x < ${PORTE.x1.toFixed(2)} && vW.y < ${PORTE.y1.toFixed(2)})`;

const chargeur = new THREE.TextureLoader();
const texPlatre = (nom, rep) => { const t = chargeur.load("textures/" + nom); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t; };
const NORMALE = texPlatre("platre-normale.jpg", [L_MUR / 1.3, H_MUR / 1.3]);
const RUGOSITE = texPlatre("platre-rugosite.jpg", [L_MUR / 1.3, H_MUR / 1.3]);

function injecter(s, corps) {
  Object.assign(s.uniforms, U);
  s.vertexShader = s.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vW;")
    .replace("#include <project_vertex>", "#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  s.fragmentShader = s.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vW;\nuniform vec2 uT;\nuniform float uR;\nuniform vec3 uTache;" + GLSL_CONTOUR)
    .replace("void main() {", "void main() {\n" + corps);
}
const DECOUPE = `
  vec2 dv = vW.xy - uT;
  float an = atan(dv.y, dv.x);
  float d = length(dv);
  float rr = rayonA(an, uR);
  float rc = rr + ecaille(an);                       // le bord cassé du parement
  bool ouvert = uR > 0.001;`;

/* Le parement : texture de plâtre (Poly Haven, CC0), troué sous la lampe.
   opts.porte : on ne peint pas dans l'ouverture de la porte. opts.xray : la porte, vue en transparence. */
function platre(couleur, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.95, metalness: 0 });
  if (!opts.xray) { m.normalMap = NORMALE; m.normalScale.set(0.7, 0.7); m.roughnessMap = RUGOSITE; }
  else { m.transparent = true; m.depthWrite = false; }
  m.onBeforeCompile = (s) => {
    injecter(s, DECOUPE + (opts.porte ? `if (${DANS_PORTE}) discard;` : "") + (opts.xray ? "" : "if (ouvert && d < rc) discard;"));
    s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      ${opts.tache ? "float tc = 1.0 - smoothstep(0.0, uTache.z, length((vW.xy - uTache.xy) * vec2(1.0, 0.8))); diffuseColor.rgb *= 1.0 - 0.32 * tc;" : ""}
      if (ouvert) {
        ${opts.xray
          ? `float rx = uR * 1.02;                                                                  // les rayons X : un cercle net, pas de plâtre cassé
             float dedans = 1.0 - smoothstep(rx - 0.05, rx, d);
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.33, 0.25), dedans * 0.6);       // le bois apparaît
             diffuseColor.a *= mix(1.0, 0.16, dedans);                                           // et devient transparent
             float trait = 1.0 - smoothstep(0.0, 0.005, abs(d - rx));
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.96), trait * 0.55);`
          : `float papier = 1.0 - smoothstep(rc, rc + 0.005, d);                                   // papier déchiré, plus clair
             float occl = 1.0 - smoothstep(rc, rc + 0.05, d);
             diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - 0.18 * occl), vec3(0.9, 0.89, 0.86), papier * 0.7);`}
      }`);
  };
  m.customProgramCacheKey = () => "platre-" + JSON.stringify(opts);   // chaque variante a son propre shader
  return m;
}
/* L'ombre portée du parement suit le trou */
function profondeurTrouee(opts = {}) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (s) => injecter(s, DECOUPE + (opts.porte ? `if (${DANS_PORTE}) discard;` : "") + "if (ouvert && d < rc) discard;");
  m.customProgramCacheKey = () => "profondeur-" + JSON.stringify(opts);
  return m;
}
/* Le fond du creux : dos de la plaque d'en face, plus sombre près du bord (occlusion) */
function fondCreux() {
  const m = new THREE.MeshStandardMaterial({ color: "#4d535f", roughness: 1, normalMap: texPlatre("platre-normale.jpg", [L_MUR / 2.2, H_MUR / 2.2]) });
  m.normalScale.set(0.5, 0.5);
  m.onBeforeCompile = (s) => {
    injecter(s, DECOUPE);
    s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      if (ouvert) diffuseColor.rgb *= mix(0.45, 1.0, 1.0 - smoothstep(rr * 0.3, rr * 0.98, d));`);
  };
  m.customProgramCacheKey = () => "fond-creux";
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
const L = L_MUR, HT = H_MUR;
const mur = new THREE.Mesh(new THREE.PlaneGeometry(L, HT), platre("#a2aebf", { porte: true, tache: true }));
mur.position.set(0, HT / 2, 0);
mur.customDepthMaterial = profondeurTrouee({ porte: true });
monde.add(mur);

/* La lèvre : l'épaisseur cassée du plâtre, recalculée quand la lampe bouge */
const NL = 180;
const levreGeo = new THREE.BufferGeometry();
const levrePos = new Float32Array((NL + 1) * 2 * 3);
levreGeo.setAttribute("position", new THREE.BufferAttribute(levrePos, 3));
const idx = [];
for (let i = 0; i < NL; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
levreGeo.setIndex(idx);
const levre = new THREE.Mesh(levreGeo, new THREE.MeshStandardMaterial({ color: "#e2ddd2", roughness: 1, flatShading: true, side: THREE.DoubleSide }));
levre.frustumCulled = false;
monde.add(levre);
const PX0 = PORTE.x0 - 0.08, PX1 = PORTE.x1 + 0.08, PY1 = PORTE.y1 + 0.08;
let levreCle = "";
function majLevre(cx, cy, R) {
  const cle = cx.toFixed(4) + cy.toFixed(4) + R.toFixed(4);
  if (cle === levreCle) return;
  levreCle = cle;
  levre.visible = R > 0.01;
  for (let i = 0; i <= NL; i++) {
    const a = -Math.PI + (i / NL) * Math.PI * 2;
    const r1 = rayonA(a, R), r0 = r1 + ecaille(a);
    const c = Math.cos(a), sn = Math.sin(a);
    let x0 = cx + c * r0, y0 = cy + sn * r0, x1 = cx + c * r1, y1 = cy + sn * r1;
    // pas de plâtre dans l'ouverture de la porte : la lèvre s'y referme sur elle-même
    let z0 = 0.0005;
    if ((x0 > PX0 && x0 < PX1 && y0 < PY1) || (x1 > PX0 && x1 < PX1 && y1 < PY1)) { x0 = x1; y0 = y1; z0 = -EP; }
    levrePos.set([x0, y0, z0, x1, y1, -EP], i * 6);
  }
  levreGeo.attributes.position.needsUpdate = true;
  levreGeo.computeVertexNormals();
}
boite(L, 0.09, 0.018, M.blancMat, 0, 0.045, 0.01);                  // plinthe
const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), M.sol);
sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, 15);
monde.add(sol);

/* L'intérieur : fond, rails métalliques, laine par endroits */
const fond = new THREE.Mesh(new THREE.PlaneGeometry(L, HT), fondCreux());
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
// radiateur à panneaux type 21 : panneau arrière, ailettes, panneau avant profilé, grille et joues
boite(1.0, 0.6, 0.012, M.blanc, 0, 0.31, -0.03, rad);
const ailettes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.004, 0.5, 0.034), M.blancMat, 60);
const tmp = new THREE.Object3D();
for (let i = 0; i < 60; i++) { tmp.position.set(-0.485 + i * 0.0164, 0.33, -0.004); tmp.updateMatrix(); ailettes.setMatrixAt(i, tmp.matrix); }
rad.add(ailettes);
boite(1.0, 0.6, 0.012, M.blanc, 0, 0.31, 0.022, rad);
const profils = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.58, 10, 1, false, 0, Math.PI), M.blanc, 20);
for (let i = 0; i < 20; i++) { tmp.position.set(-0.475 + i * 0.05, 0.31, 0.028); tmp.rotation.set(0, -Math.PI / 2, 0); tmp.updateMatrix(); profils.setMatrixAt(i, tmp.matrix); }
rad.add(profils);
boite(1.0, 0.008, 0.07, M.blanc, 0, 0.615, -0.004, rad);                       // grille du dessus
const fentes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.003, 0.003, 0.05), M.sombre, 48);
for (let i = 0; i < 48; i++) { tmp.position.set(-0.47 + i * 0.02, 0.62, -0.004); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); fentes.setMatrixAt(i, tmp.matrix); }
rad.add(fentes);
[-0.503, 0.503].forEach((x) => boite(0.006, 0.6, 0.07, M.blanc, x, 0.31, -0.004, rad));   // joues
[-0.35, 0.35].forEach((x) => boite(0.05, 0.05, 0.05, M.sombre, x, 0.5, -0.06, rad));      // consoles au mur
// vanne thermostatique sur le piquage d'entrée (en bas à gauche), tête vissée dessus
cyl(0.012, 0.09, M.acier, -0.545, 0.05, -0.004, [0, 0, Math.PI / 2], rad);            // corps de vanne
cyl(0.016, 0.03, M.acier, -0.59, 0.05, -0.004, null, rad);                              // raccord vers le tuyau
const tete = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.03, 0.1, 20), M.blanc);
tete.position.set(-0.545, 0.115, -0.004); rad.add(tete);                                // tête thermostatique, posée sur la vanne
for (let k = 0; k < 4; k++) cyl(0.0305, 0.004, M.blancMat, -0.545, 0.09 + k * 0.016, -0.004, null, rad);
// coude de réglage sur le piquage de retour (en bas à droite)
cyl(0.012, 0.07, M.acier, 0.535, 0.05, -0.004, [0, 0, Math.PI / 2], rad);
cyl(0.016, 0.03, M.acier, 0.575, 0.05, -0.004, null, rad);
const purgeur = cyl(0.009, 0.035, M.laiton, 0.515, 0.575, -0.004, [0, 0, Math.PI / 2], rad);
// départ et retour : ils descendent des vannes, entrent dans le mur et filent vers la chaufferie
const xA = -1.7 - 0.59, xR = -1.7 + 0.575, zR = 0.046;
tube([[xA, 0.235, zR], [xA, 0.13, zR], [xA, 0.13, -0.08], [1.5, 0.13, -0.08]], 0.016, M.cuivre, 0.05);
tube([[xR, 0.235, zR], [xR, 0.075, zR], [xR, 0.075, -0.16], [1.5, 0.075, -0.16]], 0.016, M.cuivre, 0.05);
[[xA, 0.13], [xR, 0.075]].forEach(([x, y]) => cyl(0.028, 0.004, M.blanc, x, y, 0.002, [Math.PI / 2, 0, 0]));   // rosaces au mur
cyl(0.021, 0.03, M.rouge, -0.9, 0.13, -0.08, [0, 0, Math.PI / 2]);
cyl(0.021, 0.03, M.bleu, -0.9, 0.075, -0.16, [0, 0, Math.PI / 2]);

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
const vantail = new THREE.Mesh(new THREE.PlaneGeometry(PORTE.x1 - PORTE.x0, PORTE.y1), platre("#4a5260", { xray: true }));
vantail.renderOrder = 2;
vantail.position.set((PORTE.x0 + PORTE.x1) / 2, PORTE.y1 / 2, 0.02);
monde.add(vantail);
boite(PORTE.x1 - PORTE.x0 - 0.02, PORTE.y1 - 0.02, 0.01, new THREE.MeshStandardMaterial({ color: "#5a4c40", roughness: 0.95 }), (PORTE.x0 + PORTE.x1) / 2, PORTE.y1 / 2, -0.05);  // âme de la porte (bois)
const xs = PORTE.x0 + 0.13;                                                  // côté serrure
boite(0.045, 0.21, 0.012, M.acier, xs, 1.03, 0.032);                          // plaque de béquille
cyl(0.012, 0.05, M.acier, xs, 1.1, 0.05, [Math.PI / 2, 0, 0]);
boite(0.16, 0.024, 0.026, M.acier, xs + 0.07, 1.1, 0.074);                    // poignée
boite(0.12, 0.34, 0.03, M.rail, xs + 0.005, 1.0, -0.028);                    // boîtier de la serrure
boite(0.012, 1.9, 0.026, M.laiton, PORTE.x0 + 0.012, 1.06, -0.02);           // têtière sur la tranche
const cylindre = cyl(0.032, 0.11, M.laiton, xs, 0.94, -0.005, [Math.PI / 2, 0, 0]);
for (let i = 0; i < 5; i++) cyl(0.006, 0.05, M.laiton, xs - 0.02 + i * 0.01, 0.985, -0.012, null);   // goupilles
cyl(0.007, 1.85, M.acier, xs + 0.02, 1.08, -0.03);                             // tringle multipoint
[0.3, 1.85].forEach((y) => boite(0.11, 0.035, 0.025, M.laiton, xs - 0.08, y, -0.02));   // pênes hauts et bas
const pene = boite(0.08, 0.025, 0.022, M.laiton, xs - 0.06, 0.97, -0.02);

/* Ombres : tout porte et reçoit, sauf la porte transparente et la lèvre (qui reçoit seulement) */
monde.traverse((o) => { if (o.isMesh) { o.castShadow = o !== vantail && o !== sol; o.receiveShadow = true; } });
porteTab.traverse((o) => { o.castShadow = false; });
levre.castShadow = false;
const LAMPE_YMAX = 2.55;                                         // la lampe reste sous la barre de navigation

/* ------------------------------------------------------------------ les quatre pannes */
const POINTS = {
  fuite: { p: new THREE.Vector3(-3.0, 1.62, 0), cible: raccord },
  chauffage: { p: new THREE.Vector3(-1.185, 0.775, 0), cible: purgeur },
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
  etat.cible.set(THREE.MathUtils.clamp(p.x, -4.6, 4.6), THREE.MathUtils.clamp(p.y, 0.15, LAMPE_YMAX));
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
  etat.cible.y = THREE.MathUtils.clamp(etat.cible.y + (k === "ArrowUp" ? pas : k === "ArrowDown" ? -pas : 0), 0.15, LAMPE_YMAX);
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
  majLevre(etat.lampe.x, etat.lampe.y, etat.rayon);

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
  lampe.position.set(etat.camX + 1.5, 0.9, d * 0.55);        // tenue à la main, en bas à droite : les ombres tombent en haut à gauche
  lampe.target.position.set(etat.lampe.x, etat.lampe.y, 0);
  lampe.angle = Math.atan((etat.rayon * 2.4 + 0.2) / lampe.position.distanceTo(lampe.target.position));
  lampe.intensity = 2.9 * etat.force;
  creux.position.set(etat.lampe.x, etat.lampe.y, 0.25);
  creux.intensity = 0.45 * etat.force * (etat.rayon / 0.6);

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
