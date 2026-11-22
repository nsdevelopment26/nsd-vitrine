/* =============================================================
   NS Development · fenêtre du concours « Devine le prix » (19/11/2026)
   Demande de Nelson : à la mise en ligne de la refonte, une fenêtre
   façon newsletter qui envoie les visiteurs du site jouer sur Instagram.

   - Visible seulement pendant le concours : du dimanche 29/11/2026 00:00
     au samedi 05/12/2026 23:59, heure de Luxembourg. Hors de ces dates,
     ce fichier ne fait rien (on peut le laisser en place après le 05/12).
   - Une seule fois par visiteur (fermée = plus jamais montrée).
   - Jamais sur les pages légales, la 404 ni la page du règlement.
   - Pour la tester hors période : ajouter ?concours=1 à l'adresse.
   ============================================================= */
(function () {
  var DEBUT = Date.parse('2026-11-29T00:00:00+01:00');
  var FIN = Date.parse('2026-12-05T23:59:59+01:00');
  var CLE = 'nsd-concours-2026-11-vu';
  // Le 29/11, dès la publication : remplacer par le lien direct de la vidéo du concours
  // (https://www.instagram.com/p/XXXX/), pour qu'un clic mène droit au jeu.
  var INSTA = 'https://www.instagram.com/nsdevelopment.lu/';

  var force = /[?&]concours=1\b/.test(location.search);
  var maintenant = Date.now();
  if (!force && (maintenant < DEBUT || maintenant > FIN)) return;
  var page = document.body && document.body.getAttribute('data-page');
  if (page === 'legal' || page === '404') return;
  if (!force) { try { if (localStorage.getItem(CLE)) return; } catch (e) {} }
  if (typeof HTMLDialogElement !== 'function') return;

  var FL = '<svg class="fl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  function construire() {
    var d = document.createElement('dialog');
    d.className = 'concours-pop';
    d.setAttribute('aria-labelledby', 'ccTitre');
    d.innerHTML =
      '<button type="button" class="cc-fermer" aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<p class="cc-kick">Concours Instagram · jusqu\'au 5 décembre</p>' +
      '<h2 id="ccTitre">Devinez le prix, <em>gagnez un mois de marketing.</em></h2>' +
      '<p class="cc-lede">1er prix : un mois de marketing offert (12 vidéos, vos réseaux gérés). 2e : trois vidéos et une heure de conseil. 3e : une vidéo et une heure de conseil. Et pour chaque participant, un mini-audit gratuit de son Instagram. Réservé aux commerces et indépendants du Luxembourg.</p>' +
      '<ol class="cc-etapes">' +
        '<li><span>Abonnez-vous à <b>@nsdevelopment.lu</b></span></li>' +
        '<li><span>Aimez la vidéo du concours</span></li>' +
        '<li><span>Partagez-la en story en nous mentionnant</span></li>' +
        '<li><span>Commentez une fois : <b>« Commerce, ville, prix »</b><br><small>ex. « Boulangerie Dupont, Esch, 700 € »</small></span></li>' +
      '</ol>' +
      '<a class="btn cc-go" href="' + INSTA + '" target="_blank" rel="noopener">Participer sur Instagram ' + FL + '</a>' +
      '<p class="cc-bas">Gratuit, sans obligation d\'achat. <a href="concours.html">Lire le règlement</a></p>';
    document.body.appendChild(d);

    function fermer() {
      try { localStorage.setItem(CLE, '1'); } catch (e) {}
      if (d.open) d.close();
    }
    d.querySelector('.cc-fermer').addEventListener('click', fermer);
    d.querySelector('.cc-go').addEventListener('click', function () { try { localStorage.setItem(CLE, '1'); } catch (e) {} });
    d.addEventListener('close', function () { try { localStorage.setItem(CLE, '1'); } catch (e) {} });
    d.addEventListener('click', function (e) { if (e.target === d) fermer(); });   // clic sur le voile
    if (window.nsRetranslate) { try { window.nsRetranslate(); } catch (e) {} }
    return d;
  }

  var montre = false;
  function montrer() {
    if (montre) return;
    // Pas par-dessus une autre fenêtre ouverte (fiche projet, menu mobile).
    if (document.querySelector('dialog[open]') || document.documentElement.classList.contains('menu-ouvert')) {
      setTimeout(montrer, 4000); return;
    }
    montre = true;
    window.removeEventListener('scroll', auDefilement);
    var d = construire();
    d.showModal();
    d.querySelector('.cc-go').focus({ preventScroll: true });
  }
  function auDefilement() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0 && scrollY / h > 0.35) montrer();
  }
  function demarrer() {
    setTimeout(montrer, force ? 600 : 9000);
    window.addEventListener('scroll', auDefilement, { passive: true });
  }
  if (document.readyState === 'complete') demarrer();
  else window.addEventListener('load', demarrer);
})();
