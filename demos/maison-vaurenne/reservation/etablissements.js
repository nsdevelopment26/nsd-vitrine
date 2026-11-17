/* ============================================================================
   Maison Vaurenne — les deux restaurants du groupe (démonstration)
   ----------------------------------------------------------------------------
   Un même patron, deux adresses, deux façons de travailler :

     Maison Vaurenne      table gastronomique, la maison VALIDE chaque demande
     Le Bistrot Vaurenne  bistrot, la réservation se CONFIRME toute seule

   Ce fichier est la source unique des deux établissements. Il est lu :
     - par le site (reservation-config.js choisit le restaurant affiché),
     - par l'espace pro en démonstration (?vitrine=maison-vaurenne), qui
       montre les deux restaurants au patron sous un seul accès.

   Les deux côtés partagent le stockage du navigateur : une table réservée
   sur le site apparaît aussitôt dans l'espace pro, une table annulée dans
   l'espace pro redevient libre sur le site. Rien ne quitte le téléphone.

   Tout est fictif : noms, adresses, téléphones, clients.
   ============================================================================ */
(function (w) {
  var TEXTES = {
    etapes: ['La table', 'Le créneau', 'Vos coordonnées', 'Confirmation'],
    choixTitre: 'Combien serez-vous ?',
    choixSuivant: 'Choisir un créneau',
    creneauTitre: 'Choisissez votre créneau',
    coordonneesTitre: 'Vos coordonnées',
    coordonneesAide: 'Elles servent uniquement à confirmer votre table.',
    noteLabel: 'Allergies, régime, occasion',
    notePlaceholder: 'Sans gluten, anniversaire, menu végétarien…',
    confirmeTitre: 'Votre table est réservée',
    confirmeAide: 'La table est bloquée à votre nom. Vous recevez la confirmation par e-mail.',
    attenteTitre: 'Demande envoyée',
    attenteAide: 'La maison confirme votre table, en général dans la demi-journée.',
    recommencer: 'Réserver une autre table',
    recapPrestation: 'Table',
  };

  w.NSR_ETABLISSEMENTS = [
    {
      backend: 'local',
      slug: 'maison-vaurenne',
      prefixeReference: 'MV',
      etablissement: {
        nom: 'Maison Vaurenne',
        ville: 'Luxembourg',
        concept: 'Table gastronomique',
        metier: 'restaurant',
        adresse: '18, rue des Cuisiniers, L-1110 Luxembourg',
        telephone: '+352 27 00 00 00',
        // La maison rappelle pour confirmer : une table se prépare.
        modeValidation: 'manuel',
        placesParCreneau: 5,
        pasMinutes: 15,
        delaiMiniHeures: 3,
        horizonJours: 45,
        annulationMiniHeures: 12,
      },
      /* On ne demande pas « quelle prestation » à quelqu'un qui vient dîner :
         on demande combien il sera. La taille de la table devient la
         prestation, et sa durée d'occupation suit. */
      prestations: [
        { code: 'duo', nom: 'Table de deux', duree: 105, couverts: 2, description: 'Deux couverts, en salle.' },
        { code: 'quatre', nom: 'Table de trois à quatre', duree: 120, couverts: 4, description: 'Jusqu’à quatre couverts, en salle.' },
        { code: 'six', nom: 'Table de cinq à six', duree: 150, couverts: 6, description: 'Jusqu’à six couverts. Menu unique pour la table le soir.' },
        { code: 'chef', nom: 'La table du chef', duree: 180, couverts: 6, description: 'Six places au comptoir, face au passe. Une seule par service.' },
      ],
      // 0 = dimanche … 6 = samedi. Bornes d'occupation de la table.
      ouvertures: {
        0: [], 1: [],
        2: [['12:00', '15:00'], ['19:00', '23:15']],
        3: [['12:00', '15:00'], ['19:00', '23:15']],
        4: [['12:00', '15:00'], ['19:00', '23:15']],
        5: [['12:00', '15:00'], ['19:00', '23:15']],
        6: [['19:00', '23:15']],
      },
      fermetures: [],
      textes: Object.assign({}, TEXTES, {
        choixAide: 'Au-delà de huit couverts, un appel vaut mieux qu’un formulaire : la maison compose le menu avec vous.',
        creneauAide: 'Fermé le dimanche et le lundi. Le samedi, service du soir uniquement.',
        valider: 'Demander cette table',
        premiereVisite: 'C’est ma première venue à la Maison Vaurenne',
        apresConfirmation: 'La table est tenue quinze minutes après l’heure convenue.',
      }),
      /* Agenda préchargé. Le soir d'après-demain est complet : cinq tables
         se chevauchent autour de 20 h. Un prospect doit voir le système
         refuser, pas un formulaire qui accepte tout. */
      demo: true,
      demoRendezVous: [
        { dans: 0, debut: '19:30', prestation: 'quatre', nom: 'M. Lentz', telephone: '+352 621 00 00 01', note: 'Anniversaire de mariage.' },
        { dans: 0, debut: '20:00', prestation: 'duo', nom: 'Mme Pereira', telephone: '+352 621 00 00 02' },
        { dans: 0, debut: '20:15', prestation: 'six', nom: 'Famille Hansen', telephone: '+352 621 00 00 03', note: 'Une chaise haute.' },
        { dans: 1, debut: '12:15', prestation: 'quatre', nom: 'M. Weber', telephone: '+352 621 00 00 04' },
        { dans: 1, debut: '19:30', prestation: 'duo', nom: 'Mme Schmit', telephone: '+352 621 00 00 05' },
        { dans: 1, debut: '19:30', prestation: 'six', nom: 'Famille Reuter', telephone: '+352 621 00 00 06' },
        { dans: 1, debut: '20:00', prestation: 'chef', nom: 'M. Origer', telephone: '+352 621 00 00 07', statut: 'en_attente' },
        { dans: 2, debut: '12:30', prestation: 'duo', nom: 'Mme Hoffmann', telephone: '+352 621 00 00 08' },
        { dans: 2, debut: '19:30', prestation: 'quatre', nom: 'M. Kremer', telephone: '+352 621 00 00 09' },
        { dans: 2, debut: '19:45', prestation: 'duo', nom: 'Mme Braun', telephone: '+352 621 00 00 10' },
        { dans: 2, debut: '20:00', prestation: 'six', nom: 'Famille Wagner', telephone: '+352 621 00 00 11' },
        { dans: 2, debut: '20:00', prestation: 'quatre', nom: 'M. Schroeder', telephone: '+352 621 00 00 12' },
        { dans: 2, debut: '20:15', prestation: 'duo', nom: 'Mme Klein', telephone: '+352 621 00 00 13', note: 'Sans gluten.' },
        { dans: 3, debut: '19:45', prestation: 'duo', nom: 'M. Thill', telephone: '+352 621 00 00 14' },
        { dans: 3, debut: '20:15', prestation: 'six', nom: 'Mme Feyder', telephone: '+352 621 00 00 15' },
        { dans: 4, debut: '19:00', prestation: 'six', nom: 'Étude Muller', telephone: '+352 621 00 00 16' },
        { dans: 5, debut: '20:00', prestation: 'quatre', nom: 'M. Lemaire', telephone: '+352 621 00 00 17' },
      ],
    },

    {
      backend: 'local',
      slug: 'bistrot-vaurenne',
      prefixeReference: 'BV',
      etablissement: {
        nom: 'Le Bistrot Vaurenne',
        ville: 'Esch-sur-Alzette',
        concept: 'Bistrot, cuisine du marché',
        metier: 'restaurant',
        adresse: '5, rue des Fourneaux, L-4010 Esch-sur-Alzette',
        telephone: '+352 27 00 00 10',
        // Au bistrot, la table se confirme toute seule.
        modeValidation: 'auto',
        placesParCreneau: 8,
        pasMinutes: 15,
        delaiMiniHeures: 1,
        horizonJours: 30,
        annulationMiniHeures: 3,
      },
      prestations: [
        { code: 'deux', nom: 'Table de deux', duree: 90, couverts: 2, description: 'Deux couverts.' },
        { code: 'quatre', nom: 'Table de trois à quatre', duree: 105, couverts: 4, description: 'Jusqu’à quatre couverts.' },
        { code: 'six', nom: 'Table de cinq à six', duree: 120, couverts: 6, description: 'Jusqu’à six couverts.' },
        { code: 'terrasse', nom: 'Table en terrasse', duree: 90, couverts: 4, description: 'Jusqu’à quatre couverts, selon la météo.' },
      ],
      ouvertures: {
        0: [['12:00', '15:30']],
        1: [['11:45', '14:30'], ['18:30', '22:30']],
        2: [['11:45', '14:30'], ['18:30', '22:30']],
        3: [['11:45', '14:30'], ['18:30', '22:30']],
        4: [['11:45', '14:30'], ['18:30', '22:30']],
        5: [['11:45', '14:30'], ['18:30', '23:00']],
        6: [['12:00', '15:00'], ['18:30', '23:00']],
      },
      fermetures: [],
      textes: Object.assign({}, TEXTES, {
        choixAide: 'Plus de six ? Appelez-nous, on vous arrange la salle.',
        creneauAide: 'Ouvert tous les jours. Le dimanche, déjeuner seulement.',
        valider: 'Réserver cette table',
        premiereVisite: 'C’est ma première venue au Bistrot',
        apresConfirmation: 'La table est tenue dix minutes après l’heure convenue.',
      }),
      demo: true,
      demoRendezVous: [
        { dans: 0, debut: '12:15', prestation: 'quatre', nom: 'M. Da Costa', telephone: '+352 621 00 00 18' },
        { dans: 0, debut: '12:30', prestation: 'deux', nom: 'Mme Ries', telephone: '+352 621 00 00 19' },
        { dans: 0, debut: '19:00', prestation: 'six', nom: 'M. Goncalves', telephone: '+352 621 00 00 20', note: 'Deux enfants.' },
        { dans: 0, debut: '19:30', prestation: 'deux', nom: 'Mme Kieffer', telephone: '+352 621 00 00 21' },
        { dans: 0, debut: '20:00', prestation: 'terrasse', nom: 'M. Nilles', telephone: '+352 621 00 00 22' },
        { dans: 1, debut: '12:00', prestation: 'quatre', nom: 'Bureau Clees', telephone: '+352 621 00 00 23' },
        { dans: 1, debut: '19:45', prestation: 'deux', nom: 'Mme Marques', telephone: '+352 621 00 00 24' },
        { dans: 2, debut: '12:30', prestation: 'six', nom: 'M. Schaack', telephone: '+352 621 00 00 25' },
        { dans: 2, debut: '20:00', prestation: 'quatre', nom: 'Mme Ferreira', telephone: '+352 621 00 00 26', note: 'Végétarien pour deux.' },
        { dans: 3, debut: '19:30', prestation: 'deux', nom: 'M. Bettendorf', telephone: '+352 621 00 00 27' },
      ],
    },
  ];
  /* Génération de la démo : quand ce jeu de données change, on repart propre
     plutôt que de mélanger d'anciennes réservations avec les nouvelles. Ce
     fichier est lu des deux côtés, donc le ménage se fait quel que soit
     l'écran ouvert en premier. */
  var GENERATION = '4';
  try {
    // « ?reinitialiser » dans l'adresse : Sam repart d'une démo propre, datée
    // du jour, juste avant son rendez-vous.
    var remise = /[?&]reinitialiser(=|&|$)/.test(w.location.search);
    if (remise || w.localStorage.getItem('vaurenne.demo.generation') !== GENERATION) {
      w.NSR_ETABLISSEMENTS.forEach(function (e) {
        ['.v1', '.v1.amorce', '.reglages'].forEach(function (s) { w.localStorage.removeItem('nsr.' + e.slug + s); });
      });
      w.localStorage.setItem('vaurenne.demo.generation', GENERATION);
    }
  } catch (e) { /* stockage bloqué : rien à nettoyer */ }
})(window);
