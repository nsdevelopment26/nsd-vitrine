/* Halvren : tout ce qui n'est pas la 3D.
   Ouverture, barre et menu, appel, disponibilité, diagnostic (relié au mur), réseau qui se trace,
   chantiers avant/après filtrés, zone d'intervention, devis en quatre étapes, outils des pages métiers. */
(function () {
  "use strict";
  var H = window.HALVREN;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var sansAccent = function (t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ toast */
  var toast = $("#toast"), tt;
  function dire(t) { if (!toast) return; toast.textContent = t; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("on"); }, 3600); }

  /* ------------------------------------------------------------ ouverture */
  var intro = $("#intro"), minuteurs = [];
  function finIntro() {
    if (!html.classList.contains("en-intro") || !intro || intro.classList.contains("sort")) return;
    minuteurs.forEach(clearTimeout);
    intro.classList.add("sort");
    window.HALVREN_INTRO_FINIE = true;
    document.dispatchEvent(new CustomEvent("halvren:intro-fin"));
    setTimeout(function () { html.classList.remove("en-intro"); }, 650);
    try { sessionStorage.setItem("halvren-intro", "1"); } catch (e) {}
  }
  if (html.classList.contains("en-intro") && intro) {
    minuteurs.push(setTimeout(finIntro, 5200));
    // la 3D ne répond pas : on n'attend pas
    var pret = false;
    document.addEventListener("halvren:pret", function () { pret = true; });
    minuteurs.push(setTimeout(function () { if (!pret) finIntro(); }, 2600));
    $("#intro-passer").addEventListener("click", finIntro);
    $("#intro-passer").addEventListener("pointerdown", finIntro);        // un simple toucher suffit
    addEventListener("keydown", function (e) { if (e.key === "Escape") finIntro(); });
    addEventListener("wheel", finIntro, { passive: true, once: true });
    addEventListener("touchmove", finIntro, { passive: true, once: true });
  } else if (intro) intro.remove();

  /* ------------------------------------------------------------ barre, menu */
  var barre = $("#barre");
  var majBarre = function () { barre.classList.toggle("pleine", scrollY > 40 || !$(".hero")); };
  addEventListener("scroll", majBarre, { passive: true }); majBarre();
  var burger = $(".burger"), menu = $("#menu");
  function menuOuvert(o) {
    burger.setAttribute("aria-expanded", o ? "true" : "false");
    burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
    menu.hidden = !o; barre.classList.toggle("pleine", o || scrollY > 40);
    document.body.style.overflow = o ? "hidden" : "";
    if (o) { var a = $("a", menu); if (a) a.focus(); }
  }
  burger.addEventListener("click", function () { menuOuvert(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuOuvert(false); }); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuOuvert(false); burger.focus(); } });

  /* ------------------------------------------------------------ appeler (démonstration) */
  var fiche = $("#fiche-appel");
  $$("[data-appel]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (fiche && fiche.showModal) fiche.showModal();
      else dire("Démonstration : sur le vrai site, ce bouton appelle l'artisan.");
    });
  });
  if (fiche) fiche.addEventListener("click", function (e) { if (e.target === fiche) fiche.close(); });

  /* ------------------------------------------------------------ ouvert maintenant ? (heure du Luxembourg) */
  function heureLux() {
    try {
      var p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Luxembourg", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var h = 0, m = 0; p.forEach(function (x) { if (x.type === "hour") h = +x.value % 24; if (x.type === "minute") m = +x.value; });
      return h + m / 60;
    } catch (e) { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  }
  function statut() {
    var h = heureLux(), ouvert = h >= H.horaires.ouvre && h < H.horaires.ferme;
    $$("[data-statut]").forEach(function (v) { v.classList.toggle("ouvert", ouvert); });
    $$("[data-statut-texte]").forEach(function (t) {
      t.textContent = ouvert ? "Ouvert : on décroche jusqu'à " + H.horaires.ferme + " h" : "Fermé, on rouvre à " + H.horaires.ouvre + " h : laissez une demande de devis";
    });
  }
  statut(); setInterval(statut, 60000);

  /* ------------------------------------------------------------ diagnostic, relié au mur */
  var zonePannes = $("#pannes"), rep = $("#diag-rep"), lienDevis = $("#diag-devis");
  var accueil = !!$("#form");
  function montrer(id, versLeMur) {
    var p = H.pannes.filter(function (x) { return x.id === id; })[0];
    if (!p || !rep) return;
    $$("button", zonePannes).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false"); });
    var pageCourante = location.pathname.split("/").pop() === p.page;
    rep.innerHTML = '<p class="signe">' + esc(p.signe) + "</p><ol>" + p.etapes.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ol>" +
      (pageCourante ? "" : '<a class="lien plus" href="' + p.page + '">Tout savoir : ' + esc(p.metier.toLowerCase()) + "</a>");
    rep.classList.remove("change"); void rep.offsetWidth; rep.classList.add("change");
    if (lienDevis) lienDevis.href = accueil ? "#devis" : "index.html?type=" + encodeURIComponent(p.metier) + "#devis";
    if (lienDevis) lienDevis.dataset.metier = p.metier;
    if (versLeMur) document.dispatchEvent(new CustomEvent("halvren:viser", { detail: { id: id } }));
  }
  if (zonePannes) {
    var liste = (zonePannes.dataset.pannes || "fuite chauffage courant porte").split(" ");
    zonePannes.innerHTML = H.pannes.filter(function (p) { return liste.indexOf(p.id) > -1; }).map(function (p, i) {
      return '<button type="button" data-id="' + p.id + '" aria-pressed="false"><i>' + (H.pannes.indexOf(p) + 1) + "</i>" + esc(p.court) + "</button>";
    }).join("");
    $$("button", zonePannes).forEach(function (b) { b.addEventListener("click", function () { montrer(b.dataset.id, true); }); });
    document.addEventListener("halvren:panne", function (e) { montrer(e.detail.id, false); });
    montrer(zonePannes.dataset.depart || liste[0], false);
    if (lienDevis && accueil) lienDevis.addEventListener("click", function () { choisirMetier(lienDevis.dataset.metier); });
  }

  /* ------------------------------------------------------------ apparitions + réseau qui se trace */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -12% 0px" });
    $$("[data-r], .metier").forEach(function (el) { io.observe(el); });
  } else $$("[data-r], .metier").forEach(function (el) { el.classList.add("vu"); });
  var metiers = $(".metiers");
  if (metiers) {
    var trace = function () {
      var r = metiers.getBoundingClientRect(), vh = innerHeight;
      var a = calme ? 1 : Math.max(0, Math.min(1, (vh * 0.75 - r.top) / (r.height * 0.85)));
      metiers.style.setProperty("--avance", a.toFixed(3));
    };
    addEventListener("scroll", trace, { passive: true }); addEventListener("resize", trace); trace();
  }

  /* ------------------------------------------------------------ comparateurs avant / après */
  $$(".compare").forEach(function (c) {
    var r = $("input", c);
    var pos = function () { c.style.setProperty("--pos", r.value + "%"); r.setAttribute("aria-valuetext", "Avant " + r.value + " %"); };
    r.addEventListener("input", pos); pos();
  });

  /* chantiers de l'accueil : filtres + vignettes */
  var CHANTIERS = [
    { id: "sdb", m: "Plomberie", t: "Salle de bain refaite", l: "Les tuyaux galvanisés qui suintaient remplacés par du cuivre, vannes d'arrêt neuves, meuble suspendu." },
    { id: "radiateur", m: "Chauffage", t: "Radiateur remplacé", l: "Le vieux radiateur en fonte qui rouillait remplacé par un radiateur à panneaux, vanne thermostatique comprise." },
    { id: "porte", m: "Serrurerie", t: "Porte d'entrée sécurisée", l: "Porte forcée remplacée par une porte pleine, serrure multipoint et cylindre de sûreté." },
    { id: "tableau", m: "Électricité", t: "Tableau mis aux normes", l: "Tableau à fusibles qui chauffait remplacé par un tableau modulaire, différentiels compris." }
  ];
  var vig = $("#vignettes");
  if (vig) {
    var cmp = $("#compare"), legende = $("#c-legende");
    vig.innerHTML = CHANTIERS.map(function (c) {
      return '<li data-m="' + c.m + '"><button type="button" data-id="' + c.id + '" aria-pressed="false"><img src="photos/av-' + c.id + '-apres.webp" alt="" width="74" height="74"><span><b>' + esc(c.t) + "</b><small>" + esc(c.m) + '</small></span><span class="v-m" aria-hidden="true">Voir</span></button></li>';
    }).join("");
    var voir = function (id) {
      var c = CHANTIERS.filter(function (x) { return x.id === id; })[0];
      $(".c-avant", cmp).src = "photos/av-" + id + "-avant.webp";
      $(".c-apres", cmp).src = "photos/av-" + id + "-apres.webp";
      $(".c-avant", cmp).alt = c.t + " : avant les travaux";
      $(".c-apres", cmp).alt = c.t + " : après les travaux";
      legende.textContent = c.l + " Photos d'illustration : sur votre site, ce sont vos chantiers.";
      $$("button", vig).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.id === id ? "true" : "false"); });
      var r = $("input", cmp); r.value = 50; r.dispatchEvent(new Event("input"));
    };
    $$("button", vig).forEach(function (b) { b.addEventListener("click", function () { voir(b.dataset.id); }); });
    $$(".filtres button").forEach(function (f) {
      f.addEventListener("click", function () {
        $$(".filtres button").forEach(function (x) { x.setAttribute("aria-pressed", x === f ? "true" : "false"); });
        var premier = null;
        $$("li", vig).forEach(function (li) { var ok = f.dataset.m === "tous" || li.dataset.m === f.dataset.m; li.hidden = !ok; if (ok && !premier) premier = li; });
        if (premier) voir($("button", premier).dataset.id);
      });
    });
    voir("sdb");
  }

  /* ------------------------------------------------------------ zone d'intervention */
  var toutes = [];
  Object.keys(H.zone).forEach(function (k) { toutes = toutes.concat(H.zone[k]); });
  var dl = $("#communes");
  if (dl) toutes.slice().sort(function (a, b) { return a.localeCompare(b, "fr"); }).forEach(function (c) { var o = document.createElement("option"); o.value = c; dl.appendChild(o); });
  var zc = $("#zone-communes");
  if (zc) {
    zc.innerHTML = Object.keys(H.zone).map(function (k) {
      return "<div><h3>" + k + "</h3><ul>" + H.zone[k].slice().sort(function (a, b) { return a.localeCompare(b, "fr"); }).map(function (c) { return '<li data-c="' + sansAccent(c) + '">' + esc(c) + "</li>"; }).join("") + "</ul></div>";
    }).join("");
  }
  var vf = $("#verif");
  if (vf) {
    var champ = $("input", vf), out = $("#verdict");
    var surligne = function (v) {
      var k = sansAccent(v);
      $$("li", zc).forEach(function (li) { li.classList.toggle("trouve", !!k && k.length > 1 && li.dataset.c.indexOf(k) === 0); });
    };
    champ.addEventListener("input", function () { surligne(champ.value); });
    vf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = champ.value.trim();
      if (!v) { out.className = "verdict"; out.textContent = "Tapez le nom de votre commune."; champ.focus(); return; }
      var c = toutes.filter(function (x) { return sansAccent(x) === sansAccent(v); })[0];
      surligne(c || v);
      if (c) { out.className = "verdict oui"; out.textContent = "Oui, on intervient à " + c + ". Appelez, on vous dit au téléphone quand on peut être là."; }
      else { out.className = "verdict non"; out.textContent = "« " + v + " » n'est pas dans notre zone habituelle. Appelez quand même : si on ne peut pas venir, on vous le dit tout de suite."; }
    });
  }

  /* ------------------------------------------------------------ devis en quatre étapes */
  var form = $("#form");
  function choisirMetier(m) { if (!form || !m) return; var r = $('input[name=type][value="' + m + '"]', form); if (r) r.checked = true; }
  if (form) {
    var e = 1, suiv = $("#suiv"), prec = $("#prec"), pas = $$(".pas li", form), apercu = $("#apercu");
    choisirMetier(new URLSearchParams(location.search).get("type"));
    $("#photos", form).addEventListener("change", function () {
      apercu.innerHTML = "";
      Array.prototype.slice.call(this.files, 0, 4).forEach(function (f) {
        if (!/^image\//.test(f.type)) return;
        var im = document.createElement("img"); im.alt = "Photo jointe : " + f.name; im.src = URL.createObjectURL(f); apercu.appendChild(im);
      });
      $("#photos-txt").textContent = this.files.length ? this.files.length + " photo(s) jointe(s), touchez pour changer" : "Ajouter une ou plusieurs photos";
    });
    var erreur = function (ch, msg) {
      var l = ch.closest(".champ"); l.classList.toggle("err", !!msg);
      ch.setAttribute("aria-invalid", msg ? "true" : "false");
      var m = $(".msg", l); if (!m) { m = document.createElement("span"); m.className = "msg"; m.id = ch.id + "-msg"; l.appendChild(m); ch.setAttribute("aria-describedby", m.id); }
      m.textContent = msg || ""; return !msg;
    };
    var valide = function () {
      if (e === 2) { var d = $("#desc", form); var ok = erreur(d, d.value.trim().length < 8 ? "Une phrase suffit, mais il nous faut un peu plus de détails." : ""); if (!ok) d.focus(); return ok; }
      if (e === 3) {
        var n = $("#nom", form), t = $("#tel", form), c = $("#commune", form);
        var a = erreur(n, n.value.trim() ? "" : "Comment vous appelez-vous ?");
        var b = erreur(t, t.value.replace(/\D/g, "").length >= 8 ? "" : "Un numéro où vous rappeler, au moins 8 chiffres.");
        var d2 = erreur(c, c.value.trim() ? "" : "Dans quelle commune ?");
        var premier = [n, t, c].filter(function (x) { return x.getAttribute("aria-invalid") === "true"; })[0]; if (premier) premier.focus();
        return a && b && d2;
      }
      return true;
    };
    var lignes = function () {
      var ph = $("#photos", form).files.length;
      return [["Métier", $("input[name=type]:checked", form).value], ["Quand", $("input[name=quand]:checked", form).value],
        ["Problème", $("#desc", form).value.trim()], ["Photos", ph ? ph + " jointe(s)" : "aucune"],
        ["Nom", $("#nom", form).value.trim()], ["Téléphone", $("#tel", form).value.trim()], ["Commune", $("#commune", form).value.trim()]];
    };
    var maj = function () {
      $$(".etape", form).forEach(function (x) { x.classList.toggle("on", +x.dataset.e === e); });
      pas.forEach(function (s, i) { s.classList.toggle("on", i < Math.min(e, 4)); });
      prec.hidden = e === 1 || e === 5; suiv.hidden = e === 5;
      $("span", suiv).textContent = e === 4 ? "Envoyer la demande" : "Continuer";
      if (e === 4) $("#recap", form).innerHTML = lignes().map(function (x) { return "<dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd>"; }).join("");
    };
    suiv.addEventListener("click", function () {
      if (!valide()) return;
      if (e === 4) {
        var num = "HV-" + String(Date.now()).slice(-5);
        try { var l = JSON.parse(localStorage.getItem("halvren-demandes") || "[]"); l.push({ num: num, quand: new Date().toISOString(), lignes: lignes() }); localStorage.setItem("halvren-demandes", JSON.stringify(l.slice(-10))); } catch (x) {}
        $("#merci").innerHTML = "Votre demande porte le numéro <b>" + num + "</b>. Sur le vrai site, elle arrive à l'instant sur le téléphone de l'artisan, photos comprises, et il vous rappelle dans la journée. Ici, c'est une démonstration : rien n'est envoyé.";
      }
      if (e < 5) { e++; maj(); var f = $(".etape.on input, .etape.on textarea", form); if (f && e < 4) f.focus({ preventScroll: true }); form.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "nearest" }); }
    });
    prec.addEventListener("click", function () { if (e > 1) { e--; maj(); } });
    $("#nouvelle").addEventListener("click", function () {
      form.reset(); apercu.innerHTML = ""; $("#photos-txt").textContent = "Ajouter une ou plusieurs photos";
      $$(".champ.err", form).forEach(function (c) { c.classList.remove("err"); });
      $$(".msg", form).forEach(function (m) { m.textContent = ""; });
      e = 1; maj(); var r = $("input[name=type]", form); if (r) r.focus({ preventScroll: true });
    });
    maj();
  }

  /* ============================================================ OUTILS DES PAGES MÉTIERS */

  /* plomberie : couper l'eau, pas à pas */
  var plo = $("#plomberie-outil");
  if (plo) {
    var LIEUX = {
      appart: ["Repérez la vanne de votre logement : sous l'évier de la cuisine, dans le placard technique ou près du compteur d'eau.", "Tournez-la dans le sens des aiguilles d'une montre jusqu'au bout, sans forcer.", "Ouvrez un robinet : s'il ne coule plus, l'eau est coupée.", "Prévenez le voisin du dessous si l'eau a traversé.", "Prenez une photo de la fuite et de la vanne."],
      maison: ["Descendez à la cave ou au local technique : la vanne est juste après le compteur d'eau.", "Tournez-la dans le sens des aiguilles d'une montre jusqu'au bout, sans forcer.", "Ouvrez un robinet à l'étage : s'il ne coule plus, l'eau est coupée.", "Si l'eau touche une prise ou un appareil, coupez aussi le disjoncteur général.", "Prenez une photo de la fuite et de la vanne."]
    };
    var coche = $("#coche"), jauge = $("#jauge i"), fin = $("#plomberie-fin");
    var compte = function () {
      var cs = $$("input", coche), n = cs.filter(function (c) { return c.checked; }).length;
      jauge.style.transform = "scaleX(" + n / cs.length + ")"; fin.hidden = n < cs.length;
    };
    var remplir = function (k) {
      $$(".seg button", plo).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.l === k ? "true" : "false"); });
      coche.innerHTML = LIEUX[k].map(function (t, i) { return '<li><label><input type="checkbox" id="c' + i + '"><span>' + esc(t) + "</span></label></li>"; }).join("");
      $$("input", coche).forEach(function (c) { c.addEventListener("change", compte); });
      compte();
    };
    $$(".seg button", plo).forEach(function (b) { b.addEventListener("click", function () { remplir(b.dataset.l); }); });
    remplir("appart");
  }

  /* chauffage : le manomètre */
  var man = $("#mano-curseur");
  if (man) {
    var aig = $("#aiguille"), val = $("#mano-val"), cons = $("#chauffage-conseil");
    var lire = function () {
      var b = man.value / 10, txt = b.toFixed(1).replace(".", ",");
      aig.style.transform = "rotate(" + (-120 + b * 60) + "deg)";
      val.innerHTML = txt + " <small>bar</small>";
      man.setAttribute("aria-valuetext", txt + " bar");
      var h;
      if (b < 1) h = '<span class="niveau rouge">Trop basse</span><h4>La pression est <em>trop basse</em></h4><p>C\'est la première cause d\'une chaudière qui se met en sécurité.</p><ol><li>Chaudière froide, ouvrez doucement le robinet de remplissage (souvent sous la chaudière, voir votre notice).</li><li>Refermez vers 1,5 bar.</li><li>Relancez la chaudière.</li></ol><p>Si la pression redescend dans la semaine, il y a une fuite sur le circuit : appelez.</p>';
      else if (b <= 2.5) h = '<span class="niveau vert">Normale</span><h4>La pression est <em>bonne</em></h4><p>Entre 1 et 2 bars à froid, un peu plus quand la chaudière chauffe : c\'est la zone habituelle. Le problème est ailleurs : notez le code affiché et prenez-le en photo.</p><ol><li>Vérifiez que le thermostat demande bien de la chaleur.</li><li>Coupez et rallumez la chaudière une seule fois.</li><li>Toujours rien ? Appelez avec le code et la marque de la chaudière.</li></ol>';
      else h = '<span class="niveau rouge">Trop haute</span><h4>La pression est <em>trop haute</em></h4><p>Au-delà de 2,5 bars, la soupape de sécurité peut s\'ouvrir et laisser couler de l\'eau.</p><ol><li>Ne touchez pas au robinet de remplissage.</li><li>Éteignez la chaudière.</li><li>Appelez : c\'est souvent le vase d\'expansion ou le robinet de remplissage qui fuit.</li></ol>';
      cons.innerHTML = h;
    };
    man.addEventListener("input", lire); lire();
  }

  /* serrurerie : la situation */
  var ser = $("#serrurerie-outil");
  if (ser) {
    var SIT = {
      claquee: { n: "Ouverture sans casse, le plus souvent", c: "vert", t: "Porte <em>claquée</em>", p: "La porte est fermée mais pas verrouillée à clé : c'est le cas le plus simple.", a: ["On ouvre sans percer ni abîmer la serrure dans la grande majorité des cas.", "Gardez votre téléphone allumé, on vous rappelle à l'approche.", "Préparez de quoi prouver que vous habitez là : pièce d'identité, courrier, bail."] },
      cle: { n: "Ça dépend de la serrure", c: "", t: "Fermée <em>à clé</em>", p: "Clé perdue ou restée à l'intérieur, porte verrouillée.", a: ["On tente d'abord l'ouverture sans casse. Sur une serrure de sûreté, il faut parfois changer le cylindre.", "Si un cylindre doit être changé, le prix vous est annoncé avant.", "Pensez à la clé de secours : voisin, famille, agence."] },
      cassee: { n: "Sans casse, le plus souvent", c: "vert", t: "Clé <em>cassée</em> dedans", p: "Un morceau de clé est resté dans la serrure.", a: ["Ne tentez pas de l'extraire avec une pince ou un trombone : vous l'enfoncez.", "On extrait le morceau et on vous refait une clé si le reste est intact.", "Gardez le morceau que vous avez en main, il sert de modèle."] },
      bloquee: { n: "À voir sur place", c: "", t: "Serrure <em>bloquée</em>", p: "La clé tourne dans le vide, ou ne tourne plus du tout.", a: ["Ne forcez pas : une clé tordue dans la serrure complique tout.", "Une pièce cassée à l'intérieur se remplace en général dans la journée.", "Envoyez une photo de la serrure côté extérieur par le formulaire de devis."] }
    };
    var cs2 = $("#serrurerie-conseil");
    var voirS = function (k) {
      var s = SIT[k];
      $$(".puces button", ser).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.s === k ? "true" : "false"); });
      cs2.innerHTML = '<span class="niveau ' + s.c + '">' + s.n + "</span><h4>" + s.t + "</h4><p>" + s.p + "</p><ul>" + s.a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    };
    $$(".puces button", ser).forEach(function (b) { b.addEventListener("click", function () { voirS(b.dataset.s); }); });
    voirS("claquee");
  }

  /* électricité : le tableau */
  var tab = $("#tableau");
  if (tab) {
    var ce = $("#electricite-conseil");
    var DIAG = {
      diff: '<span class="niveau rouge">Différentiel</span><h4>C\'est le <em>différentiel</em> qui a sauté</h4><p>Il protège les personnes : il coupe quand un appareil laisse fuir du courant, souvent un lave-linge, un four ou une prise extérieure humide.</p><ol><li>Débranchez les gros appareils.</li><li>Relevez le différentiel.</li><li>Rebranchez les appareils un par un : celui qui le refait sauter est le coupable. Laissez-le débranché.</li></ol><p>S\'il saute même avec tout débranché, appelez : le défaut est dans l\'installation.</p>',
      circuit: function (n) { return '<span class="niveau">Un seul circuit</span><h4>Le circuit <em>' + esc(n) + "</em> est coupé</h4><p>Un disjoncteur divisionnaire coupe quand le circuit est surchargé ou en court-circuit.</p><ol><li>Débranchez ce qui tourne sur ce circuit.</li><li>Relevez le disjoncteur une seule fois.</li><li>S'il retombe aussitôt, laissez-le baissé et appelez. Ne le bloquez jamais en position haute.</li></ol>"; },
      rien: "<h4>Touchez la manette <em>qui est tombée</em></h4><p>Ouvrez votre tableau, repérez la manette baissée et touchez la même ici. On vous dit quoi faire.</p><p>Odeur de brûlé, manette chaude ou grésillement : ne touchez à rien et appelez.</p>"
    };
    ce.innerHTML = DIAG.rien;
    $$(".disj", tab).forEach(function (d) {
      d.addEventListener("click", function () {
        var deja = d.getAttribute("aria-pressed") === "true";
        $$(".disj", tab).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        if (deja) { ce.innerHTML = DIAG.rien; return; }
        d.setAttribute("aria-pressed", "true");
        ce.innerHTML = d.classList.contains("diff") ? DIAG.diff : DIAG.circuit(d.dataset.nom);
      });
    });
  }
})();
