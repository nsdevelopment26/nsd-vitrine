/* KORVEL : tout le site hors 3D (ouverture, barre, presse et équipe, boutique, panier, caisse simulée,
   badge, catalogue, devis, langues). La presse 3D (presse3d.js) est pilotée par window.KorvelPresse.
   Stockage local : korvel-panier, korvel-commandes, korvel-devis, korvel-lang. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var racine = document.documentElement;
  var TX = window.KorvelTextile;
  var mobile = window.matchMedia("(max-width: 860px)");
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function lire(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ================= langues ================= */
  var LANG = "fr", MAP = window.KORVEL_I18N || {}, LI = { de: 0, en: 1 }, LOC = { fr: "fr-LU", de: "de-LU", en: "en-IE" };
  function t(fr) { if (LANG === "fr") return fr; var e = MAP[fr]; return e ? e[LI[LANG]] : fr; }
  function euros(n) { return new Intl.NumberFormat(LOC[LANG], { style: "currency", currency: "EUR" }).format(n); }
  var aRafraichir = [];
  function auChangement(f) { aRafraichir.push(f); }
  var noeuds = null;
  function collecter() {
    noeuds = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode; if (!p || /SCRIPT|STYLE/.test(p.nodeName) || p.closest("[data-dyn]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (w.nextNode()) { var n = w.currentNode; n.__fr = n.nodeValue; noeuds.push(n); }
    $$("[placeholder],[aria-label],[alt],[title]").forEach(function (el) {
      if (el.closest("[data-dyn]")) return;
      ["placeholder", "aria-label", "alt", "title"].forEach(function (a) { if (el.hasAttribute(a)) { el["__" + a] = el.getAttribute(a); } });
    });
  }
  function traduire(fr) {
    var cle = fr.trim(); if (LANG === "fr" || !MAP[cle]) return fr;
    return fr.replace(cle, MAP[cle][LI[LANG]]);
  }
  function appliquerLangue(l) {
    LANG = l; racine.lang = l;
    ecrire("korvel-lang", l);
    if (!noeuds) collecter();
    noeuds.forEach(function (n) { n.nodeValue = traduire(n.__fr); });
    $$("[placeholder],[aria-label],[alt],[title]").forEach(function (el) {
      ["placeholder", "aria-label", "alt", "title"].forEach(function (a) { if (el["__" + a] != null) el.setAttribute(a, traduire(el["__" + a])); });
    });
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === l)); });
    document.title = t("KORVEL — Atelier d'impression textile · Esch-sur-Alzette");
    aRafraichir.forEach(function (f) { f(); });
  }

  /* ================= petites choses ================= */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 2600);
  }
  function ref(prefixe) {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return prefixe + "-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function sansAccents(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* ================= ouverture ================= */
  var intro = $("#intro");
  function finIntro() {
    if (!racine.classList.contains("en-intro") || intro.classList.contains("fin")) return;
    intro.classList.add("fin");
    try { sessionStorage.setItem("korvel-intro", "1"); } catch (e) {}
    setTimeout(function () { racine.classList.remove("en-intro"); }, 700);
    document.dispatchEvent(new CustomEvent("korvel:intro-fin"));
  }
  if (racine.classList.contains("en-intro")) {
    var tIntro = setTimeout(finIntro, 3600);
    $("#intro-passer").addEventListener("click", function () { clearTimeout(tIntro); finIntro(); });
    ["wheel", "touchstart"].forEach(function (ev) { window.addEventListener(ev, function () { clearTimeout(tIntro); finIntro(); }, { passive: true, once: true }); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { clearTimeout(tIntro); finIntro(); } }, { once: true });
  }

  /* ================= barre et menu ================= */
  var menu = $("#menu"), menuBtn = $("#menu-btn");
  function menuOuvert(o) {
    menu.hidden = !o; menuBtn.setAttribute("aria-expanded", String(o));
    menuBtn.setAttribute("aria-label", t(o ? "Fermer le menu" : "Ouvrir le menu"));
    racine.classList.toggle("menu-ouvert", o);
    document.body.style.overflow = o ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function () { menuOuvert(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuOuvert(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuOuvert(false); menuBtn.focus(); } });
  $$("[data-lang]").forEach(function (b) { b.addEventListener("click", function () { appliquerLangue(b.dataset.lang); }); });
  // rubrique en cours
  var liens = $$(".barre-liens a");
  var obsRub = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      liens.forEach(function (a) { a.classList.toggle("ici", a.getAttribute("href") === "#" + e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section[id]").forEach(function (s) { obsRub.observe(s); });
  new IntersectionObserver(function (es) { racine.classList.toggle("en-presse", es[0].intersectionRatio > 0.35); }, { threshold: [0, 0.35, 0.6] }).observe($("#presse"));

  /* apparitions */
  $$(".fabrique-tete, .boutique-tete, .badge-apercu, .badge-form, .catalogue-tete, .solutions h2, .tuile, .autres li, .devis-tete, .devis-form, .patron-photo, .patron-texte, .contact-carte").forEach(function (el) { el.classList.add("monte"); });
  var obsVu = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); obsVu.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
  $$(".monte").forEach(function (el) { obsVu.observe(el); });

  /* ================= la presse ================= */
  var scene = $("#presse");
  var PRIX = { piece: { tshirt: 9.5, hoodie: 26 }, zone: { coeur: 4.5, centre: 6.5, dos: 8.5 }, flock: 1.5, nom: 3, numero: 2, remiseDes: 10, remise: 0.1 };
  var REGLAGES = { dtf: ["160 °C", 15], flex: ["150 °C", 12], flock: ["160 °C", 18] };
  var NOTES = {
    dtf: "Transfert par film : toutes les couleurs, dégradés compris. Idéal de 1 à 200 pièces.",
    flex: "Film vinyle découpé, une couleur, rendu satiné et net. Parfait pour les prénoms et les numéros.",
    flock: "Film velours, une couleur, toucher doux et relief léger. Le rendu des maillots de club."
  };
  var NOMS_COULEURS = { noir: "Noir", anthra: "Anthracite", blanc: "Blanc", marine: "Marine", rouge: "Rouge", magenta: "Magenta", olive: "Olive" };
  var NOMS_TEINTES = { blanc: "Blanc", noir: "Noir", magenta: "Magenta", or: "Or", cyan: "Cyan" };
  var etat = {
    piece: "tshirt", couleur: "blanc", technique: "dtf", teinte: "blanc",
    logo: null, exemple: true, zone: "coeur", echelle: 0.85, dx: 0, dy: 0,
    presse: false, equipeFaite: false, ajoute: false
  };
  var equipe = [
    { nom: "Lena", taille: "M", num: "" }, { nom: "Marco", taille: "L", num: "" }, { nom: "Sofia", taille: "S", num: "" },
    { nom: "Jonas", taille: "XL", num: "" }, { nom: "Inês", taille: "S", num: "" }, { nom: "Tom", taille: "M", num: "" }
  ];
  var etape = 1, troisD = null, sans3d = racine.classList.contains("sans-3d");

  function logoExemple() { etat.logo = TX.logoExemple(t("VOTRE LOGO")); etat.exemple = true; }
  logoExemple();

  function envoyer() {
    if (troisD) troisD.etat(etat);
    if (sans3d) dessiner2d();
    majTaille();
    majAction();
    scene.classList.toggle("place", !!troisD && !etat.presse && etape === 2);
  }
  function dessiner2d(membre) {
    var c = $("#apercu-2d"), lt = TX.logoTechnique(etat.logo, etat.technique, etat.teinte);
    var z = TX.ZONES[etat.piece][etat.zone], r = TX.rectDans(z, lt, etat.echelle, etat.dx, etat.dy);
    var face = membre ? "dos" : (etat.zone === "dos" ? "dos" : "devant");
    var imprime = (face === "dos") === (etat.zone === "dos") ? [{ img: lt, rect: r }] : [];
    TX.dessiner({ piece: etat.piece, couleur: etat.couleur, face: face, imprime: imprime, nom: membre ? membre.nom : null, numero: membre ? membre.num : null, texteNom: etat.couleur === "blanc" ? "#121316" : "#f4f5f6" }, c);
  }
  function majTaille() {
    var lt = etat.logo, z = TX.ZONES[etat.piece][etat.zone], r = TX.rectDans(z, lt, etat.echelle, etat.dx, etat.dy);
    $("#echelle-cm").textContent = Math.round(r.w * TX.M / TX.N * 100) + " cm";
  }

  /* nuances et teintes */
  function nuances(boite, liste, noms, cle) {
    boite.innerHTML = "";
    Object.keys(liste).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "nuance"; b.style.setProperty("--c", liste[k].hex || liste[k]);
      b.setAttribute("aria-pressed", String(etat[cle] === k));
      b.setAttribute("aria-label", t(noms[k]));
      b.addEventListener("click", function () {
        etat[cle] = k; $$(".nuance", boite).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (cle === "couleur") $("#couleur-nom").textContent = t(noms[k]);
        reset(); envoyer();
      });
      boite.appendChild(b);
    });
  }
  function dessinerNuances() {
    nuances($("#nuances"), TX.COULEURS, NOMS_COULEURS, "couleur");
    nuances($("#teintes"), TX.TEINTES, NOMS_TEINTES, "teinte");
    $("#couleur-nom").textContent = t(NOMS_COULEURS[etat.couleur]);
  }
  dessinerNuances();
  auChangement(dessinerNuances);

  function reset() {
    if (troisD && troisD.enCours()) return;
    etat.presse = false; etat.equipeFaite = false; etat.ajoute = false;
    if (troisD) troisD.vider();
    $("#et-3").disabled = true; $("#et-3").classList.remove("fait"); $("#et-2").classList.remove("fait");
    $("#recap").hidden = true; $("#reprendre").hidden = true;
    $$(".membre").forEach(function (m) { m.classList.remove("presse"); });
    if (etape === 3) choisirEtape(2);
  }
  $$("input[name=piece]").forEach(function (i) { i.addEventListener("change", function () { etat.piece = i.value; etat.dx = etat.dy = 0; reset(); envoyer(); }); });
  $$("input[name=technique]").forEach(function (i) {
    i.addEventListener("change", function () {
      etat.technique = i.value; $("#teintes-bloc").hidden = i.value === "dtf";
      $("#note-technique").textContent = t(NOTES[i.value]);
      reset(); envoyer();
    });
  });
  auChangement(function () { $("#note-technique").textContent = t(NOTES[etat.technique]); });
  $$("input[name=zone]").forEach(function (i) { i.addEventListener("change", function () { etat.zone = i.value; etat.dx = etat.dy = 0; reset(); envoyer(); }); });
  $("#echelle").addEventListener("input", function () { etat.echelle = this.value / 100; reset(); planifier(); });
  var rafP = 0;
  function planifier() { if (rafP) return; rafP = requestAnimationFrame(function () { rafP = 0; envoyer(); }); }
  function limites() {
    var lt = TX.logoTechnique(etat.logo, "dtf"), z = TX.ZONES[etat.piece][etat.zone], r = TX.rectDans(z, lt, etat.echelle, 0, 0);
    return { x: Math.max(0, z.w - r.w / 2), y: Math.max(0, z.h - r.h / 2) };
  }
  $$("[data-pousse]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.dataset.pousse.split(",").map(Number), l = limites();
      if (!v[0] && !v[1]) { etat.dx = etat.dy = 0; }
      else { etat.dx = Math.max(-l.x, Math.min(l.x, etat.dx + v[0] * 12)); etat.dy = Math.max(-l.y, Math.min(l.y, etat.dy + v[1] * 12)); }
      reset(); envoyer();
    });
  });
  document.addEventListener("korvel:place", function (e) { etat.dx = e.detail.dx; etat.dy = e.detail.dy; planifier(); });

  /* logo déposé */
  function chargerFichier(f) {
    if (!f || !/^image\//.test(f.type)) { toast(t("Ce fichier n'est pas une image. PNG, JPG ou SVG.")); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      if (!img.naturalWidth) { img.width = 600; img.height = 600; }
      etat.logo = TX.preparerLogo(img); etat.exemple = false; etat.dx = etat.dy = 0;
      URL.revokeObjectURL(url); reset(); envoyer(); toast(t("Logo posé sur le film. Placez-le, puis pressez."));
    };
    img.onerror = function () { toast(t("Ce fichier n'a pas pu être lu.")); };
    img.src = url;
  }
  $("#logo-fichier").addEventListener("change", function () { chargerFichier(this.files[0]); this.value = ""; });
  var depot = $(".depot");
  ["dragenter", "dragover"].forEach(function (ev) { depot.addEventListener(ev, function (e) { e.preventDefault(); depot.classList.add("survol"); }); });
  ["dragleave", "drop"].forEach(function (ev) { depot.addEventListener(ev, function () { depot.classList.remove("survol"); }); });
  depot.addEventListener("drop", function (e) { e.preventDefault(); chargerFichier(e.dataTransfer.files[0]); });
  $("#logo-exemple").addEventListener("click", function () { logoExemple(); etat.dx = etat.dy = 0; reset(); envoyer(); });
  auChangement(function () { if (etat.exemple) { logoExemple(); envoyer(); } });

  /* étapes */
  function choisirEtape(n) {
    etape = n;
    [1, 2, 3].forEach(function (k) {
      var b = $("#et-" + k); b.setAttribute("aria-selected", String(k === n)); b.tabIndex = k === n ? 0 : -1;
      $("#pan-" + k).hidden = k !== n;
    });
    if (troisD && !troisD.enCours()) troisD.vue(n === 3 && etat.equipeFaite ? "equipe" : "presse");
    scene.classList.toggle("place", !!troisD && !etat.presse && n === 2);
    majAction();
  }
  $$("[data-etape]").forEach(function (b) {
    b.addEventListener("click", function () { if (!b.disabled) choisirEtape(+b.dataset.etape); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var n = etape + (e.key === "ArrowRight" ? 1 : -1); if (n < 1 || n > 3 || $("#et-" + n).disabled) return;
      choisirEtape(n); $("#et-" + n).focus();
    });
  });

  /* équipe */
  var TAILLES = ["XS", "S", "M", "L", "XL", "XXL"];
  function dessinerEquipe() {
    var boite = $("#equipe"); boite.innerHTML = ""; boite.setAttribute("data-dyn", "");
    equipe.forEach(function (m, i) {
      var l = document.createElement("div"); l.className = "membre";
      l.innerHTML = '<input type="text" maxlength="12" autocomplete="off"><select></select><input type="text" inputmode="numeric" maxlength="2"><button type="button" class="retirer">×</button>';
      var champs = l.children;
      champs[0].value = m.nom; champs[0].setAttribute("aria-label", t("Prénom") + " " + (i + 1)); champs[0].placeholder = t("Prénom");
      TAILLES.forEach(function (tl) { var o = document.createElement("option"); o.textContent = tl; if (tl === m.taille) o.selected = true; champs[1].appendChild(o); });
      champs[1].setAttribute("aria-label", t("Taille") + " " + (i + 1));
      champs[2].value = m.num; champs[2].placeholder = "N°"; champs[2].setAttribute("aria-label", t("Numéro (facultatif)") + " " + (i + 1));
      champs[3].setAttribute("aria-label", t("Retirer") + " " + (m.nom || i + 1));
      champs[0].addEventListener("input", function () { m.nom = this.value; equipeChange(); });
      champs[1].addEventListener("change", function () { m.taille = this.value; equipeChange(); });
      champs[2].addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); m.num = this.value; equipeChange(); });
      champs[3].addEventListener("click", function () { if (equipe.length > 1) { equipe.splice(i, 1); equipeChange(); dessinerEquipe(); } });
      boite.appendChild(l);
    });
  }
  function equipeChange() {
    if (etat.equipeFaite) { etat.equipeFaite = false; etat.ajoute = false; $("#recap").hidden = true; if (troisD) troisD.vider(); $$(".membre").forEach(function (m) { m.classList.remove("presse"); }); }
    majAction();
  }
  $("#ajouter-membre").addEventListener("click", function () {
    if (equipe.length >= 30) { toast(t("Au-delà de 30 pièces, passez par le devis.")); return; }
    equipe.push({ nom: "", taille: "M", num: "" }); equipeChange(); dessinerEquipe();
    var ch = $$(".membre input:first-child"); ch[ch.length - 1].focus();
  });
  dessinerEquipe();
  auChangement(dessinerEquipe);
  function membresValides() { return equipe.filter(function (m) { return m.nom.trim(); }); }

  /* calcul */
  function calcul() {
    var liste = membresValides(), n = liste.length;
    var avecNum = liste.filter(function (m) { return m.num; }).length;
    var piece = PRIX.piece[etat.piece], impr = PRIX.zone[etat.zone] + (etat.technique === "flock" ? PRIX.flock : 0);
    var brut = n * (piece + impr + PRIX.nom) + avecNum * PRIX.numero;
    var remise = n >= PRIX.remiseDes ? brut * PRIX.remise : 0;
    return { n: n, piece: piece, impr: impr, noms: n * PRIX.nom, nums: avecNum * PRIX.numero, remise: remise, total: Math.round((brut - remise) * 100) / 100 };
  }
  var ZONES_NOMS = { coeur: "cœur", centre: "poitrine", dos: "dos" };
  function libelle() {
    return t(etat.piece === "hoodie" ? "Hoodie" : "T-shirt") + " " + t(NOMS_COULEURS[etat.couleur]).toLowerCase() + " · " + etat.technique.toUpperCase() + " " + t(ZONES_NOMS[etat.zone]);
  }
  function recap() {
    var c = calcul(), dl = $("#recap-lignes");
    $("#recap-titre").textContent = c.n + " " + t(c.n > 1 ? "pièces prêtes" : "pièce prête");
    var lignes = [
      [libelle(), euros(c.n * c.piece)],
      [t("Impression du logo"), euros(c.n * c.impr)],
      [t("Prénoms au dos"), euros(c.noms)]
    ];
    if (c.nums) lignes.push([t("Numéros"), euros(c.nums)]);
    if (c.remise) lignes.push([t("Remise atelier dès 10 pièces"), "− " + euros(c.remise)]);
    dl.innerHTML = "";
    lignes.concat([[t("Total TTC"), euros(c.total), "total"]]).forEach(function (l) {
      var d = document.createElement("div"); if (l[2]) d.className = l[2];
      var dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = l[0]; dd.textContent = l[1];
      d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
    });
    dl.setAttribute("data-dyn", "");
  }
  auChangement(function () { if (etat.equipeFaite) recap(); });

  /* le bouton d'action (un seul appel à l'action dans le hero) */
  var action = $("#action");
  function majAction() {
    var lib;
    if (!etat.presse) lib = t("Presser le logo");
    else if (etape !== 3) lib = t("Habiller l'équipe");
    else if (!etat.equipeFaite) { var n = membresValides().length; lib = t("Presser les prénoms") + " (" + n + ")"; }
    else if (!etat.ajoute) lib = t("Ajouter au panier") + " · " + euros(calcul().total);
    else lib = t("Voir le panier");
    action.textContent = lib;
    $("#reprendre").hidden = !etat.presse;
  }
  auChangement(majAction);
  function cadran(tech) {
    var r = REGLAGES[tech]; $("#cadran-temp").textContent = r[0];
    var s = r[1], el = $("#cadran-temps"); el.textContent = s + " s";
    scene.classList.add("chauffe");
    var pas = Math.max(40, 1250 / s), iv = setInterval(function () { s--; el.textContent = Math.max(0, s) + " s"; if (s <= 0) clearInterval(iv); }, pas);
  }
  action.addEventListener("click", function () {
    if (troisD && troisD.enCours()) return;
    if (!etat.presse) {
      scene.classList.add("occupe"); scene.classList.remove("place");
      if (mobile.matches && troisD) scene.scrollIntoView({ behavior: calme ? "auto" : "smooth" });
      var fin = function () {
        etat.presse = true; scene.classList.remove("occupe");
        setTimeout(function () { scene.classList.remove("chauffe"); }, 900);
        $("#et-3").disabled = false; $("#et-2").classList.add("fait");
        majAction(); toast(t("Pressé. Ajoutez maintenant les prénoms de l'équipe."));
      };
      if (troisD) { var p = troisD.presser(); setTimeout(function () { cadran(etat.technique); }, calme ? 0 : 850); p.then(fin); }
      else { cadran(etat.technique); setTimeout(fin, 900); }
      return;
    }
    if (etape !== 3) { choisirEtape(3); return; }
    if (!etat.equipeFaite) {
      var liste = membresValides();
      if (!liste.length) { toast(t("Ajoutez au moins un prénom.")); return; }
      scene.classList.add("occupe");
      if (mobile.matches) scene.scrollIntoView({ behavior: calme ? "auto" : "smooth" });
      var lignes = $$(".membre").filter(function (l, i) { return equipe[i].nom.trim(); });
      var fini = function () {
        etat.equipeFaite = true; scene.classList.remove("occupe");
        $("#et-3").classList.add("fait"); recap(); $("#recap").hidden = false; majAction();
      };
      if (troisD) troisD.equipe(liste, function (i) { if (lignes[i]) lignes[i].classList.add("presse"); }).then(fini);
      else { dessiner2d(liste[0]); lignes.forEach(function (l) { l.classList.add("presse"); }); setTimeout(fini, 500); }
      return;
    }
    if (!etat.ajoute) {
      var c = calcul();
      ajouterPanier({ id: "equipe-" + Date.now(), nom: t("Tenue d'équipe"), det: libelle() + " · " + c.n + " " + t("prénoms"), prix: Math.round(c.total / c.n * 100) / 100, qte: c.n, img: vignette(), fixe: true });
      etat.ajoute = true; majAction(); return;
    }
    ouvrirPanier();
  });
  $("#reprendre").addEventListener("click", function () { reset(); choisirEtape(2); envoyer(); });
  function vignette() {
    // vignette du panier : le textile à plat, tel qu'imprimé
    var c = document.createElement("canvas"); c.width = c.height = 160;
    var tmp = document.createElement("canvas");
    var lt = TX.logoTechnique(etat.logo, etat.technique, etat.teinte), z = TX.ZONES[etat.piece][etat.zone];
    TX.dessiner({ piece: etat.piece, couleur: etat.couleur, face: etat.zone === "dos" ? "dos" : "devant", imprime: [{ img: lt, rect: TX.rectDans(z, lt, etat.echelle, etat.dx, etat.dy) }] }, tmp);
    var x = c.getContext("2d"); x.fillStyle = "#e2e5e8"; x.fillRect(0, 0, 160, 160); x.drawImage(tmp, 0, 0, 160, 160);
    return c.toDataURL("image/png");
  }
  $("#telecharger").addEventListener("click", function () {
    var u = troisD ? troisD.capture() : $("#apercu-2d").toDataURL("image/png");
    if (!u) return;
    var a = document.createElement("a"); a.href = u; a.download = "korvel-apercu." + (troisD ? "jpg" : "png"); document.body.appendChild(a); a.click(); a.remove();
  });
  $("#vers-devis").addEventListener("click", function () {
    var c = calcul();
    var r = $("input[name=type][value='Textile']"); if (r) r.checked = true;
    $("#d-qte").value = c.n;
    var tech = { dtf: "DTF", flex: "Flex", flock: "Flock" }[etat.technique]; $("#d-tech").value = tech;
    $("#d-texte").value = libelle() + "\n" + t("Prénoms au dos") + " : " + membresValides().map(function (m) { return m.nom + " (" + m.taille + (m.num ? ", n° " + m.num : "") + ")"; }).join(", ");
    $("#d-fichiers").textContent = t("Aperçu de la presse joint");
    allerPas(2);
  });

  /* branchement de la 3D */
  document.addEventListener("korvel:pret", function () { troisD = window.KorvelPresse; envoyer(); choisirEtape(etape); });
  document.addEventListener("korvel:sans-3d", function () { sans3d = true; envoyer(); });
  if (window.KorvelPresse) { troisD = window.KorvelPresse; }
  envoyer();

  /* ================= panier ================= */
  var panier = lire("korvel-panier", []);
  var panierEl = $("#panier"), voile = $("#voile");
  function sauverPanier() { ecrire("korvel-panier", panier); dessinerPanier(); }
  function ajouterPanier(art) {
    var ex = panier.find(function (l) { return l.id === art.id && !art.fixe; });
    if (ex) ex.qte += art.qte; else panier.push(art);
    sauverPanier();
    var nb = $("#panier-nb"); nb.classList.remove("saute"); void nb.offsetWidth; nb.classList.add("saute");
    toast(t("Ajouté au panier") + " · " + art.nom);
  }
  function totalPanier() { return panier.reduce(function (s, l) { return s + l.prix * l.qte; }, 0); }
  function dessinerPanier() {
    var n = panier.reduce(function (s, l) { return s + l.qte; }, 0), nb = $("#panier-nb");
    nb.textContent = n; nb.classList.toggle("vide", !n);
    $("#panier-ouvrir").setAttribute("aria-label", t("Ouvrir le panier") + " (" + n + ")");
    var ul = $("#panier-liste"); ul.innerHTML = ""; ul.setAttribute("data-dyn", "");
    panier.forEach(function (l, i) {
      var li = document.createElement("li"); li.className = "ligne";
      li.innerHTML = '<img alt="" width="64" height="64"><div><p class="ligne-nom"></p><p class="ligne-det"></p><div class="ligne-qte"><button type="button">−</button><span></span><button type="button">+</button></div></div><div><p class="ligne-prix"></p><button type="button" class="ligne-retirer"></button></div>';
      var img = $("img", li); if (l.img) img.src = l.img; else img.style.visibility = "hidden";
      $(".ligne-nom", li).textContent = l.fixe ? l.nom : t(l.nom);
      $(".ligne-det", li).textContent = l.det ? l.det : euros(l.prix) + " " + t("la pièce");
      $(".ligne-qte span", li).textContent = l.qte;
      var bs = $$(".ligne-qte button", li);
      bs[0].setAttribute("aria-label", t("Un de moins")); bs[1].setAttribute("aria-label", t("Un de plus"));
      bs[0].onclick = function () { if (l.qte > 1) { l.qte--; sauverPanier(); } };
      bs[1].onclick = function () { l.qte++; sauverPanier(); };
      $(".ligne-prix", li).textContent = euros(l.prix * l.qte);
      var r = $(".ligne-retirer", li); r.textContent = t("Retirer");
      r.onclick = function () { panier.splice(i, 1); sauverPanier(); };
      ul.appendChild(li);
    });
    $("#panier-vide").hidden = !!panier.length; $("#panier-pied").hidden = !panier.length;
    $("#panier-total").textContent = euros(totalPanier());
  }
  var focusAvant = null;
  function ouvrirPanier() {
    focusAvant = document.activeElement;
    panierEl.hidden = false; voile.hidden = false; racine.classList.add("panier-ouvert"); document.body.style.overflow = "hidden";
    $("#panier-fermer").focus();
  }
  function fermerPanier() {
    panierEl.hidden = true; voile.hidden = true; racine.classList.remove("panier-ouvert"); document.body.style.overflow = "";
    if (focusAvant) focusAvant.focus();
  }
  $("#panier-ouvrir").addEventListener("click", ouvrirPanier);
  $("#panier-fermer").addEventListener("click", fermerPanier);
  voile.addEventListener("click", fermerPanier);
  panierEl.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fermerPanier();
    if (e.key === "Tab") { // le focus reste dans le panier
      var f = $$("button, a, input", panierEl).filter(function (x) { return x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  dessinerPanier();
  auChangement(dessinerPanier);

  /* caisse (paiement simulé) */
  var caisse = $("#caisse");
  $$("[data-fermer]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  $$("dialog").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });
  $("#commander").addEventListener("click", function () {
    fermerPanier();
    $("#caisse-form").hidden = false; $("#caisse-ok").hidden = true;
    $("#caisse-total").textContent = euros(totalPanier());
    caisse.showModal();
  });
  function mailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  $("#caisse-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = $("#c-nom"), mail = $("#c-mail"), ok = nom.value.trim() && mailOk(mail.value.trim());
    nom.setAttribute("aria-invalid", String(!nom.value.trim())); mail.setAttribute("aria-invalid", String(!mailOk(mail.value.trim())));
    $("#err-caisse").hidden = !!ok; if (!ok) return;
    var b = $("#payer"); b.classList.add("paie"); b.textContent = t("Paiement en cours");
    setTimeout(function () {
      var r = ref("KRV"), total = totalPanier(), recep = $("input[name=reception]:checked").value;
      var cmd = lire("korvel-commandes", []); cmd.push({ ref: r, total: total, lignes: panier, nom: nom.value.trim(), date: new Date().toISOString() }); ecrire("korvel-commandes", cmd);
      panier = []; sauverPanier();
      b.classList.remove("paie"); b.textContent = t("Payer (simulation)");
      $("#caisse-ref").textContent = r;
      $("#caisse-texte").textContent = t("Merci") + " " + nom.value.trim().split(" ")[0] + ". " + euros(total) + " · " + t(recep === "retrait" ? "Retrait à l'atelier, on vous écrit quand c'est prêt." : "Livraison au Luxembourg, on vous écrit à l'expédition.");
      $("#caisse-form").hidden = true; $("#caisse-ok").hidden = false; $("#caisse-ok").focus();
    }, calme ? 200 : 1400);
  });

  /* ================= boutique ================= */
  var PRODUITS = window.KORVEL_PRODUITS || [];
  var CATS = [["tout", "Tout"], ["brodes", "Écussons brodés"], ["pvc", "Écussons PVC"], ["laser", "Laser cut"], ["pins", "Pin's"], ["keys", "Porte-clés"], ["textile", "Textile"], ["perso", "Personnalisé"]];
  var CAT_NOM = {}; CATS.forEach(function (c) { CAT_NOM[c[0]] = c[1]; });
  var cat = "tout", tri = "atelier", quoi = "", montres = 12;
  // la sélection de l'atelier : une pièce de chaque gamme à tour de rôle
  var selection = (function () {
    var par = {}, out = []; PRODUITS.forEach(function (p) { (par[p.c] = par[p.c] || []).push(p); });
    var ordre = ["textile", "brodes", "pvc", "laser", "pins", "keys", "perso"], reste = true;
    for (var i = 0; reste; i++) { reste = false; ordre.forEach(function (c) { if (par[c] && par[c][i]) { out.push(par[c][i]); reste = true; } }); }
    return out;
  })();
  function dessinerOnglets() {
    var b = $("#onglets"); b.innerHTML = ""; b.setAttribute("data-dyn", "");
    CATS.forEach(function (c) {
      var n = c[0] === "tout" ? PRODUITS.length : PRODUITS.filter(function (p) { return p.c === c[0]; }).length;
      if (!n) return;
      var o = document.createElement("button"); o.type = "button"; o.className = "onglet"; o.setAttribute("aria-pressed", String(cat === c[0]));
      o.innerHTML = "<span></span><small></small>"; o.firstChild.textContent = t(c[1]); o.lastChild.textContent = n;
      o.addEventListener("click", function () { cat = c[0]; montres = 12; dessinerOnglets(); dessinerGrille(); });
      b.appendChild(o);
    });
  }
  function filtres() {
    var q = sansAccents(quoi.trim());
    var l = (tri === "atelier" ? selection : PRODUITS.slice()).filter(function (p) {
      if (cat !== "tout" && p.c !== cat) return false;
      if (!q) return true;
      return sansAccents(p.n + " " + t(p.n) + " " + CAT_NOM[p.c] + " " + t(CAT_NOM[p.c]) + " " + (p.col || []).join(" ")).indexOf(q) >= 0;
    });
    if (tri === "prix-asc") l.sort(function (a, b) { return a.p - b.p; });
    if (tri === "prix-desc") l.sort(function (a, b) { return b.p - a.p; });
    if (tri === "nom") l.sort(function (a, b) { return t(a.n).localeCompare(t(b.n), LOC[LANG]); });
    return l;
  }
  function dessinerGrille() {
    var l = filtres(), g = $("#grille"); g.innerHTML = ""; g.setAttribute("data-dyn", "");
    l.slice(0, montres).forEach(function (p, i) {
      var li = document.createElement("li"); li.className = "article"; li.style.animationDelay = Math.min(i % 12, 8) * 40 + "ms";
      li.innerHTML = '<button type="button" class="article-img"><img loading="lazy" width="800" height="800" alt=""><span class="article-cat"></span></button><div class="article-bas"><p class="article-nom"></p><p class="article-prix"></p><button type="button" class="article-ajout">+</button></div>';
      $("img", li).src = p.img; $("img", li).alt = t(p.n);
      $(".article-cat", li).textContent = t(CAT_NOM[p.c]);
      $(".article-nom", li).textContent = t(p.n);
      $(".article-prix", li).textContent = euros(p.p);
      $(".article-img", li).setAttribute("aria-label", t("Voir") + " " + t(p.n));
      $(".article-img", li).addEventListener("click", function () { ouvrirFiche(p); });
      var aj = $(".article-ajout", li); aj.setAttribute("aria-label", t("Ajouter au panier") + " : " + t(p.n));
      aj.addEventListener("click", function () { ajouterPanier({ id: p.id, nom: p.n, prix: p.p, qte: 1, img: p.img }); });
      g.appendChild(li);
    });
    $("#compte").textContent = l.length + " " + t(l.length > 1 ? "articles" : "article");
    $("#vide").hidden = !!l.length;
    $("#voir-plus").hidden = l.length <= montres;
  }
  $("#recherche").addEventListener("input", function () { quoi = this.value; montres = 12; dessinerGrille(); });
  $("#tri").addEventListener("change", function () { tri = this.value; dessinerGrille(); });
  $("#voir-plus").addEventListener("click", function () { montres += 12; dessinerGrille(); });
  $("#tout-voir").addEventListener("click", function () { quoi = ""; $("#recherche").value = ""; cat = "tout"; dessinerOnglets(); dessinerGrille(); });
  dessinerOnglets(); dessinerGrille();
  auChangement(function () { dessinerOnglets(); dessinerGrille(); });

  /* fiche */
  var fiche = $("#fiche"), ficheP = null, ficheQ = 1;
  function ouvrirFiche(p) {
    ficheP = p; ficheQ = 1;
    $("#fiche-img").src = p.img; $("#fiche-img").alt = t(p.n);
    $("#fiche-cat").textContent = t(CAT_NOM[p.c]); $("#fiche-nom").textContent = t(p.n); $("#fiche-desc").textContent = t(p.d);
    $("#fiche-prix").textContent = euros(p.p); $("#fiche-qte").textContent = 1;
    fiche.showModal();
  }
  $("#fiche-moins").addEventListener("click", function () { if (ficheQ > 1) $("#fiche-qte").textContent = --ficheQ; });
  $("#fiche-plus").addEventListener("click", function () { $("#fiche-qte").textContent = ++ficheQ; });
  $("#fiche-ajouter").addEventListener("click", function () { ajouterPanier({ id: ficheP.id, nom: ficheP.n, prix: ficheP.p, qte: ficheQ, img: ficheP.img }); fiche.close(); });
  ["#fiche-img", "#fiche-cat", "#fiche-nom", "#fiche-desc", "#fiche-prix", "#caisse-texte", "#caisse-ref", "#recap-titre", "#compte", "#echelle-cm", "#couleur-nom", "#note-technique", "#badge-reste", "#badge-total", "#d-fichiers", "#merci-ref", "#merci-texte", "#livre-pages", "#action", "#cadran"].forEach(function (s) { var e = $(s); if (e) e.setAttribute("data-dyn", ""); });

  /* ================= badge ================= */
  var FINITIONS = { noir: ["#16171a", "#9aa0a6", "#f4f5f6"], marine: ["#1d2a44", "#c8283b", "#f4f5f6"], olive: ["#4a5233", "#141516", "#eef0e4"] };
  var badgeQ = 2, PRIX_BADGE = 9.5, FIN_NOMS = { noir: "Noir, liseré gris", marine: "Marine, liseré rouge", olive: "Olive, liseré noir" };
  function majBadge() {
    var nom = $("#badge-nom").value.toUpperCase() || "P. NOM", f = FINITIONS[$("input[name=finition]:checked").value];
    var tx = $("#badge-texte"); tx.textContent = nom;
    tx.setAttribute("font-size", String(Math.min(88, Math.round(860 / Math.max(6, nom.length)))));
    $("#badge-fond").setAttribute("fill", f[0]); $("#badge-lisere").setAttribute("stroke", f[1]); tx.setAttribute("fill", f[2]);
    var reste = 14 - $("#badge-nom").value.length;
    $("#badge-reste").textContent = reste + " " + t(reste > 1 ? "caractères restants" : "caractère restant");
    $("#badge-qte").textContent = badgeQ;
    $("#badge-total").textContent = euros(badgeQ * PRIX_BADGE);
  }
  $("#badge-nom").addEventListener("input", majBadge);
  $$("input[name=finition], input[name=fixation]").forEach(function (i) { i.addEventListener("change", majBadge); });
  $("#badge-moins").addEventListener("click", function () { if (badgeQ > 1) { badgeQ--; majBadge(); } });
  $("#badge-plus").addEventListener("click", function () { badgeQ++; majBadge(); });
  $("#badge-ajouter").addEventListener("click", function () {
    var nom = $("#badge-nom").value.trim();
    if (!nom) { toast(t("Tapez le nom à broder.")); $("#badge-nom").focus(); return; }
    var fin = $("input[name=finition]:checked"), fix = $("input[name=fixation]:checked");
    ajouterPanier({ id: "badge-" + Date.now(), nom: t("Badge nominatif") + " « " + nom.toUpperCase() + " »", det: t(FIN_NOMS[fin.value]) + " · " + t(fix.value === "velcro" ? "Velcro" : "À coudre"), prix: PRIX_BADGE, qte: badgeQ, img: "assets/p/x01.svg", fixe: true });
  });
  majBadge();
  auChangement(majBadge);

  /* ================= catalogue (livre feuilleté) ================= */
  var GAMMES = [
    ["Cartes de visite", 4], ["Flyers", 5], ["Dépliants", 6], ["Affiches", 7], ["Brochures", 8], ["Étiquettes et stickers", 9],
    ["Signalétique", 10], ["Salons et événements", 11], ["Textile", 12], ["Écussons et badges", 13], ["Objets publicitaires", 14], ["Covering véhicule", 15]
  ];
  var NP = 16, livre = $("#livre"), tournees = 0, page1 = 1;
  function pg(n) { return "assets/cat/p" + (n < 10 ? "0" : "") + n + ".svg"; }
  var simple = window.matchMedia("(max-width: 700px)");
  function construireLivre() {
    livre.innerHTML = ""; livre.setAttribute("data-dyn", "");
    if (simple.matches) {
      livre.style.aspectRatio = "860 / 1184"; livre.classList.add("ferme");
      var im = document.createElement("img"); im.className = "page-seule"; im.alt = ""; im.width = 860; im.height = 1184; im.src = pg(page1);
      im.style.cssText = "width:100%;height:100%;box-shadow:0 20px 40px rgba(0,0,0,.5);background:#fff";
      livre.appendChild(im);
    } else {
      livre.style.aspectRatio = "";
      for (var k = 0; k < NP / 2; k++) {
        var f = document.createElement("div"); f.className = "feuille";
        f.innerHTML = '<img alt="" loading="lazy" width="860" height="1184"><img class="verso" alt="" loading="lazy" width="860" height="1184">';
        f.children[0].src = pg(2 * k + 1); f.children[1].src = pg(2 * k + 2);
        f.addEventListener("click", (function (kk) { return function () { aller(kk < tournees ? kk : kk + 1); }; })(k));
        livre.appendChild(f);
      }
    }
    peindreLivre();
  }
  function peindreLivre() {
    if (simple.matches) {
      var im = $(".page-seule", livre); if (im && im.getAttribute("src") !== pg(page1)) {
        if (!calme && im.animate) im.animate([{ opacity: 0, transform: "translateX(18px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "ease-out" });
        im.src = pg(page1);
      }
      $("#livre-prec").disabled = page1 <= 1; $("#livre-suiv").disabled = page1 >= NP;
      $("#livre-pages").textContent = page1 === 1 ? t("Couverture") : t("Page") + " " + page1 + " / " + NP;
      return;
    }
    var fs = $$(".feuille", livre);
    fs.forEach(function (f, k) {
      var t2 = k < tournees; f.classList.toggle("tournee", t2);
      f.style.zIndex = t2 ? k + 1 : NP - k;
      f.children[0].alt = t2 ? "" : t("Page") + " " + (2 * k + 1); f.children[1].alt = t2 ? t("Page") + " " + (2 * k + 2) : "";
    });
    var ferme = tournees === 0 || tournees === NP / 2;
    livre.classList.toggle("ferme", ferme);
    livre.style.transform = tournees === 0 ? "translateX(-25%)" : (tournees === NP / 2 ? "translateX(25%)" : "none");
    livre.style.transition = calme ? "none" : "transform .9s cubic-bezier(.2,.7,.1,1)";
    $("#livre-prec").disabled = tournees === 0; $("#livre-suiv").disabled = tournees === NP / 2;
    $("#livre-pages").textContent = tournees === 0 ? t("Couverture") : tournees === NP / 2 ? t("Quatrième de couverture") : t("Pages") + " " + (2 * tournees) + "–" + (2 * tournees + 1) + " / " + NP;
  }
  function aller(n) { tournees = Math.max(0, Math.min(NP / 2, n)); peindreLivre(); }
  $("#livre-prec").addEventListener("click", function () { if (simple.matches) { page1 = Math.max(1, page1 - 1); peindreLivre(); } else aller(tournees - 1); });
  $("#livre-suiv").addEventListener("click", function () { if (simple.matches) { page1 = Math.min(NP, page1 + 1); peindreLivre(); } else aller(tournees + 1); });
  function versPage(p) { if (simple.matches) { page1 = p; peindreLivre(); } else aller(Math.floor(p / 2)); }
  function dessinerGammes() {
    var ul = $("#gammes"); ul.innerHTML = ""; ul.setAttribute("data-dyn", "");
    GAMMES.forEach(function (g) {
      var li = document.createElement("li"), b = document.createElement("button"); b.type = "button";
      b.innerHTML = "<b></b><span></span>"; b.firstChild.textContent = t(g[0]); b.lastChild.textContent = "p. " + g[1];
      b.firstChild.style.fontWeight = "600";
      b.addEventListener("click", function () { versPage(g[1]); $("#livre").scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" }); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  construireLivre(); dessinerGammes();
  simple.addEventListener("change", construireLivre);
  auChangement(function () { dessinerGammes(); peindreLivre(); });

  /* ================= devis ================= */
  var formD = $("#devis-form");
  function allerPas(n) {
    $$(".pas", formD).forEach(function (p) { p.hidden = +p.dataset.pas !== n; });
    $$(".devis-suivi li").forEach(function (li) { var k = +li.dataset.pas; li.classList.toggle("actif", k === n); li.classList.toggle("fait", k < n); });
    var cible = $(".pas[data-pas='" + n + "']", formD);
    if (n === 4) cible.focus();
    if (n > 1) { var s = $("#devis"); if (s.getBoundingClientRect().top < 0 || n === 2) s.scrollIntoView({ behavior: calme ? "auto" : "smooth" }); }
  }
  function valider(n) {
    if (n === 1) { var ok1 = !!$("input[name=type]:checked", formD); $("#err-1").hidden = ok1; return ok1; }
    if (n === 2) { var q = $("#d-qte"), ok2 = +q.value > 0; q.setAttribute("aria-invalid", String(!ok2)); $("#err-2").hidden = ok2; if (!ok2) q.focus(); return ok2; }
    var nom = $("#d-nom"), m = $("#d-mail"), okN = !!nom.value.trim(), okM = mailOk(m.value.trim());
    nom.setAttribute("aria-invalid", String(!okN)); m.setAttribute("aria-invalid", String(!okM)); $("#err-3").hidden = okN && okM;
    if (!okN) nom.focus(); else if (!okM) m.focus();
    return okN && okM;
  }
  $$("[data-suite]", formD).forEach(function (b) { b.addEventListener("click", function () { var n = +b.dataset.suite; if (valider(n - 1)) allerPas(n); }); });
  $$("[data-retour]", formD).forEach(function (b) { b.addEventListener("click", function () { allerPas(+b.dataset.retour); }); });
  $$("input[name=type]", formD).forEach(function (i) { i.addEventListener("change", function () { $("#err-1").hidden = true; }); });
  formD.addEventListener("submit", function (e) {
    e.preventDefault(); if (!valider(3)) return;
    var r = ref("DEV"), mail = $("#d-mail").value.trim();
    var l = lire("korvel-devis", []); l.push({ ref: r, type: $("input[name=type]:checked").value, qte: $("#d-qte").value, mail: mail, date: new Date().toISOString() }); ecrire("korvel-devis", l);
    $("#merci-ref").textContent = r;
    $("#merci-texte").textContent = t("Récapitulatif envoyé à") + " " + mail + ". " + t("L'atelier revient vers vous avec un prix et une épreuve.");
    allerPas(4);
  });
  $("#devis-encore").addEventListener("click", function () { formD.reset(); $("#d-fichiers").textContent = "PDF, AI, EPS, SVG, PNG, JPG"; allerPas(1); });
  var fichierD = $("#d-fichier"), depotD = fichierD.closest(".depot");
  fichierD.addEventListener("change", function () {
    var n = Array.prototype.map.call(this.files, function (f) { return f.name; });
    $("#d-fichiers").textContent = n.length ? n.join(", ") : "PDF, AI, EPS, SVG, PNG, JPG";
  });
  ["dragenter", "dragover"].forEach(function (ev) { depotD.addEventListener(ev, function () { depotD.classList.add("survol"); }); });
  ["dragleave", "drop"].forEach(function (ev) { depotD.addEventListener(ev, function () { depotD.classList.remove("survol"); }); });
  var dd = $("#d-date"); if (dd) { var j = new Date(Date.now() + 864e5 * 2); dd.min = j.toISOString().slice(0, 10); }

  /* ================= l'atelier au défilement ================= */
  var photos = $$(".fabrique-photos img"), temps = $$(".fabrique-temps li");
  var obsT = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      temps.forEach(function (li) { li.classList.toggle("ici", li === e.target); });
      var k = +e.target.dataset.photo; photos.forEach(function (im, i) { im.classList.toggle("on", i === k); });
    });
  }, { rootMargin: "-40% 0px -45% 0px" });
  temps.forEach(function (li) { obsT.observe(li); });

  /* ================= démarrage ================= */
  var l0 = lire("korvel-lang", null);
  if (!l0) { var nav = (navigator.language || "fr").slice(0, 2); l0 = nav === "de" || nav === "lb" ? "de" : nav === "en" ? "en" : "fr"; }
  appliquerLangue(MAP && l0 !== "fr" ? l0 : "fr");
})();
