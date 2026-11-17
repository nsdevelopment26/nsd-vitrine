/* ==================================================================
   HORIZON : page d'accueil. Navigation, intro dessinée, chargement
   paresseux des scènes 3D, plans au défilement, recherche, formulaires.
   ================================================================== */
(function () {
  "use strict";
  var HZ = window.HZ;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CALME = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = matchMedia("(max-width: 860px)").matches;

  /* ---------- titres découpés en mots ---------- */
  $$("[data-mots]").forEach(function (h) {
    var i = 0;
    (function couper(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
            var m = document.createElement("span"); m.className = "m";
            var s = document.createElement("span"); s.textContent = w; s.style.setProperty("--i", i++);
            m.appendChild(s); frag.appendChild(m);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1) couper(c);
      });
    })(h);
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
  });

  /* ---------- apparitions ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$("[data-v], [data-mots]").forEach(function (el) { if (!el.closest(".hero")) io.observe(el); });

  /* ---------- navigation ---------- */
  var nav = $("#nav"), dernier = 0;
  function majNav() {
    var y = scrollY;
    nav.classList.toggle("solide", y > 40);
    nav.classList.toggle("cache", y > 600 && y > dernier && !menu.classList.contains("ouvert"));
    dernier = y;
  }
  var burger = $(".burger"), menu = $("#menu-mob");
  function basculerMenu(ouvrir) {
    burger.setAttribute("aria-expanded", ouvrir ? "true" : "false");
    burger.setAttribute("aria-label", ouvrir ? "Fermer le menu" : "Ouvrir le menu");
    menu.classList.toggle("ouvert", ouvrir); menu.inert = !ouvrir;
    document.body.style.overflow = ouvrir ? "hidden" : "";
    nav.classList.add("solide");
  }
  burger.addEventListener("click", function () { basculerMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { basculerMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("ouvert")) { basculerMenu(false); burger.focus(); } });
  addEventListener("scroll", majNav, { passive: true }); majNav();
  /* lien actif selon la section */
  var liens = $$(".nav-liens a");
  var ioNav = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      liens.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id ? "true" : "false"); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["immeuble", "maisons", "plans", "biens", "vendre", "contact"].forEach(function (id) { var s = document.getElementById(id); if (s) ioNav.observe(s); });

  /* ---------- 01 · intro : le dessin devient bâtiment ---------- */
  var hero = $("#hero");
  var dispo = HZ.LOTS.filter(function (l) { return l.statut === "disponible"; }).length;
  $("#hc-lots").textContent = HZ.LOTS.length; $("#hc-dispo").textContent = dispo;
  function reveler() {
    if (hero.classList.contains("revele")) return;
    hero.classList.remove("intro"); hero.classList.add("revele");
    var h1 = $("h1", hero); requestAnimationFrame(function () { h1.classList.add("vu"); $$("[data-v]", hero).forEach(function (e) { e.classList.add("vu"); }); });
    try { sessionStorage.setItem("hz-intro", "1"); } catch (e) {}
  }
  var vue = false; try { vue = sessionStorage.getItem("hz-intro") === "1"; } catch (e) {}
  if (CALME || vue || scrollY > 100) { reveler(); }
  else {
    requestAnimationFrame(function () { hero.classList.add("dessine"); });
    var nb = $$(".trace path").length;
    var tIntro = setTimeout(reveler, 170 * nb + 1500);
    $(".passer").addEventListener("pointerdown", function (e) { e.preventDefault(); clearTimeout(tIntro); reveler(); });
    $(".passer").addEventListener("click", function () { clearTimeout(tIntro); reveler(); $("h1", hero).setAttribute("tabindex", "-1"); $("h1", hero).focus({ preventScroll: true }); });
    addEventListener("wheel", function w() { clearTimeout(tIntro); reveler(); removeEventListener("wheel", w); }, { passive: true, once: true });
    addEventListener("touchmove", function t() { clearTimeout(tIntro); reveler(); }, { passive: true, once: true });
  }

  /* ---------- 3D : chargée seulement à l'approche ---------- */
  var webgl = (function () { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
  var IMM = null, MAI = null, enAttenteLot = null;
  function charger3D(sel, mod, fn, cb) {
    var el = $(sel); if (!el) return;
    if (!webgl) { el.classList.add("sans-3d"); return; }
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      import(mod).then(function (m) { cb(m[fn](el)); }).catch(function (err) { console.warn("3D indisponible", err); el.classList.add("sans-3d"); });
    }, { rootMargin: "900px 0px" });
    o.observe(el);
  }
  charger3D("#immeuble", "./immeuble.js", "initImmeuble", function (api) {
    IMM = api; if (enAttenteLot) { api.ouvrirLot(enAttenteLot); enAttenteLot = null; }
  });
  charger3D("#maisons", "./maisons.js", "initMaisons", function (api) { MAI = api; });
  if (!webgl) {
    /* sans WebGL : la liste des lots reste consultable */
    var pan = $(".imm-panneau");
    pan.classList.add("ouvert");
    pan.innerHTML = '<h3>Résidence Lumen</h3><ul class="pn-lots">' + HZ.LOTS.map(function (l) {
      return '<li><a class="pn-cta sec" style="margin-top:6px" href="' + (l.statut === "disponible" ? "bien.html?ref=" + HZ.refLot(l) : "#contact") + '">' + l.id + " · " + l.ch + " ch. · " + l.m2 + " m² · " + (l.statut === "vendu" ? "vendu" : HZ.euros(l.prix)) + "</a></li>";
    }).join("") + "</ul>";
  }
  /* ouvrir un lot depuis un résultat de recherche */
  function voirLot(id) {
    var s = $("#immeuble");
    s.scrollIntoView({ behavior: CALME ? "auto" : "smooth" });
    if (IMM) setTimeout(function () { IMM.ouvrirLot(id); }, CALME ? 0 : 700); else enAttenteLot = id;
  }
  function voirMaison(ref) {
    $("#maisons").scrollIntoView({ behavior: CALME ? "auto" : "smooth" });
    var i = HZ.MAISONS.findIndex(function (m) { return m.ref === ref; });
    var essai = function () { if (MAI) MAI.montrer(i); else setTimeout(essai, 300); };
    setTimeout(essai, 700);
  }

  /* ---------- 04 · plans au défilement ---------- */
  var plans = $("#plans"), plateau = $(".plans-plateau");
  if (plans && plateau) {
    var svg = HZ.svgPlan("A", { echelle: 40 });
    var couches = "";
    for (var k = 0; k < 9; k++) couches += '<div class="couche" style="--k:' + k + '">' + svg + "</div>";
    plateau.innerHTML = '<div class="sol"></div>' + couches + svg;
    var principal = plateau.lastElementChild;
    var familles = ["p-ext-murs", "p-murs", "p-vitrages", "p-portes", "p-ext", "p-pieces", "p-cotes"];
    var etapes = $$(".etapes li"), jauge = $(".plans-jauge i"), photo = $(".plans-photo");
    var isoImg = $(".p-iso"), oeil = $(".p-oeil");
    var lisse = function (a, b, x) { return Math.min(1, Math.max(0, (x - a) / (b - a))); };
    function majPlans() {
      var r = plans.getBoundingClientRect(), avance = innerHeight * 0.55, total = plans.offsetHeight - innerHeight + avance;
      var p = Math.min(1, Math.max(0, (avance - r.top) / total));
      if (CALME) p = Math.max(p, 0.001);
      /* 0 → .38 : le trait, famille par famille */
      familles.forEach(function (f, i) {
        var g = principal.querySelector("." + f); if (!g) return;
        g.style.setProperty("--t", lisse(0.02 + i * 0.045, 0.1 + i * 0.045, p).toFixed(3));
      });
      /* .4 → .6 : le plan se couche et les murs montent */
      var retour = lisse(0.6, 0.68, p), iso = lisse(0.4, 0.5, p) * (1 - retour) * 0.6, ext = lisse(0.46, 0.56, p) * (1 - retour);
      plateau.style.setProperty("--iso", iso.toFixed(3));
      plateau.style.setProperty("--ext", ext.toFixed(3));
      $$(".couche", plateau).forEach(function (c) { c.style.opacity = ext > 0 ? 1 : 0; });
      /* .66 → .78 : la matière ; .84 → .95 : la vie */
      var o1 = lisse(0.66, 0.78, p), o2 = lisse(0.84, 0.95, p);
      isoImg.style.setProperty("--o", (o1 * (1 - o2)).toFixed(3));
      oeil.style.setProperty("--o", o2.toFixed(3));
      plateau.style.opacity = ((1 - o1 * 0.92) * (1 - o2)).toFixed(3);
      var e = p < 0.4 ? 0 : p < 0.66 ? 1 : p < 0.84 ? 2 : 3;
      etapes.forEach(function (li, i) { li.classList.toggle("on", i === e); });
      var em = $(".etape-mob"); if (em && em.dataset.e !== String(e)) { em.dataset.e = e; em.textContent = $("p", etapes[e]).textContent; }
      jauge.style.setProperty("--p", p.toFixed(3));
    }
    addEventListener("scroll", function () { requestAnimationFrame(majPlans); }, { passive: true });
    addEventListener("resize", majPlans); majPlans();
  }

  /* ---------- 05 · recherche ---------- */
  var S = { t: "vente", q: "", loc: "", type: "", ch: 0, m2: 0, budget: 0, tri: "new" };
  var BUDGETS = {
    vente: [[0, "Sans limite"], [500000, "500 000 €"], [800000, "800 000 €"], [1000000, "1 000 000 €"], [1500000, "1 500 000 €"], [2000000, "2 000 000 €"], [3000000, "3 000 000 €"]],
    location: [[0, "Sans limite"], [1500, "1 500 € / mois"], [2500, "2 500 € / mois"], [3500, "3 500 € / mois"], [5000, "5 000 € / mois"]]
  };
  var CLES = ["t", "q", "loc", "type", "ch", "m2", "budget", "tri"];
  function filtrer() {
    var q = S.q.trim().toLowerCase();
    var out = HZ.CATALOGUE.filter(function (b) {
      if (b.t !== S.t) return false;
      if (S.loc && b.loc !== S.loc) return false;
      if (S.type && b.type !== S.type) return false;
      if (S.ch && b.ch < S.ch) return false;
      if (S.m2 && b.m2 < S.m2) return false;
      if (S.budget && b.prix > S.budget) return false;
      if (q && (b.ref + " " + b.nom + " " + b.loc + " " + b.type + " " + b.atout + " " + b.desc).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    out.sort(function (a, b) {
      if (S.tri === "prix-asc") return a.prix - b.prix;
      if (S.tri === "prix-desc") return b.prix - a.prix;
      if (S.tri === "surface") return b.m2 - a.m2;
      return HZ.CATALOGUE.indexOf(a) - HZ.CATALOGUE.indexOf(b);
    });
    return out;
  }
  var FORMES = ["f-a", "f-b", "f-c", "f-d", "f-e"];
  function carte(b, i) {
    var prix = HZ.euros(b.prix) + (b.t === "location" ? " <small>/ mois</small>" : "");
    var d3 = b.source === "lumen" ? '<a class="tag d3" href="#immeuble" data-lot="' + b.lot + '">Voir dans l\'immeuble</a>'
           : b.source === "maison" ? '<a class="tag d3" href="#maisons" data-maison="' + b.ref + '">Tourner autour</a>' : "";
    var specs = '<span><b>' + b.m2 + "</b> m²</span>" + (b.ch ? "<span><b>" + b.ch + "</b> ch.</span>" : "") + (b.sdb ? "<span><b>" + b.sdb + "</b> sdb</span>" : "") + "<span>" + b.atout + "</span>";
    return '<article class="bien ' + FORMES[i % 5] + '" style="--i:' + (i % 6) + '">' +
      '<div class="ph"><span class="tag">' + (b.t === "vente" ? "À vendre" : "À louer") + (b.neuf ? " · neuf" : "") + "</span>" + d3 +
      '<img src="' + b.photos[0] + '" alt="' + b.nom + ", " + b.loc + '" loading="lazy"></div>' +
      '<p class="meta"><span>Réf. ' + b.ref + "</span><span>" + b.loc + "</span></p>" +
      '<h3><a href="bien.html?ref=' + b.ref + '">' + b.nom + "</a></h3>" +
      '<p class="specs">' + specs + "</p>" +
      '<p class="prix">' + prix + "</p></article>";
  }
  function rendre() {
    var res = filtrer();
    $("#resultats").innerHTML = res.length ? res.map(carte).join("") :
      '<div class="vide"><h3>Aucun bien ne correspond, pour l\'instant.</h3><p>Élargissez un critère, ou confiez-nous votre recherche : nous vous prévenons dès qu\'un bien se libère.</p><button class="btn" type="button" data-reset>Tout réinitialiser</button></div>';
    $("#compte").innerHTML = "<b>" + res.length + "</b>bien" + (res.length > 1 ? "s" : "") + " " + (S.t === "vente" ? "à la vente" : "en location");
    var p = [];
    if (S.q) p.push(["q", "« " + S.q + " »"]); if (S.loc) p.push(["loc", S.loc]); if (S.type) p.push(["type", S.type]);
    if (S.ch) p.push(["ch", S.ch + " ch. et +"]); if (S.m2) p.push(["m2", S.m2 + " m² et +"]);
    if (S.budget) p.push(["budget", "≤ " + HZ.euros(S.budget)]);
    $("#puces").innerHTML = p.map(function (c) { return '<button class="puce" type="button" data-clear="' + c[0] + '">' + c[1] + ' <span aria-hidden="true">×</span><span class="sr">Retirer ce filtre</span></button>'; }).join("");
    try {
      var u = new URLSearchParams();
      CLES.forEach(function (k) { if (S[k] && !(k === "t" && S.t === "vente") && !(k === "tri" && S.tri === "new")) u.set(k, S[k]); });
      var u1 = new URLSearchParams(location.search);
      ["lot", "maison"].forEach(function (k) { if (u1.get(k)) u.set(k, u1.get(k)); });
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "") + location.hash);
    } catch (e) {}
  }
  function options(liste, vide) { return '<option value="">' + vide + "</option>" + liste.map(function (v) { return '<option value="' + v + '">' + v + "</option>"; }).join(""); }
  function majListes() {
    var dispo = HZ.CATALOGUE.filter(function (b) { return b.t === S.t; });
    var u = function (v, i, a) { return a.indexOf(v) === i; };
    var locs = dispo.map(function (b) { return b.loc; }).filter(u).sort(), types = dispo.map(function (b) { return b.type; }).filter(u).sort();
    if (locs.indexOf(S.loc) < 0) S.loc = ""; if (types.indexOf(S.type) < 0) S.type = "";
    $("#f-loc").innerHTML = options(locs, "Tout le pays");
    $("#f-type").innerHTML = options(types, "Tous les types");
    var b = BUDGETS[S.t]; if (!b.some(function (o) { return o[0] === S.budget; })) S.budget = 0;
    $("#f-budget").innerHTML = b.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
  }
  function syncUI() {
    $("#f-loc").value = S.loc; $("#f-type").value = S.type; $("#f-budget").value = String(S.budget);
    $("#f-ch").value = String(S.ch); $("#f-m2").value = String(S.m2); $("#f-tri").value = S.tri; $("#f-q").value = S.q;
    $$(".bascule button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.t === S.t ? "true" : "false"); });
  }
  function appliquer() { majListes(); syncUI(); rendre(); }
  try {
    var u0 = new URLSearchParams(location.search);
    CLES.forEach(function (k) { if (u0.has(k)) S[k] = (k === "ch" || k === "m2" || k === "budget") ? (parseInt(u0.get(k), 10) || 0) : u0.get(k); });
    if (S.t !== "vente" && S.t !== "location") S.t = "vente";
  } catch (e) {}
  appliquer();
  $$(".bascule button").forEach(function (b) { b.addEventListener("click", function () { S.t = b.dataset.t; appliquer(); }); });
  [["f-loc", "loc"], ["f-type", "type"], ["f-ch", "ch"], ["f-m2", "m2"], ["f-budget", "budget"], ["f-tri", "tri"]].forEach(function (p) {
    $("#" + p[0]).addEventListener("change", function (e) { var v = e.target.value; S[p[1]] = (p[1] === "ch" || p[1] === "m2" || p[1] === "budget") ? (parseInt(v, 10) || 0) : v; rendre(); });
  });
  var tq; $("#f-q").addEventListener("input", function (e) { clearTimeout(tq); tq = setTimeout(function () { S.q = e.target.value; rendre(); }, 180); });
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-clear]");
    if (c) { var k = c.dataset.clear; S[k] = (k === "q" || k === "loc" || k === "type") ? "" : 0; appliquer(); return; }
    if (e.target.closest("[data-reset]")) { S = { t: S.t, q: "", loc: "", type: "", ch: 0, m2: 0, budget: 0, tri: "new" }; appliquer(); return; }
    var l = e.target.closest("[data-lot]");
    if (l && l.classList.contains("tag")) { e.preventDefault(); voirLot(l.dataset.lot); return; }
    var m = e.target.closest("[data-maison]");
    if (m) { e.preventDefault(); voirMaison(m.dataset.maison); }
  });

  /* ---------- 06 · la ligne de cote suit le défilement ---------- */
  var cotes = $(".cotes");
  if (cotes) addEventListener("scroll", function () {
    var r = cotes.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    cotes.style.setProperty("--p", p.toFixed(3));
  }, { passive: true });

  /* ---------- formulaires ---------- */
  var MSG = { valueMissing: "Ce champ est nécessaire.", typeMismatch: "Adresse e-mail incomplète.", rangeUnderflow: "Valeur trop petite.", rangeOverflow: "Valeur trop grande." };
  function verifier(champs) {
    var ok = true, premier = null;
    champs.forEach(function (inp) {
      var box = inp.closest(".champ"), err = box ? $(".err", box) : $('[data-err="' + inp.name + '"]', inp.form);
      var v = inp.validity, msg = "";
      if (!v.valid) { for (var k in MSG) if (v[k]) { msg = MSG[k]; break; } if (!msg) msg = "Valeur à vérifier."; if (inp.type === "checkbox") msg = "Merci de cocher cette case."; if (inp.type === "radio") msg = "Choisissez un type de bien."; }
      if (box) box.classList.toggle("ko", !!msg);
      if (err) err.textContent = msg;
      inp.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) { ok = false; premier = premier || inp; }
    });
    if (premier) premier.focus();
    return ok;
  }
  /* estimation en trois étapes */
  var est = $("#estimation");
  if (est) {
    var pas = 1, sets = $$("fieldset", est), barre = $$(".estim-barre i", est);
    var prec = $(".prec", est), suiv = $(".suiv", est), lab = $(".estim-pas", est);
    function montrerPas(n) {
      pas = n;
      sets.forEach(function (f) { f.classList.toggle("actif", +f.dataset.pas === n); });
      barre.forEach(function (b, i) { b.classList.toggle("fait", i < n); });
      prec.hidden = n === 1;
      suiv.firstChild.textContent = n === 3 ? "Recevoir mon estimation " : "Continuer ";
      lab.textContent = "Étape " + n + " / 3";
    }
    prec.addEventListener("click", function () { montrerPas(pas - 1); });
    est.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = sets[pas - 1];
      var champs = $$("input[required], select[required]", f);
      var radios = champs.filter(function (c) { return c.type === "radio"; });
      champs = champs.filter(function (c) { return c.type !== "radio"; });
      if (radios.length) champs.unshift(radios[0]);
      if (!verifier(champs)) return;
      if (pas < 3) { montrerPas(pas + 1); var p1 = $("input, select", sets[pas - 1]); if (p1) p1.focus(); return; }
      var d = new FormData(est);
      $(".merci-recap", est).innerHTML = [["Bien", d.get("type") + ", " + d.get("surface") + " m²"], ["Localité", d.get("localite")], ["Chambres", d.get("chambres")], ["Projet", d.get("delai")]]
        .map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + String(r[1]).replace(/</g, "&lt;") + "</dd></div>"; }).join("");
      sets.forEach(function (s) { s.classList.remove("actif"); });
      $(".estim-actions", est).hidden = true; barre.forEach(function (b) { b.classList.add("fait"); }); lab.textContent = "Envoyé";
      var m = $(".merci", est); m.classList.add("on"); m.focus();
    });
  }
  var fc = $("#form-contact");
  if (fc) fc.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!verifier($$("[required]", fc))) return;
    $$(".champ, .consent, button[type=submit], h3", fc).forEach(function (x) { x.hidden = true; });
    var m = $(".merci", fc); m.classList.add("on"); m.focus();
  });
  /* un bouton « visite » ou « être prévenu » préremplit le formulaire */
  document.addEventListener("hz:sujet", function (e) {
    var s = $("#c-sujet"), msg = $("#c-msg");
    if (s) s.value = /visite/i.test(e.detail) ? "Organiser une visite" : "Une question sur un bien";
    if (msg && !msg.value) msg.value = "Bonjour, je souhaite en savoir plus : " + e.detail.replace(/^Visite · /, "") + ".";
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-sujet]");
    if (a && !a.closest(".imm-panneau") && !a.closest(".mai-fiche")) document.dispatchEvent(new CustomEvent("hz:sujet", { detail: a.dataset.sujet }));
  });

  /* ---------- contact : la photo du soir s'approche ---------- */
  var cf = $(".contact-fond");
  if (cf && !CALME) addEventListener("scroll", function () {
    var r = cf.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, 1 - r.top / innerHeight));
    cf.style.setProperty("--z", (1.12 - p * 0.1).toFixed(3));
  }, { passive: true });
})();
