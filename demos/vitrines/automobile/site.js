/* MOTORLINE — interactions de la maquette.
   Animations : NS Motion Kit (ns-motion.css + ns-motion.js).
   Tout est en vanilla, aucune dépendance : c'est ce qui garde la page rapide. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esp = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* ------------------------------------------------------------------ menu */
  var hamb = $('.hamb'), mob = $('#mob');
  function fermerMenu() { mob.style.display = 'none'; hamb.textContent = '☰'; hamb.setAttribute('aria-expanded', 'false'); }
  hamb.addEventListener('click', function () {
    if (mob.style.display === 'flex') { fermerMenu(); return; }
    mob.style.display = 'flex'; hamb.textContent = '✕'; hamb.setAttribute('aria-expanded', 'true');
  });
  mob.addEventListener('click', function (e) { if (e.target.tagName === 'A') fermerMenu(); });

  /* ------------------------------------------------------- rail « à la une »
     Construit depuis les cartes du catalogue : une seule source de vérité,
     donc impossible d'afficher en haut de page un prix qui a changé en bas. */
  var grille = $('#grille'),
      autos = $$('.auto', grille),
      vide = $('#vide');

  (function rail() {
    var choix = ['v2', 'v11', 'v9'].map(function (id) { return $('#' + id); }).filter(Boolean);
    $('#rail').innerHTML = choix.map(function (a) {
      var d = JSON.parse(a.dataset.fiche);
      return '<button type="button" class="rail-c" data-voir="' + a.id + '">' +
        '<img src="' + d.photo + '" alt="" aria-hidden="true" width="1200" height="800" loading="lazy">' +
        '<span><b>' + d.titre + '</b><span>' + d.an + ' · ' + esp(d.km) + ' km · ' + d.ch + ' ch</span></span>' +
        '<i>' + esp(d.prix) + ' €</i></button>';
    }).join('');
  })();

  /* ------------------------------------------------------------- catalogue */
  var etat = { seg: '', carb: '', boite: '', bud: null },
      compte = $('#compte'),
      tri = $('#tri'),
      segs = $$('#segs .seg'),
      fSeg = $('#f-seg'), fCarb = $('#f-carb'), fBoite = $('#f-boite'), fBud = $('#f-bud');

  function budget(v) { if (!v) return null; var p = v.split('-'); return [+p[0], +p[1]]; }

  function correspond(a) {
    var d = a.dataset;
    return (!etat.seg || d.seg === etat.seg)
        && (!etat.carb || d.carb === etat.carb)
        && (!etat.boite || d.boite === etat.boite)
        && (!etat.bud || (+d.prix > etat.bud[0] && +d.prix <= etat.bud[1]));
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

  function rendre() {
    var n = 0;
    autos.forEach(function (a) { var ok = correspond(a); a.classList.toggle('hide', !ok); if (ok) n++; });
    vide.hidden = n > 0;
    compte.innerHTML = n === 0
      ? 'Aucun véhicule ne correspond à cette recherche'
      : '<b>' + n + '</b> véhicule' + (n > 1 ? 's' : '') +
        (n < autos.length ? ' sur ' + autos.length : '') + ' en stock aujourd’hui';
    trier();
  }

  function synchroniserSegs() {
    segs.forEach(function (s) { s.classList.toggle('on', s.dataset.s === etat.seg); });
    fSeg.value = etat.seg;
  }

  $('#cherche').addEventListener('submit', function (e) {
    e.preventDefault();
    etat.seg = fSeg.value; etat.carb = fCarb.value; etat.boite = fBoite.value; etat.bud = budget(fBud.value);
    synchroniserSegs(); rendre();
    $('#vehicules').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  segs.forEach(function (s) {
    s.addEventListener('click', function () {
      etat.seg = s.dataset.s;
      synchroniserSegs(); rendre();
    });
  });

  tri.addEventListener('change', trier);
  rendre();

  /* ---------------------------------------------------------------- fiche */
  var fiche = $('#fiche'), fX = $('.fiche-x', fiche), dernier = null;

  function ouvrirFiche(id) {
    var a = $('#' + id); if (!a) return;
    var d = JSON.parse(a.dataset.fiche);
    $('#fiche-img').src = d.photo; $('#fiche-img').alt = d.alt;
    $('#fiche-kick').textContent = d.an + ' · ' + d.carb + ' · ' + d.boite;
    $('#fiche-titre').textContent = d.titre;
    $('#fiche-prix').textContent = esp(d.prix) + ' €';
    $('#fiche-mens').textContent = 'ou ' + esp(d.mens) + ' €/mois · 60 mois, 20 % d’apport, simulation indicative';
    $('#fiche-note').textContent = d.note;
    $('#fiche-grille').innerHTML = [
      ['Mise en circulation', d.an], ['Kilométrage', esp(d.km) + ' km'],
      ['Énergie', d.carb], ['Boîte', d.boite],
      ['Puissance', d.ch + ' ch'], ['Carrosserie', d.portes + ' portes · ' + d.places + ' places'],
      ['Couleur', d.coul], ['Consommation', d.conso],
      ['CO₂', d.co2], ['Historique', d.mains],
      ['Contrôle technique', d.ct], ['Garantie', '24 mois pièces et main-d’œuvre']
    ].map(function (l) { return '<div><dt>' + l[0] + '</dt><dd>' + l[1] + '</dd></div>'; }).join('');
    $('#fiche-equip').innerHTML = d.equip.split(' · ').map(function (e) { return '<b>' + e + '</b>'; }).join('');
    dernier = document.activeElement;
    fiche.hidden = false;
    document.body.style.overflow = 'hidden';
    fX.focus();
  }

  function fermerFiche() {
    if (fiche.hidden) return;
    fiche.hidden = true;
    if (recap.hidden) document.body.style.overflow = '';
    if (dernier && dernier.focus) dernier.focus();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-voir]');
    if (b) { e.preventDefault(); ouvrirFiche(b.dataset.voir); }
  });
  fiche.addEventListener('click', function (e) { if (e.target.closest('[data-fermer]')) fermerFiche(); });

  /* ------------------------------------------------------- atelier : onglets */
  $$('.ong').forEach(function (o) {
    o.addEventListener('click', function () {
      $$('.ong').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      $$('.panneau').forEach(function (p) { p.classList.remove('on'); });
      o.classList.add('on'); o.setAttribute('aria-selected', 'true');
      $('#p-' + o.dataset.ong).classList.add('on');
    });
  });

  /* --------------------------------------------- atelier : demande de devis
     Le visiteur coche ce dont il a besoin, la fourchette se construit toute
     seule. Fourchette et non prix ferme : un devis d'atelier sans examen du
     véhicule n'existe pas, autant le dire dans l'interface. */
  var panier = $('#panier'), recap = $('#recap'), choisies = [];

  function fourchette() {
    var bas = choisies.reduce(function (s, p) { return s + p.prix; }, 0);
    if (!bas) return 'à confirmer';
    return esp(bas) + ' – ' + esp(Math.round(bas * 1.35 / 10) * 10) + ' €';
  }

  function majPanier() {
    var n = choisies.length;
    panier.classList.toggle('on', n > 0);
    /* on réécrit le libellé entier : accorder « sélectionnée » au pluriel
       demande de toucher trois morceaux de phrase, autant les régénérer. */
    $('#panier-n').innerHTML = '<b>' + n + '</b> prestation' + (n > 1 ? 's' : '') +
      ' sélectionnée' + (n > 1 ? 's' : '');
    $('#panier-est').textContent = fourchette();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.presta');
    if (!b) return;
    var nom = b.dataset.nom, prix = +b.dataset.prix;
    var i = choisies.findIndex(function (p) { return p.nom === nom; });
    if (i > -1) { choisies.splice(i, 1); b.classList.remove('on'); }
    else { choisies.push({ nom: nom, prix: prix }); b.classList.add('on'); }
    majPanier();
  });

  $('#panier-vider').addEventListener('click', function () {
    choisies = [];
    $$('.presta.on').forEach(function (p) { p.classList.remove('on'); });
    majPanier();
  });

  function ouvrirRecap() {
    if (!choisies.length) return;
    $('#recap-liste').innerHTML = choisies.map(function (p) {
      return '<li><span>' + p.nom + '</span><b>' + (p.prix === 0 ? 'Offert' : 'dès ' + esp(p.prix) + ' €') + '</b></li>';
    }).join('');
    $('#recap-total').textContent = fourchette();
    recap.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.fiche-x', recap).focus();
  }

  function fermerRecap() {
    if (recap.hidden) return;
    recap.hidden = true;
    if (fiche.hidden) document.body.style.overflow = '';
  }

  $('#panier-devis').addEventListener('click', ouvrirRecap);
  recap.addEventListener('click', function (e) { if (e.target.closest('[data-fermer-recap]')) fermerRecap(); });

  $('#recap-copier').addEventListener('click', function () {
    var bouton = this;
    var texte = 'Demande d’atelier — MOTORLINE\n\n' + choisies.map(function (p) {
      return '· ' + p.nom + (p.prix === 0 ? ' (offert)' : ' — dès ' + esp(p.prix) + ' €');
    }).join('\n');
    var fini = function () { bouton.textContent = 'Liste copiée'; setTimeout(function () { bouton.textContent = 'Copier la liste'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(fini, fini);
    } else {
      var z = document.createElement('textarea');
      z.value = texte; document.body.appendChild(z); z.select();
      try { document.execCommand('copy'); } catch (err) { /* rien à faire de plus */ }
      document.body.removeChild(z); fini();
    }
  });

  /* ------------------------------------------------------------- clavier */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!recap.hidden) { fermerRecap(); return; }
    if (!fiche.hidden) { fermerFiche(); return; }
    if (mob.style.display === 'flex') fermerMenu();
  });
})();
