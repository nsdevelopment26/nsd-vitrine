/* PULSE — la semaine du studio (données de démonstration, tout est fictif).
   Une seule source pour la semaine 3D, la liste filtrable, la réservation
   et le formulaire d'essai.

   j   = jour (0 = lundi)      h   = début « HH:MM »     min = durée
   fam = famille (couleur)      int = intensité 1 à 5 (hauteur du bloc 3D)
   cap = places au total        pris = places déjà prises
   salle = plateau | cycling | studio                                     */
(function () {
  "use strict";

  var FAMILLES = {
    force:    { nom: "Force",    couleur: "#ff5a2e", texte: "Barres, kettlebells, charges guidées. On construit." },
    cardio:   { nom: "Cardio",   couleur: "#f2b04a", texte: "Intervalles courts, boxe, cross-training. On monte en régime." },
    cycling:  { nom: "Cycling",  couleur: "#e48c86", texte: "Vélo en salle sur la musique, à l'effort qu'on choisit." },
    mobilite: { nom: "Mobilité", couleur: "#e9e1d6", texte: "Yoga, gainage, amplitude. On récupère pour revenir plus fort." }
  };

  var SALLES = { plateau: "Le plateau", cycling: "Salle cycling", studio: "Studio mobilité" };

  var COACHS = {
    Lena:  { role: "Cross-training et mobilité" },
    Marco: { role: "HIIT et cardio boxing" },
    Yanis: { role: "Force et haltérophilie" },
    Sofia: { role: "Cycling et yoga" }
  };

  function c(j, h, nom, min, fam, int, coach, salle, cap, pris, niv) {
    return { id: "c" + j + h.replace(":", ""), j: j, h: h, nom: nom, min: min, fam: fam,
             int: int, coach: coach, salle: salle, cap: cap, pris: pris, niv: niv };
  }

  var COURS = [
    c(0, "07:00", "Cross-training",  45, "cardio",   4, "Lena",  "plateau", 14, 10, "Tous niveaux"),
    c(0, "12:15", "HIIT express",    30, "cardio",   5, "Marco", "plateau", 14,  8, "Tous niveaux"),
    c(0, "18:30", "Force & barres",  60, "force",    4, "Yanis", "plateau", 12, 12, "Intermédiaire"),
    c(0, "19:45", "Cardio boxing",   50, "cardio",   4, "Marco", "plateau", 14, 11, "Tous niveaux"),

    c(1, "07:00", "Mobilité & core", 40, "mobilite", 2, "Lena",  "studio",  16,  8, "Tous niveaux"),
    c(1, "12:15", "HIIT express",    30, "cardio",   5, "Marco", "plateau", 14, 12, "Tous niveaux"),
    c(1, "18:00", "Cycling 45",      45, "cycling",  4, "Sofia", "cycling", 20, 15, "Tous niveaux"),
    c(1, "19:15", "Force & barres",  60, "force",    5, "Yanis", "plateau", 12, 11, "Avancé"),

    c(2, "07:00", "Cross-training",  45, "cardio",   4, "Lena",  "plateau", 14, 14, "Tous niveaux"),
    c(2, "12:15", "Kettlebell",      30, "force",    3, "Yanis", "plateau", 12,  5, "Tous niveaux"),
    c(2, "18:30", "Cardio boxing",   50, "cardio",   4, "Marco", "plateau", 14, 10, "Intermédiaire"),
    c(2, "20:00", "Yoga du soir",    60, "mobilite", 1, "Sofia", "studio",  16,  7, "Tous niveaux"),

    c(3, "07:00", "Force & barres",  60, "force",    4, "Yanis", "plateau", 12,  9, "Intermédiaire"),
    c(3, "12:15", "HIIT express",    30, "cardio",   5, "Marco", "plateau", 14, 14, "Tous niveaux"),
    c(3, "18:00", "Cross-training",  45, "cardio",   5, "Lena",  "plateau", 14, 12, "Avancé"),
    c(3, "19:30", "Mobilité & core", 40, "mobilite", 2, "Lena",  "studio",  16, 10, "Tous niveaux"),

    c(4, "07:00", "Cycling 45",      45, "cycling",  4, "Sofia", "cycling", 20, 15, "Tous niveaux"),
    c(4, "12:15", "Kettlebell",      30, "force",    3, "Yanis", "plateau", 12,  8, "Tous niveaux"),
    c(4, "18:30", "Cardio boxing",   50, "cardio",   4, "Marco", "plateau", 14, 13, "Tous niveaux"),
    c(4, "19:45", "Cycling sprint",  30, "cycling",  5, "Sofia", "cycling", 20, 11, "Intermédiaire"),

    c(5, "09:00", "Cross-training",  60, "cardio",   4, "Lena",  "plateau", 14,  8, "Tous niveaux"),
    c(5, "10:30", "Force & barres",  60, "force",    4, "Yanis", "plateau", 12, 10, "Intermédiaire"),
    c(5, "11:00", "Cycling 45",      45, "cycling",  3, "Sofia", "cycling", 20,  9, "Tous niveaux"),
    c(5, "12:00", "Yoga",            60, "mobilite", 1, "Sofia", "studio",  16,  8, "Tous niveaux"),

    c(6, "10:00", "Mobilité & core", 40, "mobilite", 2, "Lena",  "studio",  16,  6, "Tous niveaux"),
    c(6, "11:15", "Cycling 45",      45, "cycling",  3, "Sofia", "cycling", 20, 13, "Tous niveaux"),
    c(6, "17:00", "Yoga du dimanche",60, "mobilite", 1, "Sofia", "studio",  16,  4, "Tous niveaux")
  ];

  var JOURS  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  var COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  /* Réservations faites sur cet appareil (démo) : on les rejoue sur les places. */
  var CLE = "pulse-resas";
  function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; } }
  function ecrire(l) { try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) {} }

  var resas = lire().filter(function (r) { return COURS.some(function (x) { return x.id === r.id; }); });

  function libres(cours) {
    var n = resas.filter(function (r) { return r.id === cours.id; }).length;
    return Math.max(0, cours.cap - cours.pris - n);
  }
  function minutes(h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; }

  var ecoute = [];
  window.PULSE = {
    FAMILLES: FAMILLES, SALLES: SALLES, COACHS: COACHS, COURS: COURS,
    JOURS: JOURS, COURTS: COURTS,
    aujourdhui: (new Date().getDay() + 6) % 7,
    libres: libres,
    minutes: minutes,
    fin: function (cours) { var m = minutes(cours.h) + cours.min; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); },
    trouver: function (id) { for (var i = 0; i < COURS.length; i++) if (COURS[i].id === id) return COURS[i]; return null; },
    resas: function () { return resas.slice(); },
    reserve: function (id) { return resas.some(function (r) { return r.id === id; }); },
    reserver: function (id, prenom) {
      if (this.reserve(id)) return false;
      var cours = this.trouver(id); if (!cours || libres(cours) <= 0) return false;
      resas.push({ id: id, prenom: prenom, le: Date.now() }); ecrire(resas); this.signaler(); return true;
    },
    annuler: function (id) { resas = resas.filter(function (r) { return r.id !== id; }); ecrire(resas); this.signaler(); },
    surChange: function (fn) { ecoute.push(fn); },
    signaler: function () { ecoute.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  };
})();
