/* =====================================================================
   NS Development · objets 3D des pages (même moteur que le gimbal NSD 360)
   Un objet logique par page, modélisé en code avec Three.js (local) :
     laptop    (accueil)       le portable s'ouvre et fait défiler nos vrais sites
     phone     (réalisations)  l'iPhone tourne et montre les projets en version mobile
     serveur   (studio)        un tiroir sort, voyants verts : hébergé à Contern
     terminal  (tarifs)        le terminal imprime un ticket de devis aux vrais prix
   Chargé seulement sur ordinateur, après l'affichage (v3.js). Sur téléphone, une image fixe.
   ===================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

const P = 'assets/v3/p/';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - clamp(t), 3);
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.5)'); grd.addColorStop(.45, 'rgba(0,0,0,.16)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
const SANS = 'Geist, system-ui, sans-serif';

/* Écran : deux images fondues, coins arrondis, reflet de vitre */
function screenMaterial(aspect, radius) {
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;
  return new THREE.ShaderMaterial({
    transparent: true, toneMapped: false,
    uniforms: { tA: { value: blank }, tB: { value: blank }, mixv: { value: 0 }, aspect: { value: aspect }, rad: { value: radius }, sheen: { value: 0 }, lum: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      uniform sampler2D tA; uniform sampler2D tB; uniform float mixv; uniform float aspect; uniform float rad; uniform float sheen; uniform float lum;
      varying vec2 vUv;
      void main(){
        vec2 p=(vUv-0.5)*vec2(aspect,1.0); vec2 b=vec2(aspect*0.5,0.5)-rad;
        float d=length(max(abs(p)-b,0.0))-rad; float a=1.0-smoothstep(0.0,fwidth(d)*1.5,d);
        vec3 c=mix(texture2D(tA,vUv).rgb,texture2D(tB,vUv).rgb,mixv)*lum;
        float s=smoothstep(0.24,0.0,abs(vUv.x*0.8+vUv.y*0.55-sheen)); c+=vec3(0.05)*s;
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }`
  });
}

/* Diaporama sur un écran : charge les images une à une, fond enchaîné */
function slideshow(renderer, mat, files) {
  const loader = new THREE.TextureLoader(), tex = [];
  let shown = -1, fade = null;
  const load = i => new Promise(res => loader.load(files[i], t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); tex[i] = t; res(t);
  }, undefined, () => res(null)));
  const ready = load(0).then(t => { if (t) { mat.uniforms.tA.value = t; shown = 0; } (async () => { for (let i = 1; i < files.length; i++) await load(i); })(); });
  return {
    ready,
    show(i, dt) {
      i = ((i % files.length) + files.length) % files.length;
      if (i !== shown && tex[i] && (!fade || fade.to !== i)) { mat.uniforms.tB.value = tex[i]; fade = { to: i, t: 0 }; }
      if (fade) {
        fade.t = Math.min(1, fade.t + dt / 0.5);
        mat.uniforms.mixv.value = ss(fade.t);
        if (fade.t >= 1) { mat.uniforms.tA.value = mat.uniforms.tB.value; mat.uniforms.mixv.value = 0; shown = fade.to; fade = null; }
      }
    }
  };
}

/* ---------------------------------------------------------------- Matières communes */
function materials() {
  return {
    alu: new THREE.MeshPhysicalMaterial({ color: 0xc8cacd, roughness: 0.32, metalness: 1, clearcoat: 0.2 }),
    aluDark: new THREE.MeshPhysicalMaterial({ color: 0x9da0a5, roughness: 0.4, metalness: 1 }),
    shell: new THREE.MeshPhysicalMaterial({ color: 0x232427, roughness: 0.45, metalness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.45 }),
    matte: new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.85, metalness: 0.05 }),
    bezel: new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xc2bbb0, roughness: 0.3, metalness: 1 }),
    back: new THREE.MeshPhysicalMaterial({ color: 0xd9d4cc, roughness: 0.62, clearcoat: 0.5, clearcoatRoughness: 0.6 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x07070a, roughness: 0.04, metalness: 0.2, clearcoat: 1 }),
    plateau: new THREE.MeshPhysicalMaterial({ color: 0xcdc7be, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
    ring: new THREE.MeshStandardMaterial({ color: 0xb9bcc1, roughness: 0.22, metalness: 1 }),
    key: new THREE.MeshStandardMaterial({ color: 0xe7e7e5, roughness: 0.55 }),
    keyDark: new THREE.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.6 }),
    green: new THREE.MeshBasicMaterial({ color: 0x35d29a }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffb547 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
  };
}
const box = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m);
const cyl = (rt, rb, h, m, seg = 40) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);

/* ================================================================ LAPTOP */
function buildLaptop(renderer, M) {
  const W = 3.04, Dp = 2.12, T = 0.085, LT = 0.05;
  const root = new THREE.Group();
  // socle
  const base = box(W, T, Dp, 0.06, M.alu); base.position.y = T / 2; root.add(base);
  const kbTex = canvasTexture(1024, 420, (g, w, h) => {
    g.fillStyle = '#1b1c1e'; g.fillRect(0, 0, w, h);
    const rows = 6, cols = 14, pad = 10, kw = (w - pad * 2) / cols, kh = (h - pad * 2) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let x = pad + c * kw, ww = kw - 6;
      if (r === 5 && c >= 4 && c <= 9) { if (c > 4) continue; ww = kw * 6 - 6; }
      g.fillStyle = '#2b2c2f'; g.beginPath(); g.roundRect(x + 3, pad + r * kh + 3, ww, kh - 6, 7); g.fill();
    }
  });
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, Dp * 0.36), new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.7 }));
  kb.rotation.x = -Math.PI / 2; kb.position.set(0, T + 0.0015, -Dp * 0.16); root.add(kb);
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(W * 0.36, Dp * 0.3, 0.05), 12), new THREE.MeshPhysicalMaterial({ color: 0xbfc1c4, roughness: 0.22, metalness: 0.9 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, T + 0.0012, Dp * 0.27); root.add(pad);
  // couvercle (pivot sur l'arrière du socle)
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, T, -Dp / 2 + 0.02); root.add(lidPivot);
  const lid = new THREE.Group(); lidPivot.add(lid);
  const shell = box(W, Dp, LT, 0.06, M.alu); shell.position.set(0, Dp / 2, 0); lid.add(shell);
  const bez = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(W - 0.04, Dp - 0.04, 0.05), 12), M.bezel);
  bez.position.set(0, Dp / 2, LT / 2 + 0.001); lid.add(bez);
  const SW = W - 0.2, SH = SW / 1.6;
  const mat = screenMaterial(SW / SH, 0.012);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), mat);
  scr.position.set(0, Dp / 2 + 0.03, LT / 2 + 0.002); lid.add(scr);
  const cam = cyl(0.012, 0.012, 0.004, M.lens, 16); cam.rotation.x = Math.PI / 2; cam.position.set(0, Dp - 0.06, LT / 2 + 0.003); lid.add(cam);
  // centre visuel
  root.position.set(0, -0.9, 0.2);
  const shots = ['mb-cars', 'vaurenne', 'volte', 'valombre', 'korvel', 'ashcombe', 'orvane'].map(n => P + n + '-d-800.webp');
  const show = slideshow(renderer, mat, shots);
  let t0 = null;
  return {
    root, ready: show.ready, camera: { pos: [0, 2.2, 8.2], look: [0, 0.3, 0], fov: 26 }, size: 4.2,
    update(t, dt, p, mx, my) {
      if (t0 === null) t0 = t;
      const open = ease((t - t0) / 1.6);
      lidPivot.rotation.x = Math.PI / 2 - open * (Math.PI / 2 + 0.2) + p * 0.15;
      mat.uniforms.lum.value = 0.25 + 0.75 * ease((t - t0 - 0.9) / 0.8);
      root.rotation.y = -0.42 + p * 0.9 + mx * 0.18 + Math.sin(t * 0.35) * 0.04;
      root.rotation.x = 0.06 + my * 0.06;
      root.position.y = -0.9 + Math.sin(t * 0.8) * 0.03 - p * 0.4;
      mat.uniforms.sheen.value = 0.6 + Math.sin(root.rotation.y * 2) * 0.5;
      show.show(Math.floor((t - t0 - 1.6) / 3.2) + Math.floor(p * 4), dt);
    }
  };
}

/* ================================================================ PHONE */
function buildPhone(renderer, M) {
  const W = 0.715, H = 1.466, D = 0.0825, R = 0.105, SW = 0.664, SH = SW * 844 / 390;
  const root = new THREE.Group(); const phone = new THREE.Group(); root.add(phone);
  const outline = roundedRectShape(W, H, R);
  const bodyGeo = new THREE.ExtrudeGeometry(outline, { depth: D - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 24 });
  bodyGeo.translate(0, 0, -(D - 0.012) / 2);
  phone.add(new THREE.Mesh(bodyGeo, [M.bezel, M.frame]));
  const back = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(W - 0.01, H - 0.01, R - 0.005), 24), M.back);
  back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0008; phone.add(back);
  const plat = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(0.31, 0.31, 0.075), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3, curveSegments: 16 }), M.plateau);
  plat.rotation.y = Math.PI; plat.position.set(0.17, 0.53, -D / 2 - 0.001); phone.add(plat);
  [[0.235, 0.6], [0.235, 0.46], [0.11, 0.53]].forEach(([x, y]) => {
    const l = cyl(0.048, 0.05, 0.022, M.lens); l.rotation.x = Math.PI / 2; l.position.set(x, y, -D / 2 - 0.022); phone.add(l);
    const rg = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 12, 48), M.ring); rg.position.set(x, y, -D / 2 - 0.033); phone.add(rg);
  });
  const btn = (x, y, h) => { const b = box(0.012, h, 0.03, 0.005, M.frame); b.position.set(x, y, 0); phone.add(b); };
  btn(-W / 2 - 0.003, 0.36, 0.05); btn(-W / 2 - 0.003, 0.24, 0.1); btn(-W / 2 - 0.003, 0.11, 0.1); btn(W / 2 + 0.003, 0.2, 0.16);
  const mat = screenMaterial(SW / SH, 0.085 / SH);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), mat); scr.position.z = D / 2 + 0.0012; phone.add(scr);
  phone.scale.setScalar(2.05);
  const shots = ['mb-cars', 'volte', 'korvel', 'vaurenne', 'ashcombe', 'valombre', 'orvane'].map(n => P + n + '-m.webp');
  const show = slideshow(renderer, mat, shots);
  let t0 = null, spun = 0;
  return {
    root, ready: show.ready, camera: { pos: [0, 0.2, 10], look: [0, 0, 0], fov: 26 }, size: 3.4,
    update(t, dt, p, mx, my) {
      if (t0 === null) t0 = t;
      const ent = ease((t - t0) / 1.4);
      // un tour complet à l'arrivée, puis le défilement le fait tourner et changer de projet
      const turn = (1 - ent) * Math.PI * 2;
      root.rotation.y = -0.38 + turn + p * Math.PI * 2 + mx * 0.25 + Math.sin(t * 0.5) * 0.06;
      root.rotation.x = 0.05 + my * 0.08 + Math.sin(t * 0.7) * 0.02;
      root.rotation.z = -0.06;
      root.position.y = Math.sin(t * 0.9) * 0.05 - (1 - ent) * 0.8;
      mat.uniforms.sheen.value = 0.6 + Math.sin(root.rotation.y) * 0.6;
      // l'écran change quand le téléphone est de dos (on ne voit pas la transition)
      const facing = Math.cos(root.rotation.y);
      const idx = Math.floor((t - t0) / 3.4) + Math.floor(p * 6);
      if (facing < 0 || spun === 0) { spun = idx; }
      show.show(spun, dt);
    }
  };
}

/* ================================================================ SERVEUR */
function buildServeur(renderer, M) {
  const W = 3.2, H = 0.44, D = 2.3, gap = 0.05;
  const root = new THREE.Group();
  const facade = (label, accent) => canvasTexture(1600, 220, (g, w, h) => {
    g.fillStyle = '#1e1f22'; g.fillRect(0, 0, w, h);
    // grille d'aération
    g.fillStyle = '#121315';
    for (let y = 26; y < h - 20; y += 22) for (let x = 520 + ((y / 22) % 2) * 11; x < 1180; x += 22) { g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2); g.fill(); }
    // baies de disques
    for (let i = 0; i < 4; i++) { g.fillStyle = '#2a2b2f'; g.beginPath(); g.roundRect(1220 + i * 88, 30, 78, h - 60, 8); g.fill(); g.fillStyle = '#3a3b40'; g.fillRect(1232 + i * 88, h / 2 - 3, 54, 6); }
    // plaque
    g.fillStyle = '#f2f2f2'; g.font = `600 44px ${MONO}`; g.textBaseline = 'middle'; g.fillText(label, 70, h / 2 - 22);
    g.fillStyle = '#9a9a9a'; g.font = `400 30px ${MONO}`; g.fillText(accent, 70, h / 2 + 30);
  });
  const units = [];
  const labels = [['NSD · 01', 'CONTERN · LUXEMBOURG'], ['NSD · 02', 'VOS SITES · VOS DONNÉES'], ['NSD · 03', 'SAUVEGARDES QUOTIDIENNES']];
  labels.forEach(([a, b], i) => {
    const u = new THREE.Group();
    const chassis = box(W, H, D, 0.03, M.shell); u.add(chassis);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.06), new THREE.MeshStandardMaterial({ map: facade(a, b), roughness: 0.6, metalness: 0.2 }));
    front.position.z = D / 2 + 0.002; u.add(front);
    [-1, 1].forEach(s => { const ear = box(0.12, H, 0.06, 0.02, M.aluDark); ear.position.set(s * (W / 2 + 0.06), 0, D / 2 - 0.03); u.add(ear);
      const handle = box(0.05, H * 0.66, 0.1, 0.02, M.aluDark); handle.position.set(s * (W / 2 - 0.12), 0, D / 2 + 0.05); u.add(handle); });
    const leds = [];
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), k === 2 ? M.amber.clone() : M.green.clone()); l.position.set(W / 2 - 0.34 - k * 0.075, -H / 2 + 0.11, D / 2 + 0.004); u.add(l); leds.push(l); }
    u.position.y = (1 - i) * (H + gap);
    root.add(u); units.push({ u, leds, z0: 0 });
  });
  // montants du rack
  [-1, 1].forEach(s => { const post = box(0.1, 3 * H + 2 * gap + 0.5, 0.12, 0.02, M.matte); post.position.set(s * (W / 2 + 0.17), 0, D / 2 - 0.1); root.add(post); });
  let t0 = null;
  return {
    root, ready: Promise.resolve(), camera: { pos: [0, 2.0, 10.4], look: [0, 0, 0], fov: 26 }, size: 4.4,
    update(t, dt, p, mx, my) {
      if (t0 === null) t0 = t;
      const ent = ease((t - t0) / 1.5);
      root.rotation.y = -0.55 + mx * 0.2 + p * 0.5 + Math.sin(t * 0.3) * 0.03;
      root.rotation.x = 0.12 + my * 0.05;
      root.position.y = Math.sin(t * 0.8) * 0.03 - (1 - ent) * 0.6;
      // le tiroir du milieu sort à l'arrivée et suit le défilement
      units[1].u.position.z = ease((t - t0 - 0.6) / 1.2) * 0.7 + p * 0.5;
      units.forEach((x, i) => x.leds.forEach((l, k) => {
        const on = Math.sin(t * (3 + k * 1.7 + i) + i * 2 + k) > -0.2;
        l.material.color.setHex(k === 2 ? (on ? 0xffb547 : 0x5a4420) : (on ? 0x35d29a : 0x1d4a39));
      }));
    }
  };
}

/* ================================================================ TERMINAL */
function buildTerminal(renderer, M) {
  const W = 0.95, H = 1.9, D = 0.34;
  const root = new THREE.Group(); const term = new THREE.Group(); root.add(term);
  const body = box(W, H, D, 0.12, M.shell); term.add(body);
  const top = box(W * 0.92, 0.2, D * 0.9, 0.06, M.matte); top.position.set(0, H / 2 - 0.02, -0.02); term.add(top);
  const scrTex = canvasTexture(600, 420, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#f7f7f5'); grd.addColorStop(1, '#e9e9e6'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#121212'; g.font = `500 34px ${MONO}`; g.fillText('DEVIS', 40, 70);
    g.fillStyle = '#6b6b6b'; g.font = `400 28px ${SANS}`; g.fillText('Site web, dès', 40, 150);
    g.fillStyle = '#121212'; g.font = `600 96px ${SANS}`; g.fillText('990 €', 36, 255);
    g.fillStyle = '#6b6b6b'; g.font = `400 28px ${SANS}`; g.fillText('HT · devis gratuit', 40, 310);
    g.fillStyle = '#1f9d6b'; g.beginPath(); g.arc(52, 370, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#121212'; g.font = `500 26px ${MONO}`; g.fillText('PRÊT', 74, 380);
  });
  const scr = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(W * 0.8, W * 0.56, 0.04), 12), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
  scr.geometry.computeBoundingBox(); const bb = scr.geometry.boundingBox;
  const uv = scr.geometry.attributes.uv, pos = scr.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  scr.position.set(0, H / 2 - 0.5, D / 2 + 0.003); term.add(scr);
  // clavier 3 x 4 + touches de fonction
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const k = box(0.2, 0.13, 0.05, 0.03, M.key); k.position.set((c - 1) * 0.26, -0.12 - r * 0.19, D / 2 + 0.02); term.add(k);
  }
  [0x2c2d30, 0x2c2d30, 0x1f9d6b].forEach((col, c) => {
    const k = box(0.2, 0.13, 0.05, 0.03, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); k.position.set((c - 1) * 0.26, -0.12 - 4 * 0.19, D / 2 + 0.02); term.add(k);
  });
  // ticket : s'imprime par le haut, le début du ticket sort en premier
  const RW = W * 0.72, RH = 2.6;
  const ticket = canvasTexture(560, 2080, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#121212'; g.textAlign = 'center';
    g.font = `600 40px ${MONO}`; g.fillText('NS DEVELOPMENT', w / 2, 110);
    g.font = `400 26px ${MONO}`; g.fillStyle = '#555'; g.fillText('Studio digital · Luxembourg', w / 2, 160); g.fillText('Devis gratuit, sous 24 h', w / 2, 200);
    g.textAlign = 'left';
    const dash = y => { g.fillStyle = '#bbb'; for (let x = 30; x < w - 30; x += 16) g.fillRect(x, y, 8, 3); };
    dash(250);
    const line = (a, b, y, bold) => { g.font = `${bold ? 600 : 400} 30px ${MONO}`; g.fillStyle = '#121212'; g.fillText(a, 40, y); g.textAlign = 'right'; g.fillText(b, w - 40, y); g.textAlign = 'left'; };
    g.font = `500 24px ${MONO}`; g.fillStyle = '#777'; g.fillText('SITES · DÈS, HT', 40, 310);
    [['Essentiel', '990 €'], ['Vitrine', '1 990 €'], ['Pro', '3 290 €'], ['Boutique', '3 790 €'], ['Signature', '5 990 €']].forEach(([a, b], i) => line(a, b, 370 + i * 64));
    dash(700);
    g.font = `500 24px ${MONO}`; g.fillStyle = '#777'; g.fillText('MAINTENANCE', 40, 760);
    line('Hébergement LU', '120 €/trim.', 820);
    dash(880);
    g.font = `500 24px ${MONO}`; g.fillStyle = '#777'; g.fillText('MARKETING · NSD 360', 40, 940);
    line('2 premiers mois', '3 290 €/m', 1000); line('Ensuite', '5 490 €/m', 1064);
    dash(1130);
    g.textAlign = 'center'; g.font = `400 24px ${MONO}`; g.fillStyle = '#555';
    g.fillText('Prix HT · TVA 17 % en plus', w / 2, 1190); g.fillText('Le prix exact s\'établit', w / 2, 1240); g.fillText('avec vous, gratuitement.', w / 2, 1276);
    g.font = `600 36px ${MONO}`; g.fillStyle = '#121212'; g.fillText('MERCI', w / 2, 1380);
    // code-barres
    for (let x = 80; x < w - 80; x += 6) { if (Math.sin(x * 12.9898) * 43758.5 % 1 > 0.35) g.fillRect(x, 1440, 3, 90); }
  });
  ticket.wrapS = ticket.wrapT = THREE.ClampToEdgeWrapping;
  const tMat = new THREE.MeshStandardMaterial({ map: ticket, roughness: 0.9, side: THREE.DoubleSide });
  const tGeo = new THREE.PlaneGeometry(RW, RH);
  const tk = new THREE.Mesh(tGeo, tMat); tk.position.set(0, H / 2, -0.03); term.add(tk);
  const slotY = H / 2 + 0.08;
  term.rotation.x = -0.1;
  let t0 = null;
  return {
    root, ready: Promise.resolve(), camera: { pos: [0, 0.6, 9.2], look: [0, 0.05, 0], fov: 26 }, size: 3.4,
    update(t, dt, p, mx, my) {
      if (t0 === null) t0 = t;
      const ent = ease((t - t0) / 1.3);
      root.rotation.y = -0.42 + mx * 0.22 + Math.sin(t * 0.4) * 0.05 + p * 0.35;
      root.rotation.x = my * 0.05;
      root.position.y = -0.6 + Math.sin(t * 0.85) * 0.03 - (1 - ent) * 0.7;
      // impression : 45 % à l'arrivée, le reste au défilement
      const L = Math.max(0.001, RH * clamp(0.45 * ease((t - t0 - 0.8) / 2.2) + 0.55 * clamp(p * 1.6)));
      tk.scale.y = L / RH; tk.position.y = slotY + L / 2;
      ticket.repeat.y = L / RH; ticket.offset.y = 1 - L / RH;
      tk.rotation.x = -0.12 * (L / RH);
    }
  };
}

const BUILDERS = { laptop: buildLaptop, phone: buildPhone, serveur: buildServeur, terminal: buildTerminal };

/* ================================================================ Moteur */
export async function monter(el, opts = {}) {
  const type = el.dataset.objet, build = BUILDERS[type];
  if (!build) return false;
  const canvas = el.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.capture });
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

  const M = materials();
  const obj = build(renderer, M);
  const holder = new THREE.Group(); holder.add(obj.root); scene.add(holder);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(obj.size * 1.15, obj.size * 0.7), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -obj.size * 0.36; scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(obj.camera.fov, 1, 0.1, 60);
  camera.position.set(...obj.camera.pos); camera.lookAt(new THREE.Vector3(...obj.camera.look));

  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, opts.capture ? 2 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // l'objet tient dans le cadre quelle que soit sa forme
    const fit = Math.min(1, camera.aspect / 1.15);
    camera.position.set(obj.camera.pos[0], obj.camera.pos[1], obj.camera.pos[2] / fit);
    camera.updateProjectionMatrix();
  }
  resize(); new ResizeObserver(resize).observe(el);
  await obj.ready;

  // progression : 0 quand le haut de la section est en haut de l'écran, 1 quand elle est sortie
  const zone = el.closest('[data-objet-zone]') || el.parentElement;
  let p = 0, mx = 0, my = 0, cmx = 0, cmy = 0, visible = true, raf = 0, last = performance.now();
  const lire = () => { const r = zone.getBoundingClientRect(); p = clamp(-r.top / Math.max(1, r.height)); };
  addEventListener('scroll', lire, { passive: true }); lire();
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(el);

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 5); cmx += (mx - cmx) * k; cmy += (my - cmy) * k;
    obj.update(opts.capture ? opts.t : now / 1000, dt, opts.capture ? 0 : p, cmx, cmy);
    renderer.render(scene, camera);
    if (!opts.capture && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  addEventListener('pagehide', () => { cancelAnimationFrame(raf); renderer.dispose(); pmrem.dispose(); });
  if (opts.capture) {
    // pose de repos pour l'image fixe : plusieurs images pour finir les transitions
    for (let i = 0; i <= 150; i++) { opts.t = 100 + i / 30; obj.update(opts.t, 1 / 30, 0, 0, 0); }
    renderer.render(scene, camera);
    return canvas.toDataURL('image/png');
  }
  raf = requestAnimationFrame(t => { frame(t); el.classList.add('pret'); });
  return true;
}
