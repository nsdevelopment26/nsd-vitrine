/* ============================================================================
   Maison Vaurenne — configuration de la réservation en ligne
   ----------------------------------------------------------------------------
   SEUL fichier propre au site. Le moteur (nsr-reservation.js) et le style de
   base (nsr-reservation.css) sont ceux du module NS Development, identiques
   chez tous les clients et jamais retouchés ici.

   Le groupe a DEUX restaurants, décrits dans etablissements.js (chargé juste
   avant ce fichier). Ce fichier choisit celui que le visiteur a sélectionné,
   puis applique les réglages que le patron a faits dans son espace pro
   (horaires, fermetures, tables masquées). En production, ces réglages
   viendraient de la base ; en démonstration, du stockage du navigateur.

   DÉMONSTRATION : `backend: 'local'`. Les réservations restent dans le
   navigateur du visiteur, rien n'est envoyé nulle part.
   ============================================================================ */
(function (w) {
  var liste = w.NSR_ETABLISSEMENTS || [];
  if (!liste.length) return;

  function lire(cle) {
    try { return w.localStorage.getItem(cle); } catch (e) { return null; }
  }
  function ecrire(cle, v) {
    try { w.localStorage.setItem(cle, v); } catch (e) {}
  }

  var choisi = lire('vaurenne.restaurant');
  var base = liste.filter(function (e) { return e.slug === choisi; })[0] || liste[0];
  var cfg = JSON.parse(JSON.stringify(base));

  /* Les réglages du patron, posés depuis son espace pro. */
  var r = null;
  try { r = JSON.parse(lire('nsr.' + cfg.slug + '.reglages')); } catch (e) {}
  if (r) {
    if (r.ouvertures) {
      var o = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      r.ouvertures
        .slice().sort(function (a, b) { return a.debut.localeCompare(b.debut); })
        .forEach(function (p) { o[p.jour_semaine].push([p.debut.slice(0, 5), p.fin.slice(0, 5)]); });
      cfg.ouvertures = o;
    }
    if (r.fermetures) {
      var jours = [], partielles = [];
      r.fermetures.forEach(function (f) {
        var d = new Date(f.du + 'T12:00:00'), fin = new Date(f.au + 'T12:00:00');
        for (; d <= fin; d.setDate(d.getDate() + 1)) {
          var k = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          if (f.heure_debut) partielles.push({ jour: k, debut: f.heure_debut.slice(0, 5), fin: f.heure_fin.slice(0, 5) });
          else jours.push(k);
        }
      });
      cfg.fermetures = jours;
      cfg.fermeturesPartielles = partielles;
    }
    if (r.prestations) {
      cfg.prestations = r.prestations
        .filter(function (p) { return p.actif; })
        .sort(function (a, b) { return a.ordre - b.ordre; })
        .map(function (p) {
          return { code: p.code, nom: p.nom, duree: p.duree_minutes, couverts: p.couverts, description: p.description || '' };
        });
    }
  }

  w.NSR_CONFIG = cfg;
})(window);
