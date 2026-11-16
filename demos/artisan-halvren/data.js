/* Halvren : la seule source des contenus partagés (pannes, métiers, zone, horaires).
   Les horaires et délais sont des valeurs de démonstration. */
window.HALVREN = {
  /* Dépannage : tous les jours, de 7 h à 22 h (démonstration) */
  horaires: { ouvre: 7, ferme: 22 },

  /* Les quatre pannes que la lampe trouve derrière le mur.
     id = point du mur 3D ; metier = filtre du devis ; page = page métier. */
  pannes: [
    { id: "fuite", court: "Fuite d’eau", metier: "Plomberie", page: "plomberie.html", reseau: "Eau",
      signe: "Une tache qui grandit sur le plâtre : un raccord goutte derrière.",
      etapes: ["Coupez l’arrivée d’eau : la vanne est sous l’évier, dans le placard technique ou après le compteur.",
               "Si l’eau approche d’une prise, coupez aussi le disjoncteur général.",
               "Prenez une photo de la tache et de la vanne : on vient avec la bonne pièce."] },
    { id: "chauffage", court: "Radiateur froid", metier: "Chauffage", page: "chauffage.html", reseau: "Chauffage",
      signe: "Chaud en bas, froid en haut : de l’air est bloqué dans le radiateur.",
      etapes: ["Regardez la pression de la chaudière : entre 1 et 2 bars à froid, en général.",
               "Notez le code d’erreur affiché s’il y en a un, et prenez l’écran en photo.",
               "Radiateur froid en haut seulement : une purge suffit souvent, on vous guide au téléphone."] },
    { id: "courant", court: "Plus de courant", metier: "Électricité", page: "electricite.html", reseau: "Électricité",
      signe: "Une manette est tombée au tableau : un circuit s’est mis en sécurité.",
      etapes: ["Regardez si c’est tout le quartier ou seulement chez vous.",
               "Débranchez les gros appareils, puis relevez la manette une seule fois. Si elle retombe, ne forcez pas.",
               "Odeur de brûlé, manette chaude ou grésillement : ne touchez à rien et appelez."] },
    { id: "porte", court: "Porte claquée", metier: "Serrurerie", page: "serrurerie.html", reseau: "Serrure",
      signe: "Le pêne est sorti, la porte s’est refermée : le cylindre n’est pas abîmé.",
      etapes: ["Ne forcez pas la serrure, une clé tordue dedans complique tout.",
               "Restez joignable : on vous rappelle à l’approche.",
               "Préparez de quoi prouver que vous habitez là : pièce d’identité, courrier, bail."] }
  ],

  /* Communes desservies (sud et centre) */
  zone: {
    "Sud": ["Esch-sur-Alzette","Differdange","Dudelange","Pétange","Bettembourg","Sanem","Schifflange","Kayl","Rumelange","Mondercange","Käerjeng","Bascharage","Belvaux","Soleuvre","Rodange","Roeser","Frisange","Mondorf-les-Bains","Reckange-sur-Mess","Leudelange","Weiler-la-Tour"],
    "Centre": ["Luxembourg","Strassen","Bertrange","Mamer","Hesperange","Howald","Cessange","Kirchberg","Limpertsberg","Bonnevoie","Gasperich","Walferdange","Steinsel","Sandweiler","Niederanven","Kopstal","Kehlen","Garnich","Dippach","Contern","Schuttrange","Lorentzweiler","Lintgen","Mersch","Steinfort","Habscht","Capellen","Bissen"]
  }
};
