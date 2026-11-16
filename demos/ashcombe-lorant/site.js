/* Ashcombe Lorant : tout ce qui n'est pas la 3D.
   Ouverture, barre et menu, index des dossiers et fiche (reliés au fichier en relief),
   bordereau tamponné, associés filtrés, premier contact en quatre étapes puis pli scellé. */
(function () {
  "use strict";
  var A = window.ASHCOMBE;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var emettre = function (nom, detail) { document.dispatchEvent(new CustomEvent(nom, { detail: detail })); };
  var parId = function (liste, id) { for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; };

  /* ------------------------------------------------------------ toast */
  var toast = $("#toast"), tt;
  function dire(t) { toast.textContent = t; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("on"); }, 3600); }

  /* ------------------------------------------------------------ ouverture */
  var intro = $("#intro"), minuteurs = [];
  function finIntro() {
    if (!html.classList.contains("en-intro") || intro.classList.contains("sort")) return;
    minuteurs.forEach(clearTimeout);
    intro.classList.add("sort");
    emettre("ashcombe:intro-fin");
    try { sessionStorage.setItem("ashcombe-intro", "1"); } catch (e) {}
    setTimeout(function () {
      html.classList.remove("en-intro");
      $("#scene").classList.add("apparait");
      intro.remove();
      dispatchEvent(new Event("resize"));
    }, 620);
  }
  if (html.classList.contains("en-intro")) {
    var pret = false;
    document.addEventListener("ashcombe:pret", function () {
      pret = true; html.classList.add("pret-3d");
      minuteurs.push(setTimeout(function () { intro.classList.add("nom"); }, 2100));
      minuteurs.push(setTimeout(finIntro, 5600));
    });
    minuteurs.push(setTimeout(function () { if (!pret) finIntro(); }, 3200)); // la 3D ne répond pas : on n'attend pas
    $("#intro-passer").addEventListener("click", finIntro);
    addEventListener("keydown", function (e) { if (e.key === "Escape") finIntro(); });
    addEventListener("wheel", finIntro, { passive: true, once: true });
    addEventListener("touchmove", finIntro, { passive: true, once: true });
  } else intro.remove();

  /* ------------------------------------------------------------ barre, menu */
  var barre = $("#barre");
  var majBarre = function () { barre.classList.toggle("pleine", scrollY > 30 || !menu.hidden); };
  var burger = $("#burger"), menu = $("#menu");
  addEventListener("scroll", majBarre, { passive: true }); majBarre();
  function menuOuvert(o) {
    burger.setAttribute("aria-expanded", o ? "true" : "false");
    burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
    menu.hidden = !o; majBarre();
    document.body.style.overflow = o ? "hidden" : "";
    if (o) $("a", menu).focus();
  }
  burger.addEventListener("click", function () { menuOuvert(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuOuvert(false); }); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuOuvert(false); burger.focus(); } });
  addEventListener("resize", function () { if (innerWidth > 980 && !menu.hidden) menuOuvert(false); });

  /* rubrique courante dans la barre */
  var liens = $$(".barre-liens a");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (a) { if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["dossiers", "methode", "associes", "cabinet"].forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ------------------------------------------------------------ dossiers : index et fiche */
  var hero = $("#dossiers"), index = $(".index"), fiche = $("#fiche"), ouvert = null;
  index.innerHTML = A.domaines.map(function (d) {
    return '<button type="button" data-dossier="' + d.id + '" aria-pressed="false" aria-controls="fiche"><span>' + d.n + "</span>" + esc(d.onglet) + "</button>";
  }).join("");
  var boutons = $$("button", index);

  function ouvrir(id, depuis3d) {
    var d = parId(A.domaines, id); if (!d) return;
    var a = parId(A.associes, d.associe);
    ouvert = id;
    $("#f-n").textContent = d.n;
    $("#f-titre").textContent = d.titre;
    $("#f-court").textContent = d.court;
    $("#f-situations").innerHTML = d.situations.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    $("#f-pieces").innerHTML = d.pieces.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    $("#f-photo").src = "photos/" + a.photo + ".webp";
    $("#f-photo").alt = "Portrait de " + a.nom;
    $("#f-nom").textContent = a.nom;
    $("#f-role").textContent = a.role + (d.urgence ? " · ligne d'urgence le soir et le week-end" : "");
    $("#f-langues").textContent = "Reçoit en " + a.langues.map(function (l) { return A.langues[l].toLowerCase(); }).join(", ");
    fiche.hidden = false;
    hero.classList.add("ouvert");
    boutons.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.dossier === id ? "true" : "false"); });
    // relance l'animation d'entrée de la fiche
    fiche.style.animation = "none"; void fiche.offsetWidth; fiche.style.animation = "";
    emettre("ashcombe:afficher", { id: id });
    if (!depuis3d || innerWidth > 820) fiche.focus({ preventScroll: true });
    if (innerWidth <= 820 && depuis3d) fiche.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "nearest" });
  }
  function fermer() {
    if (!ouvert) return;
    var id = ouvert; ouvert = null;
    fiche.hidden = true; hero.classList.remove("ouvert");
    boutons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    emettre("ashcombe:afficher", { id: null });
    var b = index.querySelector('[data-dossier="' + id + '"]'); if (b && innerWidth > 820) b.focus({ preventScroll: true });
  }
  function voisin(pas) {
    var i = A.domaines.findIndex(function (d) { return d.id === ouvert; });
    ouvrir(A.domaines[(i + pas + A.domaines.length) % A.domaines.length].id);
  }
  boutons.forEach(function (b) {
    b.addEventListener("click", function () { if (ouvert === b.dataset.dossier) fermer(); else ouvrir(b.dataset.dossier); });
    b.addEventListener("mouseenter", function () { emettre("ashcombe:viser", { id: b.dataset.dossier }); });
    b.addEventListener("focus", function () { emettre("ashcombe:viser", { id: b.dataset.dossier }); });
    b.addEventListener("mouseleave", function () { emettre("ashcombe:viser", { id: null }); });
  });
  $("#fiche-retour").addEventListener("click", fermer);
  $("#f-prec").addEventListener("click", function () { voisin(-1); });
  $("#f-suiv").addEventListener("click", function () { voisin(1); });
  fiche.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); fermer(); }
    if (e.key === "ArrowRight" && e.target === fiche) voisin(1);
    if (e.key === "ArrowLeft" && e.target === fiche) voisin(-1);
  });
  $("#f-exposer").addEventListener("click", function () { preparer({ domaine: ouvert }); });

  // la 3D demande / signale
  document.addEventListener("ashcombe:demande", function (e) { var id = e.detail && e.detail.id; if (!id) fermer(); else if (id !== ouvert) ouvrir(id, true); });
  document.addEventListener("ashcombe:survol", function (e) {
    var id = e.detail && e.detail.id;
    boutons.forEach(function (b) { b.classList.toggle("vise", b.dataset.dossier === id); });
  });

  /* ------------------------------------------------------------ bordereau tamponné */
  var heure = function (h) { var p = h.split(":"); return (+p[0]) + " h" + (p[1] !== "00" ? " " + p[1] : ""); };
  var jourFr = function (d) { return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); };
  var etapes = $$(".etape");
  etapes.forEach(function (li) { $("[data-date]", li).textContent = jourFr(new Date()); });
  if ("IntersectionObserver" in window && !calme) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("tamponne"); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -35% 0px" });
    etapes.forEach(function (li) { obs.observe(li); });
  } else etapes.forEach(function (li) { li.classList.add("tamponne"); });

  /* apparitions douces */
  $$(".methode-tete, .associes-tete, .cabinet-texte, .infos, .contact-gauche").forEach(function (el) { el.setAttribute("data-entre", ""); });
  if ("IntersectionObserver" in window && !calme) {
    var obs2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); obs2.unobserve(e.target); } }); }, { rootMargin: "0px 0px -12% 0px" });
    $$("[data-entre]").forEach(function (el) { obs2.observe(el); });
  } else $$("[data-entre]").forEach(function (el) { el.classList.add("vu"); });

  /* ------------------------------------------------------------ associés */
  var fDom = "tous", fLang = "toutes";
  var trombi = $("#trombi");
  trombi.innerHTML = A.associes.map(function (a) {
    var doms = a.domaines.map(function (id) { return parId(A.domaines, id).titre; }).join(" · ");
    return '<article class="carte" data-id="' + a.id + '">' +
      '<div class="carte-photo"><img src="photos/' + a.photo + '.webp" width="720" height="900" loading="lazy" alt="Portrait de ' + esc(a.nom) + ', devant le mur d\'ardoise du cabinet"></div>' +
      "<h3>" + esc(a.nom) + "</h3>" +
      '<p class="carte-role">' + esc(a.role) + "</p>" +
      '<p class="carte-dom">' + esc(doms) + "</p>" +
      '<p class="carte-langues" aria-label="Langues : ' + a.langues.map(function (l) { return A.langues[l]; }).join(", ") + '">' + a.langues.join(" · ") + "</p>" +
      "<blockquote>« " + esc(a.phrase) + " »</blockquote>" +
      '<button type="button" class="carte-ecrire" data-ecrire="' + a.id + '">Écrire à ' + esc(a.nom.split(" ")[0]) + "</button>" +
      "</article>";
  }).join("");
  var fd = $("#filtre-domaine"), fl = $("#filtre-langue");
  fd.innerHTML = '<button type="button" data-v="tous" aria-pressed="true">Tous les domaines</button>' +
    A.domaines.map(function (d) { return '<button type="button" data-v="' + d.id + '" aria-pressed="false">' + esc(d.onglet) + "</button>"; }).join("");
  fl.innerHTML = '<button type="button" data-v="toutes" aria-pressed="true">Toutes langues</button>' +
    ["FR", "EN", "DE", "LB", "PT", "ZH", "ES"].map(function (l) { return '<button type="button" data-v="' + l + '" aria-pressed="false" aria-label="' + A.langues[l] + '">' + l + "</button>"; }).join("");
  function filtrer() {
    var n = 0;
    $$(".carte", trombi).forEach(function (c) {
      var a = parId(A.associes, c.dataset.id);
      var ok = (fDom === "tous" || a.domaines.indexOf(fDom) > -1) && (fLang === "toutes" || a.langues.indexOf(fLang) > -1);
      c.hidden = !ok; if (ok) n++;
    });
    $("#compte").textContent = n === A.associes.length ? "" : n + (n > 1 ? " associés correspondent" : " associé correspond");
    $("#vide").hidden = n > 0;
  }
  function brancher(groupe, set) {
    groupe.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", groupe).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      set(b.dataset.v); filtrer();
    });
  }
  brancher(fd, function (v) { fDom = v; });
  brancher(fl, function (v) { fLang = v; });
  $("#vide-raz").addEventListener("click", function () { fDom = "tous"; fLang = "toutes"; [fd, fl].forEach(function (g) { $$("button", g).forEach(function (x, i) { x.setAttribute("aria-pressed", i === 0 ? "true" : "false"); }); }); filtrer(); });
  trombi.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ecrire]"); if (!b) return;
    var a = parId(A.associes, b.dataset.ecrire);
    preparer({ domaine: a.domaines[0], associe: a });
  });

  /* ------------------------------------------------------------ premier contact */
  var form = $("#pli"), pas = 1, creneau = null, associeVise = null;
  var kDom = $("#k-domaines");
  kDom.innerHTML = A.domaines.map(function (d, i) {
    return '<label><input type="radio" name="domaine" value="' + d.id + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(d.titre) + "</span></label>";
  }).join("") + '<label><input type="radio" name="domaine" value="autre"><span>Je ne sais pas encore</span></label>';
  kDom.setAttribute("role", "radiogroup"); kDom.setAttribute("aria-label", "Domaine");

  // créneaux : les cinq prochains jours ouvrés ; un créneau sur quatre est déjà pris (stable par date)
  var agenda = $("#k-agenda"), jours = [], d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  while (jours.length < 5) { d0.setDate(d0.getDate() + 1); if (d0.getDay() !== 0 && d0.getDay() !== 6) jours.push(new Date(d0)); }
  agenda.innerHTML = jours.map(function (j, ji) {
    return '<div class="jour"><p>' + j.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }) + "</p>" +
      A.creneaux.map(function (h, hi) {
        var pris = ((j.getDate() * 7 + hi * 3) % 5) === 0;
        var lib = j.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + heure(h);
        return '<button type="button" data-cren="' + esc(lib) + '" aria-pressed="false"' + (pris ? ' disabled aria-label="' + esc(lib) + ', déjà pris"' : ' aria-label="' + esc(lib) + '"') + ">" + heure(h) + "</button>";
      }).join("") + "</div>";
  }).join("");
  agenda.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cren]"); if (!b || b.disabled) return;
    $$("button", agenda).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    creneau = b.dataset.cren; $("#k-erreur").textContent = "";
  });

  $$('input[name="urgence"]').forEach(function (r) { r.addEventListener("change", function () { $("#k-alerte").hidden = form.urgence.value !== "Aujourd'hui"; }); });
  var msg = $("#k-msg");
  msg.addEventListener("input", function () { $("#k-compteur").textContent = msg.value.length + " / 800"; });

  function preparer(o) {
    if (!$("#scelle").hidden) nouveau();
    if (o.domaine) { var r = form.querySelector('input[name="domaine"][value="' + o.domaine + '"]'); if (r) r.checked = true; }
    associeVise = o.associe || null;
    allerA(1);
    document.getElementById("contact").scrollIntoView({ behavior: calme ? "auto" : "smooth" });
    var d = parId(A.domaines, o.domaine);
    dire(associeVise ? "Votre demande ira directement à " + associeVise.nom + "." : (d ? "Dossier « " + d.titre + " » préparé." : "Formulaire prêt."));
  }

  function allerA(n) {
    pas = n;
    $$(".pas legend", form).forEach(function (l) { l.setAttribute("tabindex", "-1"); });
  $$(".pas", form).forEach(function (f) { f.hidden = +f.dataset.pas !== n; });
    $$(".pli-etapes li", form).forEach(function (li) {
      var p = +li.dataset.pas;
      if (p === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      li.classList.toggle("fait", p < n);
    });
    $("#k-prec").hidden = n === 1;
    $("#k-suiv").hidden = n === 4;
    $("#k-envoyer").hidden = n !== 4;
    $("#k-erreur").textContent = "";
    if (n === 4) recap();
  }
  function invalide(el, txt) { el.setAttribute("aria-invalid", "true"); el.focus(); $("#k-erreur").textContent = txt; return false; }
  function valider(n) {
    $$("[aria-invalid]", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
    if (n === 2) {
      if (!form.vous.value.trim()) return invalide(form.vous, "Indiquez votre nom ou celui de votre société.");
      if (form.msg.value.trim().length < 15) return invalide(form.msg, "Quelques mots sur le dossier, au moins une phrase.");
    }
    if (n === 3) {
      if (!creneau) { $("#k-erreur").textContent = "Choisissez un créneau dans l'agenda."; var b = agenda.querySelector("button:not(:disabled)"); if (b) b.focus(); return false; }
      if (!form.nom.value.trim()) return invalide(form.nom, "Votre nom, pour que l'associé sache qui rappeler.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail.value.trim())) return invalide(form.mail, "Cette adresse courriel ne semble pas complète.");
      if (form.tel.value.trim() && form.tel.value.replace(/\D/g, "").length < 8) return invalide(form.tel, "Ce numéro paraît trop court.");
    }
    return true;
  }
  function libDomaine() { var v = form.domaine.value; var d = parId(A.domaines, v); return d ? d.titre : "À déterminer avec le cabinet"; }
  function lignes() {
    return [
      ["Domaine", libDomaine(), 1],
      ["Échéance", form.urgence.value, 1],
      ["Vous", form.vous.value.trim(), 2],
      ["Autre partie", form.autre.value.trim() || "Non indiquée", 2],
      ["Le dossier", form.msg.value.trim(), 2],
      ["Rendez-vous", form.forme.value + ", " + creneau + " (" + form.langue.value.toLowerCase() + ")", 3],
      ["Contact", form.nom.value.trim() + " · " + form.mail.value.trim() + (form.tel.value.trim() ? " · " + form.tel.value.trim() : ""), 3]
    ].concat(associeVise ? [["Associé", associeVise.nom, 1]] : []);
  }
  function recap() {
    $("#k-recap").innerHTML = lignes().map(function (l) {
      return "<div><dt>" + l[0] + "</dt><dd>" + esc(l[1]) + '<button type="button" data-revenir="' + l[2] + '">modifier</button></dd></div>';
    }).join("");
  }
  $("#k-recap").addEventListener("click", function (e) { var b = e.target.closest("[data-revenir]"); if (b) allerA(+b.dataset.revenir); });
  $("#k-suiv").addEventListener("click", function () {
    if (!valider(pas)) return;
    allerA(pas + 1);
    var f = form.querySelector('.pas[data-pas="' + pas + '"] legend'); if (f) { f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
    if (innerWidth <= 820) form.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "start" });
  });
  $("#k-prec").addEventListener("click", function () { allerA(pas - 1); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (pas !== 4) { $("#k-suiv").click(); return; }
    if (!$("#k-accord").checked) { $("#k-erreur").textContent = "Cochez la case pour que le cabinet puisse vous recontacter."; $("#k-accord").focus(); return; }
    var now = new Date();
    var ref = "AL-" + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(Math.floor(1000 + Math.random() * 9000));
    try { var l = JSON.parse(localStorage.getItem("ashcombe-demandes") || "[]"); l.push({ ref: ref, quand: now.toISOString(), lignes: lignes() }); localStorage.setItem("ashcombe-demandes", JSON.stringify(l.slice(-10))); } catch (x) {}
    var qui = associeVise ? associeVise.nom : (parId(A.associes, (parId(A.domaines, form.domaine.value) || {}).associe) || { nom: "un associé" }).nom;
    $("#s-detail").textContent = qui + " lit votre demande et vous confirme le rendez-vous (" + form.forme.value.toLowerCase() + ", " + creneau + ") dans la journée ouvrée, après vérification des conflits d'intérêts.";
    $("#s-ref").textContent = ref;
    form.hidden = true;
    var s = $("#scelle"); s.hidden = false; s.focus({ preventScroll: true });
    s.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
    emettre("ashcombe:sceller", { ref: ref, date: jourFr(now) });
  });
  function nouveau() {
    form.reset(); creneau = null; associeVise = null;
    $$("button", agenda).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    $("#k-compteur").textContent = "0 / 800"; $("#k-alerte").hidden = true;
    $("#scelle").hidden = true; form.hidden = false; allerA(1);
  }
  $("#s-nouveau").addEventListener("click", function () { nouveau(); form.querySelector("legend").focus(); });
})();
