/* PULSE — tout ce qui n'est pas la 3D : intro, filtres partagés, liste,
   réservation, mes séances, galerie du studio, abonnements, essai. */
(function () {
  "use strict";
  var P = window.PULSE;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ------------------------------------------------------------ état des filtres (partagé 3D + liste) */
  var etat = { j: -1, fam: "", moment: "", dispo: false, q: "" };
  function moment(h) { var n = parseInt(h, 10); return n < 11 ? "matin" : (n < 17 ? "midi" : "soir"); }
  function passe(c, avecJour) {
    if (avecJour && etat.j !== -1 && c.j !== etat.j) return false;
    if (etat.fam && c.fam !== etat.fam) return false;
    if (etat.moment && moment(c.h) !== etat.moment) return false;
    if (etat.dispo && P.libres(c) === 0) return false;
    var q = etat.q.trim().toLowerCase();
    if (q && (c.nom + " " + c.coach + " " + P.SALLES[c.salle] + " " + c.niv + " " + P.FAMILLES[c.fam].nom).toLowerCase().indexOf(q) === -1) return false;
    return true;
  }

  /* ------------------------------------------------------------ intro */
  var intro = $("#intro");
  var finie = false;
  function finIntro() {
    if (finie) return; finie = true;
    try { sessionStorage.setItem("pulse-intro", "1"); } catch (e) {}
    intro.classList.add("sort");
    html.classList.remove("en-intro");
    lancer3d();
    $("#intro-passer").hidden = true;
    setTimeout(function () { intro.hidden = true; }, 700);
  }
  var monteeDemandee = false;
  function lancer3d() {
    monteeDemandee = true;
    if (window.PULSE3D) window.PULSE3D.monter();
  }
  document.addEventListener("pulse:3d-pret", function () {
    appliquer();
    if (monteeDemandee) window.PULSE3D.monter();
  });
  if (html.classList.contains("en-intro")) {
    intro.classList.add("joue");
    $("#intro-passer").hidden = false;
    $("#intro-passer").addEventListener("pointerdown", finIntro);
    $("#intro-passer").addEventListener("click", finIntro);
    addEventListener("wheel", finIntro, { once: true, passive: true });
    addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === " ") finIntro(); }, { once: true });
    setTimeout(finIntro, 3100);
  } else {
    intro.hidden = true;
    lancer3d();
  }

  /* ------------------------------------------------------------ nav, menu */
  var nav = $("#nav");
  function navFond() { nav.classList.toggle("plein", scrollY > 40); }
  addEventListener("scroll", navFond, { passive: true }); navFond();

  var burger = $("#burger"), menu = $("#menu");
  function menuOuvert(o) {
    menu.hidden = !o; burger.setAttribute("aria-expanded", o ? "true" : "false");
    burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("bloque", o);
  }
  burger.addEventListener("click", function () { menuOuvert(menu.hidden); });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", function () { menuOuvert(false); }); });

  /* ------------------------------------------------------------ aujourd'hui (hero liste) */
  function auj() {
    var maintenant = new Date(), mn = maintenant.getHours() * 60 + maintenant.getMinutes();
    var j = P.aujourdhui;
    var liste = P.COURS.filter(function (c) { return c.j === j && P.minutes(c.h) + c.min > mn; });
    var titre = "Aujourd'hui, " + P.JOURS[j].toLowerCase();
    if (!liste.length) {
      j = (j + 1) % 7;
      liste = P.COURS.filter(function (c) { return c.j === j; });
      titre = "Demain, " + P.JOURS[j].toLowerCase();
    }
    $("#auj-titre").textContent = titre;
    $("#auj-liste").innerHTML = liste.slice(0, 3).map(function (c) {
      var r = P.libres(c), moi = P.reserve(c.id);
      return '<li><button type="button" data-id="' + c.id + '" style="--f:' + P.FAMILLES[c.fam].couleur + '">' +
        '<span class="h">' + c.h + '</span><span class="n">' + esc(c.nom) + '<small>' + c.coach + ' · ' + c.min + ' min</small></span>' +
        '<span class="p' + (r === 0 && !moi ? " plein" : "") + '">' + (moi ? "Réservé" : r === 0 ? "Complet" : r + (r > 1 ? " places" : " place")) + '</span></button></li>';
    }).join("");
  }

  /* ------------------------------------------------------------ commandes de la semaine */
  $("#jours").innerHTML = '<button type="button" class="chip" data-j="-1" aria-pressed="true">Semaine</button>' +
    P.COURTS.map(function (n, i) {
      return '<button type="button" class="chip' + (i === P.aujourdhui ? " auj" : "") + '" data-j="' + i + '" aria-pressed="false">' + n + '</button>';
    }).join("");
  $("#familles").innerHTML = Object.keys(P.FAMILLES).map(function (k) {
    return '<button type="button" class="chip fam" data-fam="' + k + '" aria-pressed="false" style="--f:' + P.FAMILLES[k].couleur + '"><i></i>' + P.FAMILLES[k].nom + '</button>';
  }).join("");
  $("#familles-liste").innerHTML = Object.keys(P.FAMILLES).map(function (k) {
    var f = P.FAMILLES[k];
    var n = P.COURS.filter(function (c) { return c.fam === k; });
    var moy = n.reduce(function (s, c) { return s + c.int; }, 0) / n.length;
    var barres = "";
    for (var i = 1; i <= 5; i++) barres += '<i class="' + (i <= Math.round(moy) ? "on" : "") + '"></i>';
    return '<li><button type="button" data-fam="' + k + '" aria-pressed="false" style="--f:' + f.couleur + '">' +
      '<span class="nom">' + f.nom + '</span><span class="txt">' + f.texte + '</span>' +
      '<span class="int" aria-label="Intensité moyenne ' + Math.round(moy) + ' sur 5">' + barres + '</span>' +
      '<span class="nb">' + n.length + ' cours</span></button></li>';
  }).join("");
  $$(".coach").forEach(function (a) { $(".role", a).textContent = P.COACHS[a.dataset.coach].role; });
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) $("#aide").textContent = "Touchez un bloc pour réserver";
  $("#nb-cours").textContent = P.COURS.length + " cours";

  var mobile = matchMedia("(max-width: 820px)");
  function jourMobile() { if (mobile.matches && etat.j === -1) etat.j = P.aujourdhui; }
  mobile.addEventListener("change", function () { jourMobile(); appliquer(); });
  jourMobile();

  function appliquer() {
    $$("[data-j]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.j === etat.j ? "true" : "false"); });
    $$("[data-fam]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.fam === etat.fam ? "true" : "false"); });
    $$("[data-moment]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.moment === etat.moment ? "true" : "false"); });
    $("[data-dispo]").setAttribute("aria-pressed", etat.dispo ? "true" : "false");
    if (window.PULSE3D) {
      window.PULSE3D.jour(etat.j);
      window.PULSE3D.filtrer(function (c) { return passe(c, false); });
    }
    liste();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-j],[data-fam],[data-moment],[data-dispo],[data-reset],[data-voir],[data-id],[data-plier]");
    if (!b) return;
    if (b.hasAttribute("data-id")) return ouvrirResa(b.dataset.id, b);
    if (b.hasAttribute("data-j")) etat.j = +b.dataset.j;
    else if (b.hasAttribute("data-fam")) etat.fam = etat.fam === b.dataset.fam ? "" : b.dataset.fam;
    else if (b.hasAttribute("data-moment")) etat.moment = etat.moment === b.dataset.moment ? "" : b.dataset.moment;
    else if (b.hasAttribute("data-dispo")) etat.dispo = !etat.dispo;
    else if (b.hasAttribute("data-reset")) { etat = { j: -1, fam: "", moment: "", dispo: false, q: "" }; $("#pl-q").value = ""; jourMobile(); }
    else if (b.hasAttribute("data-plier")) {
      var jj = +b.dataset.plier;
      if (ouverts[jj]) delete ouverts[jj]; else ouverts[jj] = 1;
      return liste();
    }
    else if (b.hasAttribute("data-voir")) {
      etat = { j: -1, fam: "", moment: "", dispo: false, q: b.dataset.voir }; $("#pl-q").value = b.dataset.voir;
      for (var d = 0; d < 7; d++) ouverts[d] = 1;
      jourMobile();
      appliquer(); $("#planning").scrollIntoView({ behavior: calme ? "auto" : "smooth" }); return;
    }
    appliquer();
  });
  var tm;
  $("#pl-q").addEventListener("input", function () {
    var v = this.value; clearTimeout(tm);
    tm = setTimeout(function () { etat.q = v; appliquer(); }, 160);
  });

  /* ------------------------------------------------------------ liste */
  /* La semaine entière se replie par jour : seul aujourd'hui est ouvert au départ. */
  var ouverts = {}; ouverts[P.aujourdhui] = 1;
  function ligne(c, i) {
    var r = P.libres(c), moi = P.reserve(c.id);
    return '<li class="pl-ligne" style="--i:' + i + ';--f:' + P.FAMILLES[c.fam].couleur + '">' +
      '<span class="pl-h"><small>' + P.COURTS[c.j] + '</small>' + c.h + '</span>' +
      '<span class="pl-n">' + esc(c.nom) + '<small>' + c.min + ' min · ' + c.niv + ' · ' + P.SALLES[c.salle] + ' · avec ' + c.coach + '</small></span>' +
      '<span class="pl-int" aria-label="Intensité ' + c.int + ' sur 5">' + "<i></i>".repeat(c.int) + '</span>' +
      (moi ? '<button type="button" class="pl-b moi" data-id="' + c.id + '">Réservé</button>'
           : r === 0 ? '<span class="pl-b plein">Complet</span>'
           : '<button type="button" class="pl-b" data-id="' + c.id + '">Réserver <em>' + r + (r > 1 ? " places" : " place") + '</em></button>') +
      '</li>';
  }
  function liste() {
    var res = P.COURS.filter(function (c) { return passe(c, true); });
    if (etat.j === -1 && res.length) {
      var libresS = res.reduce(function (n, c) { return n + P.libres(c); }, 0);
      $("#pl-compte").innerHTML = "<b>" + res.length + "</b> cours sur la semaine, <b>" + libresS + "</b> places libres";
      var html = "";
      for (var d = 0; d < 7; d++) {
        var jour = res.filter(function (c) { return c.j === d; });
        if (!jour.length) continue;
        var ouv = !!ouverts[d] || !!(etat.q || etat.fam || etat.moment || etat.dispo);
        html += '<li class="pl-groupe' + (ouv ? " ouvert" : "") + '"><button type="button" class="pl-groupe-t" data-plier="' + d + '" aria-expanded="' + ouv + '">' +
          '<span>' + P.JOURS[d] + (d === P.aujourdhui ? " <em>aujourd'hui</em>" : "") + '</span>' +
          '<small>' + jour.length + ' cours · ' + jour.map(function (c) { return c.h; }).join(" · ") + '</small><i aria-hidden="true"></i></button>' +
          (ouv ? '<ol class="pl-sous">' + jour.map(ligne).join("") + '</ol>' : "") + '</li>';
      }
      $("#pl-liste").innerHTML = html;
      return;
    }
    var libres = res.reduce(function (n, c) { return n + P.libres(c); }, 0);
    var quand = etat.j === -1 ? "sur la semaine" : P.JOURS[etat.j].toLowerCase();
    $("#pl-compte").innerHTML = res.length
      ? "<b>" + res.length + "</b> cours " + quand + ", <b>" + libres + "</b> places libres"
      : "Aucun cours " + quand + " avec ces critères.";
    $("#pl-liste").innerHTML = res.length ? res.map(ligne).join("") : '<li class="pl-vide"><p>Changez de jour ou retirez un filtre : le studio tourne sept jours sur sept.</p><button type="button" class="btn btn-ligne" data-reset><span>Tout afficher</span></button></li>';
  }

  /* ------------------------------------------------------------ panneaux (réservation, mes séances) */
  var voile = $("#voile"), panneau = null, retour = null;
  function ouvrir(p, depuis) {
    if (panneau) fermer(true);
    panneau = p; retour = depuis || document.activeElement;
    ouvertA = Date.now();
    voile.hidden = false; p.hidden = false;
    document.body.classList.add("bloque", "panneau-ouvert");
    requestAnimationFrame(function () { voile.classList.add("on"); p.classList.add("on"); });
    var f = $("input,button:not(.fermer)", p) || $(".fermer", p);
    setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }
  function fermer(vite) {
    if (!panneau) return;
    var p = panneau; panneau = null;
    p.classList.remove("on"); voile.classList.remove("on");
    document.body.classList.remove("bloque", "panneau-ouvert");
    var fin = function () { p.hidden = true; voile.hidden = true; };
    if (vite || calme) fin(); else setTimeout(fin, 320);
    if (retour && retour.focus && document.contains(retour)) retour.focus({ preventScroll: true });
  }
  var ouvertA = 0;
  /* au toucher, le « clic » qui suit le doigt levé tombe sur le voile : on l'ignore */
  voile.addEventListener("click", function () { if (Date.now() - ouvertA > 450) fermer(); });
  $$("[data-fermer]").forEach(function (b) { b.addEventListener("click", function () { fermer(); }); });
  addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (panneau) fermer(); else if (!menu.hidden) menuOuvert(false); }
    if (e.key === "Tab" && panneau) {       // le focus reste dans le panneau
      var f = $$("button,input,a[href]", panneau).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  var resa = $("#resa"), coursOuvert = null;
  function jauge(el, val, max) {
    el.innerHTML = ""; for (var i = 0; i < max; i++) { var s = document.createElement("b"); if (i < val) s.className = "on"; el.appendChild(s); }
  }
  function remplirResa() {
    var c = coursOuvert, r = P.libres(c), moi = P.reserve(c.id);
    resa.style.setProperty("--f", P.FAMILLES[c.fam].couleur);
    $("#resa-quand").textContent = P.JOURS[c.j] + " · " + c.h + " – " + P.fin(c);
    $("#resa-titre").textContent = c.nom;
    $("#resa-qui").textContent = "Avec " + c.coach + " · " + P.SALLES[c.salle] + " · " + c.niv;
    jauge($("#resa-int"), c.int, 5);
    jauge($("#resa-pl"), r, c.cap);       // les cases colorées sont les places LIBRES
    $("#resa-pl-txt").textContent = r === 0 ? "complet" : r + (r > 1 ? " places libres" : " place libre") + " sur " + c.cap;
    var etatEl = $("#resa-etat"), form = $("#resa-form");
    if (moi) {
      form.hidden = true; etatEl.hidden = false;
      etatEl.innerHTML = '<p class="ok">Votre place est réservée.</p><p>Arrivez dix minutes avant, on vous attend à l\'accueil.</p><button type="button" class="lien" id="resa-annuler">Annuler cette réservation</button>';
      $("#resa-annuler").addEventListener("click", function () { P.annuler(c.id); remplirResa(); });
    } else if (r === 0) {
      form.hidden = true; etatEl.hidden = false;
      etatEl.innerHTML = '<p class="ok">Ce cours est complet.</p><p>Un autre créneau de la même famille vous attend peut-être dans la semaine.</p><button type="button" class="lien" id="resa-autre">Voir les autres cours ' + P.FAMILLES[c.fam].nom.toLowerCase() + '</button>';
      $("#resa-autre").addEventListener("click", function () { etat = { j: -1, fam: c.fam, moment: "", dispo: true, q: "" }; $("#pl-q").value = ""; appliquer(); fermer(); });
    } else {
      form.hidden = false; etatEl.hidden = true; $("#r-erreur").textContent = "";
    }
  }
  function ouvrirResa(id, depuis) {
    coursOuvert = P.trouver(id); if (!coursOuvert) return;
    remplirResa(); ouvrir(resa, depuis);
  }
  document.addEventListener("pulse:choisir", function (e) { ouvrirResa(e.detail.id, $("#s3d")); });

  var reMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $("#resa-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var prenom = $("#r-prenom").value.trim(), mail = $("#r-mail").value.trim(), err = $("#r-erreur");
    $("#r-prenom").removeAttribute("aria-invalid"); $("#r-mail").removeAttribute("aria-invalid");
    if (!prenom) { err.textContent = "Indiquez votre prénom."; $("#r-prenom").setAttribute("aria-invalid", "true"); $("#r-prenom").focus(); return; }
    if (!reMail.test(mail)) { err.textContent = "Cette adresse e-mail ne semble pas complète."; $("#r-mail").setAttribute("aria-invalid", "true"); $("#r-mail").focus(); return; }
    if (!P.reserver(coursOuvert.id, prenom)) { err.textContent = "Ce cours vient d'être complet."; remplirResa(); return; }
    remplirResa();
    $(".ok", resa).textContent = "C'est réservé, " + prenom + ".";
    $("#resa-annuler").focus();
  });

  var mes = $("#mes");
  function mesSeances() {
    var l = P.resas().map(function (r) { return P.trouver(r.id); }).filter(Boolean)
      .sort(function (a, b) { return a.j - b.j || P.minutes(a.h) - P.minutes(b.h); });
    $("#mes-n").textContent = l.length;
    $("#mes-ouvrir").classList.toggle("a-des", l.length > 0);
    $("#mes-liste").innerHTML = l.length ? l.map(function (c) {
      return '<li style="--f:' + P.FAMILLES[c.fam].couleur + '"><span><b>' + P.JOURS[c.j] + ' ' + c.h + '</b>' + esc(c.nom) + ' avec ' + c.coach + '</span>' +
        '<button type="button" class="lien" data-annuler="' + c.id + '">Annuler</button></li>';
    }).join("") : '<li class="vide">Aucune séance réservée pour l\'instant. Cliquez un bloc de la semaine ou une ligne du planning.</li>';
  }
  $("#mes-ouvrir").addEventListener("click", function () { mesSeances(); ouvrir(mes, this); });
  $("#mes-liste").addEventListener("click", function (e) {
    var b = e.target.closest("[data-annuler]"); if (!b) return;
    P.annuler(b.dataset.annuler); mesSeances(); $(".fermer", mes).focus();
  });

  P.surChange(function () { auj(); liste(); mesSeances(); remplirSelect(); });

  /* ------------------------------------------------------------ le studio : galerie qui glisse au défilement */
  var studio = $("#studio"), piste = $("#studio-piste");
  function glisser() {
    if (innerWidth <= 820 || calme) { piste.style.transform = ""; return; }
    var r = studio.getBoundingClientRect();
    var t = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    var max = piste.scrollWidth - piste.parentNode.clientWidth;
    piste.style.transform = "translate3d(" + (-t * Math.max(0, max)).toFixed(1) + "px,0,0)";
  }
  addEventListener("scroll", function () { requestAnimationFrame(glisser); }, { passive: true });
  addEventListener("resize", glisser);

  /* ------------------------------------------------------------ abonnements */
  $$(".bascule button").forEach(function (b) {
    b.addEventListener("click", function () {
      var e = b.dataset.engage === "1";
      $$(".bascule button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      $$("[data-prix]").forEach(function (p) {
        var v = e ? p.dataset.prixE : p.dataset.prix;
        if (p.textContent !== v) { p.textContent = v; p.classList.remove("bouge"); void p.offsetWidth; p.classList.add("bouge"); }
      });
    });
  });
  $$("[data-formule]").forEach(function (b) {
    b.addEventListener("click", function () {
      $("#e-formule").value = b.dataset.formule;
      $("#essai").scrollIntoView({ behavior: calme ? "auto" : "smooth" });
      setTimeout(function () { $("#e-prenom").focus({ preventScroll: true }); }, calme ? 0 : 650);
    });
  });

  /* ------------------------------------------------------------ séance d'essai */
  function remplirSelect() {
    var s = $("#e-cours"), garde = s.value;
    s.innerHTML = '<option value="">Choisir un cours</option>' + P.COURS.filter(function (c) { return P.libres(c) > 0; }).map(function (c) {
      return '<option value="' + c.id + '">' + P.JOURS[c.j] + ' ' + c.h + ' · ' + esc(c.nom) + ' (' + c.coach + ')</option>';
    }).join("");
    if (garde) s.value = garde;
  }
  var form = $("#form-essai");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#e-erreur");
    $$("[aria-invalid]", form).forEach(function (x) { x.removeAttribute("aria-invalid"); });
    var manque = [["#e-prenom", "votre prénom"], ["#e-nom", "votre nom"]].filter(function (x) { return !$(x[0]).value.trim(); });
    if (manque.length) { err.textContent = "Il manque " + manque.map(function (x) { return x[1]; }).join(" et ") + "."; $(manque[0][0]).setAttribute("aria-invalid", "true"); $(manque[0][0]).focus(); return; }
    if (!reMail.test($("#e-mail").value.trim())) { err.textContent = "Cette adresse e-mail ne semble pas complète."; $("#e-mail").setAttribute("aria-invalid", "true"); $("#e-mail").focus(); return; }
    if (!$("#e-cours").value) { err.textContent = "Choisissez le cours d'essai."; $("#e-cours").setAttribute("aria-invalid", "true"); $("#e-cours").focus(); return; }
    if (!$("#e-ok").checked) { err.textContent = "Cochez la case pour que le studio puisse vous recontacter."; $("#e-ok").focus(); return; }
    err.textContent = "";
    var c = P.trouver($("#e-cours").value), prenom = $("#e-prenom").value.trim();
    P.reserver(c.id, prenom);
    $("#merci-prenom").textContent = prenom;
    $("#merci-texte").textContent = "Séance d'essai : " + c.nom + " avec " + c.coach + ", " + P.JOURS[c.j].toLowerCase() + " à " + c.h + ". Elle apparaît dans « Mes séances » et sur la semaine en relief.";
    form.hidden = true; $("#merci").hidden = false; $("#merci").focus();
  });
  $("#merci-encore").addEventListener("click", function () { form.reset(); form.hidden = false; $("#merci").hidden = true; $("#e-prenom").focus(); });

  /* ------------------------------------------------------------ apparitions */
  if ("IntersectionObserver" in window && !calme) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    $$("[data-r]").forEach(function (el) { io.observe(el); });
  } else $$("[data-r]").forEach(function (el) { el.classList.add("vu"); });
  $$(".planning-tete,.methode-texte,.coach,.abo,.essai-texte,.acces-grille > div,.reperes p").forEach(function (el, i) {
    if (!el.hasAttribute("data-r")) { el.setAttribute("data-r", ""); el.style.setProperty("--d", (i % 4) * 70 + "ms"); if (io) io.observe(el); else el.classList.add("vu"); }
  });

  auj(); liste(); mesSeances(); remplirSelect(); glisser();
  setInterval(auj, 60000);
})();
