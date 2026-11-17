/* KORVEL : la presse à chaud en 3D (Three.js r170 en local, licence MIT, aucune autre librairie).
   Tout est modélisé en code : table d'atelier, presse « clamshell » (plateau chauffant en aluminium
   brossé, bras, poignée, colonne), textile posé à plat (plan dense déplacé par une carte de hauteur :
   bords arrondis, plis, manches qui retombent sur les côtés du plateau), film de transfert, vapeur,
   piles de l'équipe avec l'étiquette de chaque prénom.
   Dialogue avec site.js : window.KorvelPresse (etat, presser, equipe, vue, capture) et les événements
   korvel:pret, korvel:place. */
import * as THREE from "./vendor/three.module.min.js";

var T = window.KorvelTextile;
var hote = document.getElementById("presse-3d");
var mobile = window.matchMedia("(max-width: 860px)").matches;
var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- moteur ---------- */
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x0c0d0f, 1);
hote.appendChild(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c0d0f, 2.6, 6.2);
var camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30);

/* environnement de reflets : pièce sombre, une lampe chaude, une fenêtre bleue */
(function () {
  var pm = new THREE.PMREMGenerator(renderer);
  var env = new THREE.Scene();
  var murs = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: 0x15161a, side: THREE.BackSide }));
  env.add(murs);
  var lampe = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), new THREE.MeshBasicMaterial({ color: 0xffd9a8 }));
  lampe.position.set(0, 2.9, 0); lampe.rotation.x = Math.PI / 2; env.add(lampe);
  var fen = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), new THREE.MeshBasicMaterial({ color: 0x3a5a9a }));
  fen.position.set(3.5, 1.4, -4.9); env.add(fen);
  var bande = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), new THREE.MeshBasicMaterial({ color: 0x9aa3ad }));
  bande.position.set(0, 1.2, 4.9); bande.rotation.y = Math.PI; env.add(bande);
  // deux grandes softbox : l'aluminium de la tête et des chromes a quelque chose à refléter
  [[0, 3.2, -3.6, 0.9], [-2.6, 2.4, 2.8, 0.55]].forEach(function (b) {
    var sb = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(b[3], b[3], b[3] * 1.04), side: THREE.DoubleSide }));
    sb.position.set(b[0], b[1], b[2]); sb.lookAt(0, 0.3, 0); env.add(sb);
  });
  scene.environment = pm.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.85;
  pm.dispose();
})();

/* lumières : la suspension de l'atelier, un contre-jour froid, un fond très bas */
var lampe = new THREE.SpotLight(0xfff7f0, 30, 7, 0.7, 0.55, 1.3);
lampe.position.set(0.35, 1.9, 1.75);
lampe.target.position.set(0.0, 0.05, -0.02);
lampe.castShadow = true;
lampe.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
lampe.shadow.bias = -0.00025;
lampe.shadow.normalBias = 0.012;
lampe.shadow.radius = 4;
lampe.shadow.camera.near = 0.8; lampe.shadow.camera.far = 4.5;
scene.add(lampe, lampe.target);
var contre = new THREE.DirectionalLight(0xb4c2e6, 0.7);   // contre-jour froid : détache la tête et les bras
contre.position.set(-1.2, 2.2, -2.6);
scene.add(contre);
var bordD = new THREE.DirectionalLight(0xffe2c4, 0.7);     // liseré chaud côté droit
bordD.position.set(2.4, 1.0, -0.6);
scene.add(bordD);
scene.add(new THREE.HemisphereLight(0x5a616c, 0x0b0b0c, 0.85));

/* ---------- textures fabriquées ---------- */
function canvas(w, h, f) { var c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h); return c; }
function texCanvas(c, rep, srgb) {
  var t = new THREE.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/* acier brossé (table) */
var brosse = canvas(512, 512, function (x, w, h) {
  x.fillStyle = "#808080"; x.fillRect(0, 0, w, h);
  for (var i = 0; i < 2600; i++) {
    var y = Math.random() * h, l = 40 + Math.random() * 260;
    x.fillStyle = "rgba(" + (Math.random() < 0.5 ? "255,255,255" : "0,0,0") + "," + (0.03 + Math.random() * 0.06) + ")";
    x.fillRect(Math.random() * w, y, l, 1);
  }
  for (var j = 0; j < 30; j++) { // traces d'usage
    x.fillStyle = "rgba(0,0,0,.06)";
    x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 8 + Math.random() * 20, Math.random() * 3, 0, 7); x.fill();
  }
});
/* normale de maille à partir du grain du textile */
function normaleDe(src, force) {
  var w = src.width, h = src.height, s = src.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  return canvas(w, h, function (x) {
    var d = x.createImageData(w, h), p = d.data;
    function H(i, j) { i = (i + w) % w; j = (j + h) % h; return s[(j * w + i) * 4] / 255; }
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var dx = (H(i + 1, j) - H(i - 1, j)) * force, dy = (H(i, j + 1) - H(i, j - 1)) * force;
      var l = Math.sqrt(dx * dx + dy * dy + 1), k = (j * w + i) * 4;
      p[k] = (-dx / l * 0.5 + 0.5) * 255; p[k + 1] = (-dy / l * 0.5 + 0.5) * 255; p[k + 2] = (1 / l * 0.5 + 0.5) * 255; p[k + 3] = 255;
    }
    x.putImageData(d, 0, 0);
  });
}
var normMaille = texCanvas(normaleDe(T.grain(), 2.2), [14, 14]);

/* ---------- table ---------- */
var matTable = new THREE.MeshStandardMaterial({ color: 0x34373c, metalness: 0.5, roughness: 0.58, roughnessMap: texCanvas(brosse, [3, 2]), map: texCanvas(brosse, [3, 2], true) });
var table = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 2.3), matTable);
table.position.set(0.35, -0.03, 0.05);
table.receiveShadow = true;
scene.add(table);

/* ---------- la presse ---------- */
var noir = new THREE.MeshStandardMaterial({ color: 0x141518, metalness: 0.35, roughness: 0.38 });
var noirMat = new THREE.MeshStandardMaterial({ color: 0x26282c, metalness: 0.45, roughness: 0.42 });
var chrome = new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 1, roughness: 0.18 });
var alu = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.3, roughnessMap: texCanvas(brosse, [1, 1]) });
var feutre = new THREE.MeshStandardMaterial({ color: 0x4f5359, metalness: 0, roughness: 0.9, normalMap: texCanvas(normaleDe(T.grain(), 0.8), [5, 5]) });

function boiteArrondie(w, h, d, r, mat) {
  var s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
  s.lineTo(x + w, z + d - r); s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
  s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r); s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
  var g = new THREE.ExtrudeGeometry(s, { depth: h - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(Math.PI / 2); g.translate(0, h - 0.004, 0);
  var m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
var presse = new THREE.Group();
scene.add(presse);
var PW = 0.88, PD = 0.94;                // plateau
var Y0 = 0.095;                          // dessus du plateau inférieur
var socle = boiteArrondie(PW + 0.06, 0.06, PD + 0.06, 0.02, noir); presse.add(socle);
var pieds = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
pieds.forEach(function (p) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.012, 20), chrome); c.position.set(p[0] * (PW / 2 - 0.02), -0.006 + 0.006, p[1] * (PD / 2 - 0.02)); presse.add(c); });
var plateauBas = boiteArrondie(PW, 0.035, PD, 0.018, feutre); plateauBas.position.y = 0.06; presse.add(plateauBas);
// colonne arrière
var colonne = boiteArrondie(0.2, 0.46, 0.14, 0.02, noir); colonne.position.set(0, 0, -PD / 2 - 0.1); presse.add(colonne);
var vis = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12); vis.rotateX(Math.PI / 2);
[[-0.075, 0.08], [0.075, 0.08], [-0.075, 0.36], [0.075, 0.36]].forEach(function (v) { var m = new THREE.Mesh(vis, chrome); m.position.set(v[0], v[1], -PD / 2 - 0.1 + 0.072); presse.add(m); });
// le bras pivotant (pivot en haut de la colonne)
var PIVOT = new THREE.Vector3(0, 0.43, -PD / 2 - 0.09);
var bras = new THREE.Group(); bras.position.copy(PIVOT); presse.add(bras);
var haut = new THREE.Group(); haut.position.set(0, Y0 + 0.012 - PIVOT.y, -PIVOT.z); bras.add(haut); // repère : centre du plateau, dessous
var plateauHaut = boiteArrondie(PW + 0.02, 0.05, PD + 0.02, 0.022, alu); haut.add(plateauHaut);
var chauffe = boiteArrondie(PW - 0.36, 0.035, PD - 0.4, 0.03, noirMat); chauffe.position.y = 0.05; haut.add(chauffe);
// semelle chauffante (face qui touche le textile) : gris anti-adhésif, éclairée par la lampe quand la tête est ouverte
var semelle = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.01, PD - 0.01), new THREE.MeshStandardMaterial({ color: 0x6d7076, metalness: 0.35, roughness: 0.38, normalMap: texCanvas(normaleDe(T.grain(), 0.25), [6, 6]) }));
semelle.rotation.x = Math.PI / 2; semelle.position.y = -0.0015; haut.add(semelle);
var liseretSemelle = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(PW - 0.08, PD - 0.08)), new THREE.LineBasicMaterial({ color: 0x9a9da3 }));
liseretSemelle.rotation.x = Math.PI / 2; liseretSemelle.position.y = -0.002; haut.add(liseretSemelle);
// nervures du capot chauffant
[-0.12, 0, 0.12].forEach(function (z) { var n = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.42, 0.008, 0.012), chrome); n.position.set(0, 0.089, z); haut.add(n); });
var tige = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 16), chrome); tige.position.set(0, 0.12, 0); haut.add(tige);
var molette = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 28), noirMat); molette.position.set(0, 0.17, 0); haut.add(molette);
// deux bras latéraux du pivot jusqu'à la poignée avant
function barre(a, b, ep, mat) {
  var v = new THREE.Vector3().subVectors(b, a), l = v.length();
  var m = new THREE.Mesh(new THREE.BoxGeometry(ep, ep * 1.6, l), mat);
  m.position.copy(a).addScaledVector(v, 0.5); m.lookAt(b); m.castShadow = true; return m;
}
[-0.11, 0.11].forEach(function (x) {
  var a = new THREE.Vector3(x, 0, 0), b = new THREE.Vector3(x, -0.06, 0.82);
  bras.add(barre(a, b, 0.03, noir));
  var c = new THREE.Vector3(x, -0.03, 0.42), d = new THREE.Vector3(x * 0.6, Y0 + 0.2 - PIVOT.y, -PIVOT.z);
  bras.add(barre(c, d, 0.022, noir));
});
var poignee = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.4, 24), noirMat);
poignee.rotation.z = Math.PI / 2; poignee.position.set(0, -0.06, 0.84); poignee.castShadow = true; bras.add(poignee);
[-0.205, 0.205].forEach(function (x) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 24), chrome); c.rotation.z = Math.PI / 2; c.position.set(x, -0.06, 0.84); bras.add(c); });
var axe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.27, 20), chrome); axe.rotation.z = Math.PI / 2; bras.add(axe);
var OUVERT = -0.98, FERME = 0;
bras.rotation.x = OUVERT;
bras.traverse(function (o) { if (o.isMesh) o.castShadow = false; });
// voyant de chauffe sur la colonne
var voyant = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0x3a1020 }));
voyant.position.set(0.06, 0.4, -PD / 2 - 0.1 + 0.071); presse.add(voyant);

/* ---------- le textile posé ---------- */
var SEG = mobile ? 120 : 190;
var geoTissu = new THREE.PlaneGeometry(T.M, T.M, SEG, SEG); geoTissu.rotateX(-Math.PI / 2);
var canTissu = document.createElement("canvas"); canTissu.width = canTissu.height = T.N;
var texTissu = new THREE.CanvasTexture(canTissu); texTissu.colorSpace = THREE.SRGBColorSpace; texTissu.anisotropy = 8;
var canRelief = document.createElement("canvas"); canRelief.width = canRelief.height = 512;
/* jersey de coton : normale Poly Haven « cotton_jersey » (CC0), reflet velouté (sheen) */
var normJersey = new THREE.TextureLoader().load("textures/jersey-normale.jpg");
normJersey.wrapS = normJersey.wrapT = THREE.RepeatWrapping; normJersey.repeat.set(22, 22); normJersey.anisotropy = 8;
var matTissu = new THREE.MeshPhysicalMaterial({ map: texTissu, alphaTest: 0.5, alphaToCoverage: true, roughness: 0.94, metalness: 0, normalMap: normJersey, normalScale: new THREE.Vector2(0.6, 0.6), sheen: 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color(0x5c6066), side: THREE.DoubleSide });
var tissu = new THREE.Mesh(geoTissu, matTissu);
tissu.castShadow = true; tissu.receiveShadow = true;
var porte = new THREE.Group(); porte.add(tissu); presse.add(porte);
porte.position.y = Y0;

var pos0 = geoTissu.attributes.position.array.slice(0);
var uv = geoTissu.attributes.uv.array;
var masques = {};
var plis = 1;          // 1 = plis du tissu posé, ~0,25 une fois pressé
var forme = "";
function bruit(x, z) {
  return Math.sin(x * 23.1 + z * 7.3) * 0.45 + Math.sin(x * 9.7 - z * 15.2 + 1.3) * 0.35 + Math.sin((x + z) * 31.0 + 2.1) * 0.2 + Math.sin(x * 4.1 + z * 3.3) * 0.6;
}
function relief() {
  var p = geoTissu.attributes.position.array, m = masques[forme];
  if (!m) return;
  var tm = m.width, d = m.data;
  for (var i = 0, n = p.length / 3; i < n; i++) {
    var u = uv[i * 2], v = 1 - uv[i * 2 + 1];
    var a = d[((Math.min(tm - 1, (v * tm) | 0)) * tm + Math.min(tm - 1, (u * tm) | 0)) * 4 + 3] / 255;
    var x = pos0[i * 3], z = pos0[i * 3 + 2];
    var e = Math.max(0, Math.min(1, (a - 0.45) / 0.5)); e = e * e * (3 - 2 * e);
    var h = 0.011 * e + bruit(x, z) * 0.0062 * e * plis;
    var ax = Math.abs(x), az = Math.abs(z);
    var tombe = Math.max(0, Math.min(1, (ax - PW / 2 + 0.01) / 0.11));
    var tombeZ = Math.max(0, Math.min(1, (az - PD / 2 + 0.015) / 0.05));
    h -= 0.042 * (tombe * tombe * (3 - 2 * tombe)) + 0.04 * tombeZ;
    p[i * 3 + 1] = h + 0.0015;
  }
  geoTissu.attributes.position.needsUpdate = true;
  geoTissu.computeVertexNormals();
}

/* ---------- film de transfert ---------- */
var film = new THREE.Group(); presse.add(film);
var matSupport = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, depthWrite: false, side: THREE.DoubleSide });
var support = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matSupport); support.rotation.x = -Math.PI / 2;
var texLogo = new THREE.Texture(); texLogo.colorSpace = THREE.SRGBColorSpace; var logoVu = null;
var matLogo = new THREE.MeshStandardMaterial({ map: texLogo, transparent: true, alphaTest: 0.05, roughness: 0.45, metalness: 0, depthWrite: false });
var logoFilm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matLogo); logoFilm.rotation.x = -Math.PI / 2; logoFilm.position.y = 0.0008;
var bord = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
support.add(bord);
var pivotFilm = new THREE.Group(); pivotFilm.add(support, logoFilm); film.add(pivotFilm);
film.visible = false;
var filmY = Y0 + 0.045;

/* ---------- vapeur ---------- */
var texVapeur = new THREE.CanvasTexture(canvas(128, 128, function (x) {
  var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.5, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
}));
var vapeurs = [];
for (var i = 0; i < (mobile ? 26 : 44); i++) {
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texVapeur, transparent: true, opacity: 0, depthWrite: false, color: 0xf1ece6 }));
  sp.visible = false; presse.add(sp); vapeurs.push({ s: sp, vie: 0, t: 0, v: new THREE.Vector3() });
}
var emettre = 0;
function lancerVapeur(dt) {
  if (emettre > 0) {
    emettre -= dt;
    for (var k = 0; k < 2; k++) {
      var p = vapeurs.find(function (q) { return q.vie <= 0; });
      if (!p) break;
      var cote = Math.floor(Math.random() * 4), r = Math.random() - 0.5;
      var x = cote < 2 ? (cote ? 1 : -1) * (PW / 2 + 0.01) : r * PW, z = cote >= 2 ? (cote === 2 ? 1 : -1) * (PD / 2 + 0.01) : r * PD;
      p.s.position.set(x, Y0 + 0.03, z); p.vie = 1.6 + Math.random(); p.t = 0;
      p.v.set(x * 0.05 + (Math.random() - 0.5) * 0.02, 0.12 + Math.random() * 0.08, z * 0.03);
      p.s.visible = true;
    }
  }
  vapeurs.forEach(function (p) {
    if (p.vie <= 0) return;
    p.t += dt; var k = p.t / p.vie;
    if (k >= 1) { p.vie = 0; p.s.visible = false; p.s.material.opacity = 0; return; }
    p.s.position.addScaledVector(p.v, dt);
    var sc = 0.04 + k * 0.16; p.s.scale.set(sc, sc * 1.6, sc);
    p.s.material.opacity = Math.sin(k * Math.PI) * 0.28;
  });
}

/* ---------- accessoires : rouleau de film, pile de textiles vierges ---------- */
var rouleau = new THREE.Group();
var r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 40), new THREE.MeshStandardMaterial({ color: 0xb9c3cb, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.85 }));
r1.rotation.z = Math.PI / 2; r1.castShadow = true; rouleau.add(r1);
var r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 24), noirMat); r2.rotation.z = Math.PI / 2; rouleau.add(r2);
rouleau.position.set(0.66, 0.06, -0.78); rouleau.rotation.y = -0.15; scene.add(rouleau);

function plieGeo() {
  var w = 0.3, d = 0.36, r = 0.03, s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r); s.lineTo(x + w, z + d - r); s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
  s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r); s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
  var g = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(Math.PI / 2); g.translate(0, 0.028, 0);
  return g;
}
var GEO_PLIE = plieGeo();
function matPlie(hex, tex) {
  var cote = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, normalMap: normMaille, normalScale: new THREE.Vector2(0.4, 0.4) });
  if (!tex) return cote;
  var dessus = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, normalMap: normMaille, normalScale: new THREE.Vector2(0.4, 0.4) });
  return [dessus, cote];
}
[["#eceeef", 0], ["#16171a", 1], ["#1d2a44", 2], ["#3a3d42", 3]].forEach(function (c, i) {
  var m = new THREE.Mesh(GEO_PLIE, matPlie(c[0])); m.position.set(-0.86, i * 0.034, 0.02); m.rotation.y = 0.08 * (i % 2 ? 1 : -1);
  m.castShadow = m.receiveShadow = true; scene.add(m);
});

/* ---------- l'équipe : piles et étiquettes ---------- */
var piles = new THREE.Group(); scene.add(piles);
var PILE_X = 0.86, PAR_PILE = 8;
function etiquette(nom, taille) {
  var c = canvas(256, 64, function (x) {
    x.fillStyle = "#121316"; x.fillRect(0, 0, 256, 64);
    x.fillStyle = "#ff3d9a"; x.fillRect(0, 0, 10, 64);
    x.fillStyle = "#f4f5f6"; x.font = "800 40px 'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif";
    x.textBaseline = "middle"; x.fillText(String(nom).toUpperCase(), 22, 34, 160);
    x.font = "700 26px 'Rethink Sans', Arial, sans-serif"; x.textAlign = "right"; x.fillText(taille || "", 244, 34);
  });
  var t = texCanvas(c, null, true);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.0375), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
  return m;
}
function texPlie() {
  // le dessus d'un textile plié : le haut du devant, avec l'impression
  var c = canvas(512, 614, function (x) {
    x.drawImage(canDevant, 512 - 210, 120, 420, 504, 0, 0, 512, 614);
  });
  var t = texCanvas(c, null, true);
  t.repeat.set(1 / 0.3, -1 / 0.36); t.offset.set(0.5, 0.5);
  return t;
}
var canDevant = document.createElement("canvas");
function viderPiles() { while (piles.children.length) { var o = piles.children.pop(); o.traverse(function (k) { if (k.geometry && k.geometry !== GEO_PLIE) k.geometry.dispose(); }); } }
function poserPlie(i, membre, tex, hex) {
  var g = new THREE.Group();
  var m = new THREE.Mesh(GEO_PLIE, matPlie(hex, tex)); m.castShadow = m.receiveShadow = true; g.add(m);
  var e = etiquette(membre.nom, membre.taille); e.position.set(0.04, 0.026, 0.188); g.add(e);
  var p = Math.floor(i / PAR_PILE), n = i % PAR_PILE;
  g.position.set(PILE_X + p * 0.38, n * 0.034, 0.12 - p * 0.05);
  g.rotation.y = (n % 2 ? 1 : -1) * 0.025 + (p ? -0.06 : 0);
  piles.add(g);
  return g;
}

/* ---------- caméra ---------- */
var vues = {
  presse: { cible: new THREE.Vector3(0.0, 0.26, -0.1), largeur: mobile ? 1.5 : 1.95, dir: new THREE.Vector3(0.42, 0.5, 0.76) },
  equipe: { cible: new THREE.Vector3(0.42, 0.22, 0.0), largeur: 2.45, dir: new THREE.Vector3(0.36, 0.52, 0.78) }
};
var vueCourante = "presse", camCible = new THREE.Vector3(), camPos = new THREE.Vector3(), camPosVoulue = new THREE.Vector3(), camCibleVoulue = new THREE.Vector3();
var decalage = 0;      // part de la largeur occupée par le volet (ordinateur)
var souris = { x: 0, y: 0, lx: 0, ly: 0 };
function placerCamera(immediat) {
  var w = hote.clientWidth || 1, h = hote.clientHeight || 1;
  var utile = w * (1 - decalage);
  var aspect = utile / h;
  var v = vues[vueCourante];
  var tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  var dist = Math.max((v.largeur / 2) / (tv * aspect), (v.largeur * 0.9 / 2) / tv);
  camPosVoulue.copy(v.dir).normalize().multiplyScalar(dist).add(v.cible);
  camCibleVoulue.copy(v.cible);
  scene.fog.near = dist * 0.85; scene.fog.far = dist * 2.3;
  if (immediat) { camPos.copy(camPosVoulue); camCible.copy(camCibleVoulue); }
}
function redim() {
  var w = hote.clientWidth || 1, h = hote.clientHeight || 1;
  decalage = (!mobile && w > 980) ? Math.min(0.42, 560 / w) : 0;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (decalage) camera.setViewOffset(w, h, -w * decalage / 2, 0, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  placerCamera(!pret);
}
window.addEventListener("resize", redim);
if (window.ResizeObserver) new ResizeObserver(function () { redim(); }).observe(hote);

/* ---------- petites animations ---------- */
var anims = [];
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function anim(duree, f, courbe) {
  return new Promise(function (ok) {
    if (calme) duree = Math.min(duree, 0.12);
    anims.push({ t: 0, d: duree, f: f, e: courbe || ease, ok: ok });
  });
}
function pause(s) { return anim(calme ? 0.01 : s, function () {}); }

/* ---------- état venu du site ---------- */
var E = null, logoTech = null, rectPx = null, zonePx = null;
var face = "devant";
function zoneDe(e) { return T.ZONES[e.piece][e.zone]; }
function dessinerTissu(e, avecLogo, nom) {
  var imprime = [];
  var faceVoulue = nom ? "dos" : (e.zone === "dos" ? "dos" : "devant");
  if (avecLogo && logoTech && ((faceVoulue === "dos") === (e.zone === "dos"))) imprime.push({ img: logoTech, rect: rectPx });
  T.dessiner({ piece: e.piece, couleur: e.couleur, face: faceVoulue, imprime: imprime, nom: nom ? nom.nom : null, numero: nom ? nom.num : null, texteNom: e.couleur === "blanc" ? "#121316" : "#f4f5f6" }, canTissu);
  texTissu.needsUpdate = true;
  var cle = e.piece;   // la silhouette posée est toujours entière (le dos ferme l'encolure)
  if (!masques[cle]) masques[cle] = T.masque(e.piece, "dos", 192);
  if (forme !== cle) { forme = cle; relief(); }
  face = faceVoulue;
}
function placerFilm(e) {
  if (!logoTech) { film.visible = false; return; }
  var z = zoneDe(e);
  rectPx = T.rectDans(z, logoTech, e.echelle, e.dx, e.dy);
  zonePx = z;
  var k = T.M / T.N;
  var w = rectPx.w * k, d = rectPx.h * k;
  film.position.set((rectPx.x + rectPx.w / 2) * k - T.M / 2, filmY, (rectPx.y + rectPx.h / 2) * k - T.M / 2);
  logoFilm.scale.set(w, d, 1);
  support.scale.set(w + 0.05, d + 0.05, 1);
}
var occupe = false;
var api = {
  etat: function (e) {
    E = e;
    logoTech = e.logo ? T.logoTechnique(e.logo, e.technique, e.teinte) : null;
    if (logoTech && logoTech !== logoVu) {
      // une texture neuve à chaque logo : une texture réutilisée garde sa taille d'origine et l'ancien logo restait visible autour
      var ancienne = texLogo; texLogo = new THREE.CanvasTexture(logoTech); texLogo.colorSpace = THREE.SRGBColorSpace; texLogo.anisotropy = 8;
      matLogo.map = texLogo; matLogo.needsUpdate = true; ancienne.dispose(); logoVu = logoTech;
    }
    placerFilm(e);
    if (!occupe) {
      dessinerTissu(e, e.presse, null);
      film.visible = !!logoTech && !e.presse;
      logoFilm.visible = true;
      pivotFilm.rotation.set(0, 0, 0); pivotFilm.position.set(0, 0, 0);
      matSupport.opacity = 0.07;
    }
    if (e.couleur) canDevant = canDevant; // gardé pour les piles
  },
  /* Presser : la tête descend, contact (impression), vapeur, remontée, le film se décolle */
  presser: function (rapide) {
    if (occupe || !E) return Promise.resolve();
    occupe = true;
    var k = rapide ? 0.45 : 1;
    var dep = bras.rotation.x;
    return anim(0.9 * k, function (t) { bras.rotation.x = dep + (FERME - dep) * t; }, function (t) { return t * t * t; })
      .then(function () {
        film.position.y = Y0 + 0.016;
        voyant.material.color.set(0xff3d9a);
        emettre = rapide ? 0.5 : 1.3;
        secousse = 0.004;
        // l'encre passe sur le tissu
        dessinerTissu(E, true, null); logoFilm.visible = false;
        document.dispatchEvent(new CustomEvent("korvel:contact"));
        return anim(rapide ? 0.35 : 1.25, function (t) { plis = 1 - 0.75 * t; relief(); });
      })
      .then(function () {
        voyant.material.color.set(0x3a1020);
        return anim(0.85 * k, function (t) { bras.rotation.x = FERME + (OUVERT - FERME) * t; });
      })
      .then(function () { return decoller(rapide); })
      .then(function () { occupe = false; film.visible = false; film.position.y = filmY; });
  },
  /* L'équipe : pour chaque prénom, on retourne la pièce, on presse le prénom au dos, on plie, on empile */
  equipe: function (liste, chaque) {
    if (occupe || !E) return Promise.resolve();
    occupe = true;
    viderPiles();
    api.vue("equipe");
    // le dessus des pièces pliées : le devant imprimé
    canDevant = document.createElement("canvas"); canDevant.width = canDevant.height = T.N;
    var rectDev = E.zone !== "dos" && logoTech ? [{ img: logoTech, rect: rectPx }] : [];
    T.dessiner({ piece: E.piece, couleur: E.couleur, face: "devant", imprime: rectDev }, canDevant);
    var texP = texPlie(), hex = T.COULEURS[E.couleur].hex;
    var anime = calme ? 0 : Math.min(liste.length, mobile ? 4 : 6);
    var i = 0;
    function suivant() {
      if (i >= liste.length) return Promise.resolve();
      var m = liste[i], idx = i; i++;
      if (idx >= anime) { poserPlie(idx, m, texP, hex); if (chaque) chaque(idx); return pause(0.06).then(suivant); }
      var r = idx >= 2 ? 0.6 : 1;
      return retourner("dos", m, r)
        .then(function () { return api._presseNom(m, r); })
        .then(function () { return plier(idx, m, texP, hex, r); })
        .then(function () { if (chaque) chaque(idx); return suivant(); });
    }
    return pause(0.5).then(suivant).then(function () {
      plis = 1; dessinerTissu(E, true, null); relief();
      porte.position.set(-1.4, Y0, 0); porte.scale.set(1, 1, 1); porte.visible = true;
      return anim(0.6, function (t) { porte.position.x = -1.4 * (1 - t); });
    }).then(function () { occupe = false; });
  },
  _presseNom: function (m, r) {
    var dep = bras.rotation.x;
    return anim(0.45 * r, function (t) { bras.rotation.x = dep + (FERME - dep) * t; }, function (t) { return t * t; })
      .then(function () { emettre = 0.4; secousse = 0.003; dessinerTissu(E, true, m); return pause(0.3 * r); })
      .then(function () { return anim(0.45 * r, function (t) { bras.rotation.x = FERME + (OUVERT - FERME) * t; }); });
  },
  vue: function (v) { vueCourante = v; placerCamera(false); },
  capture: function () {
    rendre(); try { return renderer.domElement.toDataURL("image/jpeg", 0.88); } catch (e) { return null; }
  },
  vider: function () { viderPiles(); api.vue("presse"); },
  enCours: function () { return occupe; }
};
function decoller(rapide) {
  // le support se relève depuis son bord arrière puis disparaît
  var w = support.scale.y;
  pivotFilm.position.z = w / 2; support.position.z = -w / 2; logoFilm.position.z = -w / 2;
  return anim(rapide ? 0.3 : 0.7, function (t) {
    pivotFilm.rotation.x = -t * 1.1;
    pivotFilm.position.y = t * 0.04;
    matSupport.opacity = 0.07 * (1 - t); bord.material.opacity = 0.5 * (1 - t);
  }).then(function () {
    pivotFilm.rotation.x = 0; pivotFilm.position.set(0, 0, 0); support.position.z = 0; logoFilm.position.z = 0; matSupport.opacity = 0.07; bord.material.opacity = 0.5;
  });
}
function retourner(versFace, m, r) {
  return anim(0.32 * r, function (t) { porte.rotation.z = t * Math.PI / 2; porte.position.y = Y0 + Math.sin(t * Math.PI / 2) * 0.12; })
    .then(function () {
      plis = 1; dessinerTissu(E, true, { nom: "", num: "" }); relief();
      // le film du prénom
      return anim(0.32 * r, function (t) { porte.rotation.z = -Math.PI / 2 * (1 - t); porte.position.y = Y0 + Math.cos(t * Math.PI / 2) * 0.12; });
    });
}
function plier(idx, m, tex, hex, r) {
  var p = Math.floor(idx / PAR_PILE), n = idx % PAR_PILE;
  var cible = new THREE.Vector3(PILE_X + p * 0.38, n * 0.034 + 0.03, 0.12 - p * 0.05);
  var dep = porte.position.clone();
  return anim(0.5 * r, function (t) {
    porte.scale.set(1 - 0.62 * t, 1 + t * 2, 1 - 0.55 * t);
    porte.position.set(dep.x + (cible.x - dep.x) * t, dep.y + Math.sin(t * Math.PI) * 0.18 + (cible.y - dep.y) * t, dep.z + (cible.z - dep.z) * t);
  }).then(function () {
    porte.visible = false;
    poserPlie(idx, m, tex, hex);
    porte.scale.set(1, 1, 1);
    plis = 1; dessinerTissu(E, true, null); relief();
    porte.position.set(-1.4, Y0, 0); porte.visible = true;
    return anim(0.42 * r, function (t) { porte.position.x = -1.4 * (1 - t); });
  });
}

/* ---------- glisser le logo (souris ; au doigt, les boutons de position suffisent) ---------- */
var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), planDrag = new THREE.Plane(new THREE.Vector3(0, 1, 0), -filmY), pt = new THREE.Vector3();
var drag = null;
function versNdc(ev) {
  var r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function surFilm(ev) { versNdc(ev); return film.visible && ray.intersectObject(support, false).length > 0; }
renderer.domElement.addEventListener("pointerdown", function (ev) {
  if (occupe || !E || E.presse || !surFilm(ev)) return;
  if (ev.pointerType === "touch") return;
  versNdc(ev); ray.ray.intersectPlane(planDrag, pt);
  drag = { x: pt.x, z: pt.z, dx: E.dx, dy: E.dy };
  renderer.domElement.setPointerCapture(ev.pointerId);
  hote.classList.add("tient");
});
renderer.domElement.addEventListener("pointermove", function (ev) {
  var r = renderer.domElement.getBoundingClientRect();
  souris.x = ((ev.clientX - r.left) / r.width) * 2 - 1; souris.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
  if (!drag) { if (ev.pointerType !== "touch") hote.classList.toggle("prise", !occupe && E && !E.presse && surFilm(ev)); return; }
  versNdc(ev); if (!ray.ray.intersectPlane(planDrag, pt)) return;
  var k = T.N / T.M;
  var dx = drag.dx + (pt.x - drag.x) * k, dy = drag.dy + (pt.z - drag.z) * k;
  var limX = Math.max(0, zonePx.w - rectPx.w / 2), limY = Math.max(0, zonePx.h - rectPx.h / 2);
  dx = Math.max(-limX, Math.min(limX, dx)); dy = Math.max(-limY, Math.min(limY, dy));
  document.dispatchEvent(new CustomEvent("korvel:place", { detail: { dx: dx, dy: dy } }));
});
function lacher() { drag = null; hote.classList.remove("tient"); }
renderer.domElement.addEventListener("pointerup", lacher);
renderer.domElement.addEventListener("pointercancel", lacher);
renderer.domElement.addEventListener("pointerleave", function () { souris.x = souris.y = 0; });

/* ---------- boucle ---------- */
var horloge = new THREE.Clock(), visible = true, actif = true, pret = false, secousse = 0, tps = 0;
function rendre() { renderer.render(scene, camera); }
function boucle() {
  requestAnimationFrame(boucle);
  if (!visible || !actif) { horloge.getDelta(); return; }
  var dt = Math.min(0.05, horloge.getDelta()); tps += dt;
  for (var i = anims.length - 1; i >= 0; i--) {
    var a = anims[i]; a.t += dt; var k = Math.min(1, a.t / a.d);
    a.f(a.e(k));
    if (k >= 1) { anims.splice(i, 1); a.ok(); }
  }
  lancerVapeur(dt);
  // caméra : suit la vue, léger parallaxe à la souris (ordinateur)
  souris.lx += (souris.x - souris.lx) * 0.05; souris.ly += (souris.y - souris.ly) * 0.05;
  camPos.lerp(camPosVoulue, calme ? 1 : 0.06); camCible.lerp(camCibleVoulue, calme ? 1 : 0.06);
  camera.position.copy(camPos);
  if (!mobile && !calme) { camera.position.x += souris.lx * 0.09; camera.position.y -= souris.ly * 0.05; }
  if (secousse > 0) { camera.position.y -= secousse; secousse *= 0.8; if (secousse < 0.0002) secousse = 0; }
  camera.lookAt(camCible);
  if (film.visible && !occupe && !calme && E && !E.presse) film.position.y = filmY + Math.sin(tps * 1.6) * 0.004;
  rendre();
}
new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "120px" }).observe(hote);
document.addEventListener("visibilitychange", function () { actif = !document.hidden; });

redim();
window.KorvelPresse = api;
document.fonts && document.fonts.ready.then(function () { if (E) api.etat(E); });
pret = true;
boucle();
hote.classList.add("pret");
document.dispatchEvent(new CustomEvent("korvel:pret"));
