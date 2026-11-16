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
const MODEL_TOP = H / 2, MODEL_BOTTOM = -2.62;                 // hauteur totale du modèle

/* Poses par temps de l'expérience : lacet de l'ensemble, panoramique, inclinaison, roulis (radians) */
const YAW  = [-0.78, 0.82, 0.55, -0.62, -0.86, 0.80, -0.74, 0.70, 0.30];
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

  // poignée (profil tourné : arrondie en bas, légèrement évasée)
  const prof = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI / 2; prof.push(new THREE.Vector2(0.168 * Math.sin(a), -2.62 + 0.09 * (1 - Math.cos(a)))); }
  prof.push(new THREE.Vector2(0.168, -2.2), new THREE.Vector2(0.158, -1.5), new THREE.Vector2(0.15, -1.17), new THREE.Vector2(0.132, -1.12), new THREE.Vector2(0, -1.12));
  const handle = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), M.shell);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.172, 0.62, 64, 1, true), M.grip); grip.position.y = -2.0;
  const hz = -0.6; // la poignée et le moteur panoramique sont derrière le téléphone
  const handleG = new THREE.Group(); handleG.position.z = hz; handleG.add(handle, grip); model.add(handleG);
  // panneau de commande face avant de la poignée
  const panel = box(0.17, 0.36, 0.06, 0.025, M.pad); panel.position.set(0, -1.5, 0.13); handleG.add(panel);
  const stick = cyl(0.03, 0.034, 0.03, M.shell, 24); stick.rotation.x = Math.PI / 2; stick.position.set(0, -1.42, 0.165); handleG.add(stick);
  const stickTop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), M.shell); stickTop.position.set(0, -1.42, 0.18); handleG.add(stickTop);
  const rec = cyl(0.028, 0.028, 0.012, M.ring, 24); rec.rotation.x = Math.PI / 2; rec.position.set(0, -1.56, 0.163); handleG.add(rec);
  const recDot = cyl(0.014, 0.014, 0.004, M.ledRed, 20); recDot.rotation.x = Math.PI / 2; recDot.position.set(0, -1.56, 0.17); handleG.add(recDot);
  for (let i = 0; i < 4; i++) { const l = cyl(0.006, 0.006, 0.004, i < 3 ? M.led : M.pad, 10); l.rotation.x = Math.PI / 2; l.position.set(-0.03 + i * 0.02, -1.65, 0.163); handleG.add(l); }

  // moteur panoramique (axe vertical) au sommet de la poignée
  const panMotor = motor(0.135, 0.13); panMotor.position.set(0, -1.05, hz); model.add(panMotor);
  const panPivot = new THREE.Group(); panPivot.position.set(0, -1.05, hz); model.add(panPivot);
  // bras vertical vers le moteur de roulis
  const armV = box(0.12, 1.02, 0.085, 0.012, M.shell); armV.position.set(0, 0.55, -0.02); panPivot.add(armV);
  const elbow = box(0.12, 0.12, 0.18, 0.016, M.shell); elbow.position.set(0, 1.05, 0.02); panPivot.add(elbow);
  // moteur de roulis (axe Z, aligné sur le centre du téléphone)
  const rollMotor = motor(0.1, 0.12); rollMotor.rotation.x = Math.PI / 2; rollMotor.position.set(0, 1.05, 0.15); panPivot.add(rollMotor);
  const rollPivot = new THREE.Group(); rollPivot.position.set(0, 1.05, 0.15); panPivot.add(rollPivot);
  // dans rollPivot, le centre du téléphone est en (0, 0, -hz - 0.15) = (0, 0, 0.45)
  const pz = -hz - 0.15;
  const armA = box(0.62, 0.08, 0.08, 0.012, M.shell); armA.position.set(0.31, 0, 0.08); rollPivot.add(armA);
  const filetA = box(0.5, 0.012, 0.084, 0.004, M.red); filetA.position.set(0.34, 0.02, 0.08); rollPivot.add(filetA);
  const armB = box(0.11, 0.11, 0.38, 0.012, M.shell); armB.position.set(0.62, 0, 0.24); rollPivot.add(armB);
  const filetB = box(0.114, 0.014, 0.3, 0.004, M.red); filetB.position.set(0.62, 0.03, 0.25); rollPivot.add(filetB);
  const filetC = box(0.006, 0.026, 0.3, 0.002, M.red); filetC.position.set(0.678, 0.012, 0.25); rollPivot.add(filetC);
  // moteur d'inclinaison (axe X) sur le côté du téléphone
  const tiltMotor = motor(0.105, 0.11); tiltMotor.rotation.z = Math.PI / 2; tiltMotor.position.set(0.6, 0, pz - 0.085); rollPivot.add(tiltMotor);
  const tiltPivot = new THREE.Group(); tiltPivot.position.set(0.6, 0, pz - 0.085); rollPivot.add(tiltPivot);
  // pince : bras derrière le téléphone + mâchoires sur les bords
  const clampArm = box(0.6, 0.085, 0.035, 0.015, M.shell); clampArm.position.set(-0.3, 0, 0.005); tiltPivot.add(clampArm);
  const clampBar = box(W + 0.09, 0.12, 0.04, 0.018, M.shell); clampBar.position.set(-0.6, 0, 0.025); tiltPivot.add(clampBar);
  [-1, 1].forEach(s => {
    const jaw = box(0.03, 0.13, D + 0.075, 0.012, M.shell); jaw.position.set(-0.6 + s * (W / 2 + 0.017), 0, 0.085 - 0.04 + 0.0125); tiltPivot.add(jaw);
    const pad = box(0.008, 0.11, D, 0.003, M.pad); pad.position.set(-0.6 + s * (W / 2 + 0.003), 0, 0.085); tiltPivot.add(pad);
  });
  phone.position.set(-0.6, 0, 0.085); tiltPivot.add(phone);

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
