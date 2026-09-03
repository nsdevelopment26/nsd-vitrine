/* ============================================================================
   NS Development — bascule de langue pour sites statiques
   Moteur générique, aucun contenu propre à un client. Version 1.0
   ----------------------------------------------------------------------------
   Principe : le français reste écrit en clair dans le HTML. C'est la langue de
   référence, celle que voit un visiteur sans JavaScript et celle que lisent les
   moteurs de recherche. Les autres langues vivent dans un dictionnaire
   (assets/traductions.js) et remplacent le contenu à la volée, sans rechargement.

   Marquage dans le HTML :
     <p data-i18n="accueil.chapeau">Texte français…</p>
     <meta name="description" data-i18n-attr="content:accueil.meta" content="…">
     <button data-i18n-attr="aria-label:nav.menu" aria-label="Ouvrir le menu">

   Boutons de bascule :
     <button data-langue="fr">FR</button>
     <button data-langue="lb">LB</button>

   La langue choisie est mémorisée dans le navigateur et rejouée à la page
   suivante. Un évènement `ns:langue` est émis à chaque changement : les autres
   modules (réservation, horaires) s'y accrochent pour se remettre à jour.
   ============================================================================ */
(function (window, document) {
  'use strict';

  var CLE_MEMOIRE = 'ns.langue';
  var DEFAUT = 'fr';

  var paquets = window.NS_TRADUCTIONS || {};
  var langues = [DEFAUT];
  Object.keys(paquets).forEach(function (l) {
    if (langues.indexOf(l) === -1) langues.push(l);
  });

  var elements = [];
  var attributs = [];
  var courante = DEFAUT;

  /* --- mémoire ------------------------------------------------------------ */
  function normalise(l) {
    l = String(l || '').toLowerCase().slice(0, 2);
    return langues.indexOf(l) !== -1 ? l : DEFAUT;
  }
  function memorise(l) {
    try { localStorage.setItem(CLE_MEMOIRE, l); } catch (e) {}
  }
  function memorisee() {
    try { return localStorage.getItem(CLE_MEMOIRE); } catch (e) { return null; }
  }

  /* --- relevé du français, une seule fois --------------------------------- */
  function releve() {
    elements = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      elements.push({ el: el, cle: el.getAttribute('data-i18n'), fr: el.innerHTML });
    });

    attributs = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (paire) {
        var i = paire.indexOf(':');
        if (i < 1) return;
        var attr = paire.slice(0, i).trim();
        var cle = paire.slice(i + 1).trim();
        if (!attr || !cle) return;
        attributs.push({ el: el, attr: attr, cle: cle, fr: el.getAttribute(attr) || '' });
      });
    });
  }

  /* --- lecture du dictionnaire -------------------------------------------- */
  function traduction(langue, cle) {
    var p = paquets[langue];
    if (!p || !p.dict) return null;
    var v = p.dict[cle];
    return (v == null || v === '') ? null : v;
  }

  /* --- les titres découpés par le kit d'animation doivent être recoupés ---- */
  function recoupe(el) {
    var cibles = el.hasAttribute('data-split')
      ? [el]
      : Array.prototype.slice.call(el.querySelectorAll('[data-split]'));
    cibles.forEach(function (c) {
      c.removeAttribute('data-ns-split-done');
      c.classList.remove('ns-split');
    });
    return cibles.length > 0;
  }

  /* --- application -------------------------------------------------------- */
  function applique(langue, silencieux) {
    langue = normalise(langue);
    var aRecouper = false;
    var manquantes = [];

    elements.forEach(function (e) {
      var v = langue === DEFAUT ? e.fr : traduction(langue, e.cle);
      if (v == null) {
        if (langue !== DEFAUT) manquantes.push(e.cle);
        v = e.fr;
      }
      if (e.el.innerHTML !== v) {
        e.el.innerHTML = v;
        if (recoupe(e.el)) aRecouper = true;
      }
    });

    attributs.forEach(function (a) {
      var v = langue === DEFAUT ? a.fr : traduction(langue, a.cle);
      if (v == null) {
        if (langue !== DEFAUT) manquantes.push(a.cle);
        v = a.fr;
      }
      a.el.setAttribute(a.attr, v);
    });

    courante = langue;
    document.documentElement.setAttribute('lang', langue);
    document.documentElement.setAttribute('data-langue', langue);

    Array.prototype.forEach.call(document.querySelectorAll('[data-langue-choix]'), function (b) {
      var actif = b.getAttribute('data-langue-choix') === langue;
      b.classList.toggle('is-on', actif);
      b.setAttribute('aria-pressed', String(actif));
    });

    if (aRecouper && window.NSMotion && window.NSMotion.refresh) window.NSMotion.refresh();

    if (manquantes.length && window.console && window.console.warn) {
      window.console.warn('[i18n] traductions manquantes (' + langue + ') :', manquantes);
    }

    if (!silencieux) {
      document.dispatchEvent(new CustomEvent('ns:langue', { detail: { langue: langue } }));
    }
  }

  /* --- boutons ------------------------------------------------------------ */
  function branche() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-langue-choix]') : null;
      if (!b) return;
      e.preventDefault();
      var l = normalise(b.getAttribute('data-langue-choix'));
      if (l === courante) return;
      memorise(l);
      applique(l);
    });
  }

  /* --- démarrage ---------------------------------------------------------- */
  function demarrer() {
    releve();
    branche();
    var voulue = memorisee();
    applique(voulue ? voulue : DEFAUT, true);
    document.documentElement.classList.remove('i18n-attente');
    document.dispatchEvent(new CustomEvent('ns:langue', { detail: { langue: courante } }));
  }

  window.NSLangue = {
    langues: langues,
    get: function () { return courante; },
    set: function (l) { memorise(normalise(l)); applique(l); },
    /* Traduit une chaîne isolée depuis un autre module. */
    texte: function (cle, repli) {
      var v = traduction(courante, cle);
      return v == null ? (repli == null ? cle : repli) : v;
    }
  };

  // Ce script se place en fin de <body>, sans « defer » : à cet instant toute
  // la page est lue et la traduction s'applique avant le kit d'animation.
  if (document.body) {
    demarrer();
  } else {
    document.addEventListener('DOMContentLoaded', demarrer);
  }

})(window, document);
