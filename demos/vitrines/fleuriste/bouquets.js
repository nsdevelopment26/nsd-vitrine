/* ------------------------------------------------------------------
   Atelier Verveine — les bouquets, avec recherche et filtres
   Catalogue de démonstration (compositions fictives).
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  /* occ : occasion · col : couleur dominante · p : prix de référence  */
  var BOUQUETS = [
    { img:"bouquet-champetre", nom:"Le Verveine", prix:"dès 32 €", p:32, tag:"Le plus commandé",
      occ:["Sans raison","Anniversaire","Merci"], col:"Multicolore",
      alt:"Bouquet champêtre de tulipes, iris et fleurs des champs dans un vase de verre",
      txt:"Notre bouquet signature. Fleurs de saison, cueillette du jour, jamais deux fois le même." },

    { img:"bouquet-poudre", nom:"Poudré", prix:"48 €", p:48, tag:"Roses anciennes",
      occ:["Merci","Amour"], col:"Rose",
      alt:"Composition de roses anciennes poudrées et d'eucalyptus dans une coupe en laiton",
      txt:"Roses anciennes, eucalyptus et gypsophile, montés en coupe. Pour dire merci comme il faut." },

    { img:"bouquet-dahlia", nom:"Dahlia", prix:"42 €", p:42, tag:"Édition d'automne",
      occ:["Sans raison","Merci"], col:"Multicolore",
      alt:"Composition d'automne à plat, dahlias abricot et zinnias sur une pierre sombre",
      txt:"Dahlias, zinnias et graminées. Une composition graphique, tenue par du raphia." },

    { img:"bouquet-roses", nom:"Rouge profond", prix:"65 €", p:65, tag:"24 tiges",
      occ:["Amour"], col:"Rouge",
      alt:"Bouquet rond de vingt-quatre roses rouges",
      txt:"Vingt-quatre roses rouges, tiges longues, feuillage nettoyé une à une. Le classique, bien fait." },

    { img:"bouquet-tulipes", nom:"Brassée de tulipes", prix:"28 €", p:28, tag:"Arrivage du mardi",
      occ:["Sans raison","Anniversaire"], col:"Multicolore",
      alt:"Brassée de tulipes roses, jaunes et blanches",
      txt:"Trente tulipes du cadran, encore fermées, pour qu'elles s'ouvrent chez vous." },

    { img:"bouquet-seches", nom:"Séché", prix:"36 €", p:36, tag:"Tient un an",
      occ:["Sans raison","Merci"], col:"Naturel",
      alt:"Bouquet de fleurs séchées, immortelles et chardons, sur fond sombre",
      txt:"Immortelles, chardons et lin séchés à l'atelier. Aucun entretien, et il tient un an." },

    { img:"bouquet-pivoines", nom:"Le Rosé", prix:"39 €", p:39, tag:"Pleine saison",
      occ:["Anniversaire","Merci"], col:"Rose",
      alt:"Bouquet de dahlias roses en dégradé, feuillage sombre",
      txt:"Dahlias roses en dégradé, du pâle au fuchsia. Le bouquet qui fait sourire sur le pas de la porte." },

    { img:"bouquet-tulipes-r", nom:"Tulipes rouges", prix:"31 €", p:31, tag:"Arrivage du mardi",
      occ:["Amour","Anniversaire"], col:"Rouge",
      alt:"Bouquet de tulipes rouges dans un vase, lumière chaude",
      txt:"Vingt tulipes rouges, cueillies serrées. Elles s'ouvrent en deux jours et changent toute la pièce." },

    { img:"bouquet-rouges", nom:"Roses de table", prix:"52 €", p:52, tag:"Tiges longues",
      occ:["Amour","Merci"], col:"Rouge",
      alt:"Roses rouges dans un vase de verre sur une table en bois",
      txt:"Douze roses rouges montées haut, pour une table qu'on veut habiller sans l'encombrer." },

    { img:"bouquet-bureau", nom:"Le Bureau", prix:"24 €", p:24, tag:"Petit format",
      occ:["Sans raison","Merci"], col:"Multicolore",
      alt:"Petit bouquet mixte dans un vase de verre, sur un tabouret",
      txt:"Le petit format qui tient sur un coin de bureau. Livré le lundi matin, si vous voulez." },

    { img:"bouquet-juillet", nom:"Juillet", prix:"45 €", p:45, tag:"Cueillette du jour",
      occ:["Anniversaire","Sans raison"], col:"Jaune",
      alt:"Grand bouquet champêtre jaune et rose à contre-jour",
      txt:"Rudbeckias, cosmos et graminées. Le bouquet de plein été, généreux et un peu désordonné." },

    { img:"bouquet-tournesols", nom:"Le Généreux", prix:"58 €", p:58, tag:"Grand format",
      occ:["Anniversaire","Merci"], col:"Multicolore",
      alt:"Grand bouquet de roses rouges, tournesol et œillets",
      txt:"Roses, tournesol et œillets. Quand il s'agit de marquer le coup, pas de demi-mesure." },

    { img:"bouquet-blanc", nom:"Le Blanc", prix:"34 €", p:34, tag:"Tout en douceur",
      occ:["Naissance","Deuil"], col:"Blanc",
      alt:"Bouquet de fleurs blanches délicates sur fond clair",
      txt:"Anémones et freesias blancs. Pour une naissance, ou pour accompagner sans en faire trop." }
  ];

  var OCCASIONS = ["Anniversaire", "Merci", "Amour", "Naissance", "Deuil", "Sans raison"];
  var COULEURS  = ["Rouge", "Rose", "Blanc", "Jaune", "Multicolore", "Naturel"];

  var state = { q: "", occ: "", col: "", bud: "" };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function budgetOk(b) {
    if (!state.bud) return true;
    if (state.bud === "-35") return b.p < 35;
    if (state.bud === "35-50") return b.p >= 35 && b.p <= 50;
    return b.p > 50;
  }

  function filtrer() {
    var q = state.q.trim().toLowerCase();
    return BOUQUETS.filter(function (b) {
      if (state.occ && b.occ.indexOf(state.occ) === -1) return false;
      if (state.col && b.col !== state.col) return false;
      if (!budgetOk(b)) return false;
      if (q && (b.nom + " " + b.txt + " " + b.col + " " + b.occ.join(" ")).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function carte(b, i) {
    return '<a class="bq" href="#commander" style="--i:' + i + '">' +
      '<div class="bq-ph">' +
        '<img src="photos/' + b.img + '.jpg" width="620" height="775" loading="lazy" alt="' + b.alt + '">' +
        '<span class="bq-tag">' + b.tag + '</span>' +
      '</div>' +
      '<div class="bq-in"><h3>' + b.nom + '</h3><span class="price">' + b.prix + '</span></div>' +
      '<p>' + b.txt + '</p></a>';
  }

  function rendre() {
    var res = filtrer();

    $("#bq-liste").innerHTML = res.length
      ? res.map(carte).join("")
      : '<div class="bq-vide"><b>Rien sous ces critères.</b>' +
        '<p>Dites-nous plutôt à qui vous offrez, et pourquoi : on compose sur mesure, à partir de 25 €.</p>' +
        '<a class="btn" href="#commander">Composer sur mesure</a>' +
        '<button type="button" class="btn ghost" data-reset>Revoir tous les bouquets</button></div>';

    $("#bq-compte").textContent = res.length === BOUQUETS.length
      ? BOUQUETS.length + " bouquets en boutique cette semaine"
      : res.length + (res.length > 1 ? " bouquets" : " bouquet") + " sur " + BOUQUETS.length;

    $$(".bq-chip").forEach(function (c) {
      var k = c.getAttribute("data-k");
      var on = state[k] === c.getAttribute("data-v");
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function init() {
    if (!$("#bq-liste")) return;

    $("#bq-occ").innerHTML = OCCASIONS.map(function (o) {
      return '<button type="button" class="bq-chip" data-k="occ" data-v="' + o + '" aria-pressed="false">' + o + '</button>';
    }).join("");
    $("#bq-col").innerHTML = COULEURS.map(function (c) {
      return '<button type="button" class="bq-chip" data-k="col" data-v="' + c + '" aria-pressed="false">' + c + '</button>';
    }).join("");

    rendre();

    document.addEventListener("click", function (e) {
      var c = e.target.closest ? e.target.closest(".bq-chip, [data-reset]") : null;
      if (!c) return;
      if (c.hasAttribute("data-reset")) {
        state = { q: "", occ: "", col: "", bud: "" };
        $("#bq-q").value = "";
      } else {
        var k = c.getAttribute("data-k"), v = c.getAttribute("data-v");
        state[k] = (state[k] === v) ? "" : v;
      }
      rendre();
    });

    var tm;
    $("#bq-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(tm);
      tm = setTimeout(function () { state.q = v; rendre(); }, 180);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
