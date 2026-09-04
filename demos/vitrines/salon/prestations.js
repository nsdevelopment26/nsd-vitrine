/* ------------------------------------------------------------------
   Maison Lonvière — prestations et tarifs, avec recherche et filtres
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  /* p = prix affiché, v = prix de référence pour filtrer (en €),
     devis = true quand le tarif dépend du projet                    */
  var PRESTA = [
    { u:"Coiffure", g:"Coupe & coiffage", n:"Coupe femme & brushing", d:"Diagnostic, shampoing, coupe, coiffage", p:"52 €", v:52 },
    { u:"Coiffure", g:"Coupe & coiffage", n:"Coupe enfant", d:"Jusqu'à 12 ans", p:"24 €", v:24 },
    { u:"Coiffure", g:"Coupe & coiffage", n:"Brushing seul", d:"Selon la longueur", p:"dès 28 €", v:28 },
    { u:"Coiffure", g:"Coupe & coiffage", n:"Coiffure de mariée", d:"Essai inclus", p:"sur devis", v:null, devis:true },
    { u:"Coiffure", g:"Couleur & soin", n:"Coloration racines", d:"Sans ammoniaque", p:"58 €", v:58 },
    { u:"Coiffure", g:"Couleur & soin", n:"Balayage", d:"Éclaircissement progressif", p:"dès 95 €", v:95 },
    { u:"Coiffure", g:"Couleur & soin", n:"Soin profond", d:"Cheveux abîmés ou colorés", p:"32 €", v:32 },
    { u:"Coiffure", g:"Couleur & soin", n:"Lissage", d:"Résultat 3 à 5 mois", p:"dès 140 €", v:140 },

    { u:"Barbier", g:"Coupe homme", n:"Coupe classique", d:"Shampoing et coiffage inclus", p:"32 €", v:32 },
    { u:"Barbier", g:"Coupe homme", n:"Dégradé américain", d:"Finition à la tondeuse et au rasoir", p:"38 €", v:38 },
    { u:"Barbier", g:"Coupe homme", n:"Coupe & barbe", d:"La formule complète", p:"52 €", v:52 },
    { u:"Barbier", g:"Barbe & rasage", n:"Taille de barbe", d:"Contours au rasoir", p:"24 €", v:24 },
    { u:"Barbier", g:"Barbe & rasage", n:"Rasage traditionnel", d:"Serviette chaude, coupe-chou", p:"34 €", v:34 },
    { u:"Barbier", g:"Barbe & rasage", n:"Soin du cuir chevelu", d:"Massage et lotion", p:"18 €", v:18 },

    { u:"Institut", g:"Visage", n:"Soin éclat", d:"45 minutes", p:"65 €", v:65 },
    { u:"Institut", g:"Visage", n:"Soin anti-âge", d:"75 minutes", p:"95 €", v:95 },
    { u:"Institut", g:"Visage", n:"Épilation sourcils", d:"Restructuration", p:"16 €", v:16 },
    { u:"Institut", g:"Mains & pieds", n:"Manucure", d:"Pose de vernis incluse", p:"38 €", v:38 },
    { u:"Institut", g:"Mains & pieds", n:"Pose gel", d:"Tenue 3 semaines", p:"55 €", v:55 },
    { u:"Institut", g:"Mains & pieds", n:"Pédicure de soin", d:"Gommage et massage", p:"48 €", v:48 },

    { u:"Toilettage", g:"Chien", n:"Petite race", d:"Bain, séchage, coupe", p:"45 €", v:45 },
    { u:"Toilettage", g:"Chien", n:"Race moyenne", d:"Bain, séchage, coupe", p:"62 €", v:62 },
    { u:"Toilettage", g:"Chien", n:"Grande race", d:"Sur rendez-vous uniquement", p:"dès 78 €", v:78 },
    { u:"Toilettage", g:"Chat & soins", n:"Toilettage chat", d:"Sans contention forcée", p:"52 €", v:52 },
    { u:"Toilettage", g:"Chat & soins", n:"Démêlage", d:"Facturé au temps passé", p:"dès 20 €", v:20 },
    { u:"Toilettage", g:"Chat & soins", n:"Coupe des griffes", d:"Sans rendez-vous", p:"12 €", v:12 }
  ];

  var UNIVERS = ["Coiffure", "Barbier", "Institut", "Toilettage"];
  var state = { u: "Coiffure", q: "", bud: "" };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function budgetOk(it) {
    if (!state.bud) return true;
    if (state.bud === "devis") return !!it.devis;
    if (it.devis) return false;
    if (state.bud === "-30") return it.v < 30;
    if (state.bud === "30-60") return it.v >= 30 && it.v <= 60;
    return it.v > 60;
  }

  function filtrer() {
    var q = state.q.trim().toLowerCase();
    return PRESTA.filter(function (it) {
      /* une recherche cherche dans tout le salon, pas dans le seul onglet */
      if (!q && state.u && it.u !== state.u) return false;
      if (!budgetOk(it)) return false;
      if (q && (it.n + " " + it.d + " " + it.g + " " + it.u).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function rendre() {
    var res = filtrer();
    var q = state.q.trim();
    var groupes = [];

    res.forEach(function (it) {
      var cle = (q || !state.u) ? it.u + " · " + it.g : it.g;
      var lot = groupes.filter(function (g) { return g.cle === cle; })[0];
      if (!lot) { lot = { cle: cle, items: [] }; groupes.push(lot); }
      lot.items.push(it);
    });

    $("#pr-liste").innerHTML = groupes.length
      ? groupes.map(function (g) {
          return '<div class="price-list">' +
            '<h3>' + g.cle + '</h3>' +
            g.items.map(function (it) {
              return '<div class="price-row"><span class="n">' + it.n +
                '<span class="d">' + it.d + '</span></span>' +
                '<span class="dots"></span><span class="p">' + it.p + '</span></div>';
            }).join("") + '</div>';
        }).join("")
      : '<div class="pr-vide"><b>Aucune prestation ne correspond.</b>' +
        '<p>Dites-nous ce que vous cherchez au téléphone : si nous ne le faisons pas, nous connaissons quelqu\'un qui le fait.</p>' +
        '<button type="button" class="tab" data-reset>Revoir toutes les prestations</button></div>';

    $("#pr-compte").textContent = q
      ? res.length + (res.length > 1 ? " prestations trouvées" : " prestation trouvée") + " dans tout le salon"
      : res.length + (res.length > 1 ? " prestations" : " prestation");

    $$(".tab[data-u]").forEach(function (b) {
      var on = !q && b.getAttribute("data-u") === state.u;
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$("[data-bud]").forEach(function (b) {
      var on = b.getAttribute("data-bud") === state.bud;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function init() {
    if (!$("#pr-liste")) return;
    rendre();

    var onglets = $$(".tab[data-u]");
    onglets.forEach(function (b, i) {
      b.addEventListener("click", function () {
        state.u = b.getAttribute("data-u");
        state.q = ""; $("#pr-q").value = "";
        rendre();
      });
      /* navigation au clavier, comme le veut le rôle tablist */
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : (e.key === "ArrowLeft" ? -1 : 0);
        if (!d) return;
        e.preventDefault();
        var suivant = onglets[(i + d + onglets.length) % onglets.length];
        suivant.focus();
        suivant.click();
      });
    });

    $$("[data-bud]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-bud");
        state.bud = (state.bud === v) ? "" : v;
        rendre();
      });
    });

    var tm;
    $("#pr-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(tm);
      tm = setTimeout(function () { state.q = v; rendre(); }, 180);
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-reset]")) {
        state = { u: "Coiffure", q: "", bud: "" };
        $("#pr-q").value = "";
        rendre();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
