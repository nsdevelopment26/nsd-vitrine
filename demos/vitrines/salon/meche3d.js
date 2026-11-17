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
/* Une tête vue de dos : chaque mèche part d'une racine posée sur le crâne, suit la
   surface jusqu'à la hauteur des tempes, puis tombe librement. Un crâne sombre
   (la masse des cheveux) comble les jours entre les mèches. */
const MOBILE = estMobile();
const N = MOBILE ? 3000 : 7200;    // mèches
const M = 40;                       // points par mèche
const TR = 16;                      // points de passage du peigne gardés en mémoire
const TETE = new THREE.Vector3(0, 0.82, 0);           // centre du crâne
const RAYONS = new THREE.Vector3(0.7, 0.8, 0.66);     // demi-axes du crâne

function alea(s) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

const racines = new Float32Array(N * M * 3);  // phi (autour de la tête), theta0 (depuis le sommet)
const params = new Float32Array(N * M * 4);   // t, longueur, phase, teinte
const meches = new Float32Array(N * M);       // phase commune à une mèche (les cheveux vont par groupes)
const index = new Uint32Array(N * (M - 1) * 2);
for (let s = 0, k = 0; s < N; s++) {
  const phi = (alea(s * 3.1) * 2 - 1) * 1.9;                       // ±109° depuis l'arrière
  const th0 = Math.acos(1 - alea(s * 7.7) * (1 - Math.cos(1.3)));  // répartition égale sur la calotte
  const lon = 0.86 + alea(s * 9.9) * 0.16 - Math.pow(Math.abs(phi) / 1.9, 3) * 0.12;
  const groupeM = alea(Math.floor((phi + 2) * 8) * 1.37 + Math.floor(th0 * 3) * 0.71);
  const phase = alea(s * 2.3);
  const teinte = alea(s * 4.7);
  for (let i = 0; i < M; i++) {
    const v = s * M + i;
    racines.set([phi, th0, 0], v * 3);
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
  uLong: { value: 2.95 },
  uVent: { value: 0 },
  uTrace: { value: trace },
  uTete: { value: TETE }, uRayons: { value: RAYONS },
  uRa: { value: couleur('#4a3324') }, uPa: { value: couleur('#7d5a40') }, uBa: { value: 1 }, uEa: { value: 0.95 },
  uRb: { value: couleur('#4a3324') }, uPb: { value: couleur('#7d5a40') }, uBb: { value: 1 }, uEb: { value: 0.95 },
  uMix: { value: 1 },
  uPlein: { value: 0 },
  uAlpha: { value: MOBILE ? 0.62 : 0.45 }
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
    uniform vec3 uTete, uRayons;
    uniform vec4 uTrace[TR];
    varying float vT, vTeinte, vBout, vDiff, vSpec, vSpec2;
    const vec3 LUM = normalize(vec3(-0.4, 0.35, 0.85));
    const vec3 H = normalize(LUM + vec3(0.0, 0.0, 1.0));
    void main(){
      float phi = position.x, th0 = position.y;
      float Lm = uLong * aP.y;
      float s = aP.x * uPousse * Lm;
      float Rm = 0.74;
      float surCrane = (1.5708 - th0) * Rm;
      vec3 sortie = vec3(sin(phi), 0.0, cos(phi));
      vec3 p, T, n;
      float lib = max(s - surCrane, 0.0);
      float ph = aP.z * 6.2832, pm = aM * 6.2832;
      if (s < surCrane) {
        /* sur le crâne : la mèche suit la surface vers le bas */
        float th = th0 + s / Rm;
        vec3 u = vec3(sin(th) * sin(phi), cos(th), sin(th) * cos(phi));
        p = uTete + uRayons * u * 1.012;
        T = normalize(uRayons * vec3(cos(th) * sin(phi), -sin(th), cos(th) * cos(phi)));
        n = normalize(u / uRayons);
      } else {
        /* chute libre : un léger gonflant sous le crâne, puis les ondulations */
        vec3 E = uTete + uRayons * sortie * 1.012;
        float a1 = 0.022 * min(lib, 1.0), a2 = 0.10 * pow(lib / 2.0, 1.2);
        float w1 = sin(lib * 9.0 + ph + uTemps * 0.55), w2 = sin(lib * 3.6 + pm + uTemps * 0.45);
        p = E + vec3(0.0, -lib, 0.0);
        p.xz += sortie.xz * 0.045 * (1.0 - exp(-lib * 1.4));
        p.x += sin(phi) * 0.16 * lib * lib / 4.0;
        p.x += a1 * w1 + a2 * w2 + (sin(uTemps * 0.6 + phi) * 0.06 + uVent) * lib * lib / 4.0;
        p.z += 0.07 * sin(lib * 2.6 + pm * 1.7) * lib / 2.0 + 0.03 * cos(lib * 7.0 + ph) * lib / 2.0;
        float dx = a1 * 9.0 * cos(lib * 9.0 + ph + uTemps * 0.55) + a2 * 3.6 * cos(lib * 3.6 + pm + uTemps * 0.45) + sin(phi) * 0.08 * lib;
        float dz = 0.07 * 2.6 * cos(lib * 2.6 + pm * 1.7) * lib / 2.0 + sortie.z * 0.063 * exp(-lib * 1.4);
        T = normalize(vec3(dx, -1.0, dz));
        n = normalize(vec3(sortie.x, 0.15, sortie.z * 0.8 + 0.3));
      }
      /* le peigne : écarte autour du passage, et tout ce qui pend en dessous (jamais les racines) */
      vec3 base = p;
      float prise = smoothstep(0.05, 0.5, lib);
      for (int i = 0; i < TR; i++) {
        vec4 tr = uTrace[i];
        if (tr.z < 0.002) continue;
        float ex = base.x - tr.x;
        float ey = base.y - tr.y;
        float gx = exp(-ex * ex / 0.16);
        float gy = ey > 0.0 ? exp(-ey * ey / 0.06) : exp(ey * 1.6);
        float f = gx * gy * tr.z * prise;
        p.x += clamp(ex / 0.2, -1.0, 1.0) * f * 0.22 + tr.w * f * 0.08;
      }
      vT = aP.x;
      vTeinte = aP.w;
      vBout = aP.x;
      /* lumière : diffuse sur la masse, reflet de Kajiya le long du cheveu (l'anneau de lumière) */
      vDiff = (0.3 + 0.7 * max(dot(n, LUM), 0.0)) * (0.72 + aP.w * 0.56);
      float th2 = dot(T, H);
      float sinTH = sqrt(max(1.0 - th2 * th2, 0.0));
      vSpec = pow(sinTH, 90.0) * (0.6 + 0.4 * sin(aP.z * 37.0));
      float th3 = dot(T, normalize(H + vec3(0.0, -0.18, 0.0)));
      vSpec2 = pow(sqrt(max(1.0 - th3 * th3, 0.0)), 22.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uRa, uPa, uRb, uPb;
    uniform float uBa, uBb, uEa, uEb, uMix, uPlein, uAlpha;
    varying float vT, vTeinte, vBout, vDiff, vSpec, vSpec2;
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
      vec3 base = c * vDiff * 1.15;
      /* deux reflets : blanc et net, puis coloré et large (comme sur de vrais cheveux) */
      float pointes = 1.0 - smoothstep(0.7, 1.0, vT) * 0.6;
      vec3 col = base + (vec3(1.0, 0.96, 0.9) * vSpec * 0.6 * e + c * vSpec2 * 0.75 * e) * pointes;
      float alpha = uAlpha * (1.0 - smoothstep(0.86, 1.0, vBout));
      gl_FragColor = vec4(col, alpha);
    }`
});

/* Sous les mèches : une calotte (le dessus du crâne) et une masse en dégradé derrière
   la chute, de la couleur des cheveux mais plus sombre. Elles comblent les jours sans
   dessiner de contour. */
const TEINTE_GLSL = /* glsl */`
  uniform vec3 uRa, uPa, uRb, uPb;
  uniform float uBa, uBb, uMix, uPlein;
  vec3 teinteMasse(float t){
    vec3 a = mix(uRa, uPa, smoothstep(uBa, min(uBa + 0.5, 1.0), t));
    vec3 b = mix(uRb, uPb, smoothstep(uBb, min(uBb + 0.5, 1.0), t));
    float seuil = mix(1.0 - uMix * 1.35, uMix * 1.35 - 0.35, uPlein);
    float k = uPlein > 0.5 ? 1.0 - smoothstep(seuil, seuil + 0.35, t) : smoothstep(seuil, seuil + 0.35, t);
    return mix(a, b, k);
  }`;
const calotte = new THREE.Mesh(
  new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`
      varying vec3 vN; varying float vY;
      void main(){ vN = normalize(normal); vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: TEINTE_GLSL + /* glsl */`
      varying vec3 vN; varying float vY;
      void main(){
        vec3 c = teinteMasse(0.12 * (1.0 - vY));
        float d = 0.3 + 0.7 * max(dot(vN, normalize(vec3(-0.4, 0.35, 0.85))), 0.0);
        gl_FragColor = vec4(c * d * 0.8, 1.0);
      }`
  })
);
calotte.scale.copy(RAYONS).multiplyScalar(0.985);
calotte.position.copy(TETE);
calotte.renderOrder = -2;

const masse = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: TEINTE_GLSL + /* glsl */`
      uniform float uPousse;
      varying vec2 vUv;
      void main(){
        float bas = 1.0 - vUv.y;                       // 0 sous le crâne, 1 aux pointes
        vec3 c = teinteMasse(0.3 + bas * 0.6) * (0.62 - bas * 0.2);
        float x = abs(vUv.x - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.5 - bas * 0.05, 0.95, x)) * (1.0 - smoothstep(0.45, 0.9, bas / max(uPousse, 0.01))) * mix(1.0, smoothstep(0.08, 0.22, bas), smoothstep(0.3, 0.65, x));
        gl_FragColor = vec4(c, a * 0.95);
      }`
  })
);
masse.scale.set(1.75, 2.6, 1);
masse.position.set(0, TETE.y - 1.0, -0.08);
masse.renderOrder = -1;

const cheveux = new THREE.LineSegments(geo, mat);
cheveux.frustumCulled = false;
const groupe = new THREE.Group();
groupe.add(masse, calotte, cheveux);
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
    const k = clamp(demiL / 1.3, 0.7, 1.05);
    groupe.scale.setScalar(k);
    groupe.position.set(0, demiH - 1.62 * k - 0.18, 0);   // le haut du crâne juste sous la barre
  } else {
    groupe.position.set(demiL * 0.42, -0.02, 0);
    groupe.scale.setScalar(clamp(demiL / 2.5, 0.95, 1.15));
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
    guide.t += dt / 2.6;
    const r = toile.getBoundingClientRect();
    const g = new THREE.Vector3(-0.75 + guide.t * 1.5, 0.1 - guide.t * 0.7, 0);
    groupe.localToWorld(g); g.project(camera);
    peigner(r.left + (g.x + 1) / 2 * r.width, r.top + (1 - g.y) / 2 * r.height, tactile ? 0.4 : 0.55);
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
