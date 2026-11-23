/* Franck S.A. — maquette NS Development */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu mobile ---------- */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });

  /* ---------- savoir-faire : textes repris du site actuel de Franck S.A. ---------- */
  const SKILLS = [
    { id: 'aluminium', name: 'Aluminium',
      text: "Premium Partner Schüco depuis 2004 : des profilés à rupture thermique aussi isolants que n'importe quel autre système, et assez fins pour de très grandes surfaces vitrées. Faces intérieure et extérieure de couleurs différentes, automatisation, modules anti-effraction, pare-balles et coupe-feu.",
      list: ['Murs rideaux', 'Vitrage extérieur collé ou agrafé', 'Façades en cassette alu', 'Verrières et vérandas', 'Portes et fenêtres', 'Éléments coupe-feu', 'Constructions spéciales pour l\'industrie'],
      imgs: [['alu-entree', 'Entrée vitrée, centre commercial Belle Étoile'], ['alu-cube', 'Façade en murs rideaux, Luxlait'], ['alu-portes', 'Portes et cloisons vitrées, Belle Étoile'], ['alu-facade', 'Façade vitrée en aluminium']] },
    { id: 'acier', name: 'Acier',
      text: "Robuste, résistant aux chocs, idéal pour les lieux très fréquentés : industrie, écoles, hôpitaux, gares. L'acier ouvre aussi des perspectives en statique, en protection incendie, anti-effraction et acoustique. Jansen Premium Partner, éléments coupe-feu EI30, EI60 et EI90.",
      list: ['Serrurerie et ferronnerie', 'Garde-corps et mains courantes', 'Escaliers et terrasses', 'Grilles de sécurité et portails', 'Passerelles', 'Auvents vitrés'],
      imgs: [['acier-helice', 'Escalier hélicoïdal en acier, Luxlait'], ['acier-perfore', 'Escalier en tôle perforée, Belval'], ['acier-escalier', 'Escalier extérieur et rampe'], ['acier-garde-corps', 'Escalier et garde-corps, hall sportif de Strassen']] },
    { id: 'inox', name: 'Inox',
      text: "Résistance accrue à la corrosion et aux chocs, une teinte sobre qui se fond dans tous les styles. Notre parc de machines cintre, soude et polit l'inox pour des pièces uniques, faites sur mesure jusqu'au moindre détail.",
      list: ['Garde-corps et mains courantes', 'Escaliers', 'Portes et fenêtres', 'Éléments coupe-feu et de sécurité'],
      imgs: [['inox-coupole', 'Garde-corps cintré en inox'], ['inox-terrasse', 'Garde-corps de terrasse en inox'], ['inox-escalier', 'Escalier industriel en inox'], ['inox-detail', 'Fixation en inox, détail']] },
    { id: 'verre', name: 'Verre',
      text: "La transparence du verre traverse le temps et s'adapte à toutes les configurations. Lumineux, transparent et résistant, il dialogue avec nos structures en métal.",
      list: ['Garde-corps entièrement vitrés', 'Dalles de sol', 'Escaliers en verre', 'Portes vitrées', 'Cloisons vitrées', 'Vitrines'],
      imgs: [['verre-atrium', 'Atrium et ascenseur vitré, Belle Étoile'], ['verre-escalier', 'Escalier et garde-corps vitrés, Belle Étoile'], ['verre-tribune', 'Garde-corps vitré de tribune, Strassen'], ['verre-galerie', 'Galerie marchande, Belle Étoile']] },
    { id: 'skyframe', name: 'Sky-Frame',
      text: "Distributeur et partenaire de service officiel de Sky-Frame, les fenêtres coulissantes sans cadre « 100 % Swiss Made ». Des façades vitrées jusqu'à 4 mètres de haut, sans seuil, même dans les angles : l'intérieur devient l'extérieur.",
      list: ['Ouvertures droites et d\'angle', 'Coulissants incurvés Sky-Frame Arc', 'Coulissants inclinés Sky-Frame Slope', 'Motorisation masquée au plafond', 'Anti-effraction et capteurs d\'alarme', 'Moustiquaire plissée sans cadre'],
      imgs: [['skyframe-1', 'Baie Sky-Frame posée par Franck S.A.'], ['skyframe-2', 'Baie Sky-Frame posée par Franck S.A.'], ['skyframe-3', 'Baie Sky-Frame posée par Franck S.A.']] },
    { id: 'auvent', name: 'Auvents',
      text: "La membrane architecturale tendue, le « cinquième élément » de la construction après la pierre, le métal, le ciment et le verre. Courbée dans les deux sens, tenue par câbles, elle est stable, durable et autorise toutes les audaces : protection solaire, couverture de scène, kiosque.",
      list: ['Étude', 'Fabrication', 'Montage', 'Protection solaire', 'Couvertures de scènes et kiosques'],
      imgs: [['auvent', 'Principe d\'un auvent à membrane tendue', 'svg']] },
    { id: 'solaire', name: 'Protections solaires',
      text: "Le soleil ne se maîtrise pas, il se gère. Du store en toile au brise-soleil orientable, une lumière juste dans chaque pièce, pilotée du bout du doigt.",
      list: ['Stores en toile', 'Systèmes à grandes lamelles', 'Brise-soleil orientables', 'Systèmes de commande'],
      imgs: [['solaire-lames', 'Façade à brise-soleil à grandes lamelles'], ['solaire-bois', 'Brise-soleil, Maison Relais d\'Oberanven']] },
    { id: 'glissieres', name: 'Glissières de sécurité',
      text: "Nous réalisons et posons des glissières de sécurité en acier ou en bois, le long des routes, sur les ponts et les bretelles d'autoroute. Mais aussi les barrières pour ouvrages d'art, les écrans de protection pour motocyclistes, clôtures et garde-corps.",
      list: ['Glissières en acier', 'Glissières en bois', 'Barrières d\'ouvrages d\'art', 'Écrans motocyclistes', 'Clôtures et garde-corps'],
      imgs: [['glissiere-a7', 'Glissière de sécurité, autoroute A7'], ['glissiere-tunnel', 'Glissières en entrée de tunnel, A7'], ['glissiere-bois', 'Glissière de sécurité en bois']] },
  ];

  const src = (f, kind) => `./img/${f}.${kind === 'svg' ? 'svg' : 'webp'}`;
  const tabs = $('#ex-tabs'), fig = $('.ex-figure'), body = $('.ex-body');
  const exImg = $('#ex-img'), exCap = $('#ex-cap');

  SKILLS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'ex-tab'; b.role = 'tab'; b.id = 'tab-' + s.id;
    b.setAttribute('aria-controls', 'ex-panel');
    b.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small>${s.name}`;
    b.addEventListener('click', () => showSkill(i));
    tabs.appendChild(b);
  });
  tabs.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const i = $$('.ex-tab').indexOf(document.activeElement);
    const n = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + SKILLS.length) % SKILLS.length;
    showSkill(n); $$('.ex-tab')[n].focus();
  });

  function setImage([f, cap, kind]) {
    fig.classList.add('swap');
    const next = new Image();
    next.src = src(f, kind);
    const done = () => {
      exImg.src = next.src; exImg.alt = cap; exCap.textContent = cap;
      fig.classList.toggle('drawing', kind === 'svg');
      requestAnimationFrame(() => fig.classList.remove('swap'));
    };
    next.decode ? next.decode().then(done, done) : (next.onload = done);
  }

  function showSkill(i) {
    const s = SKILLS[i];
    $$('.ex-tab').forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    $('#ex-panel').setAttribute('aria-labelledby', 'tab-' + s.id);
    $('#ex-num').textContent = `${String(i + 1).padStart(2, '0')} / ${String(SKILLS.length).padStart(2, '0')}`;
    $('#ex-title').textContent = s.name;
    $('#ex-text').textContent = s.text;
    $('#ex-list').innerHTML = s.list.map(l => `<li>${l}</li>`).join('');
    const th = $('#ex-thumbs');
    th.innerHTML = '';
    if (s.imgs.length > 1) s.imgs.forEach((im, k) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Voir : ' + im[1]);
      if (k === 0) b.setAttribute('aria-current', 'true');
      b.innerHTML = `<img src="${src(im[0], im[2])}" alt="" loading="lazy">`;
      b.addEventListener('click', () => { $$('button', th).forEach(x => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true'); setImage(im); });
      th.appendChild(b);
    });
    body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
    setImage(s.imgs[0]);
  }
  showSkill(0);

  /* ---------- réalisations ---------- */
  // Noms repris des fichiers photo du site actuel : à faire confirmer par Franck S.A.
  const WORKS = [
    ['ref-belle-etoile', 'Centre commercial Belle Étoile', 'commerce', 'big'],
    ['ref-belval-rouge', 'Université du Luxembourg, Belval', 'enseignement', 'tall'],
    ['ref-mersch', 'Lycée Ermesinde, Mersch', 'enseignement', ''],
    ['acier-helice', 'Luxlait', 'industrie', 'tall'],
    ['ref-oberanven', 'Maison Relais, Oberanven', 'enseignement', ''],
    ['ref-ettelbruck', 'Ettelbruck', 'enseignement', ''],
    ['glissiere-tunnel', 'Autoroute A7', 'infra', 'big'],
    ['ref-cactus', 'Cactus', 'commerce', ''],
    ['skyframe-2', 'Sky-Frame, maison individuelle', 'habitat', ''],
    ['ref-belval-bassin', 'Belval', 'enseignement', ''],
    ['ref-industrie', 'Plateforme industrielle', 'industrie', ''],
    ['ref-clervaux', 'Lycée, Clervaux', 'enseignement', 'big'],
    ['ref-cube-vert', 'Façade vitrée', 'industrie', ''],
    ['inox-terrasse', 'Terrasse et garde-corps inox', 'habitat', ''],
    ['alu-cube', 'Luxlait', 'industrie', ''],
    ['ref-lamadelaine', 'École, Lamadelaine', 'enseignement', ''],
    ['glissiere-bois', 'Glissière en bois', 'infra', ''],
    ['skyframe-3', 'Sky-Frame, maison individuelle', 'habitat', ''],
  ];
  const LABEL = { commerce: 'Commerce', enseignement: 'Enseignement', industrie: 'Industrie', infra: 'Infrastructures', habitat: 'Habitat' };
  const grid = $('#works-grid');
  WORKS.forEach(([f, name, cat, size], i) => {
    const b = document.createElement('button');
    b.className = `card ns-zoom ${size}`; b.dataset.cat = cat; b.dataset.i = i;
    b.setAttribute('data-reveal', '');
    b.setAttribute('aria-label', `${name}, ${LABEL[cat]} : agrandir la photo`);
    b.innerHTML = `<img src="./img/${f}.webp" alt="" loading="lazy"><span class="cap"><b>${name}</b><span>${LABEL[cat]}</span></span>`;
    b.addEventListener('click', () => openLb(i));
    grid.appendChild(b);
  });
  if (window.NSMotion) $$('.card').forEach(c => NSMotion.observe(c));
  else $$('.card').forEach(c => c.classList.add('ns-in'));
  $$('.filters button').forEach(btn => btn.addEventListener('click', () => {
    $$('.filters button').forEach(x => { x.classList.toggle('is-on', x === btn); x.setAttribute('aria-pressed', x === btn); });
    const f = btn.dataset.f;
    $$('.card').forEach(c => c.classList.toggle('is-hidden', f !== 'tout' && c.dataset.cat !== f));
  }));

  /* ---------- visionneuse ---------- */
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let cur = 0, lastFocus = null;
  const visible = () => $$('.card:not(.is-hidden)').map(c => +c.dataset.i);
  function paint() { const [f, name, cat] = WORKS[cur]; lbImg.src = `./img/${f}.webp`; lbImg.alt = name; lbCap.textContent = `${name} · ${LABEL[cat]}`; }
  function openLb(i) { cur = i; lastFocus = document.activeElement; paint(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lb-x').focus(); }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  function step(d) { const v = visible(); cur = v[(v.indexOf(cur) + d + v.length) % v.length]; paint(); }
  $('#lb-x').addEventListener('click', closeLb);
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'Tab') { // piège de focus dans la visionneuse
      const f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- frise : défilement horizontal piloté par le scroll ---------- */
  const hist = $('#histoire'), track = $('#track'), fill = $('#rail-fill'), yearEl = $('#h-year');
  const items = $$('li', track);
  const pinned = () => !reduce && matchMedia('(min-width: 861px)').matches;
  let ticking = false;
  function onScroll() {
    ticking = false;
    if (!pinned()) { track.style.transform = ''; items.forEach(li => li.classList.add('on')); return; }
    const r = hist.getBoundingClientRect();
    const total = hist.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const max = track.scrollWidth - innerWidth + 40;
    track.style.transform = `translate3d(${-p * max}px,0,0)`;
    fill.style.width = (p * 100) + '%';
    const idx = Math.min(items.length - 1, Math.round(p * (items.length - 1)));
    items.forEach((li, k) => li.classList.toggle('on', k <= idx));
    yearEl.textContent = items[idx].querySelector('b').textContent;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- formulaire : configurateur + mailto ---------- */
  const pick = $('#pick');
  SKILLS.forEach(s => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" name="materiau" value="${s.name}"><span>${s.name}</span>`;
    pick.appendChild(l);
  });
  const form = $('#form'), err = $('#form-err');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const miss = ['nom', 'tel', 'email'].filter(k => !String(d.get(k) || '').trim());
    if (miss.length) { err.textContent = 'Merci d\'indiquer votre nom, votre téléphone et votre e-mail.'; form.elements[miss[0]].focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(d.get('email'))) { err.textContent = 'Cette adresse e-mail semble incomplète.'; form.elements.email.focus(); return; }
    err.textContent = '';
    const mats = d.getAll('materiau').join(', ') || 'non précisé';
    const lines = [
      `Projet : ${mats}`, `Bâtiment : ${d.get('batiment') || 'non précisé'}`, '',
      `Nom : ${d.get('prenom') || ''} ${d.get('nom')}`.trim(), `Société : ${d.get('societe') || ''}`,
      `Commune : ${d.get('commune') || ''}`, `Téléphone : ${d.get('tel')}`, `E-mail : ${d.get('email')}`, '', d.get('message') || ''
    ];
    location.href = `mailto:info@franck-bissen.lu?subject=${encodeURIComponent('Demande d\'étude : ' + mats)}&body=${encodeURIComponent(lines.join('\n'))}`;
  });
})();
