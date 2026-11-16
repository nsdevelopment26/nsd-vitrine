/* Maison Lonvière : le nuancier vivant.
   Une chevelure dessinée en code : plusieurs milliers de mèches, chacune une ligne
   de 34 points calculée dans le shader (chute, ondulation, souffle).
   La souris (ou le doigt) passe dedans comme un peigne : les mèches s'écartent
   autour du passage et en dessous, puis retombent.
   Choisir une nuance recolore la chevelure depuis les pointes (balayage) ou en
   entier (couleur pleine) : événement « lonviere:nuance » envoyé par site.js.

   Seule dépendance : Three.js r170, servi en local (vendor/). Aucun modèle externe. */
import * as THREE from './vendor/three.module.min.js';

const L = window.LONVIERE;
const html = document.documentElement;
const toile = document.getElementById('meche');
const zone = document.getElementById('nuancier');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactile = matchMedia('(hover: none)').matches;
const estMobile = () => innerWidth <= 820;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const amortir = (v, c, k, dt) => lerp(v, c, 1 - Math.exp(-k * dt));
const ioc = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* état de la boucle (déclaré tôt : demande() est appelée dès la mise en place) */
let visible = true, enCours = false, avant = performance.now(), pousse = null;

let rendu;
try {
  rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  html.classList.add('sans-3d');
  throw e;
}
rendu.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
camera.position.set(0, 0, 6);

/* ------------------------------------------------------------ la chevelure */
const MOBILE = estMobile();
const N = MOBILE ? 2600 : 6400;    // mèches
const M = 34;                       // points par mèche
const TR = 16;                      // points de passage du peigne gardés en mémoire

function alea(s) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

const racines = new Float32Array(N * M * 3);
const params = new Float32Array(N * M * 4);   // t, longueur, phase, teinte
const meches = new Float32Array(N * M);       // phase commune à une mèche (les cheveux vont par groupes)
const index = new Uint32Array(N * (M - 1) * 2);
for (let s = 0, k = 0; s < N; s++) {
  /* racines posées sur l'arrière d'un crâne : un arc, plus dense au centre */
  const u = (alea(s * 3.1) * 2 - 1);
  const a = Math.sign(u) * Math.pow(Math.abs(u), 1.25) * 1.25;   // angle, -1,25 à 1,25 rad
  const rx = Math.sin(a) * 1.05;
  const ry = 1.55 + Math.cos(a) * 0.55 + (alea(s * 7.7) - 0.5) * 0.08;
  const rz = -Math.cos(a) * 0.45 + (alea(s * 5.3) - 0.5) * 0.5;
  const lon = 0.78 + alea(s * 9.9) * 0.3 - Math.abs(Math.sin(a)) * 0.14;
  const groupeM = alea(Math.floor((a + 2) * 9) * 1.37 + 0.5);
  const phase = alea(s * 2.3);
  const teinte = alea(s * 4.7);
  for (let i = 0; i < M; i++) {
    const v = s * M + i;
    racines.set([rx, ry, rz], v * 3);
    params.set([i / (M - 1), lon, phase, teinte], v * 4);
    meches[v] = groupeM;
    if (i < M - 1) { index[k++] = v; index[k++] = v + 1; }
  }
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(racines, 3));
geo.setAttribute('aP', new THREE.BufferAttribute(params, 4));
geo.setAttribute('aM', new THREE.BufferAttribute(meches, 1));
geo.setIndex(new THREE.BufferAttribute(index, 1));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4);

const trace = Array.from({ length: TR }, () => new THREE.Vector4(0, 0, 0, 0));
const couleur = (h) => new THREE.Color(h);   // hex sRGB, mélangés tels quels dans le shader

const uni = {
  uTemps: { value: 0 },
  uPousse: { value: calme ? 1 : 0 },
  uLong: { value: 3.7 },
  uVent: { value: 0 },
  uTrace: { value: trace },
  uRa: { value: couleur('#2c1d16') }, uPa: { value: couleur('#4a3326') }, uBa: { value: 1 }, uEa: { value: 0.55 },
  uRb: { value: couleur('#2c1d16') }, uPb: { value: couleur('#4a3326') }, uBb: { value: 1 }, uEb: { value: 0.55 },
  uMix: { value: 1 },
  uPlein: { value: 0 },
  uAlpha: { value: MOBILE ? 0.6 : 0.4 }
};

const mat = new THREE.ShaderMaterial({
  uniforms: uni,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    #define TR ${TR}
    attribute vec4 aP;
    attribute float aM;
    uniform float uTemps, uPousse, uLong, uVent;
    uniform vec4 uTrace[TR];
    varying float vT, vTeinte, vReflet, vBout, vLum;
    void main(){
      float t = aP.x * uPousse;
      float Lm = uLong * aP.y;
      vec3 p = position;
      /* chute : la mèche descend, s'évase un peu sur les épaules, se courbe vers l'arrière */
      p.y -= t * Lm;
      p.x += position.x * 0.22 * t * t;
      p.z -= 0.25 * t * t;
      /* ondulation propre à chaque mèche + souffle d'ensemble */
      float ph = aP.z * 6.2832;
      p.x += sin(t * 8.5 + ph + uTemps * 0.55) * 0.025 * t;
      /* les mèches : des groupes de cheveux qui ondulent ensemble */
      float pm = aM * 6.2832;
      p.x += sin(t * 4.2 + pm + uTemps * 0.45) * 0.11 * pow(t, 1.3);
      p.z += sin(t * 3.1 + pm * 1.7) * 0.08 * t;
      p.z += cos(t * 6.0 + ph) * 0.05 * t;
      p.x += (sin(uTemps * 0.6 + position.x * 1.4) * 0.07 + uVent) * t * t;
      /* le peigne : écarte autour du passage, et tout ce qui pend en dessous */
      vec3 base = p;
      for (int i = 0; i < TR; i++) {
        vec4 tr = uTrace[i];
        if (tr.z < 0.002) continue;
        float dx = base.x - tr.x;
        float dy = base.y - tr.y;
        float gx = exp(-dx * dx / 0.14);
        float gy = dy > 0.0 ? exp(-dy * dy / 0.05) : exp(dy * 1.8);
        float f = gx * gy * tr.z * smoothstep(0.0, 0.3, t);
        p.x += clamp(dx / 0.16, -1.0, 1.0) * f * 0.24 + tr.w * f * 0.08;
      }
      vT = aP.x;
      vTeinte = aP.w;
      vBout = aP.x;
      /* volume : le centre de la chevelure prend la lumière, les bords et l'arrière s'assombrissent */
      vLum = (0.55 + 0.6 * smoothstep(1.3, 0.0, abs(position.x + 0.25))) * (0.75 + 0.5 * smoothstep(-0.7, 0.3, position.z)) * (0.7 + aP.w * 0.6);
      /* reflet : une bande de lumière qui suit les vagues, vue d'en haut à gauche */
      float bande = p.y - 0.35 - 0.22 * sin(p.x * 1.7 + 0.6) - 0.06 * sin(t * 8.5 + ph + uTemps * 0.55);
      vReflet = exp(-bande * bande / 0.08) * (0.55 + 0.45 * sin(aP.z * 40.0 + t * 3.0));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uRa, uPa, uRb, uPb;
    uniform float uBa, uBb, uEa, uEb, uMix, uPlein, uAlpha;
    varying float vT, vTeinte, vReflet, vBout, vLum;
    vec3 teinte(vec3 r, vec3 p, float b, float t){
      /* balayage : quelques mèches éclaircies plus haut que les autres */
      float debut = b - vTeinte * 0.22 * step(b, 0.99);
      return mix(r, p, smoothstep(debut, min(debut + 0.5, 1.0), t));
    }
    void main(){
      vec3 a = teinte(uRa, uPa, uBa, vT);
      vec3 b = teinte(uRb, uPb, uBb, vT);
      /* la nouvelle couleur monte des pointes (balayage) ou descend des racines (couleur pleine) */
      float seuil = mix(1.0 - uMix * 1.35, uMix * 1.35 - 0.35, uPlein);
      float k = uPlein > 0.5 ? 1.0 - smoothstep(seuil, seuil + 0.35, vT) : smoothstep(seuil, seuil + 0.35, vT);
      vec3 c = mix(a, b, k);
      float e = mix(uEa, uEb, k);
      c *= vLum * 1.12;
      c += vec3(1.0, 0.95, 0.88) * vReflet * 0.16 * e * vLum + c * vReflet * 1.0 * e;
      float alpha = uAlpha * (1.0 - smoothstep(0.86, 1.0, vBout)) * smoothstep(0.0, 0.04, vBout + 0.02);
      gl_FragColor = vec4(c, alpha);
    }`
});

const cheveux = new THREE.LineSegments(geo, mat);
cheveux.frustumCulled = false;
const groupe = new THREE.Group();
groupe.add(cheveux);
scene.add(groupe);

/* ------------------------------------------------------------ cadrage */
let largeur = 1, hauteur = 1;
function cadrer() {
  const r = toile.getBoundingClientRect();
  largeur = Math.max(1, r.width); hauteur = Math.max(1, r.height);
  rendu.setPixelRatio(Math.min(devicePixelRatio, estMobile() ? 2 : 1.75));
  rendu.setSize(largeur, hauteur, false);
  camera.aspect = largeur / hauteur;
  const demiH = Math.tan(THREE.MathUtils.degToRad(16)) * 6;
  const demiL = demiH * camera.aspect;
  if (estMobile()) {
    groupe.position.set(0, 0.25, 0);
    groupe.scale.setScalar(clamp(demiL / 1.75, 0.62, 1));
  } else {
    groupe.position.set(demiL * 0.42, 0.05, 0);
    groupe.scale.setScalar(clamp(demiL / 2.4, 0.95, 1.2));
  }
  camera.updateProjectionMatrix();
  demande();
}

/* ------------------------------------------------------------ le peigne */
const ray = new THREE.Raycaster();
const plan = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const tmp = new THREE.Vector3();
let curseur = 0, dernier = null, cible = { x: 0, y: 0 }, cam = { x: 0, y: 0 };

function versLocal(cx, cy) {
  const r = toile.getBoundingClientRect();
  const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(plan, tmp)) return null;
  return groupe.worldToLocal(tmp.clone());
}
function peigner(cx, cy, force = 1) {
  const p = versLocal(cx, cy);
  if (!p) return;
  if (dernier) {
    const dx = p.x - dernier.x, dy = p.y - dernier.y;
    if (dx * dx + dy * dy < 0.0016) return;
    trace[curseur].set(p.x, p.y, force, clamp(dx * 6, -1, 1));
  } else {
    trace[curseur].set(p.x, p.y, force * 0.6, 0);
  }
  curseur = (curseur + 1) % TR;
  dernier = p;
  demande();
}

zone.addEventListener('pointermove', (e) => {
  const r = zone.getBoundingClientRect();
  cible.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  cible.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch') peigner(e.clientX, e.clientY);
  if (!guide.fini) guide.fini = true;
}, { passive: true });
zone.addEventListener('pointerleave', () => { dernier = null; cible.x = cible.y = 0; });
zone.addEventListener('pointerup', () => { dernier = null; });

/* Un premier passage de peigne joué tout seul, pour montrer qu'on peut toucher */
const guide = { t: -1, fini: calme };
function lancerGuide() { if (!guide.fini) { guide.t = 0; demande(); } }

/* ------------------------------------------------------------ nuances */
let anim = null;   // transition de couleur en cours
function appliquer(id, instant) {
  const n = L.nuance(id);
  uni.uRa.value.copy(uni.uRb.value); uni.uPa.value.copy(uni.uPb.value);
  uni.uBa.value = uni.uBb.value; uni.uEa.value = uni.uEb.value;
  uni.uRb.value.set(n.r); uni.uPb.value.set(n.t); uni.uBb.value = n.b; uni.uEb.value = n.e;
  uni.uPlein.value = n.b <= 0.01 ? 1 : 0;
  uni.uMix.value = 0;
  anim = { t: 0, d: instant || calme ? 0.001 : 1.7 };
  demande();
}
document.addEventListener('lonviere:nuance', (e) => appliquer(e.detail.id));
appliquer(document.querySelector('.swatch[aria-pressed="true"]')?.dataset.nuance || 'naturel', true);

/* ------------------------------------------------------------ boucle, en pause hors écran */
function demande() { if (!enCours && visible && !document.hidden) { enCours = true; avant = performance.now(); requestAnimationFrame(image); } }

function image(maintenant) {
  const dt = Math.min(0.05, (maintenant - avant) / 1000);
  avant = maintenant;
  let encore = !calme;   // le souffle tourne en continu, sauf « réduire les animations »

  if (!calme) uni.uTemps.value += dt;

  if (pousse) {
    pousse.t += dt / pousse.d;
    uni.uPousse.value = lerp(pousse.de, 1, ioc(clamp(pousse.t, 0, 1)));
    if (pousse.t >= 1) { pousse = null; setTimeout(lancerGuide, 400); } else encore = true;
  }
  if (anim) {
    anim.t += dt / anim.d;
    uni.uMix.value = ioc(clamp(anim.t, 0, 1));
    if (anim.t >= 1) anim = null; else encore = true;
  }
  if (guide.t >= 0 && !guide.fini) {
    guide.t += dt / 2.2;
    const r = toile.getBoundingClientRect();
    const g = new THREE.Vector3(-0.9 + guide.t * 1.8, 0.55 - Math.sin(guide.t * Math.PI) * 0.35, 0);
    groupe.localToWorld(g); g.project(camera);
    peigner(r.left + (g.x + 1) / 2 * r.width, r.top + (1 - g.y) / 2 * r.height, tactile ? 0.45 : 0.7);
    if (guide.t >= 1) { guide.fini = true; dernier = null; }
    encore = true;
  }
  /* le peigne relâche les mèches peu à peu */
  for (const p of trace) {
    if (p.z > 0.002) { p.z *= Math.exp(-dt * 1.5); encore = true; } else p.z = 0;
  }
  /* la caméra suit la main, très peu */
  cam.x = amortir(cam.x, tactile ? 0 : cible.x * 0.28, 3, dt);
  cam.y = amortir(cam.y, tactile ? 0 : -cible.y * 0.14, 3, dt);
  uni.uVent.value = amortir(uni.uVent.value, tactile ? 0 : cible.x * 0.05, 1.5, dt);
  camera.position.set(cam.x, cam.y, 6);
  camera.lookAt(cam.x * 0.4, cam.y * 0.4, 0);
  if (Math.abs(cam.x - (tactile ? 0 : cible.x * 0.28)) > 0.002) encore = true;

  rendu.render(scene, camera);
  enCours = false;
  if (encore) demande();
}

new IntersectionObserver((e) => {
  visible = e[0].isIntersecting;
  if (visible) demande();
}, { rootMargin: '80px' }).observe(zone);
document.addEventListener('visibilitychange', demande);
addEventListener('resize', cadrer);

/* La chevelure pousse une fois l'intro terminée (ou tout de suite si elle n'est pas jouée) */
function pousser() { if (!calme && uni.uPousse.value < 1 && !pousse) { pousse = { t: 0, d: 2.6 * (1 - uni.uPousse.value), de: uni.uPousse.value }; demande(); } }
if (html.classList.contains('en-intro') && !L.introFinie) document.addEventListener('lonviere:intro-fin', pousser, { once: true });
else { uni.uPousse.value = calme ? 1 : 0.35; pousser(); }

cadrer();
html.classList.add('avec-3d');
