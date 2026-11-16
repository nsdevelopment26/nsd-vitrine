/* =====================================================================
   NS Development · refonte v3 · comportements
   Écrit à la main, sans librairie. Chaque bloc est indépendant :
   si un élément manque dans la page, son bloc ne fait rien.
   ===================================================================== */
(function(){
  'use strict';
  const doc = document, html = doc.documentElement;
  const $ = (s, r) => (r || doc).querySelector(s);
  const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fin = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const T = s => (window.nsT ? window.nsT(s) : s);
  const retraduire = () => { if (window.nsRetranslate) window.nsRetranslate(); };
  const FL = '<svg class="fl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  const ICI_JS = document.currentScript && document.currentScript.src;
  const FLX = '<svg class="fl ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  /* ---------- 1. Écran d'ouverture : l'animation du logo, une fois par visite ---------- */
  let introFinie;
  const introPrete = new Promise(r => { introFinie = r; });
  (function intro(){
    const el = $('#intro');
    if (!el) { introFinie(); return; }
    if (!html.classList.contains('intro-joue')) { el.remove(); introFinie(); return; }
    try { sessionStorage.setItem('nsd-intro', '1'); } catch (e) {}
    const vid = $('video', el);
    let fini = false;
    const finir = () => {
      if (fini) return; fini = true;
      el.classList.add('fin');
      introFinie();
      setTimeout(() => el.remove(), 1200);
    };
    const sansVideo = () => { el.classList.add('sans-video'); setTimeout(finir, 1300); };
    $('.intro-passer', el).addEventListener('click', finir);
    el.addEventListener('click', finir);
    if (vid) {
      vid.addEventListener('ended', () => setTimeout(finir, 150), { once: true });
      vid.addEventListener('error', sansVideo, { once: true });
      const p = vid.play();
      if (p && p.catch) p.catch(sansVideo);
      setTimeout(() => { if (!fini && vid.currentTime === 0) sansVideo(); }, 900);
    } else sansVideo();
    setTimeout(finir, 3600);
  })();

  /* ---------- 2. Apparitions au défilement (une seule fois) ---------- */
  const voir = el => el.classList.add('vu');
  const hero = $('.hero');
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { voir(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }) : null;
  $$('[data-r], .vague, .foot-marque, #mkPub').forEach(el => {
    if (hero && hero.contains(el)) return;          // le hero attend la fin de l'ouverture
    if (io) io.observe(el); else voir(el);
  });
  introPrete.then(() => {
    if (!hero) return;
    $$('[data-r], .titre-r', hero).forEach(voir);
    const compo = $('#compo'); if (compo) voir(compo);
  });

  /* ---------- 3. En-tête : fond au défilement, masqué en descendant, lien actif ---------- */
  (function tete(){
    const t = $('#tete'); if (!t) return;
    let dernier = 0, attente = false;
    const maj = () => {
      const y = scrollY;
      t.classList.toggle('plein', y > 24);
      const ouvert = html.classList.contains('menu-ouvert') || $('.langues[data-ouvert="1"]');
      t.classList.toggle('cache', !ouvert && y > 640 && y > dernier + 4);
      if (y < dernier - 4 || y < 640) t.classList.remove('cache');
      dernier = y; attente = false;
    };
    addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
    // Sur l'accueil seulement : le lien « Services » s'allume quand on lit la section
    const liens = $$('.menu a').filter(a => a.hash && a.pathname === location.pathname);
    const cibles = liens.map(a => doc.getElementById(a.hash.slice(1))).filter(Boolean);
    if (io && cibles.length) {
      const vu = new IntersectionObserver(es => es.forEach(e => {
        const a = liens.find(l => l.hash === '#' + e.target.id);
        if (a) a.classList.toggle('ici', e.isIntersecting);
      }), { rootMargin: '-45% 0px -50% 0px' });
      cibles.forEach(c => vu.observe(c));
    }
  })();

  /* ---------- 4. Langues : menu déroulant + copie dans le menu mobile ---------- */
  (function langues(){
    const bloc = $('#langues'); if (!bloc) return;
    const bouton = $('button', bloc), courant = $('#langCourante');
    const ouvrir = v => { bloc.dataset.ouvert = v ? '1' : '0'; bouton.setAttribute('aria-expanded', v ? 'true' : 'false'); };
    bouton.addEventListener('click', e => { e.stopPropagation(); ouvrir(bloc.dataset.ouvert !== '1'); });
    doc.addEventListener('click', e => { if (!bloc.contains(e.target)) ouvrir(false); });
    doc.addEventListener('keydown', e => { if (e.key === 'Escape' && bloc.dataset.ouvert === '1') { ouvrir(false); bouton.focus(); } });
    const etiquette = () => {
      const l = window.nsLangue ? window.nsLangue() : 'fr';
      const b = $('#langSel .lang-b[data-lang="' + l + '"]');
      courant.textContent = b ? b.textContent : 'FR';
    };
    // i18n.js remplit #langSel au chargement : on attend qu'il l'ait fait
    const copier = () => {
      const src = $('#langSel'), dst = $('#langSelMobile');
      if (!src || !src.children.length) return false;
      if (dst && !dst.children.length) {
        dst.innerHTML = src.innerHTML;
        $$('.lang-b', dst).forEach(b => b.addEventListener('click', () => { window.nsSetLang && window.nsSetLang(b.dataset.lang); etiquette(); }));
      }
      $$('.lang-b', src).forEach(b => b.addEventListener('click', () => { etiquette(); ouvrir(false); }));
      etiquette();
      return true;
    };
    if (!copier()) {
      let n = 0;
      const essai = setInterval(() => { if (copier() || ++n > 40) clearInterval(essai); }, 50);
    }
  })();

  /* ---------- 5. Menu mobile : rideau ---------- */
  (function rideau(){
    const b = $('#burger'), r = $('#rideau'); if (!b || !r) return;
    const basculer = v => {
      html.classList.toggle('menu-ouvert', v);
      b.setAttribute('aria-expanded', v ? 'true' : 'false');
      b.setAttribute('aria-label', v ? 'Fermer le menu' : 'Ouvrir le menu');
      r.setAttribute('aria-hidden', v ? 'false' : 'true');
      r.inert = !v;
      html.style.overflow = v ? 'hidden' : '';
      if (v) { $('#tete').classList.remove('cache'); setTimeout(() => { const a = $('nav a', r); a && a.focus({ preventScroll: true }); }, 300); }
    };
    b.addEventListener('click', () => basculer(!html.classList.contains('menu-ouvert')));
    $$('a', r).forEach(a => a.addEventListener('click', () => basculer(false)));
    doc.addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('menu-ouvert')) { basculer(false); b.focus(); } });
    matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) basculer(false); });
  })();

  /* ---------- 6. Composition du hero : profondeur à la souris et au défilement ---------- */
  (function compo(){
    const c = $('#compo'); if (!c || reduit) return;
    const ecrans = $$('.ecran', c).map(el => ({ el, k: parseFloat(el.dataset.prof) || 1 }));
    let mx = 0, my = 0, cx = 0, cy = 0, sy = 0, raf = 0, visible = true;
    const boucle = () => {
      cx += (mx - cx) * 0.07; cy += (my - cy) * 0.07;
      ecrans.forEach(({ el, k }) => {
        el.style.setProperty('--px', (cx * k * 10).toFixed(2) + 'px');
        el.style.setProperty('--py', (cy * k * 8).toFixed(2) + 'px');
        el.style.setProperty('--sy', (-sy * k * 0.09).toFixed(2) + 'px');
      });
      raf = (visible && (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001)) ? requestAnimationFrame(boucle) : 0;
    };
    const relancer = () => { if (!raf) raf = requestAnimationFrame(boucle); };
    if (fin) addEventListener('pointermove', e => {
      if (!visible) return;
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; relancer();
    }, { passive: true });
    addEventListener('scroll', () => {
      sy = Math.min(scrollY, innerHeight * 1.2);
      visible = scrollY < innerHeight * 1.3;
      if (visible) { if (!raf) raf = requestAnimationFrame(boucle); }
    }, { passive: true });
    // Le défilement seul doit aussi faire bouger : on force une image à chaque scroll
    addEventListener('scroll', () => { if (visible) requestAnimationFrame(() => ecrans.forEach(({ el, k }) => el.style.setProperty('--sy', (-sy * k * 0.09).toFixed(2) + 'px'))); }, { passive: true });
  })();

  /* ---------- 7. Index des concepts : l'aperçu suit la souris ---------- */
  (function apercu(){
    const ap = $('#apercu'), liste = $('#index'); if (!ap || !liste || !fin) return;
    const img = $('img', ap);
    let x = 0, y = 0, ax = 0, ay = 0, raf = 0, on = false;
    const boucle = () => {
      ax += (x - ax) * 0.18; ay += (y - ay) * 0.18;
      ap.style.transform = 'translate3d(' + (ax + 28) + 'px,' + (ay - 110) + 'px,0) scale(' + (on ? 1 : .85) + ')';
      raf = on || Math.abs(x - ax) > .5 ? requestAnimationFrame(boucle) : 0;
    };
    $$('a', liste).forEach(a => {
      a.addEventListener('pointerenter', () => {
        if (img.getAttribute('src') !== a.dataset.apercu) img.src = a.dataset.apercu;
        on = true; ap.classList.add('on'); if (!raf) raf = requestAnimationFrame(boucle);
      });
    });
    liste.addEventListener('pointerleave', () => { on = false; ap.classList.remove('on'); });
    liste.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(boucle); });
  })();

  /* ---------- 8. Services : lignes qui s'ouvrent ---------- */
  $$('.svc-btn').forEach(b => {
    b.addEventListener('click', () => {
      const l = b.closest('.svc-l'), ouvert = !l.classList.contains('ouvert');
      l.classList.toggle('ouvert', ouvert);
      b.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  });

  /* ---------- 9. Méthode : le rail se remplit avec la lecture ---------- */
  (function etapes(){
    const bloc = $('#etapes'); if (!bloc) return;
    const rail = $('.rail', bloc), items = $$('.etape', bloc);
    if (reduit) { rail.style.setProperty('--prog', 1); items.forEach(i => i.classList.add('actif')); return; }
    let attente = false;
    const maj = () => {
      attente = false;
      const r = bloc.getBoundingClientRect(), h = innerHeight;
      const p = Math.min(1, Math.max(0, (h * 0.78 - r.top) / (r.height + h * 0.25)));
      rail.style.setProperty('--prog', p.toFixed(3));
      items.forEach((it, i) => it.classList.toggle('actif', p >= i / items.length + 0.04));
    };
    addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
  })();

  /* ---------- 10. Parallaxe très modérée (espace client, photo) ---------- */
  (function parallaxe(){
    if (reduit) return;
    const els = $$('[data-vit]').map(el => ({ el, v: parseFloat(el.dataset.vit) }));
    const photo = $('#stPhoto');
    if (!els.length && !photo) return;
    let attente = false;
    const maj = () => {
      attente = false;
      const h = innerHeight;
      els.forEach(({ el, v }) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) return;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - h / 2) * v).toFixed(1) + 'px,0)';
      });
      if (photo) {
        const r = photo.parentNode.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) photo.style.transform = 'translate3d(0,' + (((r.top + r.height / 2) - h / 2) * -0.08 - r.height * .06).toFixed(1) + 'px,0)';
      }
    };
    addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
  })();

  /* ---------- 11. Fiches projet ---------- */
  const P = 'assets/v3/p/';
  const PROJETS = {
    'mb-cars': {
      client: true, titre: 'MB Cars', secteur: "Voitures d'occasion, Pétange",
      type: 'Site vitrine, stock de véhicules, rendez-vous en ligne, logo', quand: 'En ligne depuis le 14 novembre 2026',
      img: 'mb-cars', m2: 'mb-cars-m2', lien: 'https://mbcars.lu/', lienTxt: 'Visiter mbcars.lu',
      contexte: "MB Cars achète et revend des voitures d'occasion à Pétange. Pas de showroom à visiter : les annonces existaient sur les portails, mais rien ne présentait l'entreprise elle-même.",
      besoin: "Un site qui inspire confiance avant le premier appel, un stock facile à parcourir, et des rendez-vous qui ne passent plus tous par le téléphone.",
      da: "Blanc, noir et rouge, la nouvelle identité de MB Cars, logo compris, que nous avons dessinée. Les voitures prennent toute la place, posées sur le même fond de studio.",
      fonctions: ['Stock filtrable et une fiche détaillée par véhicule', 'Prise de rendez-vous en ligne pour un essai', 'Recherche sur mesure du véhicule idéal', 'Page boutique', "Studio photo automatique : chaque voiture détourée sur un fond propre, validée photo par photo", 'Logo et identité'],
      resultat: "En ligne sur mbcars.lu depuis le 14 novembre 2026. Le gérant gère ses photos lui-même, depuis son interface d'administration."
    },
    'vaurenne': {
      titre: 'Maison Vaurenne', secteur: 'Restaurant gastronomique', type: 'Site vitrine avec réservation', img: 'vaurenne',
      lien: '../demos/maison-vaurenne/index.html', prix: '7 270 €',
      da: "Noir profond et grandes photographies de plats : l'ambiance d'une salle le soir, avant même d'avoir réservé.",
      fonctions: ['Menus et carte photographiée', 'Cave', 'Réservation en ligne qui bloque vraiment un service complet']
    },
    'volte': {
      titre: 'Maison Volte', secteur: 'École de danse', type: 'Site vitrine avec planning', img: 'volte',
      lien: '../demos/ecole-danse/index.html', prix: '3 130 €',
      da: 'Clair et éditorial : photographies monochromes, typographie de magazine, beaucoup de blanc.',
      fonctions: ['Planning des cours de la semaine', 'Réservation en un clic', 'Fiches professeurs', 'Galerie plein écran']
    },
    'korvel': {
      titre: 'KORVEL', secteur: 'Imprimerie et textile', type: 'Boutique en ligne', img: 'korvel',
      lien: '../demos/korvel/index.html', prix: '5 890 €',
      da: "Couleurs franches d'atelier, typographie massive, un ton direct de fabricant.",
      fonctions: ['Boutique avec paiement Apple Pay (simulé dans le concept)', 'Configurateur : le client pose son logo sur un T-shirt', 'Catalogue print à feuilleter', 'Trois langues']
    },
    'ashcombe': {
      titre: 'Ashcombe Lorant', secteur: "Cabinet d'avocats", type: 'Site institutionnel', img: 'ashcombe',
      lien: '../demos/ashcombe-lorant/index.html', prix: '3 740 €',
      da: "Le cabinet présenté comme la une d'un quotidien financier : colonnes, filets, papier saumon.",
      fonctions: ['Dossiers gagnés', 'Carte des affaires dans le monde', 'Fiches des associés', 'Coupon-réponse']
    },
    'valombre': {
      titre: 'Domaine de Valombre', secteur: 'Centre équestre', type: 'Site vitrine avec rendez-vous', img: 'valombre',
      lien: '../demos/domaine-equestre/index.html', prix: '6 980 €',
      da: 'Sombre et cinématique : grandes photographies, défilement fluide, mise en page de magazine.',
      fonctions: ['Rendez-vous en ligne', 'Photographie plein cadre', 'Galerie des chevaux']
    },
    'orvane': {
      titre: 'Fiduciaire Orvane', secteur: 'Fiduciaire et comptabilité', type: 'Site vitrine multilingue', img: 'orvane',
      lien: '../demos/fiduciaire-orvane/index.html', prix: '2 730 €',
      da: "Sobre et rassurant : vert profond, papier clair, la rigueur d'un cabinet.",
      fonctions: ["La frise des échéances de l'année, avec le compte à rebours de la prochaine", 'Services', 'Rendez-vous', 'Quatre langues']
    }
  };

  (function fiches(){
    const dlg = $('#fichePj'); if (!dlg || !dlg.showModal) return;
    let retour = null;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const liste = a => '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';

    function rendre(cle){
      const p = PROJETS[cle]; if (!p) return false;
      const ext = p.client;
      const contexte = p.contexte || ("Concept de démonstration, créé par NS Development pour montrer ce qu'un site peut faire pour ce métier. Ce n'est pas un client : le nom et les contenus sont fictifs.");
      const besoin = p.besoin || "Montrer qu'un site de ce métier peut avoir sa propre personnalité, et pas celle d'un modèle.";
      const resultat = p.resultat ? esc(p.resultat)
        : '<span>Ce type de site, à partir de</span> <b>' + esc(p.prix) + ' HT</b><span>, hors maintenance.</span> <span>Le vôtre est chiffré sur ce que vous demandez vraiment.</span>';
      dlg.innerHTML =
        '<div class="fp-barre"><span class="label">' + (ext ? 'Réalisation client' : 'Concept de démonstration') + '</span>'
        + '<button type="button" class="fp-fermer" data-fermer><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>Fermer</button></div>'
        + '<div class="wrap">'
        + '<div class="fp-haut">'
        + '<span class="etiquette' + (ext ? ' client' : '') + '">' + (ext ? '<i aria-hidden="true"></i>Client' : 'Concept') + '</span>'
        + '<h2 class="t-xl" id="fpTitre">' + esc(p.titre) + '</h2>'
        + '<dl class="fiche"><dt>Secteur</dt><dd>' + esc(p.secteur) + '</dd><dt>Réalisation</dt><dd>' + esc(p.type) + '</dd>'
        + (p.quand ? '<dt>Statut</dt><dd>' + esc(p.quand) + '</dd>' : '<dt>Statut</dt><dd>Site de démonstration</dd>') + '</dl>'
        + '</div>'
        + '<div class="fp-visuel"><figure class="grand"><img src="' + P + p.img + '-d.webp" srcset="' + P + p.img + '-d-800.webp 800w, ' + P + p.img + '-d.webp 1600w" sizes="100vw" width="1600" height="1000" alt="' + esc(p.titre) + ', page d\'accueil sur ordinateur"></figure>'
        + '<figure class="tel"><img src="' + P + p.img + '-m.webp" width="600" height="1298" alt="' + esc(p.titre) + ' sur téléphone"></figure></div>'
        + '<div class="fp-corps">'
        + '<div class="fp-bloc"><h3>Le contexte</h3><p>' + esc(contexte) + '</p></div>'
        + '<div class="fp-bloc"><h3>Le besoin</h3><p>' + esc(besoin) + '</p></div>'
        + '<div class="fp-bloc"><h3>La direction artistique</h3><p>' + esc(p.da) + '</p></div>'
        + '<div class="fp-bloc" style="grid-column:1 / span 6"><h3>Ce qui a été développé</h3>' + liste(p.fonctions) + '</div>'
        + '<div class="fp-bloc" style="grid-column:8 / span 5"><h3>' + (ext ? 'Le résultat' : 'Pour votre projet') + '</h3><p>' + resultat + '</p></div>'
        + '</div>'
        + '<div class="fp-duo"><figure class="grand"><img src="' + P + p.img + '-d2.webp" srcset="' + P + p.img + '-d2-800.webp 800w, ' + P + p.img + '-d2.webp 1600w" sizes="(max-width: 980px) 100vw, 75vw" width="1600" height="1000" alt="' + esc(p.titre) + ', une section intérieure" loading="lazy"></figure>'
        + '<figure class="tel"><img src="' + P + (p.m2 || p.img + '-m') + '.webp" width="600" height="1298" alt="" loading="lazy"></figure></div>'
        + '<div class="fp-fin"><p>' + (ext ? 'Un projet comme celui-ci&nbsp;? Parlons du vôtre.' : 'Ce métier est le vôtre&nbsp;? On part de zéro, à votre image.') + '</p>'
        + '<div class="cas-liens"><a class="btn" href="' + esc(p.lien) + '" target="_blank" rel="noopener">' + esc(ext ? p.lienTxt : 'Ouvrir la démo') + ' ' + FLX + '</a>'
        + '<a class="lien" href="#contact" data-fermer>Discuter d\'un projet ' + FL + '</a></div></div>'
        + '</div>';
      retraduire();
      return true;
    }
    function ouvrir(cle, source){
      if (!rendre(cle)) return;
      retour = source || null;
      dlg.classList.remove('ferme');
      dlg.showModal();
      dlg.scrollTop = 0;
      html.style.overflow = 'hidden'; html.classList.add('fiche-ouverte');
      const f = $('.fp-fermer', dlg); f && f.focus({ preventScroll: true });
    }
    function fermer(){
      if (!dlg.open) return;
      const final = () => { dlg.close(); dlg.classList.remove('ferme'); html.style.overflow = ''; html.classList.remove('fiche-ouverte'); if (retour) retour.focus({ preventScroll: true }); };
      if (reduit) return final();
      dlg.classList.add('ferme');
      setTimeout(final, 520);
    }
    doc.addEventListener('click', e => {
      const b = e.target.closest('[data-pj]');
      if (b) { e.preventDefault(); ouvrir(b.dataset.pj, b); return; }
      if (e.target.closest('[data-fermer]') && dlg.contains(e.target)) {
        const a = e.target.closest('a[href^="#"]');
        fermer();
        if (a) { e.preventDefault(); setTimeout(() => { const c = $(a.getAttribute('href')); c && c.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth' }); }, 560); }
      }
    });
    dlg.addEventListener('cancel', e => { e.preventDefault(); fermer(); });
  })();

  /* ---------- 11 bis. Objets 3D (ordinateur seulement, chargés quand le navigateur est libre) ---------- */
  (function objets(){
    const els = $$('[data-objet]').filter(e => e.querySelector('canvas'));
    if (!els.length || reduit || innerWidth <= 980 || !ICI_JS) return;
    const essai = doc.createElement('canvas');
    if (!(essai.getContext('webgl2') || essai.getContext('webgl'))) return;
    const lancer = () => import(new URL('objets3d.js?v=2', ICI_JS).href)
      .then(m => els.forEach(el => m.monter(el).then(ok => { if (ok) { el.classList.add('pret'); const h = el.closest('.hero'); if (h) h.classList.add('objet-actif'); } })))
      .catch(err => console.warn('Objets 3D indisponibles, images utilisées.', err));
    // au premier geste du visiteur (souris, défilement), sinon 2,5 s après le chargement
    let parti = false;
    const go = () => { if (parti) return; parti = true; ['pointermove', 'scroll', 'keydown'].forEach(e => removeEventListener(e, go)); (window.requestIdleCallback || (f => setTimeout(f, 50)))(lancer, { timeout: 800 }); };
    introPrete.then(() => {
      ['pointermove', 'scroll', 'keydown'].forEach(e => addEventListener(e, go, { passive: true, once: true }));
      const tard = () => setTimeout(go, 2500);
      if (doc.readyState === 'complete') tard(); else addEventListener('load', tard, { once: true });
    });
  })();

  /* ---------- 11 ter. Réalisations : inclinaison 3D au survol, image qui glisse au défilement ---------- */
  (function vivant(){
    if (reduit) return;
    const cartes = $$('.mosaique .pj, .cas-visuel');
    if (!cartes.length) return;
    if (fin) cartes.forEach(c => {
      const cadre = $('.cadre, .grand', c); if (!cadre) return;
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        cadre.style.transform = 'rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateZ(0)';
      });
      c.addEventListener('pointerleave', () => { cadre.style.transform = ''; });
    });
    const imgs = cartes.map(c => $('.cadre img, .grand img', c)).filter(Boolean);
    let attente = false;
    const maj = () => {
      attente = false; const h = innerHeight;
      imgs.forEach(im => { const r = im.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > h) return;
        const k = ((r.top + r.height / 2) - h / 2) / h; im.style.transform = 'scale(1.08) translate3d(0,' + (k * -28).toFixed(1) + 'px,0)'; });
    };
    addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true }); maj();
  })();

  /* ---------- 11 quater. Vidéo de fond de l'accueil : jamais en économie de données, en pause hors écran ---------- */
  (function videoFond(){
    const v = $('.hb-video'); if (!v) return;
    const eco = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
    if (reduit || eco) { v.removeAttribute('autoplay'); v.preload = 'none'; v.pause(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); })).observe(v);
  })();

  /* ---------- 12. Avant / après ---------- */
  (function avantApres(){
    const frame = $('#baFrame'), range = $('#baRange'); if (!frame || !range) return;
    const pose = v => frame.style.setProperty('--pos', v + '%');
    pose(range.value);
    range.addEventListener('input', () => pose(range.value));
    const placer = e => {
      const r = frame.getBoundingClientRect();
      const v = Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100));
      range.value = v; pose(v);
    };
    let glisse = false;
    frame.addEventListener('pointerdown', e => { glisse = true; try { frame.setPointerCapture(e.pointerId); } catch (_) {} placer(e); });
    frame.addEventListener('pointermove', e => { if (glisse || e.pointerType === 'mouse') placer(e); });
    const stop = e => { glisse = false; try { frame.releasePointerCapture(e.pointerId); } catch (_) {} };
    frame.addEventListener('pointerup', stop); frame.addEventListener('pointercancel', stop);
  })();

  /* ---------- 13. Simulateur de devis ----------
     Prix issus de entreprise/tarifs/grille-tarifaire.md, identiques au site en ligne.
     Un seul geste : le type de site donne une fourchette indicative, pas un devis. */
  (function simulateur(){
    const base = $('#simBase'); if (!base) return;
    const NS_TYPES = [
      { id: 'essentiel', nom: 'Essentiel', desc: "Une page, tout l'essentiel", min: 990, max: 1500 },
      { id: 'vitrine', nom: 'Vitrine', desc: '4 à 5 pages, galerie, services', min: 1990, max: 3500 },
      { id: 'pro', nom: 'Pro', desc: '8 à 10 pages, bilingue, SEO renforcé', min: 3290, max: 5000 },
      { id: 'boutique', nom: 'Boutique', desc: "Vente en ligne jusqu'à 50 produits", min: 3790, max: 6000 },
      { id: 'signature', nom: 'Signature', desc: 'Sur-mesure, haut de gamme, 3 langues', min: 5990, max: 9000 }
    ];
    const eur = n => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ');
    let type = 'vitrine', aff = null, raf = 0, filet = 0;
    const tot = $('#simTot'), detail = $('#simDetail'), cta = $('#simCta');
    const ecrire = (a, b) => { tot.textContent = eur(a) + ' – ' + eur(b) + ' €'; };
    function animer(min, max){
      const duree = 560;
      const finir = () => { cancelAnimationFrame(raf); clearTimeout(filet); aff = { min, max }; ecrire(min, max); };
      if (reduit || doc.hidden || !aff) { finir(); return; }
      const de = aff, t0 = performance.now();
      cancelAnimationFrame(raf); clearTimeout(filet);
      (function pas(t){
        const k = Math.min(1, (t - t0) / duree), e = 1 - Math.pow(1 - k, 3);
        const m = de.min + (min - de.min) * e, M = de.max + (max - de.max) * e;
        ecrire(m, M); aff = { min: m, max: M };
        if (k < 1) raf = requestAnimationFrame(pas); else finir();
      })(t0);
      filet = setTimeout(finir, duree + 140);       // onglet masqué : on finit toujours sur la bonne valeur
    }
    function calculer(){
      const t = NS_TYPES.find(x => x.id === type);
      animer(t.min, t.max);
      detail.textContent = t.desc;
      cta.dataset.resume = 'Type de site : ' + t.nom + ' (estimation ' + eur(t.min) + ' – ' + eur(t.max) + ' € HT).';
      retraduire();
    }
    function rendre(){
      base.innerHTML = NS_TYPES.map(o =>
        '<label class="sim-o' + (o.id === type ? ' on' : '') + '" data-id="' + o.id + '">'
        + '<input type="radio" name="sim-base" value="' + o.id + '"' + (o.id === type ? ' checked' : '') + '>'
        + '<span class="rond" aria-hidden="true"></span>'
        + '<span><b>' + o.nom + '</b><span class="desc">' + o.desc + '</span></span>'
        + '<i>' + eur(o.min) + ' – ' + eur(o.max) + ' €</i></label>').join('');
      $$('input', base).forEach(inp => inp.addEventListener('change', () => {
        type = inp.value;
        $$('.sim-o', base).forEach(l => l.classList.toggle('on', l.dataset.id === type));
        calculer();
      }));
      retraduire();
    }
    cta.addEventListener('click', () => {
      const m = $('#m');
      if (m && !m.value.trim()) m.value = "Bonjour, j'ai fait une estimation sur votre simulateur :\n\n" + cta.dataset.resume + "\n\nJ'aimerais un devis précis pour mon projet.";
    });
    rendre(); calculer();
  })();

  /* ---------- 14. Vérificateur de nom de domaine (DNS public de Google) ---------- */
  (function domaine(){
    const form = $('#domForm'); if (!form) return;
    const input = $('#domInput'), out = $('#domResults'), cta = $('#domCta');
    const EXTS = ['lu', 'com', 'be', 'fr', 'eu'];
    const LIB = { free: 'Disponible', taken: 'Déjà pris', checking: 'Vérification…', error: 'À confirmer' };
    const nettoyer = v => v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.(lu|com|be|fr|eu)$/, '')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 63);
    async function verifier(fqdn){
      const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 6000);
      try {
        const r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=NS', { signal: ctrl.signal });
        clearTimeout(to);
        if (!r.ok) return 'error';
        const j = await r.json();
        if (j.Status === 3) return 'free';
        if (j.Status === 0 && Array.isArray(j.Answer) && j.Answer.length) return 'taken';
        if (j.Status === 0) return 'free';
        return 'error';
      } catch (e) { clearTimeout(to); return 'error'; }
    }
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const b = nettoyer(input.value);
      if (!b) { input.focus(); return; }
      input.value = b;
      cta.classList.remove('on');
      out.innerHTML = '';
      const cartes = {};
      EXTS.forEach((ext, i) => {
        const el = doc.createElement('div');
        el.className = 'dom-res checking';
        el.style.animationDelay = (i * 60) + 'ms';
        el.innerHTML = '<span class="dn"><em>' + b + '</em>.' + ext + '</span><span class="ds">' + T(LIB.checking) + '</span>';
        out.appendChild(el); cartes[ext] = el;
      });
      let libre = 0;
      await Promise.all(EXTS.map(async ext => {
        const etat = await verifier(b + '.' + ext);
        cartes[ext].className = 'dom-res ' + etat;
        $('.ds', cartes[ext]).textContent = T(LIB[etat]);
        if (etat === 'free') libre++;
      }));
      if (libre) cta.classList.add('on');
    });
  })();

  /* ---------- 15. Formulaire de contact ----------
     Tant qu'aucun service de formulaire n'est branché (Formspree ou table Supabase,
     décision de Nelson), la demande s'ouvre dans la messagerie, déjà rédigée. */
  (function contact(){
    const f = $('#nsForm'); if (!f) return;
    const ok = $('#nsOk');
    const FORMSPREE = 'https://formspree.io/f/VOTRE_ID';
    const mailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    const telOk = v => !v.trim() || /^[+()\d\s.\-]{6,}$/.test(v.trim());
    const regles = [
      ['n', v => v.trim().length > 1, 'Indiquez votre nom.'],
      ['e', mailOk, 'Cette adresse e-mail ne semble pas complète.'],
      ['t', telOk, 'Ce numéro ne semble pas valide.'],
      ['ty', v => !!v, 'Choisissez un type de projet.'],
      ['m', v => v.trim().length > 4, 'Dites-nous en quelques mots ce dont vous avez besoin.']
    ];
    const verifierChamp = ([id, test, msg]) => {
      const el = $('#' + id), bloc = el.closest('.cf-f'), err = $('.msg-err', bloc);
      const bon = test(el.value);
      bloc.classList.toggle('err', !bon);
      el.setAttribute('aria-invalid', bon ? 'false' : 'true');
      err.textContent = bon ? '' : T(msg);
      return bon;
    };
    regles.forEach(r => $('#' + r[0]).addEventListener('blur', () => { if ($('#' + r[0]).value) verifierChamp(r); }));
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const resultats = regles.map(verifierChamp);
      const premier = regles.find((r, i) => !resultats[i]);
      if (premier) { $('#' + premier[0]).focus(); return; }
      if (FORMSPREE.indexOf('VOTRE_ID') !== -1) {
        const s = encodeURIComponent('Demande de devis — ' + f.type.value + ' — ' + f.nom.value);
        const b = encodeURIComponent('Nom : ' + f.nom.value + '\nEmail : ' + f.email.value + '\nTéléphone : ' + (f.tel.value || '—') + '\nType de projet : ' + f.type.value + '\n\nMessage :\n' + f.message.value + '\n');
        location.href = 'mailto:info@nsdevelopment.lu?subject=' + s + '&body=' + b;
        ok.textContent = T("✓ Merci ! Votre messagerie va s'ouvrir avec votre demande pré-remplie. Envoyez-la et on vous répond sous 24 h.");
        ok.classList.add('on');
        return;
      }
      fetch(FORMSPREE, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(r => { if (!r.ok) throw new Error(); f.reset(); ok.textContent = T('✓ Merci ! Votre demande a bien été envoyée, on vous répond sous 24 h ouvrées.'); ok.classList.add('on'); })
        .catch(() => { ok.textContent = T('Une erreur est survenue. Écrivez-nous directement à info@nsdevelopment.lu'); ok.classList.add('on'); });
    });
  })();
})();
