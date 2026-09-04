/* ------------------------------------------------------------------
   PULSE — planning de la semaine, filtrable
   Cours de démonstration (horaires fictifs).
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  var COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  /* j = jour (0 = lundi), h = heure, min = durée, niv = niveau,
     pl = places restantes (0 = complet)                                */
  var COURS = [
    { j:0, h:"07:00", nom:"Cross-training", min:45, niv:"Tous niveaux", coach:"Lena", pl:4 },
    { j:0, h:"12:15", nom:"HIIT express",   min:30, niv:"Tous niveaux", coach:"Marco", pl:6 },
    { j:0, h:"18:30", nom:"Force & muscu",  min:60, niv:"Intermédiaire", coach:"Yanis", pl:0 },
    { j:0, h:"19:45", nom:"Cardio boxing",  min:50, niv:"Tous niveaux", coach:"Marco", pl:3 },

    { j:1, h:"07:00", nom:"Mobilité & core", min:40, niv:"Tous niveaux", coach:"Lena", pl:8 },
    { j:1, h:"12:15", nom:"HIIT express",   min:30, niv:"Tous niveaux", coach:"Marco", pl:2 },
    { j:1, h:"18:00", nom:"Cycling",        min:45, niv:"Tous niveaux", coach:"Sofia", pl:5 },
    { j:1, h:"19:15", nom:"Force & muscu",  min:60, niv:"Avancé", coach:"Yanis", pl:1 },

    { j:2, h:"07:00", nom:"Cross-training", min:45, niv:"Tous niveaux", coach:"Lena", pl:0 },
    { j:2, h:"12:15", nom:"Renfo express",  min:30, niv:"Tous niveaux", coach:"Sofia", pl:7 },
    { j:2, h:"18:30", nom:"Cardio boxing",  min:50, niv:"Intermédiaire", coach:"Marco", pl:4 },
    { j:2, h:"20:00", nom:"Yoga"        ,   min:60, niv:"Tous niveaux", coach:"Ana", pl:9 },

    { j:3, h:"07:00", nom:"Force & muscu",  min:60, niv:"Intermédiaire", coach:"Yanis", pl:3 },
    { j:3, h:"12:15", nom:"HIIT express",   min:30, niv:"Tous niveaux", coach:"Marco", pl:0 },
    { j:3, h:"18:00", nom:"Cross-training", min:45, niv:"Avancé", coach:"Lena", pl:2 },
    { j:3, h:"19:30", nom:"Mobilité & core", min:40, niv:"Tous niveaux", coach:"Ana", pl:6 },

    { j:4, h:"07:00", nom:"Cycling",        min:45, niv:"Tous niveaux", coach:"Sofia", pl:5 },
    { j:4, h:"12:15", nom:"Renfo express",  min:30, niv:"Tous niveaux", coach:"Sofia", pl:4 },
    { j:4, h:"18:30", nom:"Cardio boxing",  min:50, niv:"Tous niveaux", coach:"Marco", pl:1 },
    { j:4, h:"19:45", nom:"Cross-training", min:45, niv:"Intermédiaire", coach:"Lena", pl:3 },

    { j:5, h:"09:00", nom:"Cross-training", min:60, niv:"Tous niveaux", coach:"Lena", pl:6 },
    { j:5, h:"10:30", nom:"Force & muscu",  min:60, niv:"Intermédiaire", coach:"Yanis", pl:4 },
    { j:5, h:"11:45", nom:"Yoga"          , min:60, niv:"Tous niveaux", coach:"Ana", pl:8 },

    { j:6, h:"10:00", nom:"Mobilité & core", min:40, niv:"Tous niveaux", coach:"Ana", pl:10 },
    { j:6, h:"11:15", nom:"Cycling",        min:45, niv:"Tous niveaux", coach:"Sofia", pl:7 }
  ];

  var TYPES = [];
  COURS.forEach(function (c) { if (TYPES.indexOf(c.nom) === -1) TYPES.push(c.nom); });

  /* aujourd'hui, en semaine qui commence le lundi */
  var aujourdhui = (new Date().getDay() + 6) % 7;
  var state = { j: aujourdhui, type: "", niv: "", moment: "", q: "", dispo: false };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function moment(h) {
    var hh = parseInt(h, 10);
    return hh < 12 ? "matin" : (hh < 17 ? "midi" : "soir");
  }

  function filtrer() {
    var q = state.q.trim().toLowerCase();
    return COURS.filter(function (c) {
      if (state.j !== -1 && c.j !== state.j) return false;
      if (state.type && c.nom !== state.type) return false;
      if (state.niv && c.niv !== state.niv) return false;
      if (state.moment && moment(c.h) !== state.moment) return false;
      if (state.dispo && c.pl === 0) return false;
      if (q && (c.nom + " " + c.coach + " " + c.niv).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function ligne(c, i) {
    var etat = c.pl === 0
      ? '<div class="tag complet">Complet</div>'
      : '<div class="tag">' + c.pl + (c.pl > 1 ? " places" : " place") + '</div>';
    var jour = state.j === -1 ? '<span class="jr">' + COURTS[c.j] + '</span> ' : "";
    return '<div class="slot" style="--i:' + i + '">' +
      '<div class="t">' + jour + c.h + '</div>' +
      '<div class="c">' + c.nom +
        '<small>' + c.min + ' min &middot; ' + c.niv + ' &middot; avec ' + c.coach + '</small></div>' +
      etat + '</div>';
  }

  function rendre() {
    var res = filtrer();

    $("#pl-liste").innerHTML = res.length
      ? res.map(ligne).join("")
      : '<div class="pl-vide"><b>Aucun cours avec ces crit&egrave;res.</b>' +
        '<p>Change de jour, ou enl&egrave;ve un filtre : la salle tourne du lundi au dimanche.</p>' +
        '<button type="button" class="pl-reset" data-reset>Voir toute la semaine</button></div>';

    var libre = res.reduce(function (n, c) { return n + c.pl; }, 0);
    $("#pl-compte").innerHTML = res.length
      ? '<b>' + res.length + '</b> cours &middot; <b>' + libre + '</b> places libres'
      : '<b>0</b> cours';

    $$("[data-j]").forEach(function (b) {
      var on = parseInt(b.getAttribute("data-j"), 10) === state.j;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$(".pl-chip").forEach(function (b) {
      var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
      var on = (k === "dispo") ? state.dispo : state[k] === v;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function init() {
    if (!$("#pl-liste")) return;

    $("#pl-jours").innerHTML = JOURS.map(function (j, i) {
      return '<button type="button" class="pl-jour" data-j="' + i + '" aria-pressed="false">' +
        '<span class="lg">' + j + '</span><span class="sm">' + COURTS[i] + '</span></button>';
    }).join("") + '<button type="button" class="pl-jour" data-j="-1" aria-pressed="false">' +
      '<span class="lg">Toute la semaine</span><span class="sm">7j</span></button>';

    $("#pl-types").innerHTML = TYPES.map(function (t) {
      return '<button type="button" class="pl-chip" data-k="type" data-v="' + t + '" aria-pressed="false">' + t + '</button>';
    }).join("");

    rendre();

    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-j],.pl-chip,[data-reset]") : null;
      if (!b) return;

      if (b.hasAttribute("data-reset")) {
        state = { j: -1, type: "", niv: "", moment: "", q: "", dispo: false };
        $("#pl-q").value = "";
        return rendre();
      }
      if (b.hasAttribute("data-j")) {
        state.j = parseInt(b.getAttribute("data-j"), 10);
        return rendre();
      }
      var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
      if (k === "dispo") state.dispo = !state.dispo;
      else state[k] = (state[k] === v) ? "" : v;
      rendre();
    });

    var tm;
    $("#pl-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(tm);
      tm = setTimeout(function () { state.q = v; rendre(); }, 180);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
