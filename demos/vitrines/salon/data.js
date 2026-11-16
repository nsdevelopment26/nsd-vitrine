/* ==================================================================
   Maison Lonvière : la seule source des données de la maquette.
   Prestations, nuances du nuancier 3D, équipe, horaires.
   Valeurs de démonstration (maquette concept NS Development).
   ================================================================== */
(function () {
  "use strict";

  /* u = univers, n = nom, d = détail, m = durée (minutes),
     p = prix affiché, v = prix de référence pour le filtre (null = sur devis) */
  var P = [];
  function p(id, u, g, n, d, m, prix, v) { P.push({ id: id, u: u, g: g, n: n, d: d, m: m, p: prix, v: v }); }

  p("coupe-f",   "Coiffure", "Coupe & coiffage", "Coupe et brushing", "Diagnostic, shampoing, coupe, coiffage", 60, "58 €", 58);
  p("coupe-c",   "Coiffure", "Coupe & coiffage", "Coupe courte", "Nuque et contours compris", 45, "46 €", 46);
  p("brushing",  "Coiffure", "Coupe & coiffage", "Brushing", "Selon la longueur", 40, "dès 34 €", 34);
  p("chignon",   "Coiffure", "Coupe & coiffage", "Chignon et coiffure d'événement", "Essai sur rendez-vous séparé", 75, "dès 85 €", 85);
  p("mariee",    "Coiffure", "Coupe & coiffage", "Coiffure de mariée", "Essai inclus, déplacement possible", 120, "sur devis", null);
  p("racines",   "Coiffure", "Couleur", "Coloration racines", "Sans ammoniaque", 75, "62 €", 62);
  p("ton",       "Coiffure", "Couleur", "Coloration ton sur ton", "Reflets et brillance, 6 à 8 semaines", 90, "dès 68 €", 68);
  p("gloss",     "Coiffure", "Couleur", "Gloss et patine", "Neutralise, ravive, fait briller", 45, "42 €", 42);
  p("balayage",  "Coiffure", "Couleur", "Balayage à main levée", "Éclaircissement progressif, patine incluse", 150, "dès 120 €", 120);
  p("polaire",   "Coiffure", "Couleur", "Balayage polaire", "Blond froid, en une ou deux séances", 180, "dès 145 €", 145);
  p("cuivre",    "Coiffure", "Couleur", "Coloration cuivrée et gloss", "Couleur pleine, reflet vénitien", 120, "dès 85 €", 85);
  p("soin",      "Coiffure", "Soin", "Soin profond", "Cheveux colorés ou sensibilisés", 30, "36 €", 36);
  p("lissage",   "Coiffure", "Soin", "Lissage", "Tenue de trois à cinq mois", 150, "dès 160 €", 160);

  p("coupe-h",   "Barbier", "Coupe", "Coupe classique", "Shampoing et coiffage inclus", 40, "36 €", 36);
  p("degrade",   "Barbier", "Coupe", "Dégradé", "Finition tondeuse et rasoir", 45, "40 €", 40);
  p("coupe-b",   "Barbier", "Coupe", "Coupe et barbe", "La formule complète", 60, "56 €", 56);
  p("barbe",     "Barbier", "Barbe & rasage", "Taille de barbe", "Contours au rasoir", 30, "26 €", 26);
  p("rasage",    "Barbier", "Barbe & rasage", "Rasage à l'ancienne", "Serviette chaude, coupe-chou", 40, "38 €", 38);
  p("cuir",      "Barbier", "Barbe & rasage", "Soin du cuir chevelu", "Massage et lotion", 20, "20 €", 20);

  p("eclat",     "Institut", "Visage", "Soin éclat", "Nettoyage, gommage, masque", 45, "68 €", 68);
  p("antiage",   "Institut", "Visage", "Soin anti-âge", "Massage liftant, 75 minutes", 75, "98 €", 98);
  p("sourcils",  "Institut", "Regard", "Restructuration des sourcils", "À la pince et au fil", 20, "18 €", 18);
  p("rehausse",  "Institut", "Regard", "Rehaussement de cils", "Teinture incluse", 60, "62 €", 62);
  p("manucure",  "Institut", "Mains & pieds", "Manucure", "Pose de vernis incluse", 45, "40 €", 40);
  p("gel",       "Institut", "Mains & pieds", "Pose de vernis semi-permanent", "Tenue trois semaines", 60, "52 €", 52);
  p("pedicure",  "Institut", "Mains & pieds", "Pédicure de soin", "Gommage et massage", 50, "50 €", 50);

  /* Nuancier : chaque nuance est une couleur de la chevelure 3D et une prestation.
     r = racine, t = pointes, b = où commence l'éclaircissement (0 = racine, 1 = pointe),
     e = éclat du reflet. Les couleurs sont en linéaire « à l'œil » (hex sRGB). */
  var NUANCES = [
    { id: "naturel",  nom: "Votre couleur",   tech: "Soin profond",          presta: "soin",     r: "#2c1d16", t: "#4a3326", b: 1.0,  e: 0.55, mot: "On la sublime, sans la changer." },
    { id: "polaire",  nom: "Blond polaire",   tech: "Balayage polaire",      presta: "polaire",  r: "#5a4535", t: "#efe6d8", b: 0.28, e: 0.9,  mot: "Un blond froid, lumineux, sans reflet jaune." },
    { id: "miel",     nom: "Miel doré",       tech: "Balayage à main levée", presta: "balayage", r: "#3e2a1c", t: "#c99a5e", b: 0.38, e: 0.8,  mot: "Le soleil posé à la main, mèche par mèche." },
    { id: "cuivre",   nom: "Cuivré vénitien", tech: "Coloration cuivrée",    presta: "cuivre",   r: "#5a2615", t: "#a35a2c", b: 0.0,  e: 0.85, mot: "Une couleur pleine, qui accroche la lumière." },
    { id: "glace",    nom: "Châtain glacé",   tech: "Gloss et patine",       presta: "gloss",    r: "#3a2a22", t: "#7b6152", b: 0.55, e: 0.7,  mot: "Un brun froid, net, qui reste brillant." },
    { id: "noir",     nom: "Noir bleuté",     tech: "Ton sur ton",           presta: "ton",      r: "#111419", t: "#2c3446", b: 0.0,  e: 1.0,  mot: "Un noir profond, avec un reflet nuit." }
  ];

  /* Équipe fictive (portraits générés pour la maquette). u = univers servis,
     j = jours travaillés (0 = dimanche … 6 = samedi) */
  var EQUIPE = [
    { id: "ines",   nom: "Inès",   role: "Coloriste",     u: ["Coiffure"], j: [2, 3, 4, 5, 6], photo: "ines",   txt: "Balayages, blonds froids et couleurs pleines. Elle commence toujours par regarder la lumière sur vos cheveux." },
    { id: "clara",  nom: "Clara",  role: "Coiffeuse",     u: ["Coiffure"], j: [2, 3, 5, 6],    photo: "clara",  txt: "Coupes, coiffures d'événement et mariées. Le geste précis, et le conseil franc." },
    { id: "mathis", nom: "Mathis", role: "Barbier",       u: ["Barbier"],  j: [2, 3, 4, 5, 6], photo: "mathis", txt: "Dégradés nets et rasage au coupe-chou, serviette chaude comprise." },
    { id: "yuna",   nom: "Yuna",   role: "Esthéticienne", u: ["Institut"], j: [3, 4, 5, 6],    photo: "yuna",   txt: "Soins du visage, regard et mains. Une cabine au calme, au fond du salon." }
  ];

  /* Horaires de démonstration : [ouverture, fermeture] en minutes, null = fermé */
  var HORAIRES = [null, null, [540, 1140], [540, 1140], [540, 1200], [540, 1140], [510, 960]];
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  /* Rendez-vous pris sur cet appareil (démo : rien n'est envoyé) */
  var CLE = "lonviere-rdv";
  function lireRdv() { try { return JSON.parse(localStorage.getItem(CLE) || "[]"); } catch (e) { return []; } }
  function ecrireRdv(l) { try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) {} }

  window.LONVIERE = {
    PRESTA: P, NUANCES: NUANCES, EQUIPE: EQUIPE, HORAIRES: HORAIRES, JOURS: JOURS,
    UNIVERS: ["Coiffure", "Barbier", "Institut"],
    presta: function (id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; },
    nuance: function (id) { for (var i = 0; i < NUANCES.length; i++) if (NUANCES[i].id === id) return NUANCES[i]; return NUANCES[0]; },
    membre: function (id) { for (var i = 0; i < EQUIPE.length; i++) if (EQUIPE[i].id === id) return EQUIPE[i]; return null; },
    lireRdv: lireRdv, ecrireRdv: ecrireRdv
  };
})();
