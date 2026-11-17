/* ==================================================================
   HORIZON Immobilier : la source unique des données de la maquette.
   ------------------------------------------------------------------
   TOUT EST FICTIF. Programme, lots, villas, prix, statuts : c'est une
   maquette de démonstration NS Development, rien n'est à vendre.

   Une seule base sert partout : le catalogue (recherche), les fiches
   (bien.html?ref=…), l'immeuble 3D et les villas 3D. Ajouter un bien :
     - un appartement de la Résidence Lumen → une ligne dans LOTS
       (étage + position), il apparaît dans la façade ET au catalogue ;
     - une maison explorable en 3D → une entrée dans MAISONS (le champ
       "forme" choisit le modèle dans js/maisons.js) ;
     - un bien classique → une entrée dans AUTRES.
   ================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Les plans types (mètres, x = gauche→droite vu de la
     façade, z = 0 sur la façade avant). Les mêmes plans dessinent la
     coupe 3D, le plan SVG animé et la fiche : un logement ne change
     jamais de configuration d'une vue à l'autre. ---------- */
  var PLANS = {
    A: {
      nom: "Type A · traversant d'angle", l: 10, p: 14,
      pieces: [
        { n: "Séjour · cuisine", x: 0,   z: 0,   w: 6.4, d: 7,   t: "sejour" },
        { n: "Suite",            x: 6.4, z: 0,   w: 3.6, d: 4.8, t: "chambre" },
        { n: "Bain",             x: 6.4, z: 4.8, w: 3.6, d: 2.2, t: "eau" },
        { n: "Dégagement",       x: 0,   z: 7,   w: 10,  d: 1.4, t: "circ" },
        { n: "Chambre 2",        x: 0,   z: 8.4, w: 3.6, d: 5.6, t: "chambre" },
        { n: "Douche",           x: 3.6, z: 8.4, w: 2,   d: 2.6, t: "eau" },
        { n: "Entrée",           x: 3.6, z: 11,  w: 2,   d: 3,   t: "circ" },
        { n: "Chambre 3",        x: 5.6, z: 8.4, w: 4.4, d: 5.6, t: "chambre" }
      ],
      portes: [ [2.6, 7, 0], [7.6, 4.8, 0], [8.2, 7, 0], [1.6, 8.4, 0], [4.6, 8.4, 0], [7.4, 8.4, 0], [4.6, 14, 0] ],
      exterieur: { nom: "Terrasse", w: 10, d: 2.4 }
    },
    B: {
      nom: "Type B · cœur d'îlot", l: 10, p: 9,
      pieces: [
        { n: "Séjour · cuisine", x: 0,   z: 0,   w: 6.2, d: 5.6, t: "sejour" },
        { n: "Chambre 1",        x: 6.2, z: 0,   w: 3.8, d: 4.6, t: "chambre" },
        { n: "Chambre 2",        x: 0,   z: 5.6, w: 3.8, d: 3.4, t: "chambre" },
        { n: "Bain",             x: 3.8, z: 5.6, w: 2.4, d: 3.4, t: "eau" },
        { n: "Entrée",           x: 6.2, z: 4.6, w: 3.8, d: 4.4, t: "circ" }
      ],
      portes: [ [7.6, 4.6, 0], [2.2, 5.6, 0], [5, 5.6, 0], [8.4, 9, 0] ],
      exterieur: { nom: "Balcon", w: 10, d: 1.6 }
    },
    P: {
      nom: "Type P · penthouse", l: 20, p: 14,
      pieces: [
        { n: "Séjour",           x: 0,    z: 0,   w: 10,  d: 7,   t: "sejour" },
        { n: "Cuisine",          x: 10,   z: 0,   w: 4,   d: 7,   t: "sejour" },
        { n: "Suite parentale",  x: 14,   z: 0,   w: 6,   d: 7,   t: "chambre" },
        { n: "Galerie",          x: 0,    z: 7,   w: 20,  d: 1.4, t: "circ" },
        { n: "Chambre 2",        x: 0,    z: 8.4, w: 4,   d: 5.6, t: "chambre" },
        { n: "Bain",             x: 4,    z: 8.4, w: 3.5, d: 5.6, t: "eau" },
        { n: "Chambre 3",        x: 12.5, z: 8.4, w: 3.5, d: 5.6, t: "chambre" },
        { n: "Dressing · bain",  x: 16,   z: 8.4, w: 4,   d: 5.6, t: "eau" }
      ],
      noyau: { x: 7.5, z: 8.4, w: 5, d: 5.6 },
      portes: [ [5, 7, 0], [12, 7, 0], [17, 7, 0], [2, 8.4, 0], [5.6, 8.4, 0], [14, 8.4, 0], [18, 8.4, 0] ],
      exterieur: { nom: "Terrasse panoramique", w: 20, d: 4 }
    }
  };

  /* ---------- 2. La Résidence Lumen (programme fictif). ----------
     RDC : hall vitré. Étages 1 à 5 : trois lots (O = ouest, C = centre,
     E = est). Étage 6 : un penthouse en retrait. */
  function lot(etage, pos, plan, prix, statut, extra) {
    var no = (etage < 10 ? "0" : "") + etage + "." + (pos === "O" ? "01" : pos === "C" ? "02" : pos === "E" ? "03" : "01");
    var p = PLANS[plan];
    var o = {
      id: no, etage: etage, pos: pos, plan: plan, miroir: pos === "E",
      prix: prix, statut: statut,
      /* surface habitable = somme exacte des pièces du plan type */
      m2: Math.round(p.pieces.reduce(function (t, x) { return t + x.w * x.d; }, 0)),
      ch: plan === "A" ? 3 : plan === "B" ? 2 : 3,
      sdb: plan === "A" ? 2 : plan === "B" ? 1 : 3,
      ext: Math.round(p.exterieur.w * p.exterieur.d),
      extNom: p.exterieur.nom,
      orient: pos === "O" ? "Sud-ouest" : pos === "E" ? "Sud-est" : "Sud"
    };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  var LOTS = [
    lot(1, "O", "A", 1090000, "vendu"),      lot(1, "C", "B", 790000, "vendu"),      lot(1, "E", "A", 1090000, "réservé"),
    lot(2, "O", "A", 1120000, "disponible"), lot(2, "C", "B", 810000, "vendu"),      lot(2, "E", "A", 1120000, "vendu"),
    lot(3, "O", "A", 1150000, "réservé"),    lot(3, "C", "B", 830000, "disponible"), lot(3, "E", "A", 1150000, "disponible"),
    lot(4, "O", "A", 1180000, "vendu"),      lot(4, "C", "B", 850000, "disponible"), lot(4, "E", "A", 1180000, "réservé"),
    lot(5, "O", "A", 1210000, "disponible"), lot(5, "C", "B", 870000, "réservé"),    lot(5, "E", "A", 1210000, "vendu"),
    lot(6, "P", "P", 2950000, "disponible")
  ];

  var RESIDENCE = {
    nom: "Résidence Lumen",
    loc: "Kirchberg",
    livraison: "Programme fictif",
    etages: 6,
    hauteurRdc: 4.2, hauteurEtage: 3.3,
    photos: {
      facade: "photos/lumen-facade.webp",
      soir: "photos/lumen-soir.webp",
      A: ["photos/lumen-a-sejour.webp", "photos/lumen-a-iso.webp"],
      B: ["photos/lumen-b-sejour.webp"],
      P: ["photos/lumen-p-sejour.webp"]
    },
    equipements: ["Ascenseur", "Cave", "Parking en sous-sol", "Classe énergétique A", "Pompe à chaleur", "Triple vitrage"]
  };

  /* ---------- 3. Les maisons explorables en 3D. ---------- */
  var MAISONS = [
    { ref: "HZ-131", forme: "porte-a-faux", nom: "Villa Aster", loc: "Strassen", type: "Villa",
      prix: 1850000, m2: 285, terrain: 1200, ch: 5, sdb: 4, atout: "Piscine", neuf: false,
      desc: "Deux volumes croisés, l'étage en porte-à-faux au-dessus de la terrasse, une piscine dans l'axe du séjour.",
      equipements: ["Piscine chauffée", "Domotique", "Garage double", "Panneaux solaires", "Cuisine ouverte"],
      photos: ["photos/villa-aster.webp", "photos/villa-aster-int.webp"],
      zones: { facade: "Façade d'entrée", terrasse: "Terrasse couverte", piscine: "Piscine 12 × 4 m", jardin: "Jardin paysager" } },
    { ref: "HZ-134", forme: "pavillon", nom: "Maison Halde", loc: "Bridel", type: "Maison",
      prix: 1690000, m2: 210, terrain: 900, ch: 4, sdb: 3, atout: "Patio", neuf: true,
      desc: "Un long pavillon de plain-pied autour d'un patio planté, toiture plate végétalisée, tout ouvert sur le jardin.",
      equipements: ["Plain-pied", "Patio intérieur", "Toiture végétalisée", "Chauffage au sol", "Carport"],
      photos: ["photos/maison-halde.webp", "photos/maison-halde-int.webp"],
      zones: { facade: "Façade sur rue", terrasse: "Patio planté", piscine: "Bassin de nage", jardin: "Verger" } },
    { ref: "HZ-137", forme: "gradins", nom: "Villa Bel-Orée", loc: "Mamer", type: "Villa",
      prix: 2450000, m2: 340, terrain: 1500, ch: 6, sdb: 4, atout: "Toit-terrasse", neuf: false,
      desc: "Trois volumes décalés qui descendent avec le terrain, un toit-terrasse sur chaque niveau, la vallée en face.",
      equipements: ["Toit-terrasse", "Ascenseur privatif", "Cave à vin", "Piscine", "Pool house"],
      photos: ["photos/villa-bel-oree.webp", "photos/villa-bel-oree-int.webp"],
      zones: { facade: "Façade principale", terrasse: "Toit-terrasse", piscine: "Piscine à débordement", jardin: "Jardin en restanques" } }
  ];

  /* ---------- 4. Les autres biens du catalogue. ---------- */
  var AUTRES = [
    { ref:"HZ-104", t:"vente", nom:"Maison de maître", loc:"Belair", type:"Maison", m2:240, ch:5, sdb:3, prix:1490000, atout:"Jardin", neuf:false,
      photos:["photos/maison-maitre-belair.webp"], desc:"Belle époque, parquets d'origine, jardin clos plein sud.", equipements:["Jardin clos", "Cave voûtée", "Parquets d'origine", "Cheminée"] },
    { ref:"HZ-118", t:"vente", nom:"Penthouse lumineux", loc:"Kirchberg", type:"Penthouse", m2:135, ch:3, sdb:2, prix:980000, atout:"Terrasse", neuf:true,
      photos:["photos/penthouse-kirchberg.webp"], desc:"Dernier étage, terrasse de 40 m², double parking en sous-sol.", equipements:["Terrasse 40 m²", "Double parking", "Ascenseur"] },
    { ref:"HZ-142", t:"vente", nom:"Appartement neuf", loc:"Merl", type:"Appartement", m2:92, ch:2, sdb:1, prix:745000, atout:"Balcon", neuf:true,
      photos:["photos/appartement-merl.webp"], desc:"Livraison immédiate, classe énergétique A, cave et parking.", equipements:["Balcon", "Cave", "Parking", "Classe A"] },
    { ref:"HZ-155", t:"vente", nom:"Duplex sous les toits", loc:"Limpertsberg", type:"Duplex", m2:118, ch:3, sdb:2, prix:895000, atout:"Charme", neuf:false,
      photos:["photos/duplex-limpertsberg.webp"], desc:"Poutres apparentes, mezzanine et vue dégagée sur le parc.", equipements:["Mezzanine", "Poutres apparentes", "Vue sur le parc"] },
    { ref:"HZ-160", t:"vente", nom:"Maison mitoyenne", loc:"Bertrange", type:"Maison", m2:165, ch:4, sdb:2, prix:1120000, atout:"Garage", neuf:false,
      photos:["photos/maison-bertrange.webp"], desc:"Quartier calme, école à pied, garage double et cave voûtée.", equipements:["Garage double", "Cave voûtée", "Jardinet"] },
    { ref:"HZ-173", t:"vente", nom:"Loft d'artiste", loc:"Hollerich", type:"Loft", m2:140, ch:2, sdb:1, prix:820000, atout:"Volume", neuf:false,
      photos:["photos/loft-hollerich.webp"], desc:"Ancien atelier réhabilité, 4,2 m sous plafond, verrière plein est.", equipements:["Verrière", "4,2 m sous plafond", "Atelier"] },
    { ref:"HZ-181", t:"vente", nom:"Terrain à bâtir", loc:"Mersch", type:"Terrain", m2:620, ch:0, sdb:0, prix:495000, atout:"Constructible", neuf:false,
      photos:["photos/terrain-mersch.webp"], desc:"Parcelle viabilisée, orientation sud-ouest, PAG favorable.", equipements:["Viabilisé", "Orientation sud-ouest"] },
    { ref:"HZ-190", t:"vente", nom:"Appartement vue Alzette", loc:"Esch-sur-Alzette", type:"Appartement", m2:76, ch:2, sdb:1, prix:425000, atout:"Ascenseur", neuf:false,
      photos:["photos/appartement-esch.webp"], desc:"Deuxième étage avec ascenseur, balcon filant, proche gare.", equipements:["Ascenseur", "Balcon filant", "Proche gare"] },
    { ref:"HZ-205", t:"location", nom:"Appartement d'angle", loc:"Limpertsberg", type:"Appartement", m2:78, ch:2, sdb:1, prix:2400, atout:"Balcon", neuf:false,
      photos:["photos/appartement-limpertsberg.webp"], desc:"Double exposition, cuisine équipée, disponible tout de suite.", equipements:["Cuisine équipée", "Balcon", "Double exposition"] },
    { ref:"HZ-212", t:"location", nom:"Studio meublé", loc:"Gare", type:"Studio", m2:38, ch:1, sdb:1, prix:1350, atout:"Meublé", neuf:true,
      photos:["photos/studio-gare.webp"], desc:"Entièrement meublé, charges comprises, bail flexible.", equipements:["Meublé", "Charges comprises"] },
    { ref:"HZ-224", t:"location", nom:"Maison familiale", loc:"Bertrange", type:"Maison", m2:180, ch:4, sdb:2, prix:4200, atout:"Jardin", neuf:false,
      photos:["photos/maison-familiale-bertrange.webp"], desc:"Jardin clos, garage, à cinq minutes de l'école européenne.", equipements:["Jardin clos", "Garage"] },
    { ref:"HZ-231", t:"location", nom:"Penthouse Clausen", loc:"Clausen", type:"Penthouse", m2:120, ch:3, sdb:2, prix:5500, atout:"Terrasse", neuf:true,
      photos:["photos/penthouse-clausen.webp"], desc:"Vue sur la vallée, terrasse plein ciel, prestations soignées.", equipements:["Terrasse", "Vue vallée"] },
    { ref:"HZ-240", t:"location", nom:"Duplex Belair", loc:"Belair", type:"Duplex", m2:105, ch:3, sdb:2, prix:3100, atout:"Parking", neuf:false,
      photos:["photos/duplex-belair.webp"], desc:"Deux niveaux, bureau indépendant, parking intérieur.", equipements:["Bureau", "Parking intérieur"] }
  ];

  /* ---------- 5. Le catalogue unifié. ---------- */
  function refLot(l) { return "LU-" + l.id.replace(".", ""); }
  var CATALOGUE = [], cLumen = [], cMaisons = [], cAutres = [], rang = { A: 0, B: 0, P: 0 };
  LOTS.forEach(function (l) {
    if (l.statut !== "disponible") return;
    /* les photos tournent d'un lot à l'autre pour éviter la répétition */
    var base = RESIDENCE.photos[l.plan].concat(l.plan === "B" ? [RESIDENCE.photos.soir] : [RESIDENCE.photos.facade]);
    var k = rang[l.plan]++ % base.length, ph = base.slice(k).concat(base.slice(0, k));
    cLumen.push({
      ref: refLot(l), t: "vente", source: "lumen", lot: l.id,
      nom: (l.plan === "P" ? "Penthouse " : "Appartement ") + l.id, loc: RESIDENCE.loc,
      type: l.plan === "P" ? "Penthouse" : "Appartement",
      m2: l.m2, ch: l.ch, sdb: l.sdb, prix: l.prix, atout: l.extNom + " " + l.ext + " m²", neuf: true,
      photos: ph, plan: l.plan, miroir: l.miroir, etage: l.etage,
      desc: "Résidence Lumen, " + (l.etage === 6 ? "dernier étage en retrait" : l.etage + (l.etage === 1 ? "er" : "e") + " étage") +
            ", " + PLANS[l.plan].nom.split("·")[1].trim() + ", orientation " + l.orient.toLowerCase() + ".",
      equipements: RESIDENCE.equipements
    });
  });
  MAISONS.forEach(function (m) {
    cMaisons.push({ ref: m.ref, t: "vente", source: "maison", forme: m.forme, nom: m.nom, loc: m.loc, type: m.type,
      m2: m.m2, terrain: m.terrain, ch: m.ch, sdb: m.sdb, prix: m.prix, atout: m.atout, neuf: m.neuf,
      photos: m.photos, desc: m.desc, equipements: m.equipements });
  });
  AUTRES.forEach(function (b) { b.source = "autre"; cAutres.push(b); });
  /* ordre « vitrine » : on alterne programme neuf, maisons et autres biens */
  for (var j = 0; j < Math.max(cLumen.length, cMaisons.length, cAutres.length); j++) {
    [cLumen[j], cMaisons[j], cAutres[j]].forEach(function (b) { if (b) CATALOGUE.push(b); });
  }

  window.HZ = {
    PLANS: PLANS, LOTS: LOTS, RESIDENCE: RESIDENCE, MAISONS: MAISONS, CATALOGUE: CATALOGUE,
    refLot: refLot,
    trouver: function (ref) { for (var i = 0; i < CATALOGUE.length; i++) if (CATALOGUE[i].ref === ref) return CATALOGUE[i]; return null; },
    euros: function (n) { return n.toLocaleString("fr-FR").replace(/[  ]/g, " ") + " €"; },
    TEL: "+352 00 00 00", TEL_HREF: "tel:+35200000000", MAIL: "contact@horizon-immo.example",
    ADRESSE: "Luxembourg · adresse fictive"
  };
})();
