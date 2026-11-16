/* =================================================================
   NSD 360 — défilement scénarisé (panneaux, repères, navigation)
   Le gimbal 3D (gimbal3d.js) n'est chargé que si WebGL est disponible
   et que le visiteur n'a pas demandé de réduire les animations.
   En attendant (ou à défaut), le téléphone s'affiche en image (.x2d).
   ================================================================= */
const html = document.documentElement;
const xp = document.getElementById('xp');
const stage = document.getElementById('stage');
const pans = [...document.querySelectorAll('.pan')].sort((a, b) => a.dataset.beat - b.dataset.beat);
const N = pans.length;
const SCENE_OF_BEAT = [0, 1, 1, 1, 2, 3, 4, 5, 6];
const rail = [...document.querySelectorAll('.rail li')];
const navLinks = [...document.querySelectorAll('.nav-links a')];
const img2d = document.getElementById('phone2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Titres découpés en mots (masques) ---------- */
function splitWords(el) {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/([ \t\n\r]+)/).forEach(part => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('i'); inner.textContent = part; inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
}
document.querySelectorAll('[data-words]').forEach(splitWords);

/* ---------- État partagé avec la scène 3D ---------- */
export const state = {
  P: 0, N, w: innerWidth, h: innerHeight, mobile: innerWidth <= 820,
  beats: pans.map(p => ({ side: p.classList.contains('left') ? 1 : -1, wide: p.classList.contains('wide'), screen: p.dataset.screen })),
  active: 0, dir: 1
};

let top0 = 0, vh = innerHeight, lastY = scrollY;
function measure() {
  const r = xp.getBoundingClientRect();
  top0 = r.top + scrollY;
  vh = Math.max(200, stage.clientHeight || innerHeight || 0);
  state.w = innerWidth; state.h = innerHeight; state.mobile = innerWidth <= 820;
}

function setActive(k) {
  if (k === state.active && (k === -1 || pans[k].classList.contains('on'))) return;
  stage.style.setProperty('--dir', state.dir);
  pans.forEach((p, i) => {
    p.style.setProperty('--dir', state.dir);
    const on = i === k;
    p.classList.toggle('on', on);
    p.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  state.active = k;
  if (k === -1) return;
  const sc = SCENE_OF_BEAT[k] ?? 0;
  rail.forEach((li, i) => li.classList.toggle('on', i === sc));
  const goTo = { 1: [1, 2, 3], 4: [4, 5], 6: [6], 7: [7], 8: [8] };
  navLinks.forEach(a => a.classList.toggle('on', (goTo[a.dataset.go] || []).includes(k)));
  if (html.classList.contains('x2d')) swap2d(k);
}

/* Téléphone en image (mode .x2d) */
let swapTimer = 0;
function swap2d(k) {
  const b = state.beats[k];
  stage.style.setProperty('--px', state.mobile ? '50%' : (b.side > 0 ? (b.wide ? '30%' : '66%') : (b.wide ? '30%' : '34%')));
  const src = `assets/nsd360/ecrans/${b.screen}.webp`;
  if (img2d.getAttribute('src') === src) return;
  img2d.style.opacity = 0; clearTimeout(swapTimer);
  swapTimer = setTimeout(() => { img2d.src = src; img2d.onload = () => (img2d.style.opacity = 1); }, reduced ? 0 : 180);
}

function onScroll() {
  const y = scrollY;
  if (y !== lastY) state.dir = y > lastY ? 1 : -1;
  lastY = y;
  const p = (y - top0) / vh;
  state.P = Number.isFinite(p) ? Math.min(N - 1, Math.max(0, p)) : 0;
  // pendant le déplacement du téléphone (milieu d'une transition), aucun texte n'est affiché : il ne croise jamais le téléphone
  const f = state.P - Math.floor(state.P);
  const moving = html.classList.contains('x3d') && !state.mobile && f > 0.36 && f < 0.64;
  setActive(moving ? -1 : Math.min(N - 1, Math.round(state.P)));
  const navEl = document.getElementById('nav'); if (navEl) navEl.classList.toggle('solid', y > 10);
}

/* Liens internes vers un temps de l'expérience */
function scrollToBeat(k) {
  window.scrollTo({ top: top0 + k * vh + 2, behavior: reduced ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || !html.classList.contains('js-xp')) return;
  const go = a.dataset.go ?? pans.findIndex(p => '#' + p.id === a.getAttribute('href'));
  if (go === undefined || go === -1 || go === '') return;
  e.preventDefault();
  scrollToBeat(+go);
});

/* Le bloc contact révèle son titre en entrant */
const contact = document.querySelector('.contact');
if (contact) new IntersectionObserver(es => es.forEach(e => e.isIntersecting && contact.classList.add('on')), { threshold: .3 }).observe(contact);

/* ---------- Démarrage ---------- */
function start() {
  html.classList.add('js-xp', 'x2d');
  xp.style.setProperty('--beats', N);
  measure(); onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  if (document.fonts) document.fonts.ready.then(() => { measure(); onScroll(); });

  // mouvement réduit (ou ?sans3d pour tester le secours) : téléphone en image, sans rotation
  if (reduced || innerWidth <= 820 || /[?&]sans3d/.test(location.search)) return;
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return;
  const plusTard = window.requestIdleCallback || (f => setTimeout(f, 600));
  plusTard(() => import('./gimbal3d.js?v=5')
    .then(m => m.init(document.getElementById('gl'), state, stage))
    .then(() => { html.classList.add('x3d'); html.classList.remove('x2d'); })
    .catch(err => { console.warn('NSD 360 : 3D indisponible, image utilisée à la place.', err); }));
}
start();
