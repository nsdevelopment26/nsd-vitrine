/* ============================================================
   Fiduciaire Orvane — frise des échéances du hero
   Construite à partir de la date du jour : le visiteur voit
   toujours SON année, l'endroit où il en est, et la prochaine
   échéance avec son compte à rebours.
   Échéances luxembourgeoises courantes, société à l'exercice civil :
   TVA mensuelle le 15 du mois suivant, trimestrielle le 15 du mois
   qui suit le trimestre, TVA annuelle le 1er mars, dépôt des comptes
   annuels au RCS dans les 7 mois après la clôture (31 juillet),
   déclaration IRC / ICC au 31 décembre de l'année suivante.
   ============================================================ */
(function () {
  "use strict";
  var frise = document.getElementById("frise"),
      dec = document.getElementById("decompte"),
      an = document.getElementById("frise-an"),
      zone = document.getElementById("frise-scroll");
  if (!frise || !dec) return;

  var TXT = {
    fr: { tva_m: "TVA mensuelle", tva_t: "TVA trimestrielle", tva_a: "TVA annuelle", rcs: "Comptes annuels · RCS", irc: "Déclaration IRC / ICC",
          t4: "4e trimestre précédent", t1: "1er trimestre", t2: "2e trimestre", t3: "3e trimestre", exo: "exercice précédent", depot: "dépôt de l'exercice précédent",
          per: "période de", proch: "Prochaine échéance", j: "jours", j1: "jour", j0: "aujourd'hui", puis: "Puis :", auj: "Aujourd'hui" },
    de: { tva_m: "Monatliche MwSt.", tva_t: "Quartals-MwSt.", tva_a: "Jährliche MwSt.", rcs: "Jahresabschluss · RCS", irc: "Erklärung IRC / ICC",
          t4: "4. Quartal Vorjahr", t1: "1. Quartal", t2: "2. Quartal", t3: "3. Quartal", exo: "Vorjahr", depot: "Hinterlegung Vorjahr",
          per: "Zeitraum", proch: "Nächste Frist", j: "Tage", j1: "Tag", j0: "heute", puis: "Danach:", auj: "Heute" },
    en: { tva_m: "Monthly VAT", tva_t: "Quarterly VAT", tva_a: "Annual VAT", rcs: "Annual accounts · RCS", irc: "IRC / ICC return",
          t4: "previous Q4", t1: "Q1", t2: "Q2", t3: "Q3", exo: "previous year", depot: "filing for previous year",
          per: "period:", proch: "Next deadline", j: "days", j1: "day", j0: "today", puis: "Then:", auj: "Today" },
    pt: { tva_m: "IVA mensal", tva_t: "IVA trimestral", tva_a: "IVA anual", rcs: "Contas anuais · RCS", irc: "Declaração IRC / ICC",
          t4: "4.º trimestre anterior", t1: "1.º trimestre", t2: "2.º trimestre", t3: "3.º trimestre", exo: "exercício anterior", depot: "depósito do exercício anterior",
          per: "período de", proch: "Próximo prazo", j: "dias", j1: "dia", j0: "hoje", puis: "Depois:", auj: "Hoje" }
  };

  var auj = new Date(); auj.setHours(0, 0, 0, 0);
  var Y = auj.getFullYear();
  var debut = new Date(Y, 0, 1), fin = new Date(Y + 1, 0, 1), duree = fin - debut;
  function pos(d) { return Math.min(100, Math.max(0, (d - debut) / duree * 100)); }
  function jours(d) { return Math.round((d - auj) / 864e5); }

  /* les grandes échéances : posées sur la frise, à deux hauteurs pour ne pas se chevaucher */
  var GRANDES = [
    { d: new Date(Y, 0, 15),  k: "tva_t", s: "t4",    h: 70 },
    { d: new Date(Y, 2, 1),   k: "tva_a", s: "exo",   h: 120 },
    { d: new Date(Y, 3, 15),  k: "tva_t", s: "t1",    h: 70 },
    { d: new Date(Y, 6, 15),  k: "tva_t", s: "t2",    h: 70 },
    { d: new Date(Y, 6, 31),  k: "rcs",   s: "depot", h: 132 },
    { d: new Date(Y, 9, 15),  k: "tva_t", s: "t3",    h: 70 },
    { d: new Date(Y, 11, 31), k: "irc",   s: "exo",   h: 120, fin: true }
  ];

  function rendre() {
    var lang = TXT[document.documentElement.lang] ? document.documentElement.lang : "fr";
    var T = TXT[lang], loc = lang + "-LU";
    var moisCourt = new Intl.DateTimeFormat(loc, { month: "short" }),
        moisLong = new Intl.DateTimeFormat(loc, { month: "long" }),
        jourMois = new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" });
    if (an) an.textContent = Y;

    /* toutes les échéances à venir, mensuelles comprises, pour le compte à rebours */
    var toutes = GRANDES.map(function (e) { return { d: e.d, t: T[e.k], s: T[e.s] }; });
    for (var m = 0; m < 14; m++) {
      var d = new Date(Y, m, 15), periode = new Date(Y, m - 1, 1);
      toutes.push({ d: d, t: T.tva_m, s: T.per + " " + moisLong.format(periode) });
    }
    var avenir = toutes.filter(function (e) { return e.d >= auj; }).sort(function (a, b) { return a.d - b.d; });
    /* deux échéances le même jour (le 15 d'un trimestre) : la trimestrielle passe devant */
    var p = avenir[0], suite = avenir.filter(function (e) { return +e.d !== +p.d; }).slice(0, 2);
    var n = jours(p.d);

    dec.innerHTML =
      '<span class="j">' + (n === 0 ? "J" : n) + '<small>' + (n === 0 ? T.j0 : (n === 1 ? T.j1 : T.j)) + '</small></span>' +
      '<span class="quoi">' + T.proch + ' · ' + jourMois.format(p.d) + '</span>' +
      '<b>' + p.t + ' <span style="opacity:.7;font-size:15px">· ' + p.s + '</span></b>' +
      '<span class="puis">' + T.puis + ' ' + suite.map(function (e) { return e.t + ', ' + jourMois.format(e.d); }).join(' · ') + '</span>';

    /* la frise */
    var h = '<div class="axe"></div><div class="fait" id="fait"></div><div class="mois">';
    for (var i = 0; i < 12; i++) h += '<span>' + moisCourt.format(new Date(Y, i, 1)).replace('.', '') + '</span>';
    h += '</div>';
    for (var k = 0; k < 12; k++) {
      var dt = new Date(Y, k, 15);
      h += '<i class="tic' + (dt < auj ? ' passe' : '') + '" style="left:' + pos(dt) + '%" title="' + T.tva_m + '"></i>';
    }
    var prochaineGrande = GRANDES.filter(function (e) { return e.d >= auj; })[0];
    /* les repères bas sont posés en dernier : leur libellé passe devant les filets des repères hauts */
    GRANDES.slice().sort(function (a, b) { return b.h - a.h; }).forEach(function (e) {
      var idx = GRANDES.indexOf(e);
      var cl = 'ech' + (e.d < auj ? ' passe' : '') + (e === prochaineGrande ? ' proche' : '') + (e.fin ? ' fin' : '');
      h += '<div class="' + cl + '" style="left:' + pos(e.d) + '%;--h:' + e.h + 'px;transition-delay:' + (0.6 + idx * 0.12) + 's">' +
        '<span class="pt"></span><span class="lab">' + T[e.k] + '<em>' + jourMois.format(e.d) + ' · ' + T[e.s] + '</em></span></div>';
    });
    h += '<div class="auj" style="left:' + pos(auj) + '%"><i></i><span>' + T.auj + '</span></div>';
    frise.innerHTML = h;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        frise.classList.add("go");
        document.getElementById("fait").style.width = pos(auj) + "%";
      });
    });
    /* sur mobile la frise défile : on la cale sur aujourd'hui */
    if (zone && zone.scrollWidth > zone.clientWidth) {
      zone.scrollLeft = Math.max(0, zone.scrollWidth * pos(auj) / 100 - zone.clientWidth * 0.55);
    }
  }

  rendre();
  /* le sélecteur de langue change l'attribut lang : on reconstruit dans la bonne langue */
  new MutationObserver(rendre).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
