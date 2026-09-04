/* ------------------------------------------------------------------
   HORIZON Immobilier — moteur de recherche des biens
   Catalogue de démonstration (biens fictifs).
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  /* 1. CATALOGUE ---------------------------------------------------- */
  var BIENS = [
    { ref:"HZ-104", t:"vente", nom:"Maison de maître", loc:"Belair", type:"Maison",
      m2:240, ch:5, prix:1490000, atout:"Jardin", neuf:false,
      img:"photos/maison-maitre-belair.jpg", alt:"Salon de la maison de maître à Belair, fauteuil et parquet d'origine",
      desc:"Belle époque, parquets d'origine, jardin clos plein sud." },

    { ref:"HZ-118", t:"vente", nom:"Penthouse lumineux", loc:"Kirchberg", type:"Penthouse",
      m2:135, ch:3, prix:980000, atout:"Terrasse", neuf:true,
      img:"photos/penthouse-kirchberg.jpg", alt:"Façade et terrasses du penthouse au Kirchberg",
      desc:"Dernier étage, terrasse de 40 m², double parking en sous-sol." },

    { ref:"HZ-131", t:"vente", nom:"Villa contemporaine", loc:"Strassen", type:"Villa",
      m2:285, ch:5, prix:1850000, atout:"Piscine", neuf:false,
      img:"photos/villa-strassen.jpg", alt:"Villa contemporaine à Strassen, piscine et baies vitrées",
      desc:"Volumes ouverts, piscine chauffée, terrain de 12 ares." },

    { ref:"HZ-142", t:"vente", nom:"Appartement neuf", loc:"Merl", type:"Appartement",
      m2:92, ch:2, prix:745000, atout:"Balcon", neuf:true,
      img:"photos/appartement-merl.jpg", alt:"Séjour de l'appartement neuf à Merl, claustra en bois clair",
      desc:"Livraison immédiate, classe énergétique A, cave et parking." },

    { ref:"HZ-155", t:"vente", nom:"Duplex sous les toits", loc:"Limpertsberg", type:"Duplex",
      m2:118, ch:3, prix:895000, atout:"Charme", neuf:false,
      img:"photos/duplex-limpertsberg.jpg", alt:"Pièce sous les toits du duplex à Limpertsberg, poutres apparentes",
      desc:"Poutres apparentes, mezzanine et vue dégagée sur le parc." },

    { ref:"HZ-160", t:"vente", nom:"Maison mitoyenne", loc:"Bertrange", type:"Maison",
      m2:165, ch:4, prix:1120000, atout:"Garage", neuf:false,
      img:"photos/maison-bertrange.jpg", alt:"Rangée de maisons mitoyennes en pierre à Bertrange",
      desc:"Quartier calme, école à pied, garage double et cave voûtée." },

    { ref:"HZ-173", t:"vente", nom:"Loft d'artiste", loc:"Hollerich", type:"Loft",
      m2:140, ch:2, prix:820000, atout:"Volume", neuf:false,
      img:"photos/loft-hollerich.jpg", alt:"Loft d'artiste à Hollerich, ancien atelier réhabilité",
      desc:"Ancien atelier réhabilité, 4,2 m sous plafond, verrière plein est." },

    { ref:"HZ-181", t:"vente", nom:"Terrain à bâtir", loc:"Mersch", type:"Terrain",
      m2:620, ch:0, prix:495000, atout:"Constructible", neuf:false,
      img:"photos/terrain-mersch.jpg", alt:"Terrain à bâtir à Mersch, parcelle en lisière de bois",
      desc:"Parcelle viabilisée, orientation sud-ouest, PAG favorable." },

    { ref:"HZ-190", t:"vente", nom:"Appartement vue Alzette", loc:"Esch-sur-Alzette", type:"Appartement",
      m2:76, ch:2, prix:425000, atout:"Ascenseur", neuf:false,
      img:"photos/appartement-esch.jpg", alt:"Séjour lumineux ouvert sur le balcon, appartement à Esch-sur-Alzette",
      desc:"Deuxième étage avec ascenseur, balcon filant, proche gare." },

    { ref:"HZ-205", t:"location", nom:"Appartement d'angle", loc:"Limpertsberg", type:"Appartement",
      m2:78, ch:2, prix:2400, atout:"Balcon", neuf:false,
      img:"photos/appartement-limpertsberg.jpg", alt:"Cuisine et coin repas de l'appartement d'angle à Limpertsberg",
      desc:"Double exposition, cuisine équipée, disponible tout de suite." },

    { ref:"HZ-212", t:"location", nom:"Studio meublé", loc:"Gare", type:"Studio",
      m2:38, ch:1, prix:1350, atout:"Meublé", neuf:true,
      img:"photos/studio-gare.jpg", alt:"Coin repas du studio meublé, quartier Gare",
      desc:"Entièrement meublé, charges comprises, bail flexible." },

    { ref:"HZ-224", t:"location", nom:"Maison familiale", loc:"Bertrange", type:"Maison",
      m2:180, ch:4, prix:4200, atout:"Jardin", neuf:false,
      img:"photos/maison-familiale-bertrange.jpg", alt:"Intérieur de la maison familiale à Bertrange, escalier bois",
      desc:"Jardin clos, garage, à cinq minutes de l'école européenne." },

    { ref:"HZ-231", t:"location", nom:"Penthouse Clausen", loc:"Clausen", type:"Penthouse",
      m2:120, ch:3, prix:5500, atout:"Terrasse", neuf:true,
      img:"photos/penthouse-clausen.jpg", alt:"Terrasse du penthouse à Clausen, vue sur la vallée",
      desc:"Vue sur la vallée, terrasse plein ciel, prestations soignées." },

    { ref:"HZ-240", t:"location", nom:"Duplex Belair", loc:"Belair", type:"Duplex",
      m2:105, ch:3, prix:3100, atout:"Parking", neuf:false,
      img:"photos/duplex-belair.jpg", alt:"Séjour du duplex à Belair avec escalier",
      desc:"Deux niveaux, bureau indépendant, parking intérieur." }
  ];

  /* 2. ÉTAT --------------------------------------------------------- */
  var state = { t:"vente", q:"", loc:"", type:"", ch:0, m2:0, budget:0, sort:"new" };

  var BUDGETS = {
    vente:    [[0,"Sans limite"],[500000,"500 000 €"],[750000,"750 000 €"],[1000000,"1 000 000 €"],[1500000,"1 500 000 €"],[2000000,"2 000 000 €"]],
    location: [[0,"Sans limite"],[1500,"1 500 € / mois"],[2500,"2 500 € / mois"],[3500,"3 500 € / mois"],[5000,"5 000 € / mois"],[7500,"7 500 € / mois"]]
  };

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function euros(n) { return n.toLocaleString("fr-FR").replace(/ | /g, " ") + " €"; }

  /* 3. FILTRAGE ----------------------------------------------------- */
  function filtrer() {
    var q = state.q.trim().toLowerCase();
    var out = BIENS.filter(function (b) {
      if (b.t !== state.t) return false;
      if (state.loc && b.loc !== state.loc) return false;
      if (state.type && b.type !== state.type) return false;
      if (state.ch && b.ch < state.ch) return false;
      if (state.m2 && b.m2 < state.m2) return false;
      if (state.budget && b.prix > state.budget) return false;
      if (q) {
        var hay = (b.nom + " " + b.loc + " " + b.type + " " + b.atout + " " + b.desc + " " + b.ref).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    out.sort(function (a, b) {
      if (state.sort === "prix-asc")  return a.prix - b.prix;
      if (state.sort === "prix-desc") return b.prix - a.prix;
      if (state.sort === "surface")   return b.m2 - a.m2;
      return (a.neuf === b.neuf) ? 0 : (a.neuf ? -1 : 1);
    });
    return out;
  }

  /* 4. RENDU -------------------------------------------------------- */
  function carte(b, i) {
    var specs = '<div><b>' + b.m2 + '</b> m²</div>' +
      (b.ch ? '<div><b>' + b.ch + '</b> ' + (b.ch > 1 ? "chambres" : "chambre") + '</div>'
            : '<div><b>Terrain</b></div>') +
      '<div><b>' + b.atout + '</b></div>';

    var prix = b.t === "location"
      ? euros(b.prix) + '<span class="pm"> / mois</span>'
      : euros(b.prix);

    return '<article class="prop" style="--i:' + i + '">' +
      '<div class="img">' +
        '<span class="tag">' + (b.t === "vente" ? "À vendre" : "À louer") + '</span>' +
        (b.neuf ? '<span class="tag new">Nouveau</span>' : "") +
        '<img src="' + b.img + '" alt="' + b.alt + '" loading="lazy">' +
      '</div>' +
      '<div class="body">' +
        '<div class="loc">' + b.loc + ', Luxembourg</div>' +
        '<h3>' + b.nom + '</h3>' +
        '<p class="dsc">' + b.desc + '</p>' +
        '<div class="specs">' + specs + '</div>' +
        '<div class="price">' + prix + '<span class="ref">Réf. ' + b.ref + '</span></div>' +
      '</div></article>';
  }

  function puces() {
    var p = [];
    if (state.q)      p.push(["q", "« " + state.q + " »"]);
    if (state.loc)    p.push(["loc", state.loc]);
    if (state.type)   p.push(["type", state.type]);
    if (state.ch)     p.push(["ch", state.ch + " chambres et +"]);
    if (state.m2)     p.push(["m2", state.m2 + " m² et +"]);
    if (state.budget) p.push(["budget", "jusqu'à " + euros(state.budget) + (state.t === "location" ? " / mois" : "")]);
    return p.map(function (c) {
      return '<button class="chip" type="button" data-clear="' + c[0] + '">' + c[1] +
             '<span aria-hidden="true">✕</span><span class="sr">Retirer ce filtre</span></button>';
    }).join("");
  }

  function rendre() {
    var res = filtrer();

    $("#resultats").innerHTML = res.length
      ? res.map(carte).join("")
      : '<div class="empty"><span class="eyebrow">Aucun résultat</span>' +
        '<h3>Aucun bien ne correspond à cette recherche.</h3>' +
        '<p>Élargissez le budget ou la localité, ou confiez-nous votre recherche : nous vous prévenons dès qu\'un bien se libère.</p>' +
        '<button class="btn line" type="button" data-reset>Réinitialiser les filtres</button></div>';

    $("#compte").innerHTML = res.length
      ? '<b>' + res.length + '</b> bien' + (res.length > 1 ? "s" : "") + ' ' + (state.t === "vente" ? "à la vente" : "en location")
      : "<b>0</b> bien";
    $("#puces").innerHTML = puces();
    memoriser();
  }

  /* 5. SYNCHRO DES CONTRÔLES ---------------------------------------- */
  function options(liste, vide) {
    return '<option value="">' + vide + '</option>' + liste.map(function (v) {
      return '<option value="' + v + '">' + v + '</option>';
    }).join("");
  }

  function majListes() {
    var dispo = BIENS.filter(function (b) { return b.t === state.t; });
    var uniq  = function (v, i, a) { return a.indexOf(v) === i; };
    var locs  = dispo.map(function (b) { return b.loc; }).filter(uniq).sort();
    var types = dispo.map(function (b) { return b.type; }).filter(uniq).sort();

    if (locs.indexOf(state.loc) === -1) state.loc = "";
    if (types.indexOf(state.type) === -1) state.type = "";

    $$("#f-loc, #t-loc").forEach(function (s) { s.innerHTML = options(locs, "Tout le pays"); });
    $$("#f-type, #t-type").forEach(function (s) { s.innerHTML = options(types, "Tous les types"); });

    var b = BUDGETS[state.t];
    if (!b.some(function (o) { return o[0] === state.budget; })) state.budget = 0;
    $$("#f-budget, #t-budget").forEach(function (s) {
      s.innerHTML = b.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join("");
    });
  }

  function syncUI() {
    $("#f-t").value = state.t;
    $$("#f-loc, #t-loc").forEach(function (s) { s.value = state.loc; });
    $$("#f-type, #t-type").forEach(function (s) { s.value = state.type; });
    $$("#f-budget, #t-budget").forEach(function (s) { s.value = String(state.budget); });
    $("#t-q").value = state.q;
    $("#t-ch").value = String(state.ch);
    $("#t-m2").value = String(state.m2);
    $("#t-sort").value = state.sort;
    $$(".seg button").forEach(function (btn) {
      var on = btn.getAttribute("data-t") === state.t;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function appliquer() { majListes(); syncUI(); rendre(); }

  /* L'état de la recherche vit dans l'URL : le visiteur peut envoyer
     sa sélection par message, elle se rouvre telle quelle.
     (protégé : history est indisponible sur un fichier ouvert en local) */
  var CLES = ["t", "q", "loc", "type", "ch", "m2", "budget", "sort"];

  function memoriser() {
    try {
      var p = new URLSearchParams();
      CLES.forEach(function (k) {
        if (state[k] && !(k === "t" && state.t === "vente") && !(k === "sort" && state.sort === "new")) {
          p.set(k, state[k]);
        }
      });
      var q = p.toString();
      var url = location.pathname + (q ? "?" + q + "#biens" : "");
      history.replaceState(null, "", url);
    } catch (e) { /* pas d'historique disponible : sans conséquence */ }
  }

  function relire() {
    try {
      var p = new URLSearchParams(location.search);
      if (!p.toString()) return false;
      CLES.forEach(function (k) {
        if (!p.has(k)) return;
        var v = p.get(k);
        state[k] = (k === "ch" || k === "m2" || k === "budget") ? (parseInt(v, 10) || 0) : v;
      });
      if (state.t !== "vente" && state.t !== "location") state.t = "vente";
      return true;
    } catch (e) { return false; }
  }

  /* 6. ÉVÉNEMENTS --------------------------------------------------- */
  function init() {
    if (!$("#resultats")) return;
    var partage = relire();
    appliquer();
    /* le scroll attend la mise en page finale (polices, images) :
       sinon on atterrit à côté de la section */
    if (partage) {
      var aller = function () {
        requestAnimationFrame(function () { $("#biens").scrollIntoView(); });
      };
      if (document.readyState === "complete") aller();
      else window.addEventListener("load", aller);
    }

    /* barre du hero : pré-remplit les filtres puis emmène aux résultats */
    $("#finder").addEventListener("submit", function (e) {
      e.preventDefault();
      /* on lit tout avant de reconstruire les listes, sinon les <option>
         régénérées effacent la sélection de l'utilisateur */
      var t = $("#f-t").value, loc = $("#f-loc").value,
          type = $("#f-type").value, budget = parseInt($("#f-budget").value, 10) || 0;
      state.t = t; state.loc = loc; state.type = type; state.budget = budget;
      appliquer();
      $("#biens").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#f-t").addEventListener("change", function () {
      state.t = this.value;
      majListes(); syncUI();
    });

    /* segments Acheter / Louer */
    $$(".seg button").forEach(function (btn) {
      btn.addEventListener("click", function () { state.t = btn.getAttribute("data-t"); appliquer(); });
    });

    /* champ texte, avec une courte temporisation */
    var tm;
    $("#t-q").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(tm);
      tm = setTimeout(function () { state.q = v; rendre(); }, 180);
    });

    var champs = { "t-loc":"loc", "t-type":"type", "t-ch":"ch", "t-m2":"m2", "t-budget":"budget", "t-sort":"sort" };
    Object.keys(champs).forEach(function (id) {
      $("#" + id).addEventListener("change", function () {
        var k = champs[id];
        state[k] = (k === "ch" || k === "m2" || k === "budget") ? (parseInt(this.value, 10) || 0) : this.value;
        syncUI(); rendre();
      });
    });

    /* puces de filtre et réinitialisation */
    document.addEventListener("click", function (e) {
      var chip = e.target.closest ? e.target.closest("[data-clear]") : null;
      if (chip) {
        var k = chip.getAttribute("data-clear");
        state[k] = (k === "ch" || k === "m2" || k === "budget") ? 0 : "";
        appliquer();
        return;
      }
      if (e.target.closest && e.target.closest("[data-reset]")) {
        state.q = ""; state.loc = ""; state.type = ""; state.ch = 0; state.m2 = 0; state.budget = 0; state.sort = "new";
        appliquer();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
