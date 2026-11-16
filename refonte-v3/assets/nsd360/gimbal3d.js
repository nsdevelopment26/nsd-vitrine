/* =================================================================
   NSD 360 — gimbal + iPhone en 3D (Three.js r170, modélisé en code)
   Unité : 1 = 10 cm. iPhone 71,5 x 146,6 x 8,25 mm.
   Chaîne mécanique d'un vrai stabilisateur 3 axes :
     poignée → moteur panoramique (axe vertical) → bras → moteur de roulis
     (axe avant-arrière, aligné sur le centre du téléphone) → bras →
     moteur d'inclinaison (axe latéral) → pince → téléphone.
   Chaque axe ne tourne que dans des plages où aucune pièce ne se touche.
   ================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

const W = 0.715, H = 1.466, D = 0.0825, R = 0.105;           // iPhone
const SCREEN_W = 0.664, SCREEN_H = SCREEN_W * 844 / 390;       // écran au format des images (390 x 844)
const MODEL_TOP = H / 2, MODEL_BOTTOM = -3.2;                 // hauteur totale du modèle

/* Poses par temps de l'expérience : lacet de l'ensemble, panoramique, inclinaison, roulis (radians) */
const YAW  = [-0.78, 0.82, 0.62, -0.66, -0.86, 0.80, -0.74, 0.70, 0.62];
const PAN  = [ 0.10,-0.12,-0.04, 0.08, 0.12,-0.12, 0.10,-0.10,-0.06];
const TILT = [-0.05, 0.09,-0.13, 0.04,-0.06, 0.09,-0.05, 0.06, 0.00];
const ROLL = [ 0.00, 0.05,-0.08, 0.00, 0.04,-0.05, 0.00, 0.03, 0.00];
/* Ampleur du mouvement de transition entre deux temps (le premier fait un tour complet : 360°) */
const SWING = [Math.PI * 2, 0.32, -0.32, 0.45, -0.34, 0.36, -0.4, 0.3];

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function contactShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.55)'); grd.addColorStop(.45, 'rgba(0,0,0,.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function init(canvas, state, stage) {
  const mobile = () => state.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(4, 2, -5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d4cc, 0.5));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  camera.position.set(0, 0.35, 9.4);
  camera.lookAt(0, 0, 0);

  /* ---------- Matières ---------- */
  const M = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0x151617, roughness: 0.58, metalness: 0.28, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.4, metalness: 0.1, emissive: 0x3a0508 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.9, metalness: 0.02 }),
    ring: new THREE.MeshStandardMaterial({ color: 0x55585d, roughness: 0.32, metalness: 1 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x111112, roughness: 0.95 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ledRed: new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xc2bbb0, roughness: 0.3, metalness: 1 }),
    back: new THREE.MeshPhysicalMaterial({ color: 0xd9d4cc, roughness: 0.62, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.6 }),
    bezel: new THREE.MeshPhysicalMaterial({ color: 0x040404, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x07070a, roughness: 0.04, metalness: 0.2, clearcoat: 1 }),
    plateau: new THREE.MeshPhysicalMaterial({ color: 0xcdc7be, roughness: 0.25, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
  };

  const box = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m);
  const cyl = (rt, rb, h, m, seg = 48) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  const ringAt = (r, tube, m) => new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 64), m);

  /* Moteur : boîtier + bague métal + capot, axe Y par défaut */
  function motor(r, len) {
    const g = new THREE.Group();
    const body = cyl(r, r, len, M.shell); g.add(body);
    const cap = cyl(r * 0.78, r * 0.78, 0.012, M.ring); cap.position.y = len / 2 + 0.004; g.add(cap);
    const cap2 = cap.clone(); cap2.position.y = -len / 2 - 0.004; g.add(cap2);
    const band = ringAt(r * 1.002, 0.006, M.ring); band.rotation.x = Math.PI / 2; band.position.y = len * 0.18; g.add(band);
    return g;
  }

  /* ---------- iPhone ---------- */
  const phone = new THREE.Group();
  const outline = roundedRectShape(W, H, R);
  const bodyGeo = new THREE.ExtrudeGeometry(outline, { depth: D - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 24 });
  bodyGeo.translate(0, 0, -(D - 0.012) / 2);
  const body = new THREE.Mesh(bodyGeo, [M.bezel, M.frame]); phone.add(body);
  const backGeo = new THREE.ShapeGeometry(roundedRectShape(W - 0.01, H - 0.01, R - 0.005), 24);
  const back = new THREE.Mesh(backGeo, M.back); back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0008; phone.add(back);
  // îlot photo (au dos, en haut à gauche vu de dos)
  const plat = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(0.31, 0.31, 0.075), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3, curveSegments: 16 }), M.plateau);
  plat.rotation.y = Math.PI; plat.position.set(0.17, 0.53, -D / 2 - 0.001); phone.add(plat);
  [[0.235, 0.6], [0.235, 0.46], [0.11, 0.53]].forEach(([x, y]) => {
    const l = cyl(0.048, 0.05, 0.022, M.lens, 40); l.rotation.x = Math.PI / 2; l.position.set(x, y, -D / 2 - 0.022); phone.add(l);
    const rg = ringAt(0.05, 0.007, M.ring); rg.position.set(x, y, -D / 2 - 0.033); phone.add(rg);
  });
  const flash = cyl(0.016, 0.016, 0.01, M.plateau, 20); flash.rotation.x = Math.PI / 2; flash.position.set(0.1, 0.62, -D / 2 - 0.016); phone.add(flash);
  // boutons latéraux
  const btn = (x, y, h) => { const b = box(0.012, h, 0.03, 0.005, M.frame); b.position.set(x, y, 0); phone.add(b); };
  btn(-W / 2 - 0.003, 0.36, 0.05); btn(-W / 2 - 0.003, 0.24, 0.1); btn(-W / 2 - 0.003, 0.11, 0.1); btn(W / 2 + 0.003, 0.2, 0.16); btn(W / 2 + 0.003, -0.14, 0.09);

  // écran : deux images mélangées + coins arrondis + léger reflet de vitre
  const loader = new THREE.TextureLoader();
  const tex = {};
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;
  const screenMat = new THREE.ShaderMaterial({
    transparent: true, toneMapped: false,
    uniforms: { tA: { value: blank }, tB: { value: blank }, mixv: { value: 0 }, aspect: { value: SCREEN_W / SCREEN_H }, rad: { value: 0.085 / SCREEN_H }, sheen: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      uniform sampler2D tA; uniform sampler2D tB; uniform float mixv; uniform float aspect; uniform float rad; uniform float sheen;
      varying vec2 vUv;
      void main(){
        vec2 p=(vUv-0.5)*vec2(aspect,1.0); vec2 b=vec2(aspect*0.5,0.5)-rad;
        float d=length(max(abs(p)-b,0.0))-rad; float a=1.0-smoothstep(0.0,fwidth(d)*1.5,d);
        vec3 c=mix(texture2D(tA,vUv).rgb,texture2D(tB,vUv).rgb,mixv);
        float s=smoothstep(0.22,0.0,abs(vUv.x*0.8+vUv.y*0.55-sheen)); c+=vec3(0.055)*s;
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }`
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.z = D / 2 + 0.0012; phone.add(screen);

  /* ---------- Gimbal ---------- */
  const root = new THREE.Group(); scene.add(root);
  const model = new THREE.Group(); root.add(model);

  /* Gimbal reproduit sur celui de la vidéo de l'accueil (demande de Nelson, 16/11) :
     stabilisateur 3 axes pour appareil photo, même architecture et mêmes proportions,
     avec le téléphone posé sur le plateau à la place de l'appareil.
     Repère du modèle : centre du téléphone en (0,0,0), écran vers +z (côté opérateur = spectateur).
     Proportions relevées sur la vidéo (1 unité = 10 cm) : plateau 0,82 au-dessus du moteur panoramique,
     moteur de roulis 0,87 en arrière de l'axe de la poignée et 0,14 sous le plateau,
     moteur d'inclinaison 0,6 au-dessus du plateau, sur le côté. */
  const hz = 0;                                   // l'axe de la poignée passe sous le centre du téléphone
  const yPlate = -H / 2 - 0.06;                   // dessus du plateau, juste sous le téléphone
  const yPan = yPlate - 0.82;                     // dessus du moteur panoramique
  const yRoll = yPlate - 0.14, zRoll = 0.87;      // moteur de roulis, côté opérateur
  const xTilt = W / 2 + 0.3, yTilt = yPlate + 0.6; // moteur d'inclinaison, sur le côté droit

  const Z = new THREE.Vector3(0, 0, 1);
  // barre à arêtes vives tendue entre deux points (bras usinés de la vidéo)
  const bar = (a, b, w, h, m, parent, o) => {
    const A = new THREE.Vector3(...a).sub(o), B = new THREE.Vector3(...b).sub(o);
    const L = A.distanceTo(B), mesh = box(w, h, L + w * 0.6, Math.min(w, h) * 0.18, m);
    mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(Z, B.clone().sub(A).normalize());
    parent.add(mesh); return mesh;
  };

  /* ---------- Poignée ---------- */
  const handleG = new THREE.Group(); model.add(handleG);
  // poignée ronde caoutchoutée, fond arrondi
  const prof = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; prof.push(new THREE.Vector2(0.2 * Math.sin(a), MODEL_BOTTOM + 0.09 * (1 - Math.cos(a)))); }
  prof.push(new THREE.Vector2(0.2, yPan - 1.1), new THREE.Vector2(0.208, yPan - 0.7), new THREE.Vector2(0.24, yPan - 0.62), new THREE.Vector2(0, yPan - 0.62));
  handleG.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 56), M.grip));
  // tête ronde, plus large que la poignée, panneau de commande côté opérateur
  const head = cyl(0.29, 0.27, 0.56, M.shell, 64); head.position.y = yPan - 0.36; handleG.add(head);
  const band1 = ringAt(0.282, 0.008, M.ring); band1.rotation.x = Math.PI / 2; band1.position.y = yPan - 0.62; handleG.add(band1);
  const panneau = box(0.3, 0.36, 0.06, 0.03, M.shell); panneau.position.set(0, yPan - 0.33, 0.27); handleG.add(panneau);
  const ecran = box(0.17, 0.11, 0.012, 0.01, M.bezel); ecran.position.set(0, yPan - 0.24, 0.302); handleG.add(ecran);
  for (let i = 0; i < 3; i++) { const l = box(0.02, 0.008, 0.004, 0.002, M.led); l.position.set(-0.05 + i * 0.045, yPan - 0.24 + (i === 1 ? 0.025 : -0.015), 0.309); handleG.add(l); }
  const joy = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), M.shell); joy.position.set(-0.06, yPan - 0.41, 0.305); handleG.add(joy);
  const joyR = ringAt(0.04, 0.005, M.ring); joyR.position.set(-0.06, yPan - 0.41, 0.302); handleG.add(joyR);
  const rec = cyl(0.028, 0.028, 0.014, M.shell, 24); rec.rotation.x = Math.PI / 2; rec.position.set(0.07, yPan - 0.41, 0.302); handleG.add(rec);
  const recDot = cyl(0.018, 0.018, 0.004, M.ledRed, 20); recDot.rotation.x = Math.PI / 2; recDot.position.set(0.07, yPan - 0.41, 0.31); handleG.add(recDot);
  const trig = box(0.09, 0.16, 0.06, 0.025, M.pad); trig.position.set(0, yPan - 0.52, -0.27); handleG.add(trig);

  /* ---------- Poignée latérale inclinée (comme dans la vidéo) ---------- */
  const xs = -0.2, yb = yPan - 0.4, zh = 1.18;
  const H0 = new THREE.Vector3();
  bar([xs, yb, 0.2], [xs, yb, zh], 0.09, 0.24, M.shell, handleG, H0);                      // équerre
  [-1, 1].forEach(s => { const fente = box(0.004, 0.08, 0.36, 0.035, M.pad); fente.position.set(xs + s * 0.047, yb, 0.62); handleG.add(fente); });
  const charn = motor(0.19, 0.13); charn.rotation.z = Math.PI / 2; charn.position.set(xs - 0.02, yb, zh); handleG.add(charn);   // charnière ronde
  const gr = bar([xs, yb + 0.1, zh + 0.02], [xs, yPan + 1.2, zh + 0.66], 0.18, 0.27, M.grip, handleG, H0);     // poignée inclinée
  const capot = bar([xs, yPan + 1.12, zh + 0.63], [xs, yPan + 1.27, zh + 0.69], 0.19, 0.28, M.shell, handleG, H0);
  for (let i = 0; i < 4; i++) { const l = box(0.004, 0.012, 0.026, 0.002, M.led); l.position.set(xs - 0.096, yPan + 1.12 - i * 0.045, zh + 0.6 - i * 0.017 - 0.06); handleG.add(l); }

  /* ---------- Moteur panoramique + bras en L à filet rouge ---------- */
  const panMotor = motor(0.27, 0.08); panMotor.position.set(0, yPan - 0.07, 0); model.add(panMotor);
  const panPivot = new THREE.Group(); panPivot.position.set(0, yPan, 0); model.add(panPivot);
  const P0 = new THREE.Vector3(0, yPan, 0);
  // platine sur le moteur, puis bras qui part vers l'arrière et remonte en courbe jusqu'au moteur de roulis
  const platine = box(0.2, 0.05, 0.56, 0.02, M.shell); platine.position.z = -0.08; panPivot.add(platine);
  const lH = bar([0, yPan + 0.03, -0.24], [0, yPan + 0.03, 0.62], 0.1, 0.075, M.shell, panPivot, P0);
  const lC = bar([0, yPan + 0.03, 0.6], [0, yPan + 0.2, 0.74], 0.1, 0.075, M.shell, panPivot, P0);
  const lD = bar([0, yPan + 0.18, 0.73], [0, yRoll - 0.17, zRoll], 0.1, 0.075, M.shell, panPivot, P0);
  // le filet rouge court sur les deux flancs du bras
  [-1, 1].forEach(s => {
    bar([s * 0.051, yPan + 0.03, -0.2], [s * 0.051, yPan + 0.03, 0.62], 0.004, 0.018, M.red, panPivot, P0);
    bar([s * 0.051, yPan + 0.03, 0.6], [s * 0.051, yPan + 0.2, 0.74], 0.004, 0.018, M.red, panPivot, P0);
    bar([s * 0.051, yPan + 0.18, 0.73], [s * 0.051, yRoll - 0.2, zRoll], 0.004, 0.018, M.red, panPivot, P0);
  });
  // moteur de roulis (axe avant-arrière), gros disque côté opérateur
  const rollMotor = motor(0.17, 0.15); rollMotor.rotation.x = Math.PI / 2; rollMotor.position.set(0, yRoll - P0.y, zRoll + 0.02); panPivot.add(rollMotor);
  const rollPivot = new THREE.Group(); rollPivot.position.set(0, yRoll - P0.y, zRoll); panPivot.add(rollPivot);
  const R0 = new THREE.Vector3(0, yRoll, zRoll);

  /* ---------- Bras de roulis : part sur la droite, se coude et monte au moteur d'inclinaison ---------- */
  bar([0.06, yRoll + 0.04, zRoll - 0.08], [xTilt, yTilt - 0.2, 0.22], 0.15, 0.12, M.shell, rollPivot, R0);
  bar([xTilt, yTilt - 0.24, 0.26], [xTilt, yTilt - 0.02, 0.04], 0.15, 0.12, M.shell, rollPivot, R0);
  // moteur d'inclinaison (axe latéral), le plus gros disque, sur le côté du téléphone
  const tiltMotor = motor(0.2, 0.13); tiltMotor.rotation.z = Math.PI / 2; tiltMotor.position.set(xTilt - R0.x, yTilt - R0.y, 0.06 - R0.z); rollPivot.add(tiltMotor);
  const tiltPivot = new THREE.Group(); tiltPivot.position.set(xTilt - 0.1 - R0.x, yTilt - R0.y, 0.06 - R0.z); rollPivot.add(tiltPivot);
  const T0 = new THREE.Vector3(xTilt - 0.1, yTilt, 0.06);

  /* ---------- Équerre, plateau à queue d'aronde et pince du téléphone ---------- */
  const tb = (w, h, d, r, m, x, y, z) => { const b = box(w, h, d, r, m); b.position.set(x - T0.x, y - T0.y, z - T0.z); tiltPivot.add(b); return b; };
  tb(0.09, yTilt - yPlate + 0.12, 0.2, 0.02, M.shell, xTilt - 0.17, (yTilt + yPlate) / 2 - 0.05, 0.02);   // équerre verticale
  tb(xTilt + W / 2 + 0.02, 0.07, 0.24, 0.015, M.shell, (xTilt - 0.17 - W / 2 - 0.1) / 2 + 0.02, yPlate - 0.1, 0.02); // bras du plateau
  tb(W + 0.24, 0.045, 0.44, 0.01, M.shell, 0, yPlate - 0.04, -0.02);                                     // plateau
  tb(W + 0.26, 0.012, 0.04, 0.004, M.ring, 0, yPlate - 0.02, 0.2);                                       // rail métal
  tb(W + 0.26, 0.012, 0.04, 0.004, M.ring, 0, yPlate - 0.02, -0.24);
  const lev = tb(0.05, 0.03, 0.2, 0.012, M.red, -W / 2 - 0.16, yPlate - 0.06, 0.06); lev.rotation.y = 0.35;  // levier rouge du plateau
  const knob = cyl(0.045, 0.045, 0.06, M.shell, 24); knob.position.set(xTilt - 0.17 - T0.x, yPlate + 0.2 - T0.y, 0.14 - T0.z); knob.rotation.x = Math.PI / 2; tiltPivot.add(knob);
  // pince : pied sur le plateau, montant derrière le téléphone, mâchoires sur les bords
  tb(0.18, 0.08, 0.14, 0.02, M.shell, 0, yPlate + 0.02, -0.06);
  tb(0.12, 0.62, 0.04, 0.015, M.shell, 0, yPlate + 0.32, -D / 2 - 0.03);
  tb(W + 0.09, 0.11, 0.04, 0.018, M.shell, 0, -0.18, -D / 2 - 0.03);
  [-1, 1].forEach(s => {
    tb(0.03, 0.13, D + 0.075, 0.012, M.shell, s * (W / 2 + 0.017), -0.18, -0.01);
    tb(0.008, 0.11, D, 0.003, M.pad, s * (W / 2 + 0.003), -0.18, 0);
  });
  phone.position.set(-T0.x, -T0.y, -T0.z); tiltPivot.add(phone);

  // ombre de contact sous la poignée
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, MODEL_BOTTOM - 0.02, hz); root.add(shadow);

  // le modèle est centré verticalement sur son milieu
  const midY = (MODEL_TOP + MODEL_BOTTOM) / 2;
  model.position.y = -midY; shadow.position.y = MODEL_BOTTOM - 0.02 - midY;
  // centre de rotation du lacet : l'axe de la poignée
  root.position.z = 0; model.position.z = -hz; shadow.position.z = 0;

  /* ---------- Écrans : chargement progressif ---------- */
  const names = [...new Set(state.beats.map(b => b.screen))];
  const loadTex = n => new Promise(res => loader.load(`assets/nsd360/ecrans/${n}.webp`, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); tex[n] = t; res(t);
  }, undefined, () => res(null)));
  await loadTex(names[0]);
  screenMat.uniforms.tA.value = tex[names[0]];
  (async () => { for (const n of names.slice(1)) await loadTex(n); })();

  /* ---------- Cadrage ---------- */
  let visH = 1, visW = 1;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.6 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); visW = visH * camera.aspect;
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  /* ---------- Pose visée à partir du défilement ---------- */
  const cur = { x: 0, y: 0, s: 1, yaw: YAW[0] - 1.2, pan: 0, tilt: 0, roll: 0 };
  const tgt = { ...cur };
  function target() {
    const P = state.P, k = Math.min(state.N - 2, Math.floor(P)), f = P - k, e = ss(0.18, 0.82, f);
    const k1 = Math.min(state.N - 1, k + 1);
    const bump = Math.sin(Math.PI * e);
    const modelH = MODEL_TOP - MODEL_BOTTOM;
    let s, x, y;
    if (mobile()) {
      // sur téléphone, on cadre la tête du gimbal et l'iPhone ; la poignée passe derrière le panneau de texte
      const h = state.h || 844, topFree = (68 + 0.47 * h) / 2 / h;   // milieu de la zone libre au-dessus du texte
      s = Math.min(1.1, (0.31 * visH) / H);
      x = 0; y = visH * (0.5 - topFree) + (MODEL_BOTTOM + MODEL_TOP) / 2 * s;
    } else {
      s = Math.min(1.04, (0.76 * visH) / modelH);
      const px = b => (b.wide ? -0.27 : b.side * 0.2) * visW;
      x = lerp(px(state.beats[k]), px(state.beats[k1]), e);
      y = -0.045 * visH;
    }
    tgt.s = s; tgt.x = x; tgt.y = y + bump * 0.06;
    // le tour complet du premier passage reste acquis ensuite (sinon la cible sauterait de 360° en arrière)
    const turn = k === 0 ? SWING[0] * e : SWING[0];
    tgt.yaw = lerp(YAW[k], YAW[k1], e) + turn + (k >= 1 && k < SWING.length ? SWING[k] * bump : 0);
    tgt.pan = lerp(PAN[k], PAN[k1], e);
    tgt.tilt = lerp(TILT[k], TILT[k1], e) + bump * 0.1;
    tgt.roll = lerp(ROLL[k], ROLL[k1], e);
    return Math.round(P);
  }

  /* ---------- Boucle ---------- */
  let shown = names[0], fading = null, raf = 0, visible = true, last = performance.now(), t0 = last;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 }).observe(stage);

  function setScreen(name) {
    if (!tex[name] || name === shown || (fading && fading.to === name)) return;
    screenMat.uniforms.tB.value = tex[name]; fading = { to: name, t: 0 };
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const active = Math.min(state.N - 1, target());
    // entrée du gimbal au chargement (1,8 s) puis pose pilotée par le défilement
    const ent = Math.min(1, (now - t0) / 1800), eo = 1 - Math.pow(1 - ent, 3);
    const k = 1 - Math.exp(-dt * 6.5);
    for (const p in cur) cur[p] += (tgt[p] - cur[p]) * k;
    // un tour complet se fait de manière continue : on suit la cible même si l'écart dépasse un demi-tour
    const time = (now - t0) / 1000;
    root.scale.setScalar(cur.s * (0.86 + 0.14 * eo));
    root.position.set(cur.x, cur.y - (1 - eo) * 1.1 + Math.sin(time * 1.1) * 0.012, 0);
    root.rotation.y = cur.yaw - (1 - eo) * 1.3;
    panPivot.rotation.y = cur.pan;
    rollPivot.rotation.z = cur.roll + Math.sin(time * 0.9) * 0.006;
    tiltPivot.rotation.x = -cur.tilt + Math.sin(time * 0.7) * 0.008;
    screenMat.uniforms.sheen.value = 0.7 + Math.sin(root.rotation.y + cur.pan) * 0.6;

    // l'écran change quand le téléphone se présente à nouveau
    const want = state.beats[active].screen;
    if (want !== shown) setScreen(want);
    if (fading) {
      fading.t = Math.min(1, fading.t + dt / 0.42);
      screenMat.uniforms.mixv.value = fading.t * fading.t * (3 - 2 * fading.t);
      if (fading.t >= 1) { screenMat.uniforms.tA.value = screenMat.uniforms.tB.value; screenMat.uniforms.mixv.value = 0; shown = fading.to; fading = null; }
    }
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  addEventListener('pagehide', () => { cancelAnimationFrame(raf); renderer.dispose(); pmrem.dispose(); });
  canvas.style.opacity = 0; canvas.style.transition = 'opacity .8s';
  raf = requestAnimationFrame(t => { frame(t); canvas.style.opacity = 1; });
  return true;
}
