/* ------------------------------------------------------------------
   Le Petit Comptoir — la carte, filtrable
   Carte de démonstration (plats fictifs).
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  /* 1. LA CARTE ----------------------------------------------------- */
  /* reg : vg = végétarien, sg = sans gluten, sl = sans lactose        */
  var CARTE = [
    { cat:"Entrées", n:"Velouté du moment", d:"Légumes de saison, huile de noisette", p:9, reg:["vg","sg"] },
    { cat:"Entrées", n:"Œuf parfait", d:"Crème de champignons, lard croustillant", p:12, reg:["sg"] },
    { cat:"Entrées", n:"Terrine de campagne", d:"Cornichons maison, pain de seigle grillé", p:11, reg:["sl"] },
    { cat:"Entrées", n:"Betterave et chèvre frais", d:"Noisettes torréfiées, miel de sapin", p:11, reg:["vg","sg"] },
    { cat:"Entrées", n:"Tartare de truite", d:"Aneth, citron confit, crème acidulée", p:14, reg:["sg"] },
    { cat:"Entrées", n:"Poireaux vinaigrette", d:"Vinaigrette à l'échalote, œuf mimosa", p:10, reg:["vg","sg","sl"] },

    { cat:"Plats", n:"Entrecôte, sauce au poivre", d:"Frites maison, salade", p:26, reg:[] },
    { cat:"Plats", n:"Dos de cabillaud rôti", d:"Purée à l'huile d'olive, jus corsé", p:24, reg:["sg"] },
    { cat:"Plats", n:"Risotto de saison", d:"Parmesan, herbes fraîches", p:19, reg:["vg","sg"] },
    { cat:"Plats", n:"Suprême de volaille fermière", d:"Écrasé de pommes de terre, jus au thym", p:22, reg:["sg"] },
    { cat:"Plats", n:"Joue de bœuf braisée", d:"Carottes fondantes, sauce au vin rouge", p:23, reg:["sg","sl"] },
    { cat:"Plats", n:"Gnocchis au potiron", d:"Sauge, éclats de noisette, pecorino", p:18, reg:["vg"] },
    { cat:"Plats", n:"Filet de bar, beurre blanc", d:"Fenouil confit, pommes grenaille", p:27, reg:["sg"] },
    { cat:"Plats", n:"Curry de légumes", d:"Lait de coco, riz basmati, coriandre", p:18, reg:["vg","sg","sl"] },

    { cat:"Desserts", n:"Tarte fine aux pommes", d:"Caramel beurre salé, glace vanille", p:9, reg:["vg"] },
    { cat:"Desserts", n:"Mousse au chocolat", d:"Grué de cacao", p:8, reg:["vg","sg"] },
    { cat:"Desserts", n:"Crème brûlée à la vanille", d:"Sucre roux caramélisé", p:8, reg:["vg","sg"] },
    { cat:"Desserts", n:"Poire pochée au vin épicé", d:"Sorbet cassis, tuile aux amandes", p:9, reg:["vg","sg","sl"] },
    { cat:"Desserts", n:"Café gourmand", d:"Trois douceurs du jour, expresso", p:10, reg:["vg"] },

    { cat:"Vins au verre", n:"Riesling, Moselle luxembourgeoise", d:"Sec, tendu, agrumes — 12 cl", p:6.5, reg:[] },
    { cat:"Vins au verre", n:"Pinot noir, Remich", d:"Léger, fruits rouges — 12 cl", p:7, reg:[] },
    { cat:"Vins au verre", n:"Côtes-du-Rhône", d:"Rond, poivré — 12 cl", p:6, reg:[] },
    { cat:"Vins au verre", n:"Crémant de Luxembourg", d:"Brut, fines bulles — 10 cl", p:8, reg:[] }
  ];

  var CATS = ["Entrées", "Plats", "Desserts", "Vins au verre"];
  var REGIMES = [["vg", "Végétarien"], ["sg", "Sans gluten"], ["sl", "Sans lactose"]];

  var state = { cat: "", q: "", reg: [] };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function prix(v) {
    return (v % 1 ? v.toFixed(2).replace(".", ",") : v) + " €";
  }

  /* 2. FILTRAGE ----------------------------------------------------- */
  function filtrer() {
    var q = state.q.trim().toLowerCase();
    return CARTE.filter(function (it) {
      if (state.cat && it.cat !== state.cat) return false;
      if (state.reg.length && !state.reg.every(function (r) { return it.reg.indexOf(r) !== -1; })) return false;
      if (q && (it.n + " " + it.d).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  /* 3. RENDU -------------------------------------------------------- */
  function ligne(it) {
    /* les étiquettes vivent sous la description : sur la ligne du nom,
       trois d'entre elles cassaient la mise en page */
    var marques = it.reg.length
      ? '<div class="m-tags">' + it.reg.map(function (r) {
          var lib = REGIMES.filter(function (x) { return x[0] === r; })[0][1];
          return '<span class="m-tag">' + lib + '</span>';
        }).join("") + '</div>'
      : "";
    return '<div class="m-item">' +
      '<div><div class="n">' + it.n + '</div><div class="d">' + it.d + '</div>' + marques + '</div>' +
      '<div class="p">' + prix(it.p) + '</div></div>';
  }

  function rendre() {
    var res = filtrer();
    var html = "";

    CATS.forEach(function (c) {
      var lot = res.filter(function (it) { return it.cat === c; });
      if (!lot.length) return;
      html += '<div class="m-cat">' + c + '</div>' + lot.map(ligne).join("");
    });

    $("#carte-liste").innerHTML = html || '<div class="m-vide">' +
      '<div class="m-vide-t">Rien à cette recherche.</div>' +
      '<p>La carte change avec les saisons, et le chef s\'adapte volontiers : dites-le-nous en réservant.</p>' +
      '<button type="button" class="btn line m-reset" data-reset>Revoir toute la carte</button></div>';

    var n = res.length;
    $("#carte-compte").textContent = n === CARTE.length
      ? CARTE.length + " propositions à la carte"
      : n + (n > 1 ? " propositions" : " proposition") + " sur " + CARTE.length;

    $$(".m-chip").forEach(function (b) {
      var on = b.hasAttribute("data-cat")
        ? b.getAttribute("data-cat") === state.cat
        : state.reg.indexOf(b.getAttribute("data-reg")) !== -1;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* 4. ÉVÉNEMENTS --------------------------------------------------- */
  function init() {
    if (!$("#carte-liste")) return;
    rendre();

    $$("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.cat = (state.cat === b.getAttribute("data-cat")) ? "" : b.getAttribute("data-cat");
        rendre();
      });
    });

    $$("[data-reg]").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = b.getAttribute("data-reg");
        var i = state.reg.indexOf(r);
        if (i === -1) state.reg.push(r); else state.reg.splice(i, 1);
        rendre();
      });
    });

    var tm;
    $("#carte-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(tm);
      tm = setTimeout(function () { state.q = v; rendre(); }, 180);
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-reset]")) {
        state.cat = ""; state.q = ""; state.reg = [];
        $("#carte-q").value = "";
        rendre();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
