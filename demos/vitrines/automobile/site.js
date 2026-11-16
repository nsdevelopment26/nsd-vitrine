/* MOTORLINE — interface de la page (hors 3D).
   Tout est écrit à la main, sans librairie : menu, révélations, parallaxe,
   galerie filtrante, fiche véhicule, atelier et demande de devis.
   La voiture 3D et la porte vivent dans scene.js. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esp = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var html = document.documentElement;
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  if (/[?&]voies/.test(location.search)) html.classList.add('debug-voies');

  /* ------------------------------------------------ fin de l'intro
     scene.js annonce la fin de la porte. Sans 3D (pas de WebGL, CDN
     injoignable), on ne laisse jamais le visiteur devant un écran noir. */
  function pret() { html.classList.add('pret'); }
  document.addEventListener('ml:intro-fin', pret);
  if (!html.classList.contains('en-intro')) setTimeout(pret, 120);
  var sceneOk = false;
  document.addEventListener('ml:scene-ok', function () { sceneOk = true; });
  function sans3d() {
    if (sceneOk) return;
    html.classList.remove('en-intro');
    html.classList.add('sans-3d');
    pret();
  }
  document.addEventListener('ml:scene-ko', sans3d);
  setTimeout(sans3d, 7000);

  /* ------------------------------------------------------------ nav */
  var nav = $('#nav');
  var liens = $$('.nav-liens a');

  /* ----------------------------------------------------------- menu */
  var hamb = $('#hamb'), menu = $('#menu'), menuMinuteur;
  function ouvrirMenu() {
    clearTimeout(menuMinuteur);
    menu.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('ouvert'); }); });
    hamb.setAttribute('aria-expanded', 'true'); hamb.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var n = $('.menu-in', menu); n.tabIndex = -1; n.focus({ preventScroll: true }); }, 300);
  }
  function fermerMenu(rendreFocus) {
    if (menu.hidden) return;
    menu.classList.remove('ouvert');
    hamb.setAttribute('aria-expanded', 'false'); hamb.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
    menuMinuteur = setTimeout(function () { menu.hidden = true; }, calme ? 0 : 650);
    if (rendreFocus) hamb.focus();
  }
  hamb.addEventListener('click', function () { menu.hidden ? ouvrirMenu() : fermerMenu(true); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(false); });

  /* --------------------------------------- titres découpés en mots */
  $$('[data-mots]').forEach(function (h) {
    var mots = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = mots.map(function (m, i) {
      return '<span class="m" aria-hidden="true"><span style="transition-delay:' + (i * 70) + 'ms">' + m + '</span></span>';
    }).join(' ');
  });

  /* -------------------------------------------------- révélations */
  var compteurs = [];
  var vigie = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('vu');
      if (el.hasAttribute('data-compte')) compter(el);
      $$('[data-compte]', el).forEach(compter);
      vigie.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('[data-mots],[data-revele],[data-apparait],.av,.g-num,.g-mini').forEach(function (el) { vigie.observe(el); });

  function compter(el) {
    if (el._compte) return; el._compte = true;
    var fin = +el.getAttribute('data-compte');
    if (calme) { el.textContent = esp(fin); return; }
    var t0 = performance.now(), d = 1800 + Math.min(fin, 2000) * 0.2;
    (function pas(t) {
      var k = clamp((t - t0) / d, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = esp(Math.round(fin * e));
      if (k < 1) requestAnimationFrame(pas);
    })(t0);
  }
  /* les compteurs démarrent à zéro seulement quand le JS tourne : sans JS,
     le HTML affiche déjà la bonne valeur. */
  $$('[data-compte]').forEach(function (el) { if (!calme) el.textContent = '0'; });

  /* --------------------------------------- défilement : un seul rAF */
  var defile = $('[data-defile]'), paras = $$('[data-para]'), exp = $('#experience'), expColle = $('.exp-colle'),
      expLi = $$('.exp-temps li'), garage = $('[data-ouvre]'), indice = $('.hero-indice'), sections = $$('main section[id]');
  var vh = innerHeight, aFaire = true;
  addEventListener('resize', function () { vh = innerHeight; aFaire = true; }, { passive: true });
  addEventListener('scroll', function () { aFaire = true; }, { passive: true });

  function boucle() {
    if (aFaire) { aFaire = false; majDefilement(); }
    requestAnimationFrame(boucle);
  }
  function majDefilement() {
    var y = scrollY;
    nav.classList.toggle('solide', y > 40);
    if (indice && y > 30) indice.classList.add('parti');

    /* rubrique courante */
    var ici = null;
    sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < vh * 0.4 && r.bottom > vh * 0.4) ici = s.id; });
    liens.forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + ici); });

    if (calme) return;

    if (defile) {
      var r = defile.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) defile.style.transform = 'translate3d(' + ((r.top - vh) * +defile.dataset.defile) + 'px,0,0)';
    }
    paras.forEach(function (img) {
      var f = img.parentNode.getBoundingClientRect();
      if (f.bottom < -50 || f.top > vh + 50) return;
      var q = clamp((f.top + f.height / 2 - vh / 2) / (vh / 2 + f.height / 2), -1, 1);
      img.style.translate = '0 ' + ((-0.5 + q * 0.5) * (img.offsetHeight - f.height)).toFixed(1) + 'px';
    });
    if (exp) {
      var re = exp.getBoundingClientRect();
      if (re.top < vh && re.bottom > 0) {
        var p = clamp(-re.top / (re.height - vh), 0, 1);
        expColle.style.setProperty('--p', p.toFixed(4));
        expLi.forEach(function (li, i) { li.classList.toggle('vu', p > 0.26 + i * 0.18); });
      }
    }
    if (garage) {
      var rg = garage.getBoundingClientRect();
      if (rg.top < vh && rg.bottom > 0) garage.style.setProperty('--o', clamp((vh - rg.top) / (vh * 0.95), 0, 1).toFixed(4));
    }
  }
  if (calme) { expLi.forEach(function (li) { li.classList.add('vu'); }); if (garage) garage.style.setProperty('--o', 1); }
  requestAnimationFrame(boucle);

  /* ------------------------------------------------------ galerie */
  var grille = $('#grille'), autos = $$('.auto', grille), vide = $('#vide');
  var etat = { seg: '', carb: '', boite: '', bud: null };
  var compte = $('#compte'), tri = $('#tri'), segs = $$('#segs .seg'),
      fCarb = $('#f-carb'), fBoite = $('#f-boite'), fBud = $('#f-bud');
  var MOTIF = ['t-xl', 't-l', 't-m decale', 't-m', 't-l'];

  function budget(v) { if (!v) return null; var p = v.split('-'); return [+p[0], +p[1]]; }
  function correspond(a) {
    var d = a.dataset;
    return (!etat.seg || d.seg === etat.seg) && (!etat.carb || d.carb === etat.carb) &&
      (!etat.boite || d.boite === etat.boite) && (!etat.bud || (+d.prix > etat.bud[0] && +d.prix <= etat.bud[1]));
  }
  function trier() {
    var m = tri.value;
    autos.slice().sort(function (a, b) {
      var A = a.dataset, B = b.dataset;
      if (m === 'prix-asc') return A.prix - B.prix;
      if (m === 'prix-desc') return B.prix - A.prix;
      if (m === 'km') return A.km - B.km;
      if (m === 'ch') return B.ch - A.ch;
      return B.an - A.an || A.km - B.km;
    }).forEach(function (a) { grille.insertBefore(a, vide); });
  }
  /* la composition suit le rang parmi les véhicules visibles : un filtre
     ne laisse jamais une pièce large toute seule sur sa ligne */
  function composer() {
    var vis = autos.filter(function (a) { return !a.classList.contains('hide'); });
    vis.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    vis.forEach(function (a, i) {
      a.classList.remove('t-xl', 't-l', 't-m', 'decale');
      var t = MOTIF[i % MOTIF.length];
      if (i === vis.length - 1 && (i % MOTIF.length === 1 || i % MOTIF.length === 3)) t = 't-xl';
      t.split(' ').forEach(function (c) { a.classList.add(c); });
      var n = $('.auto-n', a); if (n) n.textContent = (i < 9 ? '0' : '') + (i + 1);
    });
  }
  function rendre(anime) {
    var n = 0;
    autos.forEach(function (a) { var ok = correspond(a); a.classList.toggle('hide', !ok); if (ok) n++; });
    vide.hidden = n > 0;
    compte.innerHTML = n === 0 ? 'Aucun véhicule pour cette recherche'
      : '<b>' + n + '</b> véhicule' + (n > 1 ? 's' : '') + (n < autos.length ? ' sur ' + autos.length : '') + ' en stock aujourd’hui';
    trier(); composer();
    if (anime && !calme) {
      autos.forEach(function (a, i) {
        if (a.classList.contains('hide')) return;
        a.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: Math.min(i, 6) * 60, easing: 'cubic-bezier(.16,.84,.24,1)', fill: 'backwards' });
      });
    }
    document.dispatchEvent(new CustomEvent('ml:mise-en-page'));
  }
  segs.forEach(function (s) {
    s.addEventListener('click', function () {
      etat.seg = s.dataset.s;
      segs.forEach(function (x) { var on = x === s; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      rendre(true);
    });
  });
  [fCarb, fBoite, fBud].forEach(function (f) {
    f.addEventListener('change', function () {
      etat.carb = fCarb.value; etat.boite = fBoite.value; etat.bud = budget(fBud.value); rendre(true);
    });
  });
  tri.addEventListener('change', function () { rendre(true); });
  $('#cherche').addEventListener('submit', function (e) { e.preventDefault(); });
  rendre(false);

  /* ---------------------------------------------- fenêtres modales */
  var dernier = null;
  function piege(e, boite) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),select', boite).filter(function (x) { return x.offsetParent; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function bloquer(b) { document.body.style.overflow = b ? 'hidden' : ''; document.dispatchEvent(new CustomEvent('ml:modale', { detail: b })); }

  /* ------------------------------------------------- fiche véhicule */
  var fiche = $('#fiche'), fX = $('.fiche-x', fiche);
  function ouvrirFiche(id, depuis) {
    var a = $('#' + id); if (!a) return;
    var d = JSON.parse(a.dataset.fiche);
    var img = $('#fiche-img');
    img.src = d.photo; img.alt = d.alt;
    $('#fiche-kick').textContent = d.an + ' · ' + d.carb + ' · ' + d.boite;
    $('#fiche-titre').textContent = d.titre;
    $('#fiche-prix').textContent = esp(d.prix) + ' €';
    $('#fiche-mens').textContent = 'ou ' + esp(d.mens) + ' €/mois · 60 mois, 20 % d’apport, simulation indicative';
    $('#fiche-note').textContent = d.note;
    $('#fiche-grille').innerHTML = [
      ['Mise en circulation', d.an], ['Kilométrage', esp(d.km) + ' km'], ['Énergie', d.carb], ['Boîte', d.boite],
      ['Puissance', d.ch + ' ch'], ['Carrosserie', d.portes + ' portes · ' + d.places + ' places'], ['Couleur', d.coul],
      ['Consommation', d.conso], ['CO₂', d.co2], ['Historique', d.mains], ['Contrôle technique', d.ct],
      ['Garantie', '24 mois pièces et main-d’œuvre']
    ].map(function (l) { return '<div><dt>' + l[0] + '</dt><dd>' + l[1] + '</dd></div>'; }).join('');
    $('#fiche-equip').innerHTML = d.equip.split(' · ').map(function (e) { return '<b>' + e + '</b>'; }).join('');
    dernier = document.activeElement;
    fiche.hidden = false;
    $('.fiche-in', fiche).scrollTop = 0;
    bloquer(true);
    fX.focus({ preventScroll: true });
    /* la photo de la carte s'envole jusqu'à sa place dans la fiche */
    var src = depuis && $('img', depuis);
    if (src && !calme) {
      var r0 = src.getBoundingClientRect(), r1 = $('.fiche-ph', fiche).getBoundingClientRect();
      if (r0.width && r1.width) {
        var v = document.createElement('img');
        v.src = src.currentSrc || src.src; v.className = 'fiche-vole'; v.alt = '';
        v.style.cssText = 'left:' + r0.left + 'px;top:' + r0.top + 'px;width:' + r0.width + 'px;height:' + r0.height + 'px';
        document.body.appendChild(v);
        img.style.opacity = 0;
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          v.style.cssText = 'left:' + r1.left + 'px;top:' + r1.top + 'px;width:' + r1.width + 'px;height:' + r1.height + 'px';
        }); });
        setTimeout(function () { img.style.opacity = ''; v.remove(); }, 780);
      }
    }
  }
  function fermerFiche() {
    if (fiche.hidden) return;
    fiche.hidden = true;
    if (recap.hidden) bloquer(false);
    if (dernier && dernier.focus) dernier.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-voir]');
    if (b) { e.preventDefault(); ouvrirFiche(b.dataset.voir, b.closest('.auto')); }
  });
  fiche.addEventListener('click', function (e) { if (e.target.closest('[data-fermer]')) fermerFiche(); });
  fiche.addEventListener('keydown', function (e) { piege(e, fiche); });

  /* ----------------------------------------------- atelier : onglets */
  var onglets = $$('.ong');
  function activer(o, focus) {
    onglets.forEach(function (x) { var on = x === o; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    $$('.panneau').forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + o.dataset.ong); });
    if (focus) o.focus();
    if (innerWidth <= 1100) o.scrollIntoView({ block: 'nearest', inline: 'center', behavior: calme ? 'auto' : 'smooth' });
  }
  onglets.forEach(function (o, i) {
    o.addEventListener('click', function () { activer(o, false); });
    o.addEventListener('keydown', function (e) {
      var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      activer(onglets[(i + k + onglets.length) % onglets.length], true);
    });
  });

  /* ------------------------------------- atelier : demande de devis */
  var panier = $('#panier'), recap = $('#recap'), choisies = [];
  function fourchette() {
    var bas = choisies.reduce(function (s, p) { return s + p.prix; }, 0);
    if (!bas) return 'à confirmer';
    return esp(bas) + ' – ' + esp(Math.round(bas * 1.35 / 10) * 10) + ' €';
  }
  function majPanier() {
    var n = choisies.length;
    panier.classList.toggle('on', n > 0);
    $('#panier-n').innerHTML = '<b>' + n + '</b> prestation' + (n > 1 ? 's' : '') + ' sélectionnée' + (n > 1 ? 's' : '');
    $('#panier-est').textContent = fourchette();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.presta'); if (!b) return;
    var nom = b.dataset.nom, prix = +b.dataset.prix;
    var i = choisies.findIndex(function (p) { return p.nom === nom; });
    if (i > -1) choisies.splice(i, 1); else choisies.push({ nom: nom, prix: prix });
    b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0);
    majPanier();
  });
  $('#panier-vider').addEventListener('click', function () {
    choisies = [];
    $$('.presta.on').forEach(function (p) { p.classList.remove('on'); p.setAttribute('aria-pressed', 'false'); });
    majPanier();
  });
  function ouvrirRecap() {
    if (!choisies.length) return;
    $('#recap-liste').innerHTML = choisies.map(function (p) {
      return '<li><span>' + p.nom + '</span><b>' + (p.prix === 0 ? 'Offert' : 'dès ' + esp(p.prix) + ' €') + '</b></li>';
    }).join('');
    $('#recap-total').textContent = fourchette();
    dernier = document.activeElement;
    recap.hidden = false; bloquer(true);
    $('.fiche-x', recap).focus({ preventScroll: true });
  }
  function fermerRecap() {
    if (recap.hidden) return;
    recap.hidden = true;
    if (fiche.hidden) bloquer(false);
    if (dernier && dernier.focus) dernier.focus({ preventScroll: true });
  }
  $('#panier-devis').addEventListener('click', ouvrirRecap);
  recap.addEventListener('click', function (e) { if (e.target.closest('[data-fermer-recap]')) fermerRecap(); });
  recap.addEventListener('keydown', function (e) { piege(e, recap); });
  $('#recap-copier').addEventListener('click', function () {
    var bouton = this;
    var texte = 'Demande d’atelier — MOTORLINE\n\n' + choisies.map(function (p) {
      return '· ' + p.nom + (p.prix === 0 ? ' (offert)' : ' — dès ' + esp(p.prix) + ' €');
    }).join('\n') + '\n\nEstimation : ' + fourchette();
    var fini = function () { bouton.textContent = 'Liste copiée'; setTimeout(function () { bouton.textContent = 'Copier la liste'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fini, fini);
    else fini();
  });

  /* ---------------------------------------------------------- clavier */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!recap.hidden) { fermerRecap(); return; }
    if (!fiche.hidden) { fermerFiche(); return; }
    if (!menu.hidden) fermerMenu(true);
  });
})();
