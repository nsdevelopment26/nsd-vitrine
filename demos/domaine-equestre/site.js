/* ============================================================================
   Domaine de Valombre : tout ce qui n'est pas la 3D.
   Ouverture, barre et menu, lieux du relief, journée au défilement, planning,
   balades, pensions, chevaux, réservation, horaires.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.VALOMBRE;
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var emit = function (n, d) { document.dispatchEvent(new CustomEvent(n, { detail: d })); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var stock = {
    lire: function (k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } },
    ecrire: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var JOURS = D.joursNoms;
  var Jour = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var hTexte = function (h) { var p = h.split(':'); return +p[0] + ' h' + (p[1] !== '00' ? ' ' + p[1] : ''); };
  var euros = function (n) { return n.toLocaleString('fr-FR') + ' €'; };
  var toastT;
  function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('vu'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('vu'); }, 3200); }

  /* ---------- ouverture ---------- */
  var intro = $('#intro');
  function finIntro() {
    if (!doc.classList.contains('en-intro')) return;
    doc.classList.add('intro-sort');
    try { sessionStorage.setItem('valombre-intro', '1'); } catch (e) {}
    setTimeout(function () { doc.classList.remove('en-intro', 'intro-sort'); }, 900);
  }
  function passer() { if (!doc.classList.contains('en-intro')) return; emit('valombre:passer'); finIntro(); }
  document.addEventListener('valombre:intro-fin', finIntro);
  if (doc.classList.contains('en-intro')) {
    $('#intro-passer').addEventListener('click', passer);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') passer(); });
    addEventListener('wheel', passer, { passive: true, once: true });
    addEventListener('touchmove', passer, { passive: true, once: true });
    setTimeout(finIntro, 8000); // filet si la 3D ne répond pas
  }

  /* ---------- barre et menu ---------- */
  var barre = $('#barre'), burger = $('#burger'), menu = $('#menu');
  function majBarre() { barre.classList.toggle('pleine', scrollY > 40); }
  addEventListener('scroll', majBarre, { passive: true }); majBarre();
  function menuOuvert(o) {
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !o; doc.classList.toggle('menu-ouvert', o);
    if (o) $('a', menu).focus();
  }
  burger.addEventListener('click', function () { menuOuvert(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menuOuvert(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { menuOuvert(false); burger.focus(); } });

  /* ---------- les lieux du relief ---------- */
  var LIEUX = {}; D.lieux.forEach(function (l) { LIEUX[l.id] = l; });
  var index = $('#index-lieux');
  D.lieux.forEach(function (l, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" data-lieu="' + l.id + '"><span class="n">' + (i + 1) + '</span><b>' + esc(l.nom) + '</b><small>' + esc(l.offre) + '</small></button>';
    index.appendChild(li);
  });
  $$('button', index).forEach(function (b) { b.addEventListener('click', function () { ouvrirLieu(b.dataset.lieu, true); }); });

  var fiche = $('#fiche'), accueil = $('#volet-accueil'), lieuOuvert = null;
  var fBal = $('#f-balades');
  D.balades.forEach(function (b) {
    var bt = document.createElement('button');
    bt.type = 'button'; bt.dataset.boucle = b.id; bt.setAttribute('aria-pressed', 'false');
    bt.innerHTML = '<b>' + esc(b.nom) + '</b><small>' + esc(b.duree) + ' · ' + b.km + ' km</small>';
    bt.addEventListener('click', function () { choisirBoucle(b.id); });
    fBal.appendChild(bt);
  });
  function choisirBoucle(id) {
    $$('button', fBal).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.boucle === id ? 'true' : 'false'); });
    emit('valombre:balade', { id: id });
    var b = D.balades.filter(function (x) { return x.id === id; })[0];
    if (b) { $('#f-texte').textContent = b.texte; var a = $('#f-action'); a.textContent = 'Réserver ' + b.nom; a.dataset.boucle = id; }
  }
  function ouvrirLieu(id, focus) {
    var l = LIEUX[id]; if (!l) return;
    lieuOuvert = id;
    $('#f-offre').textContent = l.nom + ' · ' + l.offre;
    $('#f-titre').textContent = l.titre;
    $('#f-texte').textContent = l.texte;
    $('#f-faits').innerHTML = l.faits.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var a = $('#f-action'); a.textContent = l.action; a.setAttribute('href', l.cible); delete a.dataset.boucle;
    a.dataset.activite = l.activite || '';
    fBal.hidden = id !== 'foret';
    accueil.hidden = true; fiche.hidden = false;
    $$('button', index).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lieu === id ? 'true' : 'false'); });
    emit('valombre:lieu', { id: id });
    if (id === 'foret') choisirBoucle('hetraie');
    if (focus) fiche.focus({ preventScroll: true });
    if (focus && !matchMedia('(min-width: 980px)').matches && !doc.classList.contains('sans-3d')) {
      var v = $('#vue'), top = v.getBoundingClientRect().top + scrollY - 64;
      if (Math.abs(scrollY - top) > 40) scrollTo({ top: top, behavior: calme ? 'auto' : 'smooth' });
    }
  }
  function fermerLieu() {
    lieuOuvert = null; fiche.hidden = true; accueil.hidden = false;
    emit('valombre:lieu', { id: null }); emit('valombre:balade', { id: null });
  }
  $('#fiche-retour').addEventListener('click', function () { fermerLieu(); var b = $('button', index); if (b) b.focus({ preventScroll: true }); });
  fiche.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerLieu(); });
  document.addEventListener('valombre:choix', function (e) { ouvrirLieu(e.detail.id, false); });
  $('#f-action').addEventListener('click', function (e) {
    var a = e.currentTarget;
    if (a.dataset.boucle) { e.preventDefault(); reserver({ act: 'balade', boucle: a.dataset.boucle }); }
    else if (a.dataset.activite) { e.preventDefault(); reserver({ act: a.dataset.activite }); }
  });

  /* ---------- l'heure ---------- */
  var heure = $('#heure'), heureVal = $('#heure-val');
  function hLisible(v) { var h = Math.floor(v), m = Math.round((v - h) * 60); return h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }
  heure.addEventListener('input', function () { heureVal.textContent = hLisible(+heure.value); emit('valombre:heure', { h: +heure.value }); });

  /* ---------- une journée au domaine ---------- */
  var cartes = $('#journee-cartes');
  D.journee.forEach(function (c) {
    var li = document.createElement('li');
    li.innerHTML = '<img src="photos/' + c.photo + '-m.webp" alt="" loading="lazy" width="900" height="560"><p class="jc-heure">' + c.heure + '</p><h3>' + esc(c.titre) + '</h3><p>' + esc(c.texte) + '</p>';
    cartes.appendChild(li);
  });
  var scn = $('#domaine'), jt = $('#journee-texte'), jPts = $('#j-points');
  D.journee.forEach(function () { jPts.appendChild(document.createElement('i')); });
  var grand = matchMedia('(min-width: 980px)');
  var chap = -2;
  function journeePossible() { return grand.matches && !calme && !doc.classList.contains('sans-3d'); }
  function majModeJournee() { doc.classList.toggle('avec-journee', journeePossible()); majJournee(); }
  function majJournee() {
    if (!doc.classList.contains('avec-journee')) { if (chap !== -2) { chap = -2; emit('valombre:journee', { actif: false }); doc.classList.remove('en-journee'); } return; }
    var vh = innerHeight, y = scrollY - scn.offsetTop;
    var c = y < vh * 0.45 ? -1 : Math.min(D.journee.length - 1, Math.floor((y - vh * 0.45) / (vh * 0.75)));
    if (y > scn.offsetHeight - vh * 0.6) c = -1;
    if (c === chap) return;
    chap = c;
    if (c < 0) { doc.classList.remove('en-journee'); emit('valombre:journee', { actif: false }); emit('valombre:heure', { h: +heure.value }); return; }
    var d = D.journee[c];
    doc.classList.add('en-journee');
    jt.classList.remove('vu'); void jt.offsetWidth; jt.classList.add('vu');
    $('#j-heure').textContent = d.heure; $('#j-titre').textContent = d.titre; $('#j-texte').textContent = d.texte;
    $$('i', jPts).forEach(function (i, k) { i.classList.toggle('on', k === c); });
    emit('valombre:journee', { actif: true, h: d.h, lieu: d.lieu, az: c % 2 ? 0.3 : -0.2 });
  }
  addEventListener('scroll', majJournee, { passive: true });
  grand.addEventListener('change', majModeJournee);
  document.addEventListener('valombre:pret', majModeJournee);
  majModeJournee();

  /* ---------- cours ---------- */
  var filtreN = 'tous', filtreT = 'tous';
  function puces(box, items, onChoix) {
    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = it[1]; b.dataset.v = it[0]; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { $$('button', box).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); onChoix(it[0]); });
      box.appendChild(b);
    });
  }
  puces($('#filtres-niveau'), [['tous', 'Tous niveaux']].concat(D.niveaux.map(function (n) { return [n.id, n.nom.split(',')[0]]; })), function (v) { filtreN = v; planning(); });
  puces($('#filtres-type'), [['tous', 'Toutes formules'], ['collectif', 'Collectif'], ['particulier', 'Particulier'], ['poney', 'Poneys']], function (v) { filtreT = v; planning(); });
  var ORDRE = [2, 3, 4, 5, 6, 0];
  function niveauNom(id) { if (id === 'tous') return 'Tous niveaux'; var n = D.niveaux.filter(function (x) { return x.id === id; })[0]; return n ? n.nom.split(',')[0] : id; }
  function planning() {
    var box = $('#planning'), total = 0;
    box.innerHTML = '';
    ORDRE.forEach(function (j) {
      var liste = D.cours.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) {
        var c = o.c; return c.jour === j && (filtreN === 'tous' || c.niveau === filtreN || c.niveau === 'tous') && (filtreT === 'tous' || c.type === filtreT);
      });
      var col = document.createElement('div'); col.className = 'jour';
      col.innerHTML = '<h3>' + Jour(JOURS[j]) + '</h3>';
      if (!liste.length) col.classList.add('jour-vide');
      liste.forEach(function (o) {
        var c = o.c, reste = c.places - c.prises; total++;
        var el = document.createElement('article'); el.className = 'reprise' + (reste <= 0 ? ' complet' : '');
        el.innerHTML = '<p class="r-h">' + hTexte(c.h) + ' <span>' + c.duree + ' min</span></p><h4>' + esc(c.titre) + '</h4>' +
          '<p class="r-m">' + esc(c.lieu) + ' · ' + D.coursTypes[c.type] + ' · ' + niveauNom(c.niveau) + '</p>' +
          '<p class="r-pl">' + (reste <= 0 ? 'Complet' : reste === 1 ? '1 place' : reste + ' places') + '</p>' +
          (reste > 0 ? '<button type="button" class="lien" data-cours="' + o.i + '">Réserver<span class="sr"> ' + esc(c.titre) + ', ' + JOURS[j] + ' ' + hTexte(c.h) + '</span></button>' : '');
        col.appendChild(el);
      });
      box.appendChild(col);
    });
    $('#planning-vide').hidden = total > 0;
    $$('[data-cours]', box).forEach(function (b) { b.addEventListener('click', function () { reserver({ act: 'cours', cours: +b.dataset.cours }); }); });
  }
  $('#planning-tout').addEventListener('click', function () {
    filtreN = filtreT = 'tous';
    $$('.filtres button').forEach(function (b) { if (b.closest('#filtres-chevaux')) return; b.setAttribute('aria-pressed', b.dataset.v === 'tous' ? 'true' : 'false'); });
    planning();
  });
  planning();

  /* ---------- balades ---------- */
  var boucles = $('#boucles');
  D.balades.forEach(function (b) {
    var li = document.createElement('li');
    li.innerHTML = '<div class="b-tete"><h3>' + esc(b.nom) + '</h3><p class="b-prix">' + euros(b.prix) + '<small> par cavalier</small></p></div>' +
      '<p class="b-meta">' + esc(b.duree) + ' · ' + b.km + ' km · ' + esc(b.niveauTexte) + '</p><p>' + esc(b.texte) + '</p>' +
      '<div class="b-actions"><button type="button" class="selle selle-petit" data-res="' + b.id + '">Réserver</button>' +
      '<button type="button" class="lien" data-voir="' + b.id + '">Voir le tracé sur le domaine</button></div>';
    boucles.appendChild(li);
  });
  $$('[data-res]', boucles).forEach(function (bt) { bt.addEventListener('click', function () { reserver({ act: 'balade', boucle: bt.dataset.res }); }); });
  $$('[data-voir]', boucles).forEach(function (bt) {
    bt.addEventListener('click', function () {
      scrollTo({ top: 0, behavior: calme ? 'auto' : 'smooth' });
      ouvrirLieu('foret', false);
      choisirBoucle(bt.dataset.voir);
      setTimeout(function () { fiche.focus({ preventScroll: true }); }, calme ? 0 : 700);
    });
  });
  if (doc.classList.contains('sans-3d')) $$('[data-voir]', boucles).forEach(function (b) { b.hidden = true; });

  /* ---------- pensions ---------- */
  var formules = $('#formules'), formule = 'box';
  D.pensions.forEach(function (p) {
    var l = document.createElement('label');
    l.innerHTML = '<input type="radio" name="formule" value="' + p.id + '"' + (p.id === formule ? ' checked' : '') + '>' +
      '<span class="f-carte"><b>' + esc(p.nom) + '</b><span class="f-prix">' + euros(p.prix) + '<small> par mois</small></span><span class="f-pour">' + esc(p.pour) + '</span>' +
      '<ul>' + p.inclus.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></span>';
    formules.appendChild(l);
  });
  var opts = $('#options');
  D.pensionOptions.forEach(function (o) {
    var l = document.createElement('label'); l.className = 'opt';
    l.innerHTML = '<input type="checkbox" name="opt" value="' + o.id + '"><span>' + esc(o.nom) + '</span><b>+' + euros(o.prix) + '</b>';
    opts.appendChild(l);
  });
  function estimer() {
    var f = $('input[name=formule]:checked', formules).value; formule = f;
    var p = D.pensions.filter(function (x) { return x.id === f; })[0].prix;
    $$('input[name=opt]:checked', opts).forEach(function (c) { p += D.pensionOptions.filter(function (o) { return o.id === c.value; })[0].prix; });
    $('#estim').textContent = euros(p);
    return p;
  }
  formules.addEventListener('change', estimer); opts.addEventListener('change', estimer); estimer();
  (function () { var d = new Date(); d.setMonth(d.getMonth() + 1); $('#p-arrivee').min = d.toISOString().slice(0, 7); })();

  function verifier(champs, err) {
    for (var i = 0; i < champs.length; i++) {
      var c = champs[i], v = c.value.trim(), ok = !!v;
      if (ok && c.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (ok && c.type === 'tel') ok = v.replace(/\D/g, '').length >= 8;
      c.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) {
        var nom = $('label[for="' + c.id + '"]').childNodes[0].textContent.trim();
        err.textContent = (v ? 'Vérifiez le champ « ' : 'Il manque le champ « ') + nom + ' ».';
        c.focus(); return false;
      }
    }
    err.textContent = ''; return true;
  }
  function refDu(pref) {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return pref + '-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  $('#pension-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.currentTarget;
    if (!verifier($$('input[required]', f), $('#p-erreur'))) return;
    var ref = refDu('VLP');
    var liste = stock.lire('valombre-pensions');
    liste.push({ ref: ref, formule: formule, estimation: estimer(), cheval: $('#p-cheval').value.trim(), discipline: $('#p-discipline').value, arrivee: $('#p-arrivee').value, nom: $('#p-nom').value.trim(), tel: $('#p-tel').value.trim(), mail: $('#p-mail').value.trim(), le: new Date().toISOString() });
    stock.ecrire('valombre-pensions', liste);
    var s = $('#p-succes');
    s.hidden = false;
    s.textContent = 'Demande ' + ref + ' enregistrée pour ' + $('#p-cheval').value.trim() + '. La responsable d’écurie vous rappelle pour fixer la visite.';
    f.reset(); estimer();
  });

  /* ---------- chevaux ---------- */
  var ecurie = $('#ecurie');
  D.chevaux.forEach(function (c) {
    var li = document.createElement('li');
    li.dataset.taille = c.taille; li.dataset.niveaux = c.niveaux.join(' ');
    li.innerHTML = '<figure><img src="photos/' + c.photo + '.webp" alt="Portrait de ' + esc(c.nom) + ', ' + esc(c.robe.toLowerCase()) + '" loading="lazy" width="640" height="800"></figure>' +
      '<h3>' + esc(c.nom) + '</h3><p class="c-robe">' + esc(c.robe) + '</p><p>' + esc(c.caractere) + '</p>' +
      '<p class="c-niv">' + c.niveaux.map(niveauNom).join(' · ') + '</p>';
    ecurie.appendChild(li);
  });
  puces($('#filtres-chevaux'), [['tous', 'Tous'], ['poney', 'Poneys'], ['debut', 'Pour débuter'], ['g5', 'Confirmés']], function (v) {
    var n = 0;
    $$('li', ecurie).forEach(function (li) {
      var nv = li.dataset.niveaux.split(' ');
      var ok = v === 'tous' || (v === 'poney' && li.dataset.taille === 'poney') || (v === 'debut' && (nv.indexOf('debutant') > -1 || nv.indexOf('decouverte') > -1)) || (v === 'g5' && nv.indexOf('g5') > -1);
      li.hidden = !ok; if (ok) n++;
    });
    $('#ecurie-vide').hidden = n > 0;
  });

  /* ---------- réservation ---------- */
  var form = $('#resa'), pas = 1;
  var R = { act: 'cours', cours: null, boucle: 'hetraie', date: null, heure: null };
  var selCours = $('#r-cours'), selBoucle = $('#r-boucle'), selNiv = $('#r-niveau');
  D.cours.forEach(function (c, i) {
    var o = document.createElement('option'); o.value = i;
    var plein = c.prises >= c.places;
    o.textContent = Jour(JOURS[c.jour]) + ' ' + hTexte(c.h) + ' · ' + c.titre + (plein ? ' (complet)' : '');
    o.disabled = plein; selCours.appendChild(o);
  });
  selCours.value = String(D.cours.findIndex(function (c) { return c.prises < c.places; }));
  D.balades.forEach(function (b) { var o = document.createElement('option'); o.value = b.id; o.textContent = b.nom + ' · ' + b.duree + ' · ' + euros(b.prix); selBoucle.appendChild(o); });
  D.niveaux.forEach(function (n) { var o = document.createElement('option'); o.value = n.id; o.textContent = n.nom; selNiv.appendChild(o); });
  selNiv.value = 'debutant';
  var RANG = { decouverte: 0, debutant: 1, g1: 2, g3: 3, g5: 4 };

  function majAct() {
    R.act = $('input[name=act]:checked', form).value;
    $('#r-cours-bloc').hidden = R.act !== 'cours';
    $('#r-boucle-bloc').hidden = R.act !== 'balade';
    $('#r-nb-bloc').hidden = R.act !== 'balade';
    $('#r-niveau-bloc').hidden = R.act === 'visite';
    R.date = R.heure = null;
  }
  $$('input[name=act]', form).forEach(function (r) { r.addEventListener('change', majAct); });
  selCours.addEventListener('change', function () { R.date = R.heure = null; });
  selBoucle.addEventListener('change', function () { R.date = R.heure = null; });

  function pris(dIso, h) { var s = 0, k = dIso + h; for (var i = 0; i < k.length; i++) s = (s * 31 + k.charCodeAt(i)) % 997; return s % 5 === 0; }
  function isoJour(d) { var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function joursPossibles() {
    var res = [], d = new Date(); d.setHours(12, 0, 0, 0);
    for (var i = 1; i <= 24 && res.length < 8; i++) {
      var x = new Date(d); x.setDate(d.getDate() + i); var j = x.getDay();
      if (R.act === 'cours' && j !== D.cours[+selCours.value].jour) continue;
      if (R.act === 'balade' && D.baladeJours.indexOf(j) < 0) continue;
      if (R.act === 'visite' && (j < 2 || j > 6)) continue;
      res.push(x);
    }
    return res;
  }
  function heuresPossibles() {
    if (R.act === 'cours') return [D.cours[+selCours.value].h];
    if (R.act === 'balade') return D.balades.filter(function (b) { return b.id === selBoucle.value; })[0].depart;
    return D.visites;
  }
  function dessinerJours() {
    var box = $('#r-jours'); box.innerHTML = '';
    joursPossibles().forEach(function (x) {
      var iso = isoJour(x), b = document.createElement('button');
      b.type = 'button'; b.dataset.iso = iso; b.setAttribute('aria-pressed', R.date === iso ? 'true' : 'false');
      b.innerHTML = '<small>' + JOURS[x.getDay()].slice(0, 3) + '.</small><b>' + x.getDate() + '</b><small>' + x.toLocaleDateString('fr-FR', { month: 'short' }) + '</small>';
      b.setAttribute('aria-label', x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
      b.addEventListener('click', function () { R.date = iso; R.heure = null; dessinerJours(); });
      box.appendChild(b);
    });
    var hb = $('#r-creneaux'); hb.innerHTML = '';
    if (!R.date) { $('#r-aide-jour').textContent = 'Choisissez un jour.'; return; }
    heuresPossibles().forEach(function (h) {
      var b = document.createElement('button'), p = pris(R.date, h);
      b.type = 'button'; b.textContent = hTexte(h); b.disabled = p;
      if (p) b.setAttribute('aria-label', hTexte(h) + ', déjà pris');
      b.setAttribute('aria-pressed', R.heure === h ? 'true' : 'false');
      b.addEventListener('click', function () { R.heure = h; dessinerJours(); });
      hb.appendChild(b);
    });
    if (heuresPossibles().length === 1 && !pris(R.date, heuresPossibles()[0]) && !R.heure) { R.heure = heuresPossibles()[0]; $$('button', hb)[0].setAttribute('aria-pressed', 'true'); }
    $('#r-aide-jour').textContent = R.act === 'cours' ? 'La reprise a lieu chaque semaine à la même heure.' : 'Les créneaux barrés sont déjà pris.';
  }
  function alerteNiveau() {
    var al = $('#r-alerte'), n = RANG[selNiv.value], txt = '';
    if (R.act === 'balade') {
      var b = D.balades.filter(function (x) { return x.id === selBoucle.value; })[0];
      if (n < RANG[b.niveau]) txt = b.nom + ' demande le niveau « ' + b.niveauTexte + ' ». Pour une première fois, choisissez la Hêtraie.';
    } else if (R.act === 'cours') {
      var c = D.cours[+selCours.value];
      if (c.niveau !== 'tous' && c.niveau !== selNiv.value) txt = 'Cette reprise est prévue pour le niveau « ' + niveauNom(c.niveau) + ' ». L’enseignant vous confirmera le bon groupe.';
    }
    al.textContent = txt; al.hidden = !txt;
    return R.act === 'balade' && !!txt;
  }
  selNiv.addEventListener('change', alerteNiveau);

  function libelleAct() {
    if (R.act === 'cours') { var c = D.cours[+selCours.value]; return 'Cours d’essai · ' + c.titre + ' (' + c.lieu.toLowerCase() + ')'; }
    if (R.act === 'balade') { var b = D.balades.filter(function (x) { return x.id === selBoucle.value; })[0]; return 'Balade · ' + b.nom + ', ' + b.duree; }
    return 'Visite pour une pension';
  }
  function prix() {
    if (R.act === 'cours') return D.prixCours.essai;
    if (R.act === 'balade') return D.balades.filter(function (x) { return x.id === selBoucle.value; })[0].prix * +$('#r-nb').value;
    return 0;
  }
  function dateLisible() { var p = R.date.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + hTexte(R.heure); }
  function recap() {
    var lignes = [['Activité', libelleAct(), 1], ['Quand', dateLisible(), 2]];
    if (R.act === 'balade') lignes.push(['Cavaliers', $('#r-nb').value, 3]);
    if (R.act !== 'visite') lignes.push(['Niveau', $('option:checked', selNiv).textContent, 3]);
    lignes.push(['Contact', $('#r-nom').value.trim() + ', ' + $('#r-tel').value.trim() + ', ' + $('#r-mail').value.trim(), 3]);
    lignes.push(['À régler sur place', prix() ? euros(prix()) + ' (tarif de démonstration)' : 'Gratuit', 0]);
    $('#r-recap').innerHTML = lignes.map(function (l) {
      return '<div><dt>' + l[0] + '</dt><dd>' + esc(l[1]) + (l[2] ? ' <button type="button" class="lien" data-aller="' + l[2] + '">modifier<span class="sr"> ' + l[0].toLowerCase() + '</span></button>' : '') + '</dd></div>';
    }).join('');
    $$('[data-aller]', $('#r-recap')).forEach(function (b) { b.addEventListener('click', function () { aller(+b.dataset.aller); }); });
  }
  function aller(n) {
    pas = n;
    $$('.pas', form).forEach(function (f) { f.hidden = +f.dataset.pas !== n; });
    $$('#etapes li').forEach(function (li, i) { li.classList.toggle('on', i === n - 1); li.classList.toggle('fait', i < n - 1); if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    $('#r-prec').hidden = n === 1; $('#r-suiv').hidden = n === 4; $('#r-envoyer').hidden = n !== 4;
    $('#r-erreur').textContent = '';
    if (n === 2) dessinerJours();
    if (n === 3) alerteNiveau();
    if (n === 4) recap();
    var lg = $('.pas[data-pas="' + n + '"] legend', form); if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); }
  }
  function etapeValide() {
    var err = $('#r-erreur');
    if (pas === 2 && (!R.date || !R.heure)) { err.textContent = !R.date ? 'Choisissez un jour.' : 'Choisissez une heure.'; return false; }
    if (pas === 3) {
      if (alerteNiveau()) { err.textContent = 'Le niveau ne correspond pas à cette boucle. Changez de boucle ou de niveau.'; return false; }
      return verifier([$('#r-nom'), $('#r-tel'), $('#r-mail')], err);
    }
    return true;
  }
  $('#r-suiv').addEventListener('click', function () { if (etapeValide()) aller(pas + 1); });
  $('#r-prec').addEventListener('click', function () { aller(pas - 1); });
  var dernier = null;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pas !== 4) { if (etapeValide()) aller(pas + 1); return; }
    if (!$('#r-accord').checked) { $('#r-erreur').textContent = 'Cochez la case pour que nous puissions vous recontacter.'; $('#r-accord').focus(); return; }
    var ref = refDu('VLB');
    dernier = { ref: ref, act: R.act, libelle: libelleAct(), date: R.date, heure: R.heure, nb: R.act === 'balade' ? +$('#r-nb').value : 1, niveau: R.act === 'visite' ? null : selNiv.value, nom: $('#r-nom').value.trim(), tel: $('#r-tel').value.trim(), mail: $('#r-mail').value.trim(), note: $('#r-note').value.trim(), prix: prix(), le: new Date().toISOString() };
    var liste = stock.lire('valombre-reservations'); liste.push(dernier); stock.ecrire('valombre-reservations', liste);
    $('#c-detail').textContent = dernier.libelle + ', ' + dateLisible() + '. Rendez-vous à l’accueil de l’écurie quinze minutes avant.';
    $('#c-ref').textContent = ref;
    var duree = R.act === 'balade' ? ({ hetraie: 60, cretes: 150, vallee: 480 })[selBoucle.value] : R.act === 'visite' ? 45 : D.cours[+selCours.value].duree;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var deb = new Date(R.date + 'T' + R.heure + ':00'), fin = new Date(deb.getTime() + duree * 60000);
    var f = function (d) { return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00'; };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Domaine de Valombre//Concept//FR', 'BEGIN:VEVENT', 'UID:' + ref + '@valombre.example', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(deb), 'DTEND:' + f(fin), 'SUMMARY:' + dernier.libelle.replace(/[,;]/g, ' '), 'LOCATION:Domaine de Valombre', 'DESCRIPTION:Référence ' + ref, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    $('#c-ics').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    $('#c-ics').setAttribute('download', 'valombre-' + ref + '.ics');
    form.hidden = true; var c = $('#confirme'); c.hidden = false; c.focus();
    toast('Réservation ' + ref + ' confirmée');
  });
  $('#c-nouveau').addEventListener('click', function () {
    form.reset(); selNiv.value = 'debutant'; majAct(); $('#confirme').hidden = true; form.hidden = false; aller(1);
  });

  /* Pré-remplissage depuis le planning, les balades ou la fiche d'un lieu. */
  function reserver(o) {
    $('#confirme').hidden = true; form.hidden = false;
    $$('input[name=act]', form).forEach(function (r) { r.checked = r.value === o.act; });
    majAct();
    if (o.act === 'balade' && o.boucle) selBoucle.value = o.boucle;
    if (o.act === 'cours' && o.cours != null) { selCours.value = String(o.cours); }
    if (o.act === 'balade') { selNiv.value = ({ hetraie: 'debutant', cretes: 'g3', vallee: 'g5' })[selBoucle.value]; }
    if (o.act === 'cours' && o.cours != null) { var c = D.cours[o.cours]; if (c.niveau !== 'tous') selNiv.value = c.niveau; }
    var aSauter = o.act === 'cours' && o.cours != null || o.act === 'balade' && o.boucle;
    aller(aSauter ? 2 : 1);
    var j = joursPossibles()[0];
    if (aSauter && j) { R.date = isoJour(j); dessinerJours(); }
    $('#reserver').scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' });
    toast(libelleAct());
  }
  majAct(); aller(1);
  $('#etapes').removeAttribute('tabindex');

  /* ---------- horaires ---------- */
  var tb = $('#horaires'), auj = new Date().getDay(), corps = document.createElement('tbody');
  [2, 3, 4, 5, 6, 0, 1].forEach(function (j) {
    var tr = document.createElement('tr'), h = D.horaires[j];
    if (j === auj) tr.className = 'auj';
    tr.innerHTML = '<th scope="row">' + Jour(JOURS[j]) + (j === auj ? ' <small>aujourd’hui</small>' : '') + '</th><td>' + (h ? hTexte(h[0]) + ' – ' + hTexte(h[1]) : 'Fermé au public') + '</td>';
    corps.appendChild(tr);
  });
  tb.appendChild(corps);

  /* ---------- apparitions au défilement ---------- */
  if ('IntersectionObserver' in window && !calme) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.cours-tete, .planning .jour, .balades-corps, .boucles li, .formules label, .pension-form, .pensions-photos figure, .ecurie li, .lieu-corps, .lieu-grand, .reserver-tete, .infos-grille > div, .journee-cartes li, .bandeau p').forEach(function (el, i) { el.classList.add('apparait'); el.style.setProperty('--i', i % 6); io.observe(el); });
  }
})();
