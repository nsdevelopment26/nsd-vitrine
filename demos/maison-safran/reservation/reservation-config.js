/* ============================================================================
   Maison Safran — configuration de la réservation en ligne
   ----------------------------------------------------------------------------
   SEUL fichier propre au site. Le moteur (nsr-reservation.js) et le style de
   base (nsr-reservation.css) sont ceux du module NS Development, identiques
   chez tous les clients et jamais retouchés ici.

   DÉMONSTRATION : `backend: 'local'`. Les réservations restent dans le
   navigateur du visiteur, rien n'est envoyé nulle part. Le jour d'une vraie
   mise en service, on passe à 'supabase' et on renseigne le projet.

   PARTICULARITÉ RESTAURANT : `placesParCreneau`. Un praticien n'a qu'une paire
   de mains, une salle a plusieurs tables. Ici, cinq tables peuvent démarrer sur
   le même créneau ; la sixième demande ne le trouve plus libre.
   ============================================================================ */
window.NSR_CONFIG = {
  backend: 'local',
  slug: 'maison-safran',
  prefixeReference: 'MS',

  etablissement: {
    nom: 'Maison Safran',
    adresse: '00, rue des Capucins — L-0000 Luxembourg', // à compléter
    telephone: '+352 00 00 00 00', // à compléter

    // La maison rappelle pour confirmer : une table se prépare.
    modeValidation: 'manuel',

    placesParCreneau: 5,
    pasMinutes: 15,
    delaiMiniHeures: 3,
    horizonJours: 45,
    annulationMiniHeures: 12,
  },

  /* On ne demande pas « quelle prestation » à quelqu'un qui vient dîner : on
     demande combien il sera. La taille de la table devient la prestation, et
     sa durée d'occupation suit — un déjeuner à deux libère la table bien avant
     un dîner à six. */
  prestations: [
    {
      code: 'duo',
      nom: 'Table de deux',
      duree: 105,
      description: 'Deux couverts, en salle.',
    },
    {
      code: 'quatre',
      nom: 'Table de trois à quatre',
      duree: 120,
      description: 'Jusqu’à quatre couverts, en salle.',
    },
    {
      code: 'six',
      nom: 'Table de cinq à six',
      duree: 150,
      description: 'Jusqu’à six couverts. Menu unique pour la table le soir.',
    },
    {
      code: 'chef',
      nom: 'La table du chef',
      duree: 180,
      description: 'Six places au comptoir, face au passe. Une seule par service.',
    },
    {
      code: 'privatisation',
      nom: 'Privatisation de la salle',
      duree: 240,
      description: 'À partir de 24 couverts. La maison vous rappelle pour le menu.',
    },
  ],

  /* 0 = dimanche … 6 = samedi.
     Les bornes sont celles d'occupation de la table, pas celles du service :
     la dernière commande part à 21h30, la table se libère vers 23h. */
  ouvertures: {
    0: [],
    1: [],
    2: [['12:00', '15:00'], ['19:00', '23:00']],
    3: [['12:00', '15:00'], ['19:00', '23:00']],
    4: [['12:00', '15:00'], ['19:00', '23:00']],
    5: [['12:00', '15:00'], ['19:00', '23:15']],
    6: [['19:00', '23:15']],
  },

  fermetures: [],
  prestationsADomicile: [],
  champsMasques: [],

  textes: {
    etapes: ['La table', 'Le créneau', 'Vos coordonnées', 'Confirmation'],
    choixTitre: 'Combien serez-vous ?',
    choixAide:
      'Au-delà de huit couverts, un appel vaut mieux qu’un formulaire : la maison compose le menu avec vous.',
    choixSuivant: 'Choisir un créneau',
    creneauTitre: 'Choisissez votre créneau',
    creneauAide: 'Fermé le dimanche et le lundi. Le samedi, service du soir uniquement.',
    coordonneesTitre: 'Vos coordonnées',
    coordonneesAide: 'Elles servent uniquement à confirmer votre table.',
    valider: 'Demander cette table',
    noteLabel: 'Allergies, régime, occasion',
    notePlaceholder: 'Sans gluten, anniversaire, menu végétarien…',
    premiereVisite: 'C’est ma première venue à la Maison Safran',
    apresConfirmation:
      'La maison vous rappelle pour confirmer, en général dans la demi-journée. ' +
      'La table est tenue quinze minutes après l’heure convenue.',
  },

  /* Agenda préchargé : un prospect ne doit pas tomber sur une grille vide.
     Avec cinq tables par créneau, il faut plusieurs réservations sur la même
     heure pour la faire disparaître — c'est exactement ce qu'on veut montrer. */
  demo: true,
  demoRendezVous: [
    { dans: 1, debut: '12:15', prestation: 'quatre', nom: 'M. Weber' },
    { dans: 1, debut: '19:30', prestation: 'duo', nom: 'Mme Schmit' },
    { dans: 1, debut: '19:30', prestation: 'six', nom: 'Famille Reuter' },
    { dans: 1, debut: '20:00', prestation: 'chef', nom: 'M. Origer' },

    /* Le service du soir de J+2 est complet : cinq tables se chevauchent
       autour de 20 h. C'est ce qu'il faut montrer à un prospect — un agenda
       qui refuse vraiment, pas un formulaire qui accepte tout. */
    { dans: 2, debut: '12:30', prestation: 'duo', nom: 'Mme Hoffmann' },
    { dans: 2, debut: '19:30', prestation: 'quatre', nom: 'M. Kremer' },
    { dans: 2, debut: '19:45', prestation: 'duo', nom: 'Mme Braun' },
    { dans: 2, debut: '20:00', prestation: 'six', nom: 'Famille Wagner' },
    { dans: 2, debut: '20:00', prestation: 'quatre', nom: 'M. Schroeder' },
    { dans: 2, debut: '20:15', prestation: 'duo', nom: 'Mme Klein' },

    { dans: 3, debut: '19:45', prestation: 'duo', nom: 'M. Thill' },
    { dans: 3, debut: '20:15', prestation: 'six', nom: 'Mme Feyder' },
    { dans: 4, debut: '19:00', prestation: 'privatisation', nom: 'Étude Muller' },
    { dans: 5, debut: '20:00', prestation: 'quatre', nom: 'M. Lemaire' },
  ],
}
