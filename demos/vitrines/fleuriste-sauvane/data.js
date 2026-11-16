/* Sauvane : la seule source des données de la maquette.
   Tiges de l'atelier, papiers, compositions, boutique du jour, occasions, horaires.
   Toutes les valeurs sont des valeurs de démonstration (prix, horaires, délais). */
(function () {
  'use strict';

  var S = window.SAUVANE = {};

  /* ---------- les tiges de l'atelier (composition 3D) ---------- */
  S.tiges = [
    { id: 'pivoine',   nom: 'Pivoine',    detail: 'corail, pleine',     prix: 7.0, max: 9,  teinte: '#e8735f' },
    { id: 'renoncule', nom: 'Renoncule',  detail: 'crème, serrée',      prix: 4.5, max: 12, teinte: '#f3e6c9' },
    { id: 'anemone',   nom: 'Anémone',    detail: 'blanche, cœur noir', prix: 4.0, max: 12, teinte: '#f4f1f2' },
    { id: 'tulipe',    nom: 'Tulipe',     detail: 'jaune pollen',       prix: 3.0, max: 12, teinte: '#f2c84b' },
    { id: 'chardon',   nom: 'Chardon',    detail: 'bleu acier',         prix: 3.5, max: 9,  teinte: '#6d82b8' },
    { id: 'eucalyptus',nom: 'Eucalyptus', detail: 'feuillage argenté',  prix: 2.5, max: 10, teinte: '#9fb5ae' }
  ];
  S.MAX_TIGES = 36;
  S.MIN_TIGES = 5;

  S.papiers = [
    { id: 'perle', nom: 'Soie gris perle', prix: 3, couleur: '#b9b5be' },
    { id: 'mure',  nom: 'Soie mûre',       prix: 3, couleur: '#4a2a3d' },
    { id: 'nu',    nom: 'Lien seul',       prix: 0, couleur: null }
  ];
  S.NOUAGE = 4;   // nouage à la main, toujours compté

  /* Compositions de l'atelier : un point de départ, que l'on ajuste ensuite */
  S.compositions = [
    { id: 'clair-obscur', nom: 'Clair-obscur', papier: 'mure',
      tiges: { pivoine: 4, anemone: 5, eucalyptus: 4, renoncule: 2 } },
    { id: 'pollen', nom: 'Pollen', papier: 'perle',
      tiges: { tulipe: 7, renoncule: 4, chardon: 3, eucalyptus: 3 } },
    { id: 'blanc', nom: 'Tout blanc', papier: 'perle',
      tiges: { anemone: 6, renoncule: 5, eucalyptus: 5 } },
    { id: 'brassee', nom: 'Grande brassée', papier: 'mure',
      tiges: { pivoine: 5, renoncule: 5, anemone: 5, tulipe: 5, chardon: 4, eucalyptus: 6 } }
  ];

  /* ---------- la boutique du jour ---------- */
  S.produits = [
    { id: 'clair-obscur', cat: 'Bouquets', nom: 'Clair-obscur', img: 'bq-clair-obscur',
      desc: 'Pivoines corail, anémones blanches, eucalyptus.',
      tailles: [{ n: 'Classique', p: 48 }, { n: 'Généreux', p: 68 }] },
    { id: 'pollen', cat: 'Bouquets', nom: 'Pollen', img: 'bq-pollen',
      desc: 'Tulipes jaunes, renoncules crème, chardons bleus.',
      tailles: [{ n: 'Classique', p: 39 }, { n: 'Généreux', p: 55 }] },
    { id: 'hiver', cat: 'Bouquets', nom: 'Veille d’hiver', img: 'bq-hiver',
      desc: 'Hellébores blanches, branches d’ilex, pin, eucalyptus.',
      tailles: [{ n: 'Classique', p: 44 }, { n: 'Généreux', p: 62 }] },
    { id: 'mot-doux', cat: 'Bouquets', nom: 'Mot doux', img: 'bq-mot-doux',
      desc: 'Petit bouquet de renoncules, noué au lien, avec sa carte.',
      tailles: [{ n: 'Unique', p: 24 }] },
    { id: 'amaryllis', cat: 'Bouquets', nom: 'Amaryllis', img: 'amaryllis',
      desc: 'Tiges d’amaryllis rouge profond, à poser dans un grand vase.',
      tailles: [{ n: '5 tiges', p: 36 }, { n: '8 tiges', p: 54 }] },
    { id: 'seches', cat: 'Séchés', nom: 'Herbier', img: 'seches',
      desc: 'Pampa, monnaie-du-pape, hortensia et blé séchés. Tient des mois.',
      tailles: [{ n: 'Avec vase', p: 58 }, { n: 'Sans vase', p: 42 }] },
    { id: 'orchidee', cat: 'Plantes', nom: 'Orchidée blanche', img: 'orchidee',
      desc: 'Phalaenopsis à deux hampes, pot en grès anthracite.',
      tailles: [{ n: 'Unique', p: 45 }] },
    { id: 'olivier', cat: 'Plantes', nom: 'Olivier', img: 'olivier',
      desc: 'Environ 80 cm, pot en pierre grise. Lumineux, peu d’eau.',
      tailles: [{ n: 'Unique', p: 89 }] }
  ];

  /* ---------- les jours qui comptent ---------- */
  S.occasions = [
    { id: 'mariage', nom: 'Mariage', img: 'mariage',
      titre: 'Du bouquet de la mariée à la dernière table.',
      texte: 'Un premier rendez-vous à l’atelier, avec vos couleurs, vos photos et votre budget. On revient avec une proposition dessinée et chiffrée, puis on installe le jour J.',
      inclus: ['Bouquet de mariée et boutonnières', 'Centres de table et arche', 'Installation et reprise sur place'] },
    { id: 'deuil', nom: 'Deuil', img: 'deuil',
      titre: 'Dire au revoir avec des fleurs justes.',
      texte: 'Couronnes, gerbes et coussins, composés dans la journée. On peut livrer directement au funérarium ou à l’église, et vous aider à trouver les mots de la carte.',
      inclus: ['Couronnes, gerbes, coussins', 'Livraison au lieu de la cérémonie', 'Ruban et carte écrits à la main'] },
    { id: 'entreprise', nom: 'Entreprise', img: 'entreprise',
      titre: 'Un accueil qui change chaque semaine.',
      texte: 'Une grande composition pour votre réception, renouvelée à la fréquence de votre choix, et les fleurs de vos événements. Facture mensuelle.',
      inclus: ['Abonnement hebdomadaire ou bimensuel', 'Événements et séminaires', 'Facture unique chaque mois'] }
  ];

  /* ---------- horaires (démonstration) : [ouverture, fermeture] en minutes, null = fermé ---------- */
  S.horaires = [
    null,               // dimanche (index 0) : voir plus bas
    null,               // lundi
    [510, 1110],        // mardi 8 h 30 - 18 h 30
    [510, 1110],
    [510, 1110],
    [510, 1110],        // vendredi
    [480, 1020]         // samedi 8 h - 17 h
  ];
  S.horaires[0] = [540, 750];  // dimanche 9 h - 12 h 30
  S.JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  S.DELAI_RETRAIT = 120;       // minutes de préparation avant un retrait
  S.LIVRAISON = 8;             // € (démonstration)

  /* ---------- utilitaires partagés ---------- */
  S.euro = function (n) {
    return (Math.round(n * 100) / 100).toLocaleString('fr-LU', {
      minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  };
  S.tige = function (id) { for (var i = 0; i < S.tiges.length; i++) if (S.tiges[i].id === id) return S.tiges[i]; return null; };
  S.papier = function (id) { for (var i = 0; i < S.papiers.length; i++) if (S.papiers[i].id === id) return S.papiers[i]; return S.papiers[0]; };
  S.produit = function (id) { for (var i = 0; i < S.produits.length; i++) if (S.produits[i].id === id) return S.produits[i]; return null; };
  S.heure = function (m) { var h = Math.floor(m / 60), mn = m % 60; return h + ' h' + (mn ? ' ' + (mn < 10 ? '0' : '') + mn : ''); };

  S.lire = function (cle, defaut) {
    try { var v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; }
  };
  S.ecrire = function (cle, val) {
    try { localStorage.setItem(cle, JSON.stringify(val)); } catch (e) {}
  };

  /* L'état de la composition en cours, lu aussi par la 3D quand elle se charge après coup */
  S.etat = { tiges: { pivoine: 3, renoncule: 3, anemone: 4, tulipe: 3, chardon: 2, eucalyptus: 4 }, papier: 'perle' };
})();
