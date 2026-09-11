/* MOTORLINE PRO — interactions de la maquette.
   Même socle que la maquette automobile, avec en plus la notion d'univers :
   voitures, utilitaires et poids lourds ne se filtrent pas pareil, donc les
   puces de filtre sont reconstruites à chaque changement d'univers. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esp = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* Regénéré par _generer-catalogue.py : ne pas modifier à la main. */
  var SEGMENTS = {"voiture": [["berline", "Berlines"], ["break", "Breaks"], ["suv", "SUV"]], "utilitaire": [["fourgon", "Fourgons"], ["fourgonnette", "Fourgonnettes"], ["cabine", "Cabines approfondies"]], "pl": [["tracteur", "Tracteurs"], ["porteur", "Porteurs"], ["benne", "Bennes"], ["grue", "Grues"], ["ensemble", "Ensembles routiers"]]};

  /* ------------------------------------------------------------------ menu */
  var hamb = $('.hamb'), mob = $('#mob');
  function fermerMenu() { mob.style.display = 'none'; hamb.textContent = '☰'; hamb.setAttribute('aria-expanded', 'false'); }
  hamb.addEventListener('click', function () {
    if (mob.style.display === 'flex') { fermerMenu(); return; }
    mob.style.display = 'flex'; hamb.textContent = '✕'; hamb.setAttribute('aria-expanded', 'true');
  });
  mob.addEventListener('click', function (e) { if (e.target.tagName === 'A') fermerMenu(); });

  /* ------------------------------------------------------------- catalogue */
  var grille = $('#grille'),
      autos = $$('.auto', grille),
      vide = $('#vide'),
      compte = $('#compte'),
      tri = $('#tri'),
      segs = $('#segs'),
      fSeg = $('#f-seg'), fCarb = $('#f-carb'), fBoite = $('#f-boite'), fBud = $('#f-bud');

  var etat = { univ: 'voiture', seg: '', carb: '', boite: '', bud: null };

  function budget(v) { if (!v) return null; var p = v.split('-'); return [+p[0], +p[1]]; }

  function correspond(a) {
    var d = a.dataset;
    return d.univ === etat.univ
        && (!etat.seg || d.seg === etat.seg)
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
      return B.an - A.an || A.km - B.km;
    }).forEach(function (a) { grille.insertBefore(a, vide); });
  }

  var NOMS = { voiture: 'voiture', utilitaire: 'utilitaire', pl: 'poids lourd' };

  function rendre() {
    var n = 0, total = autos.filter(function (a) { return a.dataset.univ === etat.univ; }).length;
    autos.forEach(function (a) { var ok = correspond(a); a.classList.toggle('hide', !ok); if (ok) n++; });
    vide.hidden = n > 0;
    var mot = NOMS[etat.univ] + (n > 1 ? 's' : '');
    compte.innerHTML = n === 0
      ? 'Aucun véhicule ne correspond à cette recherche'
      : '<b>' + n + '</b> ' + mot + (n < total ? ' sur ' + total : '') + ' en stock aujourd’hui';
    trier();
  }

  /* Les puces de filtre dépendent de l'univers : un tracteur ne se range pas
     dans « berlines ». On les reconstruit, plutôt que d'en cacher la moitié. */
  function construireSegs() {
    var liste = SEGMENTS[etat.univ] || [];
    segs.innerHTML = '<button type="button" class="seg on" data-s="">Tout</button>' +
      liste.map(function (s) {
        return '<button type="button" class="seg" data-s="' + s[0] + '">' + s[1] + '</button>';
      }).join('');
    fSeg.innerHTML = '<option value="">Tous</option>' +
      liste.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('');
  }

  function changerUnivers(u) {
    etat.univ = u; etat.seg = ''; etat.carb = ''; etat.boite = ''; etat.bud = null;
    fCarb.value = ''; fBoite.value = ''; fBud.value = '';
    $$('.un').forEach(function (t) {
      var actif = t.dataset.u === u;
      t.classList.toggle('on', actif);
      t.setAttribute('aria-pressed', actif ? 'true' : 'false');
    });
    construireSegs();
    rendre();
  }

  $$('.un').forEach(function (t) {
    t.addEventListener('click', function () { changerUnivers(t.dataset.u); });
  });

  segs.addEventListener('click', function (e) {
    var b = e.target.closest('.seg');
    if (!b) return;
    etat.seg = b.dataset.s;
    $$('.seg', segs).forEach(function (s) { s.classList.toggle('on', s === b); });
    fSeg.value = etat.seg;
    rendre();
  });

  $('#cherche').addEventListener('submit', function (e) {
    e.preventDefault();
    etat.seg = fSeg.value; etat.carb = fCarb.value; etat.boite = fBoite.value; etat.bud = budget(fBud.value);
    $$('.seg', segs).forEach(function (s) { s.classList.toggle('on', s.dataset.s === etat.seg); });
    rendre();
    $('#parc').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  tri.addEventListener('change', trier);
  changerUnivers('voiture');

  /* ------------------------------------------------- rail « à la une »
     Construit depuis les cartes : une seule source de vérité pour les prix. */
  (function rail() {
    var choix = ['p2', 'u4', 'v1'].map(function (id) { return $('#' + id); }).filter(Boolean);
    $('#rail').innerHTML = choix.map(function (a) {
      var d = JSON.parse(a.dataset.fiche);
      return '<button type="button" class="rail-c" data-voir="' + a.id + '">' +
        '<img src="' + d.photo + '" alt="" aria-hidden="true" width="1200" height="800" loading="lazy">' +
        '<span><b>' + d.titre + '</b><span>' + d.an + ' · ' + esp(d.km) + ' km · ' + d.ch + ' ch</span></span>' +
        '<i>' + esp(d.prix) + ' €' + (d.ht ? ' HT' : '') + '</i></button>';
    }).join('');
  })();

  /* ---------------------------------------------------------------- fiche */
  var fiche = $('#fiche'), fX = $('.fiche-x', fiche), dernier = null;

  function ouvrirFiche(id) {
    var a = $('#' + id); if (!a) return;
    var d = JSON.parse(a.dataset.fiche);
    $('#fiche-img').src = d.photo; $('#fiche-img').alt = d.alt;
    $('#fiche-kick').textContent = d.an + ' · ' + d.carb + ' · ' + d.boite;
    $('#fiche-titre').textContent = d.titre;
    $('#fiche-prix').textContent = esp(d.prix) + (d.ht ? ' € HT' : ' €');
    $('#fiche-mens').textContent = d.financement + ' · simulation indicative';
    $('#fiche-note').textContent = d.note;
    $('#fiche-grille').innerHTML = [
      ['Mise en circulation', d.an], ['Kilométrage', esp(d.km) + ' km'],
      ['Énergie', d.carb], ['Boîte', d.boite],
      ['Puissance', d.ch + ' ch'], ['Places', d.places],
      ['Couleur', d.coul], ['Consommation', d.conso],
      ['Norme / CO₂', d.co2], ['Historique', d.mains],
      ['Contrôle technique', 'Vierge, valable 1 an'],
      ['Garantie', d.ht ? '12 mois moteur et boîte' : '24 mois pièces et main-d’œuvre']
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

  /* --------------------------------------------- atelier : demande de devis */
  var panier = $('#panier'), recap = $('#recap'), choisies = [];

  function fourchette() {
    var bas = choisies.reduce(function (s, p) { return s + p.prix; }, 0);
    if (!bas) return 'à confirmer';
    return esp(bas) + ' – ' + esp(Math.round(bas * 1.35 / 10) * 10) + ' € HT';
  }

  function majPanier() {
    var n = choisies.length;
    panier.classList.toggle('on', n > 0);
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
      return '<li><span>' + p.nom + '</span><b>' + (p.prix === 0 ? 'Inclus' : 'dès ' + esp(p.prix) + ' €') + '</b></li>';
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
    var texte = 'Demande d’atelier — MOTORLINE PRO\n\n' + choisies.map(function (p) {
      return '· ' + p.nom + (p.prix === 0 ? ' (inclus)' : ' — dès ' + esp(p.prix) + ' € HT');
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
