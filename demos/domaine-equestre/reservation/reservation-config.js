/* ============================================================================
   Domaine de Valombre — configuration de la réservation en ligne
   ----------------------------------------------------------------------------
   SEUL fichier propre au site. Le moteur (nsr-reservation.js) et le style de
   base (nsr-reservation.css) sont ceux du module NS Development, identiques
   chez tous les clients et jamais retouchés ici.

   DÉMONSTRATION : `backend: 'local'`. Les rendez-vous restent dans le
   navigateur du visiteur, rien n'est envoyé nulle part. Le jour d'une vraie
   mise en service, on passe à 'supabase' et on renseigne le projet.
   ============================================================================ */
window.NSR_CONFIG = {
  backend: 'local',
  slug: 'domaine-valombre',
  prefixeReference: 'VLB',

  etablissement: {
    nom: 'Domaine de Valombre',
    adresse: '1, route du Domaine — L-0000 Luxembourg', // à compléter
    telephone: '+352 00 00 00 00', // à compléter

    // Le domaine confirme lui-même : une visite se prépare.
    modeValidation: 'manuel',

    pasMinutes: 30,
    delaiMiniHeures: 12,
    horizonJours: 42,
    annulationMiniHeures: 24,
  },

  /* Les prestations du domaine. Durées réalistes pour un centre équestre :
     une séance à cheval ne se règle pas en vingt minutes. */
  prestations: [
    {
      code: 'visite',
      nom: 'Visite du domaine',
      duree: 45,
      description: 'Le tour des installations avec un enseignant. Sans engagement.',
    },
    {
      code: 'essai',
      nom: "Séance d'essai",
      duree: 60,
      description: 'Une reprise pour se situer, sur un cheval choisi pour vous.',
    },
    {
      code: 'cours',
      nom: 'Cours particulier',
      duree: 60,
      description: 'Un cavalier, un enseignant. Le travail se construit sur la durée.',
    },
    {
      code: 'coaching',
      nom: 'Coaching performance',
      duree: 90,
      description: 'Travail sur le plat ou à l’obstacle, préparation de concours.',
    },
    {
      code: 'pension',
      nom: 'Rendez-vous pension',
      duree: 30,
      description: 'Pour un propriétaire qui cherche une écurie pour son cheval.',
    },
  ],

  /* 0 = dimanche … 6 = samedi. Lundi, le domaine est fermé au public. */
  ouvertures: {
    1: [],
    2: [['09:00', '12:00'], ['14:00', '19:00']],
    3: [['09:00', '12:00'], ['14:00', '19:00']],
    4: [['09:00', '12:00'], ['14:00', '19:00']],
    5: [['09:00', '12:00'], ['14:00', '19:00']],
    6: [['09:00', '13:00'], ['14:00', '18:00']],
    0: [['09:00', '13:00']],
  },

  fermetures: [],
  prestationsADomicile: [],
  champsMasques: [],

  textes: {
    etapes: ['Prestation', 'Créneau', 'Coordonnées', 'Confirmation'],
    choixTitre: 'Que souhaitez-vous réserver ?',
    choixAide: 'La durée dépend de la prestation. Un cheval vous est attribué à l’arrivée.',
    choixSuivant: 'Choisir un créneau',
    creneauTitre: 'Choisissez votre créneau',
    creneauAide: 'Le domaine est fermé au public le lundi.',
    coordonneesTitre: 'Vos coordonnées',
    coordonneesAide: 'Elles servent uniquement à confirmer votre venue.',
    valider: 'Demander ce créneau',
    noteLabel: 'Votre expérience à cheval',
    notePlaceholder: 'Débutant, reprise après une pause, galop 4…',
    premiereVisite: 'C’est ma première venue au domaine',
    apresConfirmation:
      'Prévoyez une tenue longue et des chaussures fermées ; bombe et gilet sont prêtés sur place. ' +
      'Présentez-vous quinze minutes avant l’heure, le temps de faire connaissance avec votre cheval.',
  },

  /* Agenda préchargé : un prospect ne doit pas tomber sur une grille vide. */
  demo: true,
  demoRendezVous: [
    { dans: 1, debut: '10:00', prestation: 'cours', nom: 'Mme Lemaire' },
    { dans: 1, debut: '15:00', prestation: 'coaching', nom: 'M. Hoffmann' },
    { dans: 2, debut: '09:30', prestation: 'essai', nom: 'M. Feyder' },
    { dans: 2, debut: '16:00', prestation: 'cours', nom: 'Mme Thill' },
    { dans: 3, debut: '11:00', prestation: 'visite', nom: 'Famille Weber' },
    { dans: 4, debut: '14:30', prestation: 'cours', nom: 'M. Origer' },
    { dans: 5, debut: '10:30', prestation: 'pension', nom: 'Mme Kremer' },
  ],
}
