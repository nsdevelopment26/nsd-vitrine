/* ============================================================================
   Domaine de Valombre : la seule source des données de la maquette.
   Tout ce qui est affiché (lieux, cours, balades, pensions, chevaux, horaires,
   tarifs) vient d'ici. VALEURS DE DÉMONSTRATION : rien n'est un vrai tarif ni
   un vrai planning, c'est dit sur la page.
   ========================================================================== */
window.VALOMBRE = {
  domaine: {
    nom: 'Domaine de Valombre',
    telephone: '+352 27 00 00 00',
    telLien: '+35227000000',
    mobile: '+352 621 00 00 00',
    courriel: 'bonjour@valombre.example',
    adresse: 'Adresse à compléter, Gutland, Luxembourg',
    langues: 'Français, luxembourgeois, allemand, anglais'
  },

  /* 0 = dimanche … 6 = samedi. Lundi : fermé au public, les chevaux se reposent. */
  horaires: {
    0: ['08:00', '18:00'], 1: null, 2: ['08:00', '20:00'], 3: ['08:00', '20:00'],
    4: ['08:00', '20:00'], 5: ['08:00', '20:00'], 6: ['08:00', '18:00']
  },
  joursNoms: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],

  /* Les lieux du relief 3D. x / z : position sur la maquette (unités de la scène). */
  lieux: [
    { id: 'ecuries', nom: 'Les écuries', offre: 'Pensions', x: -14, z: 6,
      titre: 'Une écurie de pierre pour votre cheval',
      texte: 'Boxes en pierre ouverts sur l’allée, sortie quotidienne au paddock, foin à volonté. Trois formules, du pré à la pleine pension travail.',
      faits: ['Boxes paillés ou copeaux', 'Sortie au paddock chaque jour', 'Visite sans engagement'],
      action: 'Voir les pensions', cible: '#pensions' },
    { id: 'manege', nom: 'Le manège couvert', offre: 'Cours', x: 8, z: 2,
      titre: 'Des reprises par tous les temps',
      texte: 'Le manège couvert accueille les cours collectifs et particuliers, du premier galop au travail sur le plat de haut niveau.',
      faits: ['Cours du mardi au dimanche', 'Groupes de six cavaliers au plus', 'Cheval attribué selon votre niveau'],
      action: 'Voir le planning', cible: '#cours' },
    { id: 'carriere', nom: 'La carrière', offre: 'Coaching', x: 14, z: 18,
      titre: 'La carrière, pour le plat et l’obstacle',
      texte: 'Sable drainé, lisses blanches, vue sur les prés. On y prépare les concours et on y monte dès que le temps le permet.',
      faits: ['Coaching plat et obstacle', 'Préparation aux concours', 'Votre cheval ou celui du domaine'],
      action: 'Réserver un coaching', cible: '#reserver', activite: 'cours' },
    { id: 'pres', nom: 'Les prés', offre: 'Pension au pré', x: -2, z: 26,
      titre: 'Des hectares d’herbe et un abri',
      texte: 'Pour les chevaux qui vivent mieux dehors : pré en petit groupe stable, abri en bois, eau courante, ronde du soir.',
      faits: ['Groupes formés avec soin', 'Abri et râtelier couverts', 'Ronde du soir chaque jour'],
      action: 'Voir les pensions', cible: '#pensions' },
    { id: 'poneys', nom: 'Le pré des poneys', offre: 'École', x: -26, z: 20,
      titre: 'Les premiers pas, à hauteur d’enfant',
      texte: 'Dès six ans, sur nos poneys. On apprend à les panser, à les mener en main, puis à monter. Stages pendant les vacances scolaires.',
      faits: ['Dès 6 ans', 'Mercredi et samedi', 'Stages de vacances'],
      action: 'Réserver un cours d’essai', cible: '#reserver', activite: 'cours' },
    { id: 'foret', nom: 'La hêtraie', offre: 'Balades', x: 4, z: -30,
      titre: 'Trois boucles dans la forêt et sur les crêtes',
      texte: 'Au pas dans la hêtraie, au galop sur les chemins des crêtes, ou une journée entière dans la vallée avec pique-nique.',
      faits: ['Départs mercredi, samedi, dimanche', 'Accompagnées par un enseignant', 'Cheval choisi pour vous'],
      action: 'Choisir une balade', cible: '#balades' }
  ],

  /* Les boucles tracées sur le relief. Points : [x, z] sur la maquette. */
  balades: [
    { id: 'hetraie', nom: 'La Hêtraie', duree: '1 h', km: 6, niveau: 'debutant', niveauTexte: 'Débutant, au pas',
      prix: 45, depart: ['09:30', '14:00'],
      texte: 'Au pas sous les hêtres, une montée douce et le retour par l’allée des chênes. Idéale pour une première fois.',
      points: [[-6, 10], [-4, -4], [-10, -16], [-2, -26], [10, -24], [14, -12], [8, -2], [-6, 10]] },
    { id: 'cretes', nom: 'Les Crêtes', duree: '2 h 30', km: 15, niveau: 'g3', niveauTexte: 'Galop 3, trot et galop',
      prix: 75, depart: ['09:30', '14:00'],
      texte: 'On monte par la hêtraie jusqu’aux crêtes, longues lignes droites pour galoper, vue sur toute la vallée.',
      points: [[-6, 10], [-18, -6], [-30, -22], [-20, -40], [4, -44], [28, -36], [36, -18], [24, 0], [6, 6], [-6, 10]] },
    { id: 'vallee', nom: 'La Vallée', duree: 'La journée', km: 28, niveau: 'g5', niveauTexte: 'Galop 5, cavaliers à l’aise',
      prix: 160, depart: ['09:00'],
      texte: 'Une journée entière : la forêt, les crêtes, puis la vallée et le gué. Pique-nique au bord de l’eau, retour en fin d’après-midi.',
      points: [[-6, 10], [-34, 4], [-46, -18], [-38, -44], [-8, -52], [26, -48], [46, -30], [48, -4], [40, 22], [22, 30], [-6, 10]] }
  ],
  baladeJours: [0, 3, 6],

  niveaux: [
    { id: 'decouverte', nom: 'Découverte, poneys dès 6 ans' },
    { id: 'debutant', nom: 'Débutant, jamais ou peu monté' },
    { id: 'g1', nom: 'Galops 1 et 2' },
    { id: 'g3', nom: 'Galops 3 et 4' },
    { id: 'g5', nom: 'Galops 5 à 7' }
  ],

  /* Le planning de la semaine. jour : 0 = dimanche … 6 = samedi. */
  cours: [
    { jour: 2, h: '17:30', duree: 60, titre: 'Reprise Galops 1-2', niveau: 'g1', type: 'collectif', lieu: 'Manège', places: 6, prises: 4 },
    { jour: 2, h: '19:00', duree: 60, titre: 'Adultes, reprise du soir', niveau: 'g3', type: 'collectif', lieu: 'Manège', places: 6, prises: 6 },
    { jour: 3, h: '10:00', duree: 60, titre: 'Poneys, premiers pas', niveau: 'decouverte', type: 'poney', lieu: 'Pré des poneys', places: 8, prises: 5 },
    { jour: 3, h: '14:00', duree: 60, titre: 'Poneys, Galop 1', niveau: 'decouverte', type: 'poney', lieu: 'Manège', places: 8, prises: 7 },
    { jour: 3, h: '16:30', duree: 60, titre: 'Reprise Galops 3-4', niveau: 'g3', type: 'collectif', lieu: 'Carrière', places: 6, prises: 3 },
    { jour: 4, h: '18:00', duree: 60, titre: 'Travail sur le plat', niveau: 'g5', type: 'collectif', lieu: 'Manège', places: 5, prises: 2 },
    { jour: 4, h: '19:15', duree: 45, titre: 'Cours particulier', niveau: 'tous', type: 'particulier', lieu: 'Manège', places: 1, prises: 0 },
    { jour: 5, h: '17:30', duree: 60, titre: 'Débutants adultes', niveau: 'debutant', type: 'collectif', lieu: 'Manège', places: 6, prises: 2 },
    { jour: 5, h: '19:00', duree: 75, titre: 'Obstacle Galops 5-7', niveau: 'g5', type: 'collectif', lieu: 'Carrière', places: 5, prises: 4 },
    { jour: 6, h: '09:00', duree: 60, titre: 'Poneys, premiers pas', niveau: 'decouverte', type: 'poney', lieu: 'Pré des poneys', places: 8, prises: 8 },
    { jour: 6, h: '10:30', duree: 60, titre: 'Débutants adultes', niveau: 'debutant', type: 'collectif', lieu: 'Manège', places: 6, prises: 3 },
    { jour: 6, h: '14:00', duree: 60, titre: 'Reprise Galops 1-2', niveau: 'g1', type: 'collectif', lieu: 'Carrière', places: 6, prises: 1 },
    { jour: 6, h: '16:00', duree: 45, titre: 'Cours particulier', niveau: 'tous', type: 'particulier', lieu: 'Manège', places: 1, prises: 0 },
    { jour: 0, h: '10:00', duree: 90, titre: 'Coaching concours', niveau: 'g5', type: 'particulier', lieu: 'Carrière', places: 3, prises: 1 },
    { jour: 0, h: '11:00', duree: 60, titre: 'Reprise en famille', niveau: 'debutant', type: 'collectif', lieu: 'Manège', places: 6, prises: 2 }
  ],
  coursTypes: { collectif: 'Collectif', particulier: 'Particulier', poney: 'Poneys' },
  prixCours: { collectif: 38, particulier: 65, poney: 28, essai: 30 },

  pensions: [
    { id: 'pre', nom: 'Au pré', prix: 420, pour: 'Chevaux qui vivent mieux dehors',
      inclus: ['Pré en groupe stable', 'Abri et foin à volonté', 'Ronde du soir', 'Accès manège et carrière'] },
    { id: 'box', nom: 'Box et paddock', prix: 690, pour: 'Le confort de l’écurie, le dehors chaque jour',
      inclus: ['Box paillé, curé chaque jour', 'Paddock tous les jours', 'Trois repas, foin à volonté', 'Accès manège et carrière'] },
    { id: 'travail', nom: 'Pension travail', prix: 1090, pour: 'Quand votre agenda ne suit pas',
      inclus: ['Tout « Box et paddock »', 'Travail monté trois fois par semaine', 'Compte rendu chaque semaine', 'Accompagnement en concours'] }
  ],
  pensionOptions: [
    { id: 'couv', nom: 'Gestion des couvertures', prix: 40 },
    { id: 'marcheur', nom: 'Marcheur, deux fois par semaine', prix: 60 },
    { id: 'longe', nom: 'Longe ou travail à pied, une fois par semaine', prix: 80 }
  ],

  chevaux: [
    { id: 'pepin', nom: 'Pépin', robe: 'Poney welsh, bai brun', taille: 'poney', niveaux: ['decouverte', 'debutant'],
      caractere: 'Patient, gourmand, le premier ami des enfants. Il sait attendre qu’on ait fini de le brosser.', photo: 'pepin' },
    { id: 'brume', nom: 'Brume', robe: 'Gris pommelé', taille: 'cheval', niveaux: ['debutant', 'g1', 'g3'],
      caractere: 'Le calme même. On lui confie les cavaliers qui reprennent et les balades dans la hêtraie.', photo: 'brume' },
    { id: 'orme', nom: 'Orme', robe: 'Bai, en-tête', taille: 'cheval', niveaux: ['g1', 'g3', 'g5'],
      caractere: 'Franc et généreux, il avance devant la jambe. Le cheval des crêtes et des premiers galops en terrain.', photo: 'orme' },
    { id: 'sorbier', nom: 'Sorbier', robe: 'Alezan, liste en tête', taille: 'cheval', niveaux: ['g3', 'g5'],
      caractere: 'Curieux et respectueux, il aime l’obstacle. Il demande une main légère.', photo: 'sorbier' },
    { id: 'ardoise', nom: 'Ardoise', robe: 'Noir zain', taille: 'cheval', niveaux: ['g5'],
      caractere: 'Sensible et brillante sur le plat. Pour les cavaliers qui veulent affiner leurs aides.', photo: 'ardoise' }
  ],

  /* Une journée au domaine : chaque chapitre règle l'heure et le lieu du relief. */
  journee: [
    { h: 7, heure: '7 h', lieu: 'ecuries', titre: 'Les écuries se réveillent',
      texte: 'Premier repas, boxes curés, chaque cheval regardé un par un avant de sortir.', photo: 'ecuries' },
    { h: 9.5, heure: '9 h 30', lieu: 'pres', titre: 'La brume quitte les prés',
      texte: 'Les chevaux au pré, les autres au paddock. Le domaine s’ouvre aux cavaliers.', photo: 'pres' },
    { h: 11, heure: '11 h', lieu: 'carriere', titre: 'On travaille en carrière',
      texte: 'Plat, barres au sol, préparation des concours. Le sable sèche vite.', photo: 'carriere' },
    { h: 14.5, heure: '14 h 30', lieu: 'foret', titre: 'Départ pour la hêtraie',
      texte: 'Les balades partent par l’allée des chênes et montent vers les crêtes.', photo: 'balade' },
    { h: 18, heure: '18 h', lieu: 'poneys', titre: 'Le soir tombe sur le pré',
      texte: 'Dernière reprise des enfants, ronde du soir, les lumières de l’écurie s’allument.', photo: 'poney' }
  ],

  /* Créneaux de visite pour une pension (mardi à samedi). */
  visites: ['10:00', '11:00', '15:00', '16:00'],
  essaiCreneaux: ['10:00', '11:30', '15:00', '17:00']
};
