/* ============================================================================
   Kinésithérapie Kelmen — configuration de la réservation en ligne
   ----------------------------------------------------------------------------
   Seul fichier propre à ce site. Le moteur (nsr-reservation.js) et le style
   de base (nsr-reservation.css) sont ceux de sites-web/modules/reservation/,
   partagés avec tous les autres clients.

   État actuel : MAQUETTE DE PROSPECTION (backend 'local').
   Les rendez-vous pris ici restent dans le navigateur du visiteur.

   Le jour où Nora Kelmen signe :
     1. exécuter backend/installer-un-client.sql (déjà rempli à son nom)
     2. ici, passer backend à 'supabase' et renseigner le bloc supabase
   Rien d'autre à changer. Les prestations et les horaires seront alors lus
   dans la base, pour qu'elle puisse les modifier elle-même.
   ============================================================================ */
window.NSR_CONFIG = {

  backend: 'local',
  slug: 'kine-kelmen',
  prefixeReference: 'KS',

  // À remplir au passage en production.
  supabase: { url: '', cle: '' },

  etablissement: {
    nom: 'Kinésithérapie Kelmen',
    adresse: '21, rue de la Gare — L-6117 Junglinster',
    telephone: '+352 27 00 00 00',
    modeValidation: 'auto',
    pasMinutes: 30,
    delaiMiniHeures: 4,
    horizonJours: 42,
    annulationMiniHeures: 24
  },

  // Les quatre spécialisations déclarées à l'ALK, plus le bilan et la visite
  // à domicile. Durées calées sur la pratique d'un cabinet de kinésithérapie.
  prestations: [
    { code: 'bilan',    nom: 'Premier bilan',            duree: 45,
      description: 'Première venue : bilan complet et plan de traitement.' },
    { code: 'seance',   nom: 'Séance de suivi',          duree: 30,
      description: 'Séance de rééducation dans un traitement en cours.' },
    { code: 'sport',    nom: 'Kinésithérapie du sport',  duree: 45,
      description: 'Blessure sportive, reprise, prévention, taping.' },
    { code: 'drainage', nom: 'Drainage lymphatique',     duree: 60,
      description: 'Drainage manuel, suites de chirurgie, œdèmes.' },
    { code: 'respi',    nom: 'Rééducation respiratoire', duree: 30,
      description: 'Adultes et enfants, encombrement, souffle.' },
    { code: 'domicile', nom: 'Visite à domicile',        duree: 45,
      description: 'Sur prescription, pour les patients non déplaçables.' }
  ],

  prestationsADomicile: ['domicile'],

  // 0 = dimanche … 6 = samedi. Horaires de démonstration.
  ouvertures: {
    1: [['08:00', '12:00'], ['13:30', '18:30']],
    2: [['08:00', '12:00'], ['13:30', '18:30']],
    3: [['08:00', '12:00'], ['13:30', '18:30']],
    4: [['08:00', '12:00'], ['13:30', '19:00']],
    5: [['08:00', '12:00'], ['13:30', '17:00']],
    6: [['09:00', '12:00']],
    0: []
  },

  // Jours fériés luxembourgeois à venir.
  fermetures: ['2026-08-15', '2026-11-01', '2026-12-25', '2026-12-26'],

  textes: {
    etapes: ['Motif', 'Créneau', 'Coordonnées', 'Confirmation'],
    choixTitre: 'Pourquoi venez-vous ?',
    choixAide: 'La durée du rendez-vous dépend du motif. Si vous hésitez, choisissez « Premier bilan ».',
    choixSuivant: 'Choisir un créneau',
    creneauTitre: 'Choisissez votre créneau',
    creneauAide: 'Les horaires barrés sont déjà réservés. Réservation possible jusqu\'à 6 semaines à l\'avance, au plus tard 4 h avant la séance.',
    coordonneesTitre: 'Vos coordonnées',
    coordonneesAide: 'Elles servent uniquement à confirmer et, si besoin, à vous prévenir d\'un changement.',
    valider: 'Confirmer le rendez-vous',
    confirmeTitre: 'C\'est réservé',
    confirmeAide: 'Votre créneau est bloqué dans l\'agenda du cabinet. Il n\'apparaît plus pour les autres patients.',
    noteLabel: 'Motif détaillé',
    notePlaceholder: 'Depuis quand ? Quelle zone ? Opération récente ? Toute précision utile avant la séance.',
    premiereVisite: 'C\'est ma première venue au cabinet',
    recommencer: 'Prendre un autre rendez-vous',
    apresConfirmation:
      'Pensez à apporter votre <strong>ordonnance</strong> et votre <strong>carte CNS</strong>. ' +
      'Un empêchement ? Prévenez la veille au <a href="tel:+35227000000">27 00 00 00</a>, ' +
      'le créneau repartira à quelqu\'un d\'autre.'
  },

  // Le module parle la langue de la page. Le moteur apporte déjà son propre
  // vocabulaire (jours, mois, « Retour », messages d'erreur) : il ne reste
  // ici que les mots du cabinet.
  traductions: {
    lb: {
      textes: {
        etapes: ['Grond', 'Termin', 'Kontakt', 'Bestätegung'],
        choixTitre: 'Firwat kommt Dir?',
        choixAide: 'D\'Dauer vum Rendez-vous hänkt vum Grond of. Wann Dir onsécher sidd, wielt « Éischte Bilan ».',
        choixSuivant: 'En Termin wielen',
        creneauTitre: 'Wielt Ären Termin',
        creneauAide: 'Duerchgestrachen Auerzäite sinn schonn ergraff. Reservatioun bis 6 Wochen am Viraus méiglech, spéitstens 4 Stonne virun der Séance.',
        coordonneesTitre: 'Är Kontaktdaten',
        coordonneesAide: 'Si déngen nëmme fir ze bestätegen an, wann néideg, Iech iwwer eng Ännerung ze informéieren.',
        valider: 'De Rendez-vous bestätegen',
        confirmeTitre: 'Et ass reservéiert',
        confirmeAide: 'Ären Termin ass am Agenda vum Cabinet blockéiert. Hie gëtt deenen anere Patienten net méi ugewisen.',
        attenteTitre: 'Ufro geschéckt',
        attenteAide: 'Är Ufro ass gutt ukomm. Dir kritt eng Bestätegung, soubal se validéiert ass.',
        rgpd: 'Ech si domat averstanen, datt meng Kontaktdate fir d\'Verwaltung vun dësem Rendez-vous benotzt ginn. Si ginn net weiderverkaaft an net fir aner Zwecker benotzt.',
        noteLabel: 'Grond am Detail',
        notePlaceholder: 'Zënter wéini? Wéi eng Zon? Rezent Operatioun? All nëtzlech Präzisioun virun der Séance.',
        premiereVisite: 'Et ass mäin éischte Besuch am Cabinet',
        recommencer: 'Nach e Rendez-vous huelen',
        lieuDomicile: 'Bei Iech doheem',
        apresConfirmation:
          'Denkt drun, Är <strong>Ordonnance</strong> an Är <strong>CNS-Kaart</strong> matzebréngen. ' +
          'Verhënnert? Sot den Dag virdrun Bescheed um <a href="tel:+35227000000">27 00 00 00</a>, ' +
          'den Termin geet dann un een aneren.'
      },
      prestations: {
        bilan:    { nom: 'Éischte Bilan',
                    description: 'Éischte Besuch: kompletten Bilan a Behandlungsplang.' },
        seance:   { nom: 'Follow-up-Séance',
                    description: 'Rehabilitatiounsséance an enger lafender Behandlung.' },
        sport:    { nom: 'Sportkinesitherapie',
                    description: 'Sportblessur, Nei-Ufank, Preventioun, Taping.' },
        drainage: { nom: 'Lymphatesch Drainage',
                    description: 'Manuell Drainage, no enger Operatioun, Ödemer.' },
        respi:    { nom: 'Atmungsrehabilitatioun',
                    description: 'Erwuessener a Kanner, verschleimt Loftweeër, Otem.' },
        domicile: { nom: 'Hausbesich',
                    description: 'Op Verschreiwung, fir Patienten déi net kënne kommen.' }
      }
    }
  },

  // Agenda préchargé pour la démonstration : une grille vide ne montre rien.
  demo: true,
  demoRendezVous: [
    { dans: 1, debut: '09:00', prestation: 'seance',   nom: 'M. Kelmen' },
    { dans: 1, debut: '10:30', prestation: 'bilan',    nom: 'Mme Klein' },
    { dans: 1, debut: '14:00', prestation: 'sport',    nom: 'M. Reuter' },
    { dans: 2, debut: '08:30', prestation: 'seance',   nom: 'Mme Hoffmann' },
    { dans: 2, debut: '15:00', prestation: 'drainage', nom: 'Mme Thill' },
    { dans: 3, debut: '09:30', prestation: 'respi',    nom: 'Enfant Muller' },
    { dans: 3, debut: '16:30', prestation: 'seance',   nom: 'M. Wagner' },
    { dans: 4, debut: '11:00', prestation: 'seance',   nom: 'Mme Braun' },
    { dans: 5, debut: '08:00', prestation: 'bilan',    nom: 'M. Faber' }
  ]
};
