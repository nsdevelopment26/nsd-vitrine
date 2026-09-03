/* ============================================================
   ESPACE CLIENT — NS Development
   Version web de l'application mobile (app-mobile/espace-client).
   Même contenu, mêmes chiffres, même client de démonstration.

   DONNÉES DE DÉMONSTRATION : aucun serveur, aucune authentification.
   Le jour où on branche un vrai backend, seul le bloc DONNÉES change.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------- */
  /* DONNÉES                                                     */
  /* ---------------------------------------------------------- */

  var CLIENT = {
    prenom: "Julien",
    nom: "Mercier",
    etablissement: "Maison Vaurenne",
    metier: "Restaurant gastronomique",
    ville: "Luxembourg-Ville",
    site: "maison-vaurenne.example",
    depuis: "client depuis mars 2026",
    formule: "Vitrine",
    formulePrix: 150,          // forfait trimestriel de la catégorie (colonne clients.maintenance_trimestre)
    formulePrixAn: 550,        // forfait annuel : 11 mois payés, 1 offert
    forfait: "Vitrine",
    /* Démo au trimestre. Passer à periodicite:"annuel" + echeance:"2027-03-01"
       + moyen:"virement" pour voir le rendu d'un contrat annuel.
       Il n'y a plus de paiement au mois. */
    periodicite: "trimestriel",   // 'trimestriel' | 'annuel'
    montantRemise: null,       // prix négocié ; null = tarif standard
    echeance: "2026-10-01",    // trimestriel : prochain prélèvement — annuel : couvert jusqu'au
    moyen: "sepa",             // 'sepa' | 'virement'
    uptime: "99.98",
    derniereMaj: "14 juillet 2026"
  };

  var KPIS = [
    { label: "Visiteurs", valeur: 2847, variation: 18.4, icone: "users" },
    { label: "Pages vues", valeur: 7912, variation: 22.1, icone: "pages" },
    { label: "Appels reçus", valeur: 143, variation: 31.2, icone: "phone" },
    { label: "Itinéraires", valeur: 208, variation: 12.7, icone: "map" }
  ];

  /* 30 derniers jours de visiteurs : le week-end monte, c'est un restaurant. */
  var VISITEURS = [62, 71, 68, 94, 132, 148, 105, 74, 69, 81, 88, 141, 166, 118, 83,
                   77, 92, 96, 152, 174, 121, 88, 84, 99, 108, 163, 189, 134, 96, 112];

  // Couleurs alignées sur la palette claire du site (voir ns-clair.css, thème clair-b).
  var SOURCES = [
    { nom: "Recherche Google", part: 58, couleur: "#f4f4f5" },
    { nom: "Google Maps", part: 21, couleur: "#a8a8b0" },
    { nom: "Instagram", part: 12, couleur: "#6b6b75" },
    { nom: "Direct", part: 9, couleur: "#55555f" }
  ];

  var TOP_PAGES = [
    { page: "Accueil", vues: 3120 },
    { page: "Notre carte", vues: 2480 },
    { page: "Réserver une table", vues: 1104 },
    { page: "Nous trouver", vues: 742 },
    { page: "Galerie", vues: 466 }
  ];

  var MOTS_CLES = [
    { mot: "restaurant gastronomique luxembourg", position: 2, evolution: 3 },
    { mot: "menu dégustation luxembourg", position: 1, evolution: 0 },
    { mot: "restaurant luxembourg centre", position: 7, evolution: 4 },
    { mot: "où bien manger luxembourg", position: 4, evolution: -1 }
  ];

  var FACTURES = [
    { id: "f7", numero: "NS-2026-0087", libelle: "Abonnement Sérénité — juillet 2026", montant: 119, date: "1 juillet 2026", statut: "payee", moyen: "Prélèvement SEPA" },
    { id: "f6", numero: "NS-2026-0074", libelle: "Abonnement Sérénité — juin 2026", montant: 119, date: "1 juin 2026", statut: "payee", moyen: "Prélèvement SEPA" },
    { id: "f5", numero: "NS-2026-0061", libelle: "Abonnement Sérénité — mai 2026", montant: 119, date: "1 mai 2026", statut: "payee", moyen: "Prélèvement SEPA" },
    { id: "f4", numero: "NS-2026-0052", libelle: "Page supplémentaire — Menu de midi", montant: 240, date: "22 avril 2026", statut: "payee", moyen: "Virement" },
    { id: "f3", numero: "NS-2026-0048", libelle: "Abonnement Sérénité — avril 2026", montant: 119, date: "1 avril 2026", statut: "payee", moyen: "Prélèvement SEPA" },
    { id: "f2", numero: "NS-2026-0031", libelle: "Site vitrine Standard — solde à la mise en ligne", montant: 745, date: "18 mars 2026", statut: "payee", moyen: "Virement" },
    { id: "f1", numero: "NS-2026-0022", libelle: "Site vitrine Standard — acompte 50 %", montant: 745, date: "2 mars 2026", statut: "payee", moyen: "Virement" }
  ];

  /* --------------------------------------------------------------------------
     MAINTENANCE — trimestrielle ou annuelle. Il n'y a plus de paiement au mois.
     La règle commerciale « 11 mois payés, 1 offert » est la même que celle du
     schéma SQL (clients.abonnement_montant_standard). Si elle change, la changer
     aux DEUX endroits : ici et dans la migration correspondante.
     -------------------------------------------------------------------------- */
  var MOIS_FACTURES_PAR_AN = 11;

  /* Date ISO -> "1 juillet 2026". Tolère une date déjà formatée (données de démo). */
  function frDateLong(iso) {
    if (!iso) return "";
    var mois = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
    var p = String(iso).slice(0, 10).split("-");
    if (p.length < 3) return iso;
    return parseInt(p[2], 10) + " " + mois[parseInt(p[1], 10) - 1] + " " + p[0];
  }

  /* Montant en euros, format français : 1 309 € / 119 € / 109,08 € */
  function euros(n) {
    var v = Number(n) || 0;
    var s = v % 1 === 0 ? String(v) : v.toFixed(2).replace(".", ",");
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
  }

  function estAnnuel() { return CLIENT.periodicite === "annuel"; }

  /* Montant réellement facturé par période. Un prix négocié n'est jamais recalculé. */
  function abonnementMontant() {
    if (CLIENT.montantRemise != null) return Number(CLIENT.montantRemise);
    return estAnnuel() ? CLIENT.formulePrixAn : CLIENT.formulePrix;
  }

  /* Équivalent trimestriel d'un forfait annuel : c'est ce que le client a gagné. */
  function abonnementParTrimestre() {
    return Math.round((abonnementMontant() / 4) * 100) / 100;
  }

  function abonnementPeriode() { return estAnnuel() ? "/ an" : "/ trimestre"; }

  /* Nombre de mois offerts, pour l'afficher tel quel (0 si prix négocié à part). */
  function moisOfferts() {
    if (!estAnnuel() || CLIENT.montantRemise != null) return 0;
    return 12 - MOIS_FACTURES_PAR_AN;
  }

  function moyenLibelle() {
    return CLIENT.moyen === "virement" ? "Virement annuel" : "Prélèvement SEPA";
  }

  /* Même emplacement, sens inversé selon la périodicité :
       trimestriel → une échéance qui revient  ("prochain prélèvement")
       annuel      → une tranquillité déjà payée ("couvert jusqu'au")
     Pour quelqu'un qui vient de régler l'année, c'est l'info qui justifie la dépense. */
  function echeanceTexte() {
    var d = frDateLong(CLIENT.echeance);
    if (!d) return estAnnuel() ? "Maintenance réglée pour l'année" : "Prélèvement trimestriel";
    return estAnnuel()
      ? "Votre site est couvert jusqu'au " + d
      : "Prochain prélèvement le " + d;
  }

  var INCLUS = [
    "Hébergement et nom de domaine",
    "Maintenance technique et sécurité",
    "Sauvegardes quotidiennes",
    "Suivi du référencement local",
    "Modifications illimitées raisonnables"
  ];

  var DEMANDES = [
    { id: "d4", titre: "Ajouter le menu de la semaine", detail: "Le nouveau menu du 21 au 27 juillet, avec les photos que je vous ai envoyées par mail.", statut: "encours", date: "20 juillet 2026", reponse: "Bien reçu, en cours de mise en page. En ligne demain matin." },
    { id: "d3", titre: "Changer les horaires du dimanche", detail: "On ferme désormais à 22h le dimanche au lieu de 23h.", statut: "faite", date: "12 juillet 2026", reponse: "Modifié sur le site et sur la fiche Google Business." },
    { id: "d2", titre: "Nouvelles photos de la terrasse", detail: "Les 8 photos de la terrasse rénovée, à mettre dans la galerie.", statut: "faite", date: "28 juin 2026", reponse: "Galerie mise à jour, photos optimisées pour le mobile." },
    { id: "d1", titre: "Ajouter le lien de réservation TheFork", detail: "Un bouton bien visible sur la page d’accueil.", statut: "faite", date: "9 juin 2026", reponse: "Bouton ajouté dans le hero et dans le menu." }
  ];

  var STATUTS = { recue: "Reçue", encours: "En cours", faite: "Terminée" };
  var TYPES_DEMANDE = ["Texte", "Photos", "Horaires", "Menu / carte", "Autre"];

  var DOCUMENTS = [
    { id: "doc1", titre: "Contrat de maintenance Sérénité", meta: "PDF · 4 pages · signé le 2 mars 2026", type: "contrat" },
    { id: "doc2", titre: "Devis site vitrine Standard", meta: "PDF · 2 pages · accepté le 28 février 2026", type: "devis" },
    { id: "doc3", titre: "Conditions générales de service", meta: "PDF · 3 pages · version du 1er janvier 2026", type: "contrat" },
    { id: "doc4", titre: "Accès Google Business Profile", meta: "Fiche gérée par NS Development · accès partagé", type: "acces" },
    { id: "doc5", titre: "Nom de domaine maison-vaurenne.example", meta: "Enregistré au nom de Maison Vaurenne Sàrl · expire le 3 mars 2027", type: "acces" },
    { id: "doc6", titre: "Rapport SEO — juin 2026", meta: "PDF · 6 pages · publié le 3 juillet 2026", type: "rapport" }
  ];

  var GROUPES_DOCS = [
    { titre: "Contrats et devis", types: ["contrat", "devis"] },
    { titre: "Accès et propriété", types: ["acces"] },
    { titre: "Rapports", types: ["rapport"] }
  ];

  var ACTIVITE = [
    { texte: "Sauvegarde complète du site effectuée", date: "Aujourd’hui, 04:00", icone: "bouclier" },
    { texte: "Demande « Menu de la semaine » prise en charge", date: "Hier, 18:12", icone: "outil" },
    { texte: "Certificat SSL renouvelé automatiquement", date: "17 juillet", icone: "cadenas" },
    { texte: "Rapport SEO de juin disponible", date: "3 juillet", icone: "hausse" },
    { texte: "Facture NS-2026-0087 réglée", date: "1 juillet", icone: "carte" }
  ];

  /* ---------------------------------------------------------- */
  /* ICÔNES (SVG en ligne, aucun chargement externe)             */
  /* ---------------------------------------------------------- */

  var TRAITS = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  var ICONES = {
    accueil: '<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    factures: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    demandes: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    documents: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.6-3.4 3.3-5.2 6.5-5.2s5.9 1.8 6.5 5.2M17 8.2a3 3 0 0 1 0 5.6M18.5 19.6c-.2-1.6-.8-2.9-1.8-3.9"/>',
    pages: '<rect x="4" y="3" width="12" height="15" rx="2"/><path d="M8 21h9a2 2 0 0 0 2-2V8"/>',
    phone: '<path d="M4 5c0-1 .8-2 1.8-2h2L9.5 7 7.8 8.6a13 13 0 0 0 6.6 6.6L16 13.5l4 1.7v2c0 1-1 1.8-2 1.8A15.8 15.8 0 0 1 4 5z"/>',
    map: '<path d="m3 11 18-8-8 18-2.2-7.8z"/>',
    lien: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    crayon: '<path d="M4 20h4L20 8l-4-4L4 16z"/>',
    bouclier: '<path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    calendrier: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    fleche: '<path d="M9 6l6 6-6 6"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8.5v7M8.5 12h7"/>',
    telecharger: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/>',
    cle: '<circle cx="8" cy="14" r="4.2"/><path d="m11 11 8-8 2 2-1.6 1.6L21 8.2 18.6 10.6 17 9l-2 2"/>',
    etiquette: '<path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 13.5 19z"/><circle cx="8" cy="8" r="1.4"/>',
    hausse: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    cadenas: '<rect x="4.5" y="10" width="15" height="10" rx="2.2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    outil: '<path d="M14.5 3.5a5 5 0 0 0 6 6.6L10 20.6a2.8 2.8 0 0 1-4-4L16.6 6a5 5 0 0 1-2.1-2.5z"/>',
    carte: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    checkRond: '<circle cx="12" cy="12" r="9"/><path d="m8 12.2 2.6 2.6L16 9.4"/>',
    enveloppe: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    puce: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    ampoule: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5V16H8v-2.5A6 6 0 0 1 12 3z"/>',
    envoyer: '<path d="m21 3-9.5 9.5M21 3l-6.5 18-3.5-8.5L2.5 9z"/>',
    repeat: '<path d="M4 9V7.5a2 2 0 0 1 2-2h12M20 15v1.5a2 2 0 0 1-2 2H6"/><path d="m7 12-3-3-3 3M17 12l3 3 3-3"/>'
  };

  function ico(nom, taille) {
    var d = ICONES[nom];
    if (!d) return "";
    var t = taille || 18;
    return '<svg class="ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" ' + TRAITS + ' aria-hidden="true">' + d + "</svg>";
  }

  /* ---------------------------------------------------------- */
  /* OUTILS                                                      */
  /* ---------------------------------------------------------- */

  function nb(v) { return Math.round(v).toLocaleString("fr"); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function tendance(v) {
    var haut = v >= 0;
    return '<span class="trend ' + (haut ? "up" : "down") + '">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" ' + TRAITS + '><path d="' +
      (haut ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6") + '"/></svg>' +
      String(Math.abs(v)).replace(".", ",") + " %</span>";
  }

  function compteur(valeur, delai) {
    return '<span data-count="' + valeur + '"' + (delai ? ' data-duration="' + delai + '"' : "") + ">0</span>";
  }

  /* ---------------------------------------------------------- */
  /* COURBE D'AUDIENCE (SVG, tracé lissé + animation)            */
  /* ---------------------------------------------------------- */

  function cheminLisse(pts) {
    if (pts.length < 2) return "";
    var d = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C " + (p1.x + (p2.x - p0.x) / 6) + " " + (p1.y + (p2.y - p0.y) / 6) +
           ", " + (p2.x - (p3.x - p1.x) / 6) + " " + (p2.y - (p3.y - p1.y) / 6) +
           ", " + p2.x + " " + p2.y;
    }
    return d;
  }

  var idCourbe = 0;

  function courbe(donnees, labels, hauteur) {
    var h = hauteur || 200, L = 1000, padTop = 16, padBas = 30;
    var zone = h - padTop - padBas;
    var max = Math.max.apply(null, donnees) * 1.08;
    var min = Math.min.apply(null, donnees) * 0.75;
    var amp = Math.max(max - min, 1);

    var pts = donnees.map(function (v, i) {
      return {
        x: (i / (donnees.length - 1)) * (L - 24) + 12,
        y: padTop + zone - ((v - min) / amp) * zone
      };
    });

    var trace = cheminLisse(pts);
    var aire = trace + " L " + pts[pts.length - 1].x + " " + (h - padBas) + " L " + pts[0].x + " " + (h - padBas) + " Z";
    var dernier = pts[pts.length - 1];
    var id = "c" + (++idCourbe);

    var grille = [0.25, 0.5, 0.75].map(function (g) {
      var y = padTop + zone * g;
      return '<line x1="0" x2="' + L + '" y1="' + y + '" y2="' + y + '" class="grille"/>';
    }).join("");

    return '<div class="courbe">' +
      '<svg viewBox="0 0 ' + L + " " + h + '" preserveAspectRatio="none" class="cv" role="img" aria-label="Évolution des visiteurs">' +
        "<defs>" +
          '<linearGradient id="aire-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#ffffff" stop-opacity=".22"/>' +
            '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
          "</linearGradient>" +
          '<linearGradient id="trait-' + id + '" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8a8a94"/>' +
          "</linearGradient>" +
        "</defs>" + grille +
        '<path d="' + aire + '" fill="url(#aire-' + id + ')" class="aire"/>' +
        '<path d="' + trace + '" fill="none" stroke="url(#trait-' + id + ')" stroke-width="2.6" ' +
          'stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="1" class="trait"/>' +
        '<circle cx="' + dernier.x + '" cy="' + dernier.y + '" r="9" fill="#ffffff" opacity=".20" class="pt"/>' +
        '<circle cx="' + dernier.x + '" cy="' + dernier.y + '" r="4" fill="#ffffff" stroke="#0a0a0c" stroke-width="2" class="pt"/>' +
      "</svg>" +
      (labels ? '<div class="cv-labels">' + labels.map(function (l) { return "<span>" + l + "</span>"; }).join("") + "</div>" : "") +
    "</div>";
  }

  /** Relance le tracé d'une courbe quand sa vue devient visible. */
  function animerCourbes(racine) {
    racine.querySelectorAll(".courbe").forEach(function (c) {
      c.classList.remove("tracee");
      void c.offsetWidth;                 // force le navigateur à repartir de zéro
      requestAnimationFrame(function () { c.classList.add("tracee"); });
    });
  }

  /* ---------------------------------------------------------- */
  /* VUES                                                        */
  /* ---------------------------------------------------------- */

  function enTete(sur, titre, sous, action) {
    return '<header class="vue-tete" data-reveal>' +
      '<div><span class="eyebrow">' + sur + "</span>" +
      "<h1>" + titre + "</h1>" +
      (sous ? '<p class="sous">' + sous + "</p>" : "") + "</div>" +
      (action || "") + "</header>";
  }

  function vueAccueil() {
    var kpis = KPIS.map(function (k) {
      return '<article class="carte kpi">' +
        '<div class="kpi-tete"><span class="lbl">' + k.label + "</span>" + ico(k.icone, 15) + "</div>" +
        '<div class="kpi-val">' + compteur(k.valeur) + "</div>" + tendance(k.variation) + "</article>";
    }).join("");

    var activite = ACTIVITE.map(function (a) {
      return '<li><span class="pastille">' + ico(a.icone, 15) + "</span>" +
        "<span><b>" + a.texte + "</b><em>" + a.date + "</em></span></li>";
    }).join("");

    return enTete(
      CLIENT.etablissement,
      "Bonjour " + CLIENT.prenom + ".",
      CLIENT.ville + " · " + CLIENT.depuis,
      '<div class="avatar" aria-hidden="true">' + CLIENT.prenom[0] + CLIENT.nom[0] + "</div>"
    ) +

    '<article class="carte lueur site" data-reveal data-delay="80">' +
      '<div class="site-tete">' +
        '<span class="enligne"><i class="pulse"></i>En ligne</span>' +
        '<span class="chip">' + ico("puce", 13) + CLIENT.uptime + " % de disponibilité</span>" +
      "</div>" +
      '<p class="domaine">' + CLIENT.site + "</p>" +
      '<p class="sous">Dernière mise à jour le ' + CLIENT.derniereMaj + "</p>" +
      '<div class="site-btns">' +
        '<a class="bt bt-plein" href="https://' + CLIENT.site + '" target="_blank" rel="noopener">' + ico("lien", 16) + "Voir mon site</a>" +
        '<button class="bt bt-vide" data-aller="demandes">' + ico("crayon", 16) + "Demander une modif</button>" +
      "</div>" +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Ces 30 derniers jours</h2>' +
      '<button class="lien-fin" data-aller="stats">Détail ' + ico("fleche", 13) + "</button></div>" +
    '<div class="grille-kpi" data-stagger="90">' + kpis + "</div>" +

    '<article class="carte" data-reveal>' +
      '<div class="carte-tete"><div><h3>Visiteurs</h3><p class="sous">30 derniers jours</p></div>' + tendance(18.4) + "</div>" +
      courbe(VISITEURS, ["21 juin", "6 juil.", "21 juil."]) +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Ma maintenance</h2></div>' +
    '<article class="carte ns-lift abo" data-reveal data-aller="factures" role="button" tabindex="0">' +
      '<div class="abo-tete">' +
        '<span class="pastille grande">' + ico("bouclier", 19) + "</span>" +
        "<div><h3>Formule " + CLIENT.formule + "</h3>" +
        '<p class="sous">Hébergement, maintenance, SEO local, modifications</p></div>' +
        '<div class="abo-prix"><b>' + euros(abonnementMontant()) + "</b><em>" + abonnementPeriode() + "</em>" +
          /* En annuel, l'équivalent trimestriel montre au client ce que l'avance lui a fait gagner. */
          (estAnnuel()
            ? '<em class="abo-equiv">soit ' + euros(abonnementParTrimestre()) + " / trimestre" +
              (moisOfferts() ? " · " + moisOfferts() + (moisOfferts() > 1 ? " mois offerts" : " mois offert") : "") + "</em>"
            : "") +
        "</div>" +
      "</div><hr>" +
      '<div class="abo-bas">' + ico("calendrier", 14) + "<span>" + echeanceTexte() + "</span>" + ico("fleche", 15) +
      "</div>" +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Activité récente</h2></div>' +
    '<article class="carte" data-reveal><ul class="fil">' + activite + "</ul></article>";
  }

  function vueStats(periode) {
    // 0 est une période valide (7 jours) : ne pas utiliser « || 1 » ici.
    if (typeof periode !== "number") periode = 1;
    var serie = periode === 0 ? VISITEURS.slice(-7)
              : periode === 1 ? VISITEURS
              : VISITEURS.concat(VISITEURS.map(function (v) { return Math.round(v * 0.82); }));
    var facteur = periode === 0 ? 0.24 : periode === 1 ? 1 : 2.7;
    var labels = periode === 0 ? ["15 juil.", "18 juil.", "21 juil."]
               : periode === 1 ? ["21 juin", "6 juil.", "21 juil."]
               : ["avril", "juin", "juil."];
    var nomPeriode = ["7 jours", "30 jours", "3 mois"][periode];

    var onglets = ["7 jours", "30 jours", "3 mois"].map(function (p, i) {
      return '<button class="seg' + (i === periode ? " actif" : "") + '" data-periode="' + i + '">' + p + "</button>";
    }).join("");

    var kpis = KPIS.map(function (k) {
      return '<article class="carte kpi">' +
        '<div class="kpi-tete"><span class="lbl">' + k.label + "</span>" + ico(k.icone, 15) + "</div>" +
        '<div class="kpi-val">' + compteur(Math.round(k.valeur * facteur)) + "</div>" + tendance(k.variation) + "</article>";
    }).join("");

    var barres = SOURCES.map(function (s) {
      return '<div class="barre"><div class="barre-tete"><span>' + s.nom + "</span>" +
        '<b style="color:' + s.couleur + '">' + s.part + " %</b></div>" +
        '<div class="piste"><i style="width:' + s.part + "%;background:" + s.couleur + '"></i></div></div>';
    }).join("");

    var pages = TOP_PAGES.map(function (p, i) {
      return "<li><span class=\"rang\">" + (i + 1 < 10 ? "0" : "") + (i + 1) + "</span>" +
        "<span class=\"nom\">" + p.page + "</span>" +
        "<span class=\"val\">" + nb(p.vues * facteur) + "</span></li>";
    }).join("");

    var mots = MOTS_CLES.map(function (m) {
      var note = m.evolution > 0
        ? m.evolution + " place" + (m.evolution > 1 ? "s gagnées" : " gagnée") + " ce mois-ci"
        : m.evolution < 0 ? Math.abs(m.evolution) + " place perdue ce mois-ci" : "Position stable";
      return '<li><div><b>« ' + m.mot + " »</b><em>" + note + "</em></div>" +
        '<span class="pos' + (m.position <= 3 ? " top" : "") + '">#' + m.position + "</span></li>";
    }).join("");

    return enTete("Statistiques", "Ce que rapporte votre site.",
      "Les chiffres qui comptent, sans jargon : combien de personnes vous trouvent, et ce qu'elles font ensuite.") +

    '<div class="segments" data-reveal role="tablist">' + onglets + "</div>" +

    '<article class="carte" data-reveal data-delay="60">' +
      '<div class="carte-tete"><div><div class="gros">' + compteur(Math.round(2847 * facteur)) + "</div>" +
      '<p class="sous">visiteurs sur ' + nomPeriode.toLowerCase() + "</p></div>" + tendance(18.4) + "</div>" +
      courbe(serie, labels, 220) +
    "</article>" +

    '<div class="grille-kpi" data-stagger="90">' + kpis + "</div>" +

    '<div class="titre-section" data-reveal><h2>D\'où viennent vos visiteurs</h2></div>' +
    '<article class="carte" data-reveal>' + barres + "<hr>" +
      '<p class="note">' + ico("ampoule", 15) + "<span>8 visiteurs sur 10 vous trouvent via Google. C'est le travail de référencement local inclus dans votre formule.</span></p>" +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Pages les plus consultées</h2></div>' +
    '<article class="carte" data-reveal><ol class="liste-pages">' + pages + "</ol></article>" +

    '<div class="titre-section" data-reveal><h2>Votre position sur Google</h2></div>' +
    '<article class="carte" data-reveal><ul class="liste-mots">' + mots + "</ul></article>" +

    '<p class="pied-note" data-reveal>Données de démonstration. En production, les chiffres viendront de la mesure d\'audience installée sur votre site.</p>';
  }

  /* Supabase renvoie un booléen "paye" ; les données de démo n'ont que "statut".
     On lit les deux, sinon une facture réglée s'affiche "À régler". */
  function estPayee(f) {
    return !!f.paye || f.statut === "payee" || f.statut === "payée";
  }

  function vueFactures() {
    var total = FACTURES.reduce(function (t, f) { return t + f.montant; }, 0);
    var impayes = FACTURES.filter(function (f) { return !estPayee(f) && f.statut !== "brouillon"; }).length;

    var lignes = FACTURES.length ? FACTURES.map(function (f) {
      var tag = estPayee(f) ? '<span class="tag ok">Payée</span>'
              : f.statut === "en_retard" ? '<span class="tag">En retard</span>'
              : f.statut === "brouillon" ? '<span class="tag">Brouillon</span>'
              : '<span class="tag">À régler</span>';
      return '<article class="carte ligne ns-lift" data-facture="' + f.id + '" role="button" tabindex="0">' +
        '<span class="pastille">' + ico("factures", 17) + "</span>" +
        '<span class="ligne-txt"><b>' + f.libelle + "</b><em>" + f.date + "</em></span>" +
        '<span class="ligne-fin"><b>' + f.montant + ' €</b>' + tag + '</span>' +
      "</article>";
    }).join("") : '<p class="sous" style="padding:10px 2px">Aucune facture pour l\'instant. Elles apparaîtront ici dès leur émission.</p>';

    var inclus = INCLUS.map(function (l) {
      return '<li>' + ico("checkRond", 15) + "<span>" + l + "</span></li>";
    }).join("");

    return enTete("Facturation", "Vos factures.",
      "Tout l'historique, téléchargeable en un geste. Aucune surprise sur le montant.") +

    '<article class="carte lueur" data-reveal data-delay="60">' +
      '<div class="resume">' +
        "<div><p class=\"lbl\">Total facturé</p>" +
        '<div class="gros">' + compteur(total) + ' <span class="euro">€</span></div></div>' +
        (impayes > 0
          ? '<span class="tag grand">' + ico("factures", 13) + impayes + (impayes > 1 ? " à régler" : " à régler") + "</span>"
          : '<span class="tag ok grand">' + ico("checkRond", 13) + "Aucun impayé</span>") +
      "</div><hr>" +
      '<div class="resume-bas">' +
        "<div><p class=\"sous\">" + (estAnnuel() ? "Prochain renouvellement" : "Prochaine échéance") + "</p><b>" +
          euros(abonnementMontant()) + (frDateLong(CLIENT.echeance) ? " le " + frDateLong(CLIENT.echeance) : "") + "</b></div>" +
        '<span class="chip">' + ico("repeat", 13) + moyenLibelle() + "</span>" +
      "</div>" +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Maintenance en cours</h2></div>' +
    '<article class="carte" data-reveal>' +
      '<div class="abo-tete simple"><div><h3>Formule ' + CLIENT.formule + "</h3>" +
      '<p class="sous">Engagement 12 mois · reconduction tacite · ' +
        (estAnnuel() ? "réglé à l'année" : "prélevé chaque trimestre") + "</p></div>" +
      '<div class="abo-prix"><b class="prix-periode">' + euros(abonnementMontant()) + abonnementPeriode().replace("/ ", "/") + "</b>" +
        (estAnnuel()
          ? '<em class="abo-equiv">soit ' + euros(abonnementParTrimestre()) + " / trimestre" +
            (moisOfferts() ? " · " + moisOfferts() + (moisOfferts() > 1 ? " mois offerts" : " mois offert") : "") + "</em>"
          : "") +
      "</div></div>" +
      '<ul class="inclus">' + inclus + "</ul>" +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Historique</h2><span class="compte">' +
      FACTURES.length + (FACTURES.length > 1 ? " factures" : " facture") + "</span></div>" +
    /* En annuel, l'historique n'a qu'une ligne par an : sans ce repère, l'espace
       paraît vide 11 mois sur 12 et donne l'impression d'un service à l'arrêt. */
    (estAnnuel() && frDateLong(CLIENT.echeance)
      ? '<article class="carte note-annuel" data-reveal>' + ico("checkRond", 16) +
          "<span>Votre abonnement est réglé jusqu'au <b>" + frDateLong(CLIENT.echeance) +
          "</b>. La prochaine facture vous parviendra à cette échéance.</span></article>"
      : "") +
    '<div class="pile" data-stagger="70">' + lignes + "</div>";
  }

  function vueDemandes() {
    var enCours = DEMANDES.filter(function (d) { return d.statut !== "faite"; }).length;
    var faites = DEMANDES.filter(function (d) { return d.statut === "faite"; }).length;

    var cartes = DEMANDES.map(function (d) {
      var etapes = ["recue", "encours", "faite"];
      var idx = etapes.indexOf(d.statut);
      var frise = etapes.map(function (e, i) {
        return (i > 0 ? '<span class="trait' + (i <= idx ? " fait" : "") + '"></span>' : "") +
          '<span class="etape' + (i <= idx ? " fait" : "") + '"><i>' + (i <= idx ? ico("check", 10) : "") + "</i>" +
          "<em>" + STATUTS[e] + "</em></span>";
      }).join("");

      return '<article class="carte demande" data-reveal>' +
        '<div class="dem-tete"><span class="pastille ' + d.statut + '">' +
          ico(d.statut === "faite" ? "check" : d.statut === "encours" ? "outil" : "enveloppe", 17) + "</span>" +
          "<div><h3>" + esc(d.titre) + "</h3><em>" + d.date + "</em></div>" +
          '<span class="tag ' + d.statut + '">' + STATUTS[d.statut] + "</span></div>" +
        '<p class="dem-detail">' + esc(d.detail) + "</p>" +
        (d.reponse ? '<div class="reponse"><span class="ns">NS</span><p>' + esc(d.reponse) + "</p></div>" : "") +
        '<div class="frise">' + frise + "</div>" +
      "</article>";
    }).join("");

    return enTete("Modifications", "Vos demandes.",
      "Une modification à faire ? Écrivez-la ici. Vous suivez l'avancement en direct, sans relancer personne.") +

    '<div data-reveal data-delay="60"><button class="bt bt-plein large ns-shine" id="ecNouvelle">' +
      ico("plus", 17) + "Nouvelle demande</button></div>" +

    '<article class="carte compteurs" data-reveal data-delay="120">' +
      '<div><b class="c-warn">' + enCours + "</b><span>en cours</span></div><i></i>" +
      '<div><b class="c-ok">' + faites + "</b><span>terminées</span></div><i></i>" +
      '<div><b class="c-acc">24h</b><span>délai moyen</span></div>' +
    "</article>" +

    '<div class="titre-section" data-reveal><h2>Historique</h2></div>' +
    '<div class="pile" id="ecListeDemandes">' + cartes + "</div>";
  }

  function vueDocuments() {
    var infos = [
      ["Nom de domaine", CLIENT.site],
      ["Propriétaire du domaine", "Maison Vaurenne Sàrl"],
      ["Mise en ligne", "18 mars 2026"],
      ["Formule", CLIENT.formule + " · " + euros(abonnementMontant()) + abonnementPeriode().replace("/ ", "/")]
    ].map(function (l) {
      return '<li><span class="sous">' + l[0] + "</span><b>" + l[1] + "</b></li>";
    }).join("");

    var apparence = {
      contrat: { ic: "factures", cl: "acc" },
      devis: { ic: "etiquette", cl: "ok" },
      acces: { ic: "cle", cl: "warn" },
      rapport: { ic: "hausse", cl: "violet" }
    };

    var groupes = GROUPES_DOCS.map(function (g) {
      var items = DOCUMENTS.filter(function (d) { return g.types.indexOf(d.type) !== -1; }).map(function (d) {
        var a = apparence[d.type];
        return '<article class="carte ligne ns-lift" role="button" tabindex="0">' +
          '<span class="pastille ' + a.cl + '">' + ico(a.ic, 17) + "</span>" +
          '<span class="ligne-txt"><b>' + d.titre + "</b><em>" + d.meta + "</em></span>" +
          ico(d.type === "acces" ? "lien" : "telecharger", 18) +
        "</article>";
      }).join("");
      return '<div class="titre-section" data-reveal><h2>' + g.titre + "</h2></div>" +
        '<div class="pile" data-stagger="70">' + items + "</div>";
    }).join("");

    return enTete("Documents", "Vos documents.",
      "Contrat, devis, accès, rapports. Tout est archivé ici, accessible à tout moment.") +

    '<article class="carte lueur" data-reveal data-delay="60">' +
      '<div class="projet-tete"><div><h3>' + CLIENT.etablissement + "</h3>" +
      '<p class="sous">' + CLIENT.metier + " · " + CLIENT.ville + "</p></div>" +
      '<span class="chip">Forfait ' + CLIENT.forfait + "</span></div><hr>" +
      '<ul class="infos">' + infos + "</ul>" +
    "</article>" + groupes +

    '<div class="titre-section" data-reveal><h2>Une question ?</h2></div>' +
    '<article class="carte" data-reveal>' +
      "<p>Votre interlocuteur chez NS Development répond du lundi au vendredi, de 9h à 18h.</p>" +
      '<div class="contacts">' +
        '<a class="contact" href="mailto:info@nsdevelopment.lu">' + ico("enveloppe", 17) + "info@nsdevelopment.lu</a>" +
        '<a class="contact" href="index.html#contact">' + ico("demandes", 17) + "Écrire à NS Development</a>" +
      "</div>" +
    "</article>" +

    '<p class="pied-note" data-reveal>NS Development SARL-S · 2, rue de la fontaine, L-4988 Sanem<br>RCS B310037 · autorisation d\'établissement 10196211 / 0</p>';
  }

  var VUES = {
    accueil: vueAccueil,
    stats: vueStats,
    factures: vueFactures,
    demandes: vueDemandes,
    documents: vueDocuments
  };

  /* ---------------------------------------------------------- */
  /* MODALES                                                     */
  /* ---------------------------------------------------------- */

  var modale, modaleCorps;

  function ouvrirModale(html) {
    modaleCorps.innerHTML = html;
    modale.classList.add("ouverte");
    document.body.classList.add("fige");
    var premier = modaleCorps.querySelector("input, textarea, button");
    if (premier) setTimeout(function () { premier.focus(); }, 120);
  }

  function fermerModale() {
    modale.classList.remove("ouverte");
    document.body.classList.remove("fige");
  }

  function ficheFacture(id) {
    var f = FACTURES.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    var paye = estPayee(f);
    /* "regle" n'existe que sur les données Supabase : une facture payée sans ce
       champ (démo) doit afficher 0 de reste, pas la totalité du montant. */
    var reste = paye ? 0 : Math.max(0, (f.montant || 0) - (f.regle || 0));
    var lignes = [
      ["Date", f.date],
      ["Statut", paye ? "Réglée" : "À régler"],
      ["Reste à payer", reste.toFixed(2).replace(".", ",") + " €"],
      ["Émetteur", "NS Development SARL-S"], ["Adresse", "2, rue de la fontaine, L-4988 Sanem"], ["RCS", "B310037"]
    ].map(function (l) { return "<li><span>" + l[0] + "</span><b>" + l[1] + "</b></li>"; }).join("");

    ouvrirModale(
      '<p class="mod-num">' + f.numero + "</p>" +
      "<h3 class=\"mod-titre\">" + f.libelle + "</h3>" +
      '<div class="mod-montant"><b>' + f.montant.toFixed(2).replace(".", ",") + " €</b>" +
      '<span class="sous">TVA luxembourgeoise 17 % · n° TVA Intra. LU37686640</span></div>' +
      '<ul class="mod-lignes">' + lignes + "</ul>" +
      '<div class="mod-btns">' +
        '<button class="bt bt-plein large" data-fermer>' + ico("telecharger", 16) + "Télécharger le PDF</button>" +
        '<button class="bt bt-vide large" data-fermer>Fermer</button>' +
      "</div>"
    );
  }

  function formulaireDemande() {
    var types = TYPES_DEMANDE.map(function (t, i) {
      return '<button type="button" class="puce-type' + (i === 0 ? " actif" : "") + '">' + t + "</button>";
    }).join("");

    ouvrirModale(
      '<h3 class="mod-titre">Nouvelle demande</h3>' +
      '<p class="sous">Décrivez ce que vous voulez changer. Une phrase suffit.</p>' +
      '<form id="ecForm" class="mod-form">' +
        '<label>Type de modification</label>' +
        '<div class="types">' + types + "</div>" +
        "<label for=\"ecObjet\">Objet</label>" +
        '<input id="ecObjet" type="text" placeholder="Ex. : mettre à jour la carte des desserts" required>' +
        "<label for=\"ecDetail\">Détail</label>" +
        '<textarea id="ecDetail" rows="4" placeholder="Expliquez en quelques mots, joignez vos textes ou photos par mail si besoin." required></textarea>' +
        '<div class="mod-btns">' +
          '<button type="submit" class="bt bt-plein large">' + ico("envoyer", 16) + "Envoyer la demande</button>" +
          '<button type="button" class="bt bt-vide large" data-fermer>Annuler</button>' +
        "</div>" +
      "</form>"
    );

    var types_ = modaleCorps.querySelectorAll(".puce-type");
    types_.forEach(function (b) {
      b.addEventListener("click", function () {
        types_.forEach(function (x) { x.classList.remove("actif"); });
        b.classList.add("actif");
      });
    });

    modaleCorps.querySelector("#ecForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var type = modaleCorps.querySelector(".puce-type.actif").textContent;
      var objet = modaleCorps.querySelector("#ecObjet").value.trim();
      var detail = modaleCorps.querySelector("#ecDetail").value.trim();
      if (objet.length < 3 || detail.length < 5) return;

      DEMANDES.unshift({
        id: "d" + (DEMANDES.length + 1),
        titre: type + " · " + objet,
        detail: detail,
        statut: "recue",
        date: "21 juillet 2026",
        reponse: "Demande bien reçue. Nous revenons vers vous sous 24h ouvrées."
      });
      fermerModale();
      afficher("demandes");
    });
  }

  /* ---------------------------------------------------------- */
  /* NAVIGATION                                                  */
  /* ---------------------------------------------------------- */

  var vueActive = "accueil", conteneur, periodeStats = 1;

  function afficher(nom, periode) {
    if (!VUES[nom]) return;
    vueActive = nom;
    if (nom === "stats" && typeof periode === "number") periodeStats = periode;

    conteneur.innerHTML = nom === "stats" ? vueStats(periodeStats) : VUES[nom]();
    conteneur.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });

    document.querySelectorAll("[data-onglet]").forEach(function (o) {
      o.classList.toggle("actif", o.getAttribute("data-onglet") === nom);
      o.setAttribute("aria-current", o.getAttribute("data-onglet") === nom ? "page" : "false");
    });

    if (window.NSMotion) window.NSMotion.refresh();
    animerCourbes(conteneur);
  }

  /* ---------------------------------------------------------- */
  /* DÉMARRAGE                                                   */
  /* ---------------------------------------------------------- */

  function demarrer() {
    var ecran = document.getElementById("ecConnexion");
    var appli = document.getElementById("ecApp");
    conteneur = document.getElementById("ecVue");
    modale = document.getElementById("ecModale");
    modaleCorps = document.getElementById("ecModaleCorps");

    /* Connexion réelle via Supabase, avec aiguillage par rôle */
    function getSb() { return window.nsSupabase; }
    var boiteErr = document.getElementById("ecErr");
    function erreurCo(msg) { if (boiteErr) { boiteErr.textContent = msg || ""; boiteErr.style.display = msg ? "block" : "none"; } }

    function ouvrirEspaceClient() {
      ecran.classList.add("parti");
      setTimeout(function () {
        ecran.hidden = true;
        appli.hidden = false;
        document.body.classList.add("en-app");
        afficher("accueil");
      }, 380);
    }

    /* Charge les vraies données du client connecté (RLS : il ne voit que les siennes).
       Ne touche qu'à ce qui existe côté serveur : fiche client + factures.
       Le reste (stats, SEO, demandes, documents) reste en démo, faute de backend. */
    async function chargerDonneesClient() {
      var sb = getSb();
      if (!sb) return;
      try {
        var rc = await sb.from("clients").select("*").limit(1).maybeSingle();
        var c = rc && rc.data;
        if (c) {
          if (c.nom_etablissement) CLIENT.etablissement = c.nom_etablissement;
          if (c.metier) CLIENT.metier = c.metier;
          if (c.ville) CLIENT.ville = c.ville;
          if (c.site_domaine) CLIENT.site = c.site_domaine;
          if (c.formule) CLIENT.formule = c.formule;
          if (c.abonnement_mensuel) CLIENT.formulePrix = Number(c.abonnement_mensuel); // forfait trimestriel
          /* Colonnes ajoutées par migrations/2026-07-30-abonnement-periodicite.sql.
             Si la migration n'a pas encore été passée, elles sont absentes et on
             garde le comportement mensuel : l'espace client reste fonctionnel. */
          if (c.abonnement_periodicite) CLIENT.periodicite = c.abonnement_periodicite;
          CLIENT.montantRemise = c.abonnement_montant_remise != null ? Number(c.abonnement_montant_remise) : null;
          if (c.abonnement_echeance) CLIENT.echeance = c.abonnement_echeance;
          if (c.abonnement_moyen) CLIENT.moyen = c.abonnement_moyen;
          if (c.contact_prenom) CLIENT.prenom = c.contact_prenom;
          if (c.contact_nom) CLIENT.nom = c.contact_nom;
        }
        var rf = await sb.from("factures")
          .select("id, numero, date_emission, total_ttc, montant_paye, statut, factures_lignes(designation, ordre)")
          .order("date_emission", { ascending: false });
        if (rf && rf.data) {
          FACTURES = rf.data.map(function (f) {
            var ls = (f.factures_lignes || []).slice().sort(function (a, b) { return (a.ordre || 0) - (b.ordre || 0); });
            var libelle = ls.length ? (ls[0].designation + (ls.length > 1 ? " + " + (ls.length - 1) + " ligne" + (ls.length > 2 ? "s" : "") : "")) : ("Facture " + (f.numero || ""));
            var paye = (f.statut === "payée" || f.statut === "payee");
            return {
              id: f.id, numero: f.numero || "brouillon", libelle: libelle,
              montant: Number(f.total_ttc) || 0, regle: Number(f.montant_paye) || 0,
              date: frDateLong(f.date_emission), statut: f.statut || "envoyée", paye: paye
            };
          });
        }
      } catch (e) { /* échec réseau : on garde l'affichage par défaut */ }
    }

    /* ------------------------------------------------------------------
       MODE DÉMONSTRATION — espace-client.html?demo=1
       Ouvre l'espace sans connexion, sur les seules données de démo de ce
       fichier (Maison Vaurenne). Aucun appel à Supabase n'est fait : aucune
       donnée réelle ne peut donc transiter, et la sécurité côté serveur
       (RLS) n'est pas affaiblie puisqu'aucune session n'est ouverte.
       Sert à montrer l'espace client à un prospect sans lui créer de compte.
       ------------------------------------------------------------------ */
    function estDemo() {
      try { return new URLSearchParams(location.search).get("demo") === "1"; }
      catch (e) { return false; }
    }

    function lancerDemo() {
      var b = document.createElement("div");
      b.className = "bandeau-demo";
      b.innerHTML = "Mode démonstration · données fictives · " +
        '<a href="index.html#espace">revenir au site</a>';
      document.body.appendChild(b);
      document.body.classList.add("avec-bandeau");

      /* En démo, personne n'est connecté : « Se déconnecter » renverrait le
         visiteur sur un formulaire de login qu'il n'a jamais rempli, ce qui
         ressemble à une impasse. On le remplace par une vraie sortie. */
      var sortir = document.getElementById("ecSortir");
      if (sortir) {
        var lien = document.createElement("a");
        lien.href = "index.html#espace";
        lien.innerHTML = sortir.innerHTML.replace("Se déconnecter", "Quitter la démo");
        sortir.replaceWith(lien);
      }

      ouvrirEspaceClient();
    }

    /* Sam (admin) -> système de facturation ; client -> son espace */
    async function aiguiller(session) {
      var sb = getSb();
      try {
        var res = await sb.from("profiles").select("role").eq("id", session.user.id).single();
        if (res.data && res.data.role === "admin") {
          /* Le tableau de bord d'administration est volontairement exclu de la
             vitrine publique (voir publier-vitrine.command). Sans cette
             vérification, un admin connecté qui ouvre l'espace client depuis
             la vitrine est redirigé vers une page absente : 404 en pleine
             démonstration, et seulement pour lui, ce qui le rend difficile
             à reproduire. */
          var dispo = false;
          try { dispo = (await fetch("espace-client-admin.html", { method: "HEAD" })).ok; }
          catch (e2) { dispo = false; }
          if (dispo) {
            window.location.replace("espace-client-admin.html");
            return;
          }
          var err = document.getElementById("ecErr");
          if (err) {
            err.textContent = "Compte administrateur. Le tableau de bord d'administration n'est pas publié à cette adresse : ouvrez-le depuis le poste de travail.";
            err.style.display = "block";
          }
          return;
        }
      } catch (e) { /* pas de profil : traité comme client */ }
      await chargerDonneesClient();
      ouvrirEspaceClient();
    }

    document.getElementById("ecForm-connexion").addEventListener("submit", async function (e) {
      e.preventDefault();
      erreurCo("");
      var b = document.getElementById("ecEntrer");
      var sb = getSb();
      if (!sb) { erreurCo("Connexion au serveur indisponible. Réessayez dans un instant."); return; }
      b.classList.add("charge");
      var email = document.getElementById("ecMail").value.trim();
      var mdp = document.getElementById("ecMdp").value;
      var res = await sb.auth.signInWithPassword({ email: email, password: mdp });
      b.classList.remove("charge");
      if (res.error) { erreurCo("Email ou mot de passe incorrect."); return; }
      aiguiller(res.data.session);
    });

    /* Onglets */
    document.querySelectorAll("[data-onglet]").forEach(function (o) {
      o.addEventListener("click", function () { afficher(o.getAttribute("data-onglet")); });
    });

    /* Déconnexion */
    document.getElementById("ecSortir").addEventListener("click", async function () {
      var sb = getSb();
      if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
      appli.hidden = true;
      document.body.classList.remove("en-app");
      ecran.hidden = false;
      ecran.classList.remove("parti");
    });

    /* Session déjà ouverte ? on aiguille directement, sans re-demander le login.
       On attend que le client Supabase (module, chargé à part) soit prêt.
       En mode démo on saute complètement cette étape : aucune session, aucun
       appel réseau. */
    if (!estDemo()) {
      (function attendreSb(essais) {
        essais = essais || 0;
        var sb = getSb();
        if (sb) {
          sb.auth.getSession().then(function (res) {
            if (res && res.data && res.data.session) { aiguiller(res.data.session); }
          });
          return;
        }
        if (essais > 40) return;
        setTimeout(function () { attendreSb(essais + 1); }, 100);
      })();
    }

    /* Clics délégués dans les vues */
    conteneur.addEventListener("click", function (e) {
      var aller = e.target.closest("[data-aller]");
      if (aller) { afficher(aller.getAttribute("data-aller")); return; }

      var seg = e.target.closest("[data-periode]");
      if (seg) { afficher("stats", parseInt(seg.getAttribute("data-periode"), 10)); return; }

      var fact = e.target.closest("[data-facture]");
      if (fact) { ficheFacture(fact.getAttribute("data-facture")); return; }

      if (e.target.closest("#ecNouvelle")) formulaireDemande();
    });

    /* Accessibilité clavier sur les cartes cliquables */
    conteneur.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var cible = e.target.closest("[data-facture],[data-aller]");
      if (!cible) return;
      e.preventDefault();
      cible.click();
    });

    /* Fermeture de la modale */
    modale.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-voile") || e.target.closest("[data-fermer]")) fermerModale();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modale.classList.contains("ouverte")) fermerModale();
    });

    /* Démo : lancée EN DERNIER, une fois tous les écouteurs posés. Plus haut,
       les modales et les liens internes ne seraient pas encore actifs. */
    if (estDemo()) lancerDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }
})();
