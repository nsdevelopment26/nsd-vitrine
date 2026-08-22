/* Interactions communes du site — sans dépendance. */
(function () {
  'use strict';

  /* Les deux seules phrases écrites par ce fichier, dans chaque langue. */
  var ETATS = {
    fr: { ouvert: 'Ouvert maintenant', ferme: 'Fermé actuellement' },
    lb: { ouvert: 'Elo op', ferme: 'Momentan zou' }
  };
  function langue() {
    var l = document.documentElement.getAttribute('lang') || 'fr';
    return ETATS[l] ? l : 'fr';
  }

  /* Menu mobile */
  var burger = document.querySelector('.burger');
  var liens = document.querySelector('.nav__links');
  if (burger && liens) {
    var nav = burger.closest('.nav');
    function bascule(ouvrir) {
      burger.setAttribute('aria-expanded', String(ouvrir));
      liens.classList.toggle('is-open', ouvrir);
      nav.classList.toggle('nav--open', ouvrir);
    }
    burger.addEventListener('click', function () {
      bascule(burger.getAttribute('aria-expanded') !== 'true');
    });
    liens.addEventListener('click', function (e) {
      /* La bascule de langue vit dans le menu : la cliquer ne doit pas
         refermer le menu, sinon on ne voit pas le résultat. */
      if (e.target.closest('[data-langue-choix]')) return;
      if (e.target.closest('a')) bascule(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') bascule(false);
    });
  }

  /* Surligne la ligne du jour dans les horaires */
  var jour = new Date().getDay();
  document.querySelectorAll('[data-jour]').forEach(function (li) {
    if (+li.dataset.jour === jour) li.classList.add('is-today');
  });

  /* Année du pied de page */
  document.querySelectorAll('[data-annee]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Ouvert / fermé en direct */
  var badge = document.querySelector('[data-ouvert]');
  function etatOuverture() {
    if (!badge) return;
    var h = { 1: [[480, 720], [810, 1110]], 2: [[480, 720], [810, 1110]], 3: [[480, 720], [810, 1110]],
              4: [[480, 720], [810, 1140]], 5: [[480, 720], [810, 1020]], 6: [[540, 720]], 0: [] };
    var n = new Date(), m = n.getHours() * 60 + n.getMinutes();
    var ouvert = (h[n.getDay()] || []).some(function (p) { return m >= p[0] && m < p[1]; });
    var mots = ETATS[langue()];
    badge.textContent = ouvert ? mots.ouvert : mots.ferme;
    badge.style.color = ouvert ? '#6E8F73' : '#948A81';
  }
  etatOuverture();

  /* La langue a changé : on réécrit ce que ce fichier avait écrit. */
  document.addEventListener('ns:langue', etatOuverture);
})();
