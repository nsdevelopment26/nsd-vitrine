/* Ashcombe Lorant : la seule source des domaines, des associés et des créneaux.
   Maquette concept : cabinet, personnes et coordonnées sont fictifs (dit en pied de page). */
window.ASHCOMBE = {
  domaines: [
    {
      id: "contentieux", n: "01", titre: "Contentieux des affaires", onglet: "Contentieux",
      court: "Litiges entre associés, ruptures de contrat, responsabilité des dirigeants.",
      situations: [
        "Un associé bloque les décisions de la société.",
        "Un partenaire rompt un contrat cadre sans préavis.",
        "La responsabilité d'un dirigeant est mise en cause."
      ],
      pieces: ["Statuts et pacte d'associés", "Le contrat en cause", "Les derniers courriers échangés"],
      associe: "clara"
    },
    {
      id: "arbitrage", n: "02", titre: "Arbitrage international", onglet: "Arbitrage",
      court: "De la clause d'arbitrage à l'exécution de la sentence, là où se trouvent les actifs.",
      situations: [
        "Un différend commence et le contrat prévoit un arbitrage.",
        "Une sentence a été rendue et doit être exécutée à l'étranger.",
        "Vous voulez rédiger la bonne clause avant de signer."
      ],
      pieces: ["Le contrat et sa clause", "La correspondance du différend", "Ce que vous savez des actifs de l'autre partie"],
      associe: "elise"
    },
    {
      id: "fusions", n: "03", titre: "Fusions et acquisitions", onglet: "Fusions",
      court: "Audit, structuration, négociation, signature : la même équipe du premier rendez-vous au closing.",
      situations: [
        "Vous achetez ou vendez une société.",
        "Une lettre d'intention est sur la table.",
        "Un investisseur entre au capital."
      ],
      pieces: ["La lettre d'intention ou l'offre", "L'organigramme du groupe", "Le calendrier visé"],
      associe: "marc"
    },
    {
      id: "fonds", n: "04", titre: "Fonds et réglementation", onglet: "Fonds",
      court: "Véhicules d'investissement luxembourgeois, documentation, échanges avec le régulateur.",
      situations: [
        "Vous lancez un véhicule d'investissement au Luxembourg.",
        "Un courrier du régulateur appelle une réponse.",
        "La documentation d'un fonds existant doit être revue."
      ],
      pieces: ["Le projet de term sheet ou de prospectus", "Le courrier reçu, s'il y en a un", "La structure actuelle"],
      associe: "lea"
    },
    {
      id: "penal", n: "05", titre: "Pénal des affaires", onglet: "Pénal",
      court: "Perquisitions, enquêtes internes, convocations. Une ligne répond le soir et le week-end.",
      situations: [
        "Une perquisition est en cours ou annoncée.",
        "Une enquête interne doit être menée sans bruit.",
        "Vous êtes convoqué par un juge d'instruction."
      ],
      pieces: ["La convocation ou le procès-verbal", "Une chronologie, même brève", "Les personnes concernées"],
      associe: "clara", urgence: true
    },
    {
      id: "prives", n: "06", titre: "Clients privés", onglet: "Clients privés",
      court: "Transmission d'entreprise familiale, successions entre plusieurs pays, patrimoine.",
      situations: [
        "La transmission d'une entreprise familiale se prépare.",
        "Une succession concerne plusieurs pays.",
        "Un patrimoine doit être organisé entre membres d'une famille."
      ],
      pieces: ["Un arbre familial simplifié", "Les actes déjà signés", "La liste des biens, pays par pays"],
      associe: "tomas"
    }
  ],

  associes: [
    { id: "elise", nom: "Élise Ashcombe", role: "Associée gérante", photo: "elise", langues: ["FR", "EN", "DE"], domaines: ["arbitrage", "prives"],
      phrase: "Un arbitrage se prépare comme s'il fallait plaider partout où sont les actifs." },
    { id: "marc", nom: "Marc Lorant", role: "Associé", photo: "marc", langues: ["FR", "EN", "PT"], domaines: ["fusions", "fonds"],
      phrase: "Le jour de la signature se décide au premier rendez-vous." },
    { id: "clara", nom: "Clara Wen", role: "Associée", photo: "clara", langues: ["FR", "EN", "ZH"], domaines: ["contentieux", "penal"],
      phrase: "Un dossier se gagne le jour où l'autre partie mesure ce que coûterait le procès." },
    { id: "lea", nom: "Léa Morand", role: "Counsel", photo: "lea", langues: ["FR", "EN", "DE", "LB"], domaines: ["fonds"],
      phrase: "Une réponse au régulateur se lit deux fois avant de partir." },
    { id: "tomas", nom: "Tomás Reis", role: "Associé", photo: "tomas", langues: ["FR", "PT", "EN", "ES"], domaines: ["prives", "contentieux"],
      phrase: "Une famille signe mieux quand chacun a compris ce qu'il signe." }
  ],

  langues: { FR: "Français", EN: "Anglais", DE: "Allemand", LB: "Luxembourgeois", PT: "Portugais", ZH: "Chinois", ES: "Espagnol" },

  /* Créneaux de démonstration, du lundi au vendredi (heure de Luxembourg) */
  creneaux: ["09:00", "11:00", "14:30", "17:00"],

  telephone: "+352 27 00 00 00",
  telephoneLien: "tel:+35227000000",
  urgence: "+352 621 00 00 00",
  urgenceLien: "tel:+352621000000",
  email: "contact@ashcombe-lorant.example"
};
