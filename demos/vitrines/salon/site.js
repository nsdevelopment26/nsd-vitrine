/* Maison Lonvière : tout ce qui n'est pas la 3D.
   Intro, navigation, nuancier (panneau + événement vers la 3D), tarifs filtrés,
   équipe, réservation en quatre étapes, « Mes rendez-vous », horaires du jour. */
(function () {
  "use strict";
  var L = window.LONVIERE;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var hm = function (m) { return Math.floor(m / 60) + ":" + pad(m % 60); };
  var duree = function (m) { return m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + pad(m % 60) : ""); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ------------------------------------------------------------ intro */
  var intro = $("#intro");
  var minuteurs = [];
  function finIntro(vite) {
    if (!html.classList.contains("en-intro") || intro.classList.contains("ouvre")) return;
    minuteurs.forEach(clearTimeout);
    intro.classList.add("coupe");
    $("#intro-passer").classList.add("parti");
    setTimeout(function () {
      intro.classList.add("ouvre");
      L.introFinie = true;
      document.dispatchEvent(new CustomEvent("lonviere:intro-fin"));
      setTimeout(function () { html.classList.remove("en-intro"); }, 1100);
    }, vite ? 120 : 450);
    try { sessionStorage.setItem("lonviere-intro", "1"); } catch (e) {}
  }
  if (html.classList.contains("en-intro")) {
    minuteurs.push(setTimeout(function () { finIntro(false); }, 2700));
    /* un seul toucher suffit : sur le bouton, ou n'importe où sur l'ouverture */
    $("#intro-passer").addEventListener("pointerdown", function (e) { e.preventDefault(); finIntro(true); });
    $("#intro-passer").addEventListener("click", function () { finIntro(true); });
    intro.addEventListener("pointerdown", function () { finIntro(true); });
    addEventListener("wheel", function () { finIntro(true); }, { once: true, passive: true });
    addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === " " || e.key === "Enter") finIntro(true); });
    addEventListener("touchmove", function () { finIntro(true); }, { once: true, passive: true });
  } else {
    L.introFinie = true;
  }

  /* ------------------------------------------------------------ navigation */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  function navEtat() { nav.classList.toggle("plein", scrollY > 40 || !menu.hidden); }
  addEventListener("scroll", navEtat, { passive: true });
  navEtat();
  function menuOuvrir(o) {
    menu.hidden = !o;
    burger.setAttribute("aria-expanded", o ? "true" : "false");
    burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("panneau-ouvert", o);
    document.body.style.overflow = o ? "hidden" : "";
    navEtat();
    if (o) $("a", menu).focus();
  }
  burger.addEventListener("click", function () { menuOuvrir(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuOuvrir(false); }); });
  $("#menu-mes").addEventListener("click", function () { menuOuvrir(false); mesOuvrir(); });

  /* lien actif selon la section à l'écran */
  var liens = $$(".nav-liens a");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      liens.forEach(function (a) { a.classList.toggle("actif", a.getAttribute("href") === "#" + e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["nuancier", "prestations", "salon", "equipe", "acces"].forEach(function (id) { io.observe(document.getElementById(id)); });

  /* ------------------------------------------------------------ apparitions + parallaxe */
  var vus = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); vus.unobserve(e.target); } });
  }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
  $$("[data-apparition]").forEach(function (el) { vus.observe(el); });

  var para = $$("[data-parallaxe] img");
  function parallaxe() {
    if (calme) return;
    para.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var k = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height);
      img.style.transform = "translate3d(0," + (-8 + k * -14).toFixed(2) + "%,0)";
    });
  }
  var attente = false;
  addEventListener("scroll", function () { if (!attente) { attente = true; requestAnimationFrame(function () { attente = false; parallaxe(); }); } }, { passive: true });
  parallaxe();

  /* ------------------------------------------------------------ nuancier */
  var choix = $(".choix");
  function choisirNuance(id) {
    var n = L.nuance(id), p = L.presta(n.presta);
    $$(".swatch").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.nuance === id ? "true" : "false"); });
    $("#choix-nom").textContent = n.nom;
    $("#choix-mot").textContent = n.mot;
    $("#choix-tech").textContent = n.tech;
    $("#choix-duree").textContent = duree(p.m);
    $("#choix-prix").textContent = p.p;
    var cta = $("#choix-cta");
    cta.dataset.presta = p.id;
    cta.textContent = "Réserver : " + p.n.toLowerCase();
    choix.classList.remove("change"); void choix.offsetWidth; choix.classList.add("change");
    document.dispatchEvent(new CustomEvent("lonviere:nuance", { detail: { id: id } }));
  }
  $$(".swatch").forEach(function (b) { b.addEventListener("click", function () { choisirNuance(b.dataset.nuance); }); });
  $("#choix-cta").addEventListener("click", function () { prendre(this.dataset.presta, null); });
  choisirNuance("naturel");

  /* ------------------------------------------------------------ aujourd'hui + horaires */
  var maintenant = new Date();
  var jToday = maintenant.getDay(), minNow = maintenant.getHours() * 60 + maintenant.getMinutes();
  (function () {
    var h = L.HORAIRES[jToday], b = $("#auj"), d = $("#auj-detail");
    if (h && minNow < h[1]) {
      b.textContent = minNow < h[0] ? "Ouvre aujourd'hui à " + hm(h[0]) : "Ouvert aujourd'hui";
      d.textContent = "jusqu'à " + hm(h[1]);
    } else {
      var k = 1; while (!L.HORAIRES[(jToday + k) % 7]) k++;
      var j = (jToday + k) % 7;
      b.textContent = "Fermé pour aujourd'hui";
      b.parentNode.classList.add("ferme");
      d.textContent = "réouverture " + (k === 1 ? "demain" : L.JOURS[j]) + " à " + hm(L.HORAIRES[j][0]);
    }
    var ordre = [2, 3, 4, 5, 6, 0, 1], corps = $("#horaires tbody");
    var lignes = [];
    ordre.forEach(function (j) {
      var x = L.HORAIRES[j];
      lignes.push('<tr' + (j === jToday ? ' class="auj"' : "") + "><td>" + L.JOURS[j].charAt(0).toUpperCase() + L.JOURS[j].slice(1) + "</td><td>" + (x ? hm(x[0]) + " – " + hm(x[1]) : "Fermé") + "</td></tr>");
    });
    corps.innerHTML = lignes.join("");
  })();

  /* ------------------------------------------------------------ tarifs */
  var etat = { u: "Coiffure", q: "", bud: "", dur: "" };
  var liste = $("#liste"), compte = $("#compte");
  function sansAccent(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function budgetOk(p) {
    if (!etat.bud) return true;
    if (etat.bud === "devis") return p.v === null;
    if (p.v === null) return false;
    if (etat.bud === "-40") return p.v < 40;
    if (etat.bud === "40-80") return p.v >= 40 && p.v <= 80;
    return p.v > 80;
  }
  function dureeOk(p) {
    if (!etat.dur) return true;
    if (etat.dur === "45") return p.m <= 45;
    if (etat.dur === "90") return p.m <= 90;
    return p.m > 90;
  }
  function rendreTarifs() {
    var q = sansAccent(etat.q.trim());
    var res = L.PRESTA.filter(function (p) {
      if (!q && p.u !== etat.u) return false;   /* une recherche couvre tout le salon */
      if (q && sansAccent(p.n + " " + p.d + " " + p.g + " " + p.u).indexOf(q) < 0) return false;
      return budgetOk(p) && dureeOk(p);
    });
    $(".onglets").classList.toggle("muet", !!q);
    compte.textContent = res.length + (res.length > 1 ? " prestations" : " prestation") + (q ? " pour « " + etat.q.trim() + " », tous univers confondus" : "");
    if (!res.length) {
      liste.innerHTML = '<p class="vide">Aucune prestation ne correspond.<button type="button" class="lien" id="raz">Effacer les filtres</button></p>';
      $("#raz").addEventListener("click", function () {
        etat.q = etat.bud = etat.dur = "";
        $("#cherche").value = ""; $("#f-budget").value = ""; $("#f-duree").value = "";
        rendreTarifs();
      });
      return;
    }
    var groupes = {}, ordre = [];
    res.forEach(function (p) {
      var g = q ? p.u + " · " + p.g : p.g;
      if (!groupes[g]) { groupes[g] = []; ordre.push(g); }
      groupes[g].push(p);
    });
    liste.innerHTML = ordre.map(function (g) {
      return '<h3 class="groupe-titre">' + esc(g) + "</h3>" + groupes[g].map(function (p, i) {
        return '<div class="ligne" style="animation-delay:' + Math.min(i * 40, 240) + 'ms"><span class="ligne-nom">' + esc(p.n) + '</span><span class="ligne-duree">' + duree(p.m) + '</span><span class="ligne-prix">' + esc(p.p) + '</span><span class="ligne-detail">' + esc(p.d) + '</span><button type="button" class="ligne-choisir" data-presta="' + p.id + '" aria-label="Réserver : ' + esc(p.n) + '">Réserver</button></div>';
      }).join("");
    }).join("");
  }
  function ongletChoisir(u) {
    etat.u = u;
    $$(".onglet").forEach(function (o) { o.setAttribute("aria-selected", o.dataset.u === u ? "true" : "false"); });
    rendreTarifs();
  }
  $$(".onglet").forEach(function (o) {
    o.addEventListener("click", function () {
      if (etat.q) { etat.q = ""; $("#cherche").value = ""; }
      ongletChoisir(o.dataset.u);
    });
    o.addEventListener("keydown", function (e) {
      var tous = $$(".onglet"), i = tous.indexOf(o);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var n = tous[(i + (e.key === "ArrowRight" ? 1 : tous.length - 1)) % tous.length];
        n.focus(); n.click();
      }
    });
  });
  $("#cherche").addEventListener("input", function () { etat.q = this.value; rendreTarifs(); });
  $("#f-budget").addEventListener("change", function () { etat.bud = this.value; rendreTarifs(); });
  $("#f-duree").addEventListener("change", function () { etat.dur = this.value; rendreTarifs(); });
  liste.addEventListener("click", function (e) {
    var b = e.target.closest(".ligne-choisir");
    if (b) prendre(b.dataset.presta, null);
  });
  $$(".univ").forEach(function (a) { a.addEventListener("click", function () { ongletChoisir(a.dataset.univers); }); });
  rendreTarifs();

  /* ------------------------------------------------------------ équipe */
  $("#portraits").innerHTML = L.EQUIPE.map(function (m) {
    return '<article class="portrait" data-apparition><div class="portrait-img"><img src="photos/' + m.photo + '.webp" width="720" height="964" alt="Portrait de ' + m.nom + ", " + m.role.toLowerCase() + ' (personne fictive)" loading="lazy"></div><h3>' + m.nom + '</h3><p class="portrait-role">' + m.role + '</p><p class="portrait-txt">' + esc(m.txt) + '</p><button type="button" class="lien" data-membre="' + m.id + '">Réserver avec ' + m.nom + "</button></article>";
  }).join("");
  $$(".portrait").forEach(function (el, i) { el.style.transitionDelay = (i * 0.08) + "s"; vus.observe(el); });
  $("#portraits").addEventListener("click", function (e) {
    var b = e.target.closest("[data-membre]");
    if (!b) return;
    var m = L.membre(b.dataset.membre);
    var dejaOk = sel.presta && m.u.indexOf(L.presta(sel.presta).u) >= 0;
    prendre(dejaOk ? sel.presta : L.PRESTA.filter(function (p) { return p.u === m.u[0]; })[0].id, m.id);
  });

  /* ------------------------------------------------------------ réservation */
  var sel = { presta: null, avec: "", jour: null, heure: null };
  var champPresta = $("#r-presta");
  champPresta.innerHTML = '<option value="">Choisir une prestation</option>' + L.UNIVERS.map(function (u) {
    return '<optgroup label="' + u + '">' + L.PRESTA.filter(function (p) { return p.u === u; }).map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.n) + " · " + duree(p.m) + " · " + esc(p.p) + "</option>";
    }).join("") + "</optgroup>";
  }).join("");

  function cle(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  var jours = [];
  (function () {
    var d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    for (var k = 0; jours.length < 12 && k < 30; k++) {
      var x = new Date(d.getTime() + k * 86400000);
      if (L.HORAIRES[x.getDay()]) jours.push(x);
    }
  })();
  function membresPour(p) { return L.EQUIPE.filter(function (m) { return !p || m.u.indexOf(p.u) >= 0; }); }
  function libre(m, date, debut, fin) {
    if (m.j.indexOf(date.getDay()) < 0) return false;
    var k = cle(date);
    var pris = L.lireRdv().some(function (r) { return r.membre === m.id && r.jour === k && debut < r.fin && fin > r.debut; });
    if (pris) return false;
    /* agenda de démonstration : une partie des créneaux est déjà prise */
    for (var t = debut; t < fin; t += 30) if (hash(k + m.id + t) < 0.38) return false;
    return true;
  }
  function creneaux(date) {
    var p = L.presta(sel.presta);
    if (!p) return [];
    var h = L.HORAIRES[date.getDay()], out = [];
    var auj = cle(date) === cle(maintenant);
    var qui = sel.avec ? [L.membre(sel.avec)] : membresPour(p);
    for (var t = h[0]; t + p.m <= h[1]; t += 30) {
      if (auj && t < minNow + 60) continue;
      for (var i = 0; i < qui.length; i++) if (libre(qui[i], date, t, t + p.m)) { out.push({ t: t, m: qui[i].id }); break; }
    }
    return out;
  }
  function rendreAvec() {
    var p = L.presta(sel.presta);
    var ms = membresPour(p);
    if (sel.avec && !ms.some(function (m) { return m.id === sel.avec; })) sel.avec = "";
    $("#r-avec").innerHTML = '<button type="button" class="pastille" data-avec="" aria-pressed="' + (!sel.avec) + '"><span class="rond" aria-hidden="true">✦</span>Sans préférence</button>' + ms.map(function (m) {
      return '<button type="button" class="pastille" data-avec="' + m.id + '" aria-pressed="' + (sel.avec === m.id) + '"><img src="photos/' + m.photo + '.webp" alt="" width="36" height="36">' + m.nom + "</button>";
    }).join("");
  }
  function rendreJours() {
    var f = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }), mo = new Intl.DateTimeFormat("fr-FR", { month: "short" });
    $("#r-jours").innerHTML = jours.map(function (d, i) {
      var n = sel.presta ? creneaux(d).length : 1;
      var nom = cle(d) === cle(maintenant) ? "auj." : f.format(d).replace(".", "");
      return '<button type="button" class="jour" data-i="' + i + '" aria-pressed="' + (sel.jour === i) + '"' + (n ? "" : " disabled") + ' aria-label="' + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + (n ? "" : ", complet") + '">' + nom + "<b>" + d.getDate() + "</b>" + mo.format(d).replace(".", "") + "</button>";
    }).join("");
  }
  function rendreHeures() {
    var z = $("#r-heures");
    if (!sel.presta) { z.innerHTML = '<p class="heures-vide">Choisissez d\'abord une prestation.</p>'; return; }
    if (sel.jour === null) { z.innerHTML = '<p class="heures-vide">Choisissez un jour pour voir les heures libres.</p>'; return; }
    var cs = creneaux(jours[sel.jour]);
    if (!cs.some(function (c) { return c.t === sel.heure; })) sel.heure = null;
    z.innerHTML = cs.length ? cs.map(function (c) {
      return '<button type="button" class="heure" data-t="' + c.t + '" data-m="' + c.m + '" aria-pressed="' + (sel.heure === c.t) + '">' + hm(c.t) + "</button>";
    }).join("") : '<p class="heures-vide">Plus de place ce jour-là avec ce choix. Essayez un autre jour ou « sans préférence ».</p>';
  }
  function recap() {
    var p = L.presta(sel.presta);
    $("#rc-presta").textContent = p ? p.n : "À choisir";
    $("#rc-duree").textContent = p ? duree(p.m) : "–";
    $("#rc-prix").textContent = p ? p.p : "–";
    var hBtn = sel.heure !== null ? $('.heure[data-t="' + sel.heure + '"]') : null;
    var m = sel.avec ? L.membre(sel.avec) : (hBtn ? L.membre(hBtn.dataset.m) : null);
    $("#rc-avec").textContent = m ? m.nom + (sel.avec ? "" : " (proposé)") : "Sans préférence";
    $("#rc-quand").textContent = sel.jour !== null && sel.heure !== null ? jours[sel.jour].toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + ", " + hm(sel.heure) : "À choisir";
    $("#e-presta").classList.toggle("ok", !!p);
    $("#e-avec").classList.toggle("ok", !!p);
    $("#e-jour").classList.toggle("ok", sel.jour !== null && sel.heure !== null);
    $("#e-qui").classList.toggle("ok", $("#r-prenom").value.trim().length > 1 && telOk());
  }
  function toutRendre() { rendreAvec(); rendreJours(); rendreHeures(); recap(); }
  function telOk() { return $("#r-tel").value.replace(/\D/g, "").length >= 8; }

  champPresta.addEventListener("change", function () { sel.presta = this.value || null; toutRendre(); });
  $("#r-avec").addEventListener("click", function (e) {
    var b = e.target.closest(".pastille"); if (!b) return;
    sel.avec = b.dataset.avec; toutRendre();
  });
  $("#r-jours").addEventListener("click", function (e) {
    var b = e.target.closest(".jour"); if (!b || b.disabled) return;
    sel.jour = +b.dataset.i; sel.heure = null;
    $$(".jour").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    rendreHeures(); recap();
  });
  $("#r-heures").addEventListener("click", function (e) {
    var b = e.target.closest(".heure"); if (!b) return;
    sel.heure = +b.dataset.t;
    $$(".heure").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    recap();
  });
  ["r-prenom", "r-tel"].forEach(function (id) { $("#" + id).addEventListener("input", function () { this.removeAttribute("aria-invalid"); $("#r-erreur").textContent = ""; recap(); }); });

  /* depuis le nuancier, les tarifs ou l'équipe */
  function prendre(prestaId, membreId) {
    sel.presta = prestaId; champPresta.value = prestaId;
    if (membreId) sel.avec = membreId;
    sel.heure = null;
    if (sel.jour === null) {
      for (var i = 0; i < jours.length; i++) if (creneaux(jours[i]).length) { sel.jour = i; break; }
    }
    $("#reserver").classList.remove("fait");
    $("#confirme").hidden = true;
    toutRendre();
    document.getElementById("reserver").scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "start" });
    setTimeout(function () { (sel.jour !== null && $(".heure") ? $(".heure") : champPresta).focus({ preventScroll: true }); }, calme ? 0 : 700);
  }

  var dernierRdv = null;
  $("#resa-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#r-erreur"), manque = null;
    if (!sel.presta) manque = [champPresta, "Choisissez une prestation."];
    else if (sel.jour === null || sel.heure === null) manque = [$(".heure") || $(".jour:not(:disabled)"), "Choisissez un jour et une heure."];
    else if ($("#r-prenom").value.trim().length < 2) manque = [$("#r-prenom"), "Indiquez votre prénom."];
    else if (!telOk()) manque = [$("#r-tel"), "Indiquez un numéro de téléphone pour qu'on puisse vous prévenir en cas d'imprévu."];
    if (manque) {
      err.textContent = manque[1];
      if (manque[0] && manque[0].tagName === "INPUT") manque[0].setAttribute("aria-invalid", "true");
      if (manque[0]) manque[0].focus();
      return;
    }
    err.textContent = "";
    var p = L.presta(sel.presta), hBtn = $('.heure[data-t="' + sel.heure + '"]');
    var m = L.membre(sel.avec || hBtn.dataset.m);
    var d = jours[sel.jour];
    var rdv = { id: Date.now().toString(36), presta: p.id, membre: m.id, jour: cle(d), debut: sel.heure, fin: sel.heure + p.m, prenom: $("#r-prenom").value.trim() };
    var l = L.lireRdv(); l.push(rdv); L.ecrireRdv(l);
    dernierRdv = rdv;
    $("#cf-prenom").textContent = rdv.prenom;
    $("#cf-detail").textContent = p.n + " avec " + m.nom + ", " + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + hm(rdv.debut) + " (" + duree(p.m) + ", " + p.p + "). Un rappel vous serait envoyé la veille par SMS.";
    $("#reserver").classList.add("fait");
    var c = $("#confirme"); c.hidden = false; c.focus({ preventScroll: true });
    c.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
    majCompte();
  });
  $("#cf-autre").addEventListener("click", function () {
    $("#reserver").classList.remove("fait"); $("#confirme").hidden = true;
    sel.heure = null; toutRendre(); champPresta.focus();
  });
  $("#cf-ics").addEventListener("click", function () {
    var r = dernierRdv; if (!r) return;
    var p = L.presta(r.presta), m = L.membre(r.membre);
    var dt = function (min) { return r.jour.replace(/-/g, "") + "T" + pad(Math.floor(min / 60)) + pad(min % 60) + "00"; };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Maison Lonviere//Demo//FR", "BEGIN:VEVENT", "UID:" + r.id + "@lonviere.example",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART:" + dt(r.debut), "DTEND:" + dt(r.fin),
      "SUMMARY:" + p.n + " - Maison Lonvière", "DESCRIPTION:Avec " + m.nom + ". Rendez-vous de démonstration.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "lonviere-rendez-vous.ics";
    document.body.appendChild(a); a.click(); a.remove();
  });
  toutRendre();

  /* ------------------------------------------------------------ mes rendez-vous */
  var tiroir = $("#mes"), voile = $("#voile"), retour = null;
  function majCompte() {
    var n = L.lireRdv().length;
    $("#mes-n").textContent = n;
    $("#mes-ouvrir").classList.toggle("a", n > 0);
    $("#menu-mes").textContent = "Mes rendez-vous (" + n + ")";
  }
  function rendreMes() {
    var l = L.lireRdv().sort(function (a, b) { return (a.jour + pad(a.debut)).localeCompare(b.jour + pad(b.debut)); });
    $("#mes-liste").innerHTML = l.length ? l.map(function (r) {
      var p = L.presta(r.presta), m = L.membre(r.membre), d = new Date(r.jour + "T12:00:00");
      return '<li><p class="q">' + esc(p ? p.n : r.presta) + '</p><p class="d">' + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + hm(r.debut) + " avec " + (m ? m.nom : "") + '</p><button type="button" class="lien" data-annuler="' + r.id + '">Annuler ce rendez-vous</button></li>';
    }).join("") : '<li class="rien">Aucun rendez-vous pour l\'instant sur cet appareil.</li>';
  }
  function mesOuvrir() {
    retour = document.activeElement;
    rendreMes();
    tiroir.hidden = false; voile.hidden = false;
    document.body.classList.add("panneau-ouvert");
    requestAnimationFrame(function () { tiroir.classList.add("ouvert"); voile.classList.add("ouvert"); });
    $(".fermer", tiroir).focus();
  }
  function mesFermer() {
    tiroir.classList.remove("ouvert"); voile.classList.remove("ouvert");
    document.body.classList.remove("panneau-ouvert");
    setTimeout(function () { tiroir.hidden = true; voile.hidden = true; }, calme ? 0 : 450);
    if (retour) retour.focus();
  }
  $("#mes-ouvrir").addEventListener("click", mesOuvrir);
  voile.addEventListener("click", mesFermer);
  $("[data-fermer]", tiroir).addEventListener("click", mesFermer);
  $("#mes-liste").addEventListener("click", function (e) {
    var b = e.target.closest("[data-annuler]"); if (!b) return;
    L.ecrireRdv(L.lireRdv().filter(function (r) { return r.id !== b.dataset.annuler; }));
    rendreMes(); majCompte(); toutRendre();
    var f = $("[data-annuler]", tiroir); (f || $(".fermer", tiroir)).focus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!tiroir.hidden) mesFermer();
      else if (!menu.hidden) { menuOuvrir(false); burger.focus(); }
    }
    if (e.key === "Tab" && !tiroir.hidden) {
      var f = $$("button, a[href]", tiroir), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  majCompte();
})();
