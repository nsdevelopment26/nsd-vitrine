/* Sauvane : tout ce qui n'est pas la 3D.
   Ouverture, navigation, composeur (panneau + événement vers la 3D), boutique filtrée,
   occasions et demande de rendez-vous, panier et commande (retrait ou livraison), horaires. */
(function () {
  "use strict";
  var S = window.SAUVANE;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var sansAccent = function (t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var euro = S.euro;

  /* ------------------------------------------------------------ ouverture */
  var intro = $("#intro"), minuteurs = [];
  function finIntro(vite) {
    if (!html.classList.contains("en-intro") || intro.classList.contains("ouvre")) return;
    minuteurs.forEach(clearTimeout);
    intro.classList.add("ouvre");
    S.introFinie = true;
    document.dispatchEvent(new CustomEvent("sauvane:intro-fin"));
    setTimeout(function () { html.classList.remove("en-intro"); }, vite ? 700 : 1200);
    try { sessionStorage.setItem("sauvane-intro", "1"); } catch (e) {}
  }
  if (html.classList.contains("en-intro")) {
    minuteurs.push(setTimeout(function () { finIntro(false); }, 3000));
    $("#intro-passer").addEventListener("click", function () { finIntro(true); });
    addEventListener("wheel", function () { finIntro(true); }, { once: true, passive: true });
    addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === " " || e.key === "Enter") finIntro(true); });
    addEventListener("touchmove", function () { finIntro(true); }, { once: true, passive: true });
  } else {
    S.introFinie = true;
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
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuOuvrir(false); burger.focus(); } });

  var liens = $$(".nav-liens a");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      liens.forEach(function (a) { a.classList.toggle("actif", a.getAttribute("href") === "#" + e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["atelier", "boutique", "occasions", "acces"].forEach(function (id) { io.observe(document.getElementById(id)); });

  /* ------------------------------------------------------------ apparitions + parallaxe */
  var vus = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); vus.unobserve(e.target); } });
  }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
  function observer(r) { $$("[data-apparition]", r).forEach(function (el) { if (!el.classList.contains("vu")) vus.observe(el); }); }
  observer();

  var para = $$("[data-parallaxe] img");
  function parallaxe() {
    if (calme) return;
    para.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var t = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = "translate3d(0," + (t * -7).toFixed(2) + "%,0) scale(1.14)";
    });
  }
  var attente = false;
  addEventListener("scroll", function () { if (!attente) { attente = true; requestAnimationFrame(function () { attente = false; parallaxe(); }); } }, { passive: true });
  parallaxe();

  /* ------------------------------------------------------------ toast */
  var toast = $("#toast"), toastT;
  function dire(t) {
    toast.textContent = t; toast.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("on"); }, 2600);
  }

  /* ------------------------------------------------------------ le composeur */
  var etat = S.etat;
  function nTiges() { var n = 0; for (var k in etat.tiges) n += etat.tiges[k] || 0; return n; }
  function prixCompo(t, papier) {
    var s = S.NOUAGE + S.papier(papier).prix;
    for (var k in t) { var d = S.tige(k); if (d) s += d.prix * (t[k] || 0); }
    return s;
  }
  var ulTiges = $("#tiges");
  ulTiges.innerHTML = S.tiges.map(function (t) {
    return '<li class="tige" data-tige="' + t.id + '">' +
      '<i class="tige-pastille" style="--c:' + t.teinte + '"></i>' +
      '<span class="tige-nom">' + t.nom + '<small>' + t.detail + " · " + euro(t.prix) + "</small></span>" +
      '<span class="pas">' +
        '<button type="button" data-moins aria-label="Retirer une ' + t.nom.toLowerCase() + '">−</button>' +
        '<output aria-live="polite" id="n-' + t.id + '">0</output>' +
        '<button type="button" data-plus aria-label="Ajouter une ' + t.nom.toLowerCase() + '">+</button>' +
      "</span></li>";
  }).join("");
  $("#papiers").innerHTML = S.papiers.map(function (p) {
    return '<label class="papier"><input type="radio" name="papier" value="' + p.id + '"' + (p.id === etat.papier ? " checked" : "") + '>' +
      '<i style="--c:' + (p.couleur || "transparent") + '"></i><span>' + p.nom + (p.prix ? " <small>+" + euro(p.prix) + "</small>" : "") + "</span></label>";
  }).join("");
  $("#compos").innerHTML = S.compositions.map(function (c) {
    return '<button type="button" class="compo" data-compo="' + c.id + '" aria-pressed="false">' + c.nom + "</button>";
  }).join("") + '<button type="button" class="compo compo-surprise" data-compo="surprise">Au choix du fleuriste</button>';

  var aide = $("#c-aide");
  function majCompo(source) {
    var n = nTiges();
    S.tiges.forEach(function (t) {
      var v = etat.tiges[t.id] || 0, li = $('[data-tige="' + t.id + '"]', ulTiges);
      $("output", li).textContent = v;
      $("[data-moins]", li).disabled = v <= 0;
      $("[data-plus]", li).disabled = v >= t.max || n >= S.MAX_TIGES;
      li.classList.toggle("choisie", v > 0);
    });
    $("#c-n").textContent = n + (n > 1 ? " tiges" : " tige");
    $("#c-prix").textContent = euro(prixCompo(etat.tiges, etat.papier));
    $("#c-ajouter").disabled = n < S.MIN_TIGES;
    aide.textContent = n < S.MIN_TIGES ? "Encore " + (S.MIN_TIGES - n) + " tige" + (S.MIN_TIGES - n > 1 ? "s" : "") + " pour un bouquet qui tient debout."
      : n >= S.MAX_TIGES ? "C'est une belle brassée : " + S.MAX_TIGES + " tiges au maximum en ligne, au-delà on en parle au téléphone." : "";
    if (source !== "compo") $$(".compo").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    document.dispatchEvent(new CustomEvent("sauvane:bouquet", { detail: { tiges: etat.tiges, papier: etat.papier } }));
  }
  ulTiges.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var id = b.closest(".tige").dataset.tige, d = S.tige(id);
    var v = etat.tiges[id] || 0;
    if (b.hasAttribute("data-plus") && v < d.max && nTiges() < S.MAX_TIGES) v++;
    if (b.hasAttribute("data-moins") && v > 0) v--;
    etat.tiges[id] = v;
    majCompo();
  });
  $("#papiers").addEventListener("change", function (e) { etat.papier = e.target.value; majCompo(); });
  $("#compos").addEventListener("click", function (e) {
    var b = e.target.closest(".compo"); if (!b) return;
    var c;
    if (b.dataset.compo === "surprise") {
      /* le fleuriste choisit : trois ou quatre variétés, entre 12 et 18 tiges */
      var ids = S.tiges.map(function (t) { return t.id; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3 + (Math.random() < 0.5 ? 1 : 0));
      if (ids.indexOf("eucalyptus") < 0) ids[ids.length - 1] = "eucalyptus";
      var t = {}, reste = 12 + Math.floor(Math.random() * 7);
      ids.forEach(function (id, i) { var q = i === ids.length - 1 ? reste : Math.max(2, Math.round(reste / (ids.length - i) + (Math.random() - 0.5) * 3)); q = Math.min(q, S.tige(id).max); t[id] = q; reste -= q; });
      c = { tiges: t, papier: Math.random() < 0.5 ? "perle" : "mure" };
    } else {
      c = S.compositions.filter(function (x) { return x.id === b.dataset.compo; })[0];
    }
    etat.tiges = {}; for (var k in c.tiges) etat.tiges[k] = c.tiges[k];
    etat.papier = c.papier;
    $$('input[name="papier"]').forEach(function (i) { i.checked = i.value === etat.papier; });
    $$(".compo").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    majCompo("compo");
  });
  $("#c-ajouter").addEventListener("click", function () {
    if (nTiges() < S.MIN_TIGES) return;
    var t = {}; for (var k in etat.tiges) if (etat.tiges[k]) t[k] = etat.tiges[k];
    ajouter({ type: "compo", tiges: t, papier: etat.papier, prix: prixCompo(t, etat.papier) });
    dire("Votre bouquet est dans le panier.");
  });
  /* l'indice disparaît au premier geste sur le bouquet */
  $("#atelier").addEventListener("sauvane:tourne", function () { $("#indice").classList.add("fini"); }, { once: true });
  majCompo();

  /* ------------------------------------------------------------ la boutique du jour */
  var filtre = { cat: "", q: "", budget: "" };
  var grille = $("#produits");
  function prixMin(p) { return Math.min.apply(null, p.tailles.map(function (t) { return t.p; })); }
  function carte(p) {
    var tailles = p.tailles.length > 1
      ? '<label class="taille"><span class="sr">Taille</span><select data-taille>' + p.tailles.map(function (t, i) { return '<option value="' + i + '">' + t.n + " · " + euro(t.p) + "</option>"; }).join("") + "</select></label>"
      : '<p class="taille-unique">' + euro(p.tailles[0].p) + "</p>";
    return '<article class="produit" data-apparition data-id="' + p.id + '">' +
      '<div class="produit-img"><img src="photos/' + p.img + '-560.webp" srcset="photos/' + p.img + '-560.webp 560w, photos/' + p.img + '.webp 1000w" sizes="(max-width: 620px) 92vw, (max-width: 1100px) 46vw, 24vw" width="1000" height="1250" alt="' + esc(p.nom + " : " + p.desc) + '" loading="lazy"></div>' +
      '<p class="produit-cat">' + p.cat + "</p>" +
      "<h3>" + p.nom + "</h3>" +
      '<p class="produit-desc">' + p.desc + "</p>" +
      '<div class="produit-pied">' + tailles + '<button type="button" class="btn btn-petit" data-ajout>Ajouter</button></div>' +
      "</article>";
  }
  function filtrer() {
    var q = sansAccent(filtre.q.trim());
    var liste = S.produits.filter(function (p) {
      if (filtre.cat && p.cat !== filtre.cat) return false;
      if (q && sansAccent(p.nom + " " + p.desc + " " + p.cat).indexOf(q) < 0) return false;
      var m = prixMin(p);
      if (filtre.budget === "-40" && m >= 40) return false;
      if (filtre.budget === "40-60" && (m < 40 || m > 60)) return false;
      if (filtre.budget === "60+" && m <= 60) return false;
      return true;
    });
    grille.innerHTML = liste.length ? liste.map(carte).join("")
      : '<div class="vide"><p>Rien ne correspond aujourd’hui.</p><button type="button" class="lien" id="tout-voir">Tout afficher</button></div>';
    $("#compte").textContent = liste.length + (liste.length > 1 ? " pièces" : " pièce") + " sur " + S.produits.length;
    observer(grille);
    var tv = $("#tout-voir");
    if (tv) tv.addEventListener("click", function () {
      filtre = { cat: "", q: "", budget: "" }; $("#cherche").value = ""; $("#f-budget").value = "";
      $$(".onglet").forEach(function (o) { o.setAttribute("aria-selected", o.dataset.cat === "" ? "true" : "false"); });
      filtrer();
    });
  }
  $$(".onglet").forEach(function (o) {
    o.addEventListener("click", function () {
      filtre.cat = o.dataset.cat;
      $$(".onglet").forEach(function (x) { x.setAttribute("aria-selected", x === o ? "true" : "false"); });
      filtrer();
    });
  });
  $("#cherche").addEventListener("input", function (e) { filtre.q = e.target.value; filtrer(); });
  $("#f-budget").addEventListener("change", function (e) { filtre.budget = e.target.value; filtrer(); });
  grille.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ajout]"); if (!b) return;
    var art = b.closest(".produit"), p = S.produit(art.dataset.id);
    var sel = $("[data-taille]", art), i = sel ? +sel.value : 0;
    ajouter({ type: "produit", id: p.id, taille: i, prix: p.tailles[i].p });
    dire(p.nom + " ajouté au panier.");
  });
  filtrer();

  /* ------------------------------------------------------------ les jours qui comptent */
  var occ = "mariage";
  $("#occ-onglets").innerHTML = S.occasions.map(function (o, i) {
    return '<button type="button" role="tab" id="occ-' + o.id + '" data-occ="' + o.id + '" aria-selected="' + (i ? "false" : "true") + '" aria-controls="occ-panneau">' + o.nom + "</button>";
  }).join("");
  function majOcc() {
    var o = S.occasions.filter(function (x) { return x.id === occ; })[0];
    var p = $("#occ-panneau");
    p.setAttribute("aria-labelledby", "occ-" + o.id);
    p.classList.remove("change"); void p.offsetWidth; p.classList.add("change");
    var img = $("#occ-img");
    img.src = "photos/" + o.img + "-720.webp";
    img.alt = { mariage: "Longue table de mariage : guirlande d'anémones, de renoncules et de pivoines, bougies blanches", deuil: "Couronne de deuil en anémones, roses et renoncules blanches avec de l'eucalyptus", entreprise: "Grande composition de fleurs sur une console en chêne dans un hall d'accueil" }[o.id];
    $("#occ-titre").textContent = o.titre;
    $("#occ-desc").textContent = o.texte;
    $("#occ-inclus").innerHTML = o.inclus.map(function (t) { return "<li>" + t + "</li>"; }).join("");
    $("#d-occasion").value = o.id;
    $("#d-date").previousElementSibling.textContent = o.id === "entreprise" ? "À partir du" : o.id === "deuil" ? "Date de la cérémonie" : "Date du mariage";
    $$("#occ-onglets button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.occ === occ ? "true" : "false"); b.tabIndex = b.dataset.occ === occ ? 0 : -1; });
  }
  $("#occ-onglets").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { occ = b.dataset.occ; majOcc(); } });
  $("#occ-onglets").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var ids = S.occasions.map(function (o) { return o.id; }), i = ids.indexOf(occ);
    occ = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]; majOcc(); $("#occ-" + occ).focus();
  });
  var auj = new Date(); auj.setHours(0, 0, 0, 0);
  var iso = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  $("#d-date").min = iso(auj);
  $("#demande").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#d-erreur"), date = $("#d-date"), nom = $("#d-nom"), contact = $("#d-contact");
    [date, nom, contact].forEach(function (c) { c.removeAttribute("aria-invalid"); });
    var manque = null;
    if (!date.value || date.value < date.min) manque = [date, "Indiquez une date à venir."];
    else if (nom.value.trim().length < 2) manque = [nom, "Indiquez votre nom."];
    else if (!/@.+\./.test(contact.value) && contact.value.replace(/\D/g, "").length < 8) manque = [contact, "Laissez un téléphone ou une adresse e-mail pour qu'on vous rappelle."];
    if (manque) { err.textContent = manque[1]; manque[0].setAttribute("aria-invalid", "true"); manque[0].focus(); return; }
    err.textContent = "";
    var d = new Date(date.value + "T12:00");
    var demandes = S.lire("sauvane-demandes", []);
    demandes.push({ occasion: occ, date: date.value, budget: $("#d-budget").value, nom: nom.value.trim(), contact: contact.value.trim(), message: $("#d-message").value.trim(), le: Date.now() });
    S.ecrire("sauvane-demandes", demandes);
    var ok = $("#d-ok");
    ok.textContent = "C'est noté, " + nom.value.trim() + ". On vous rappelle sous 48 h pour fixer un rendez-vous à l'atelier (" +
      S.occasions.filter(function (o) { return o.id === occ; })[0].nom.toLowerCase() + ", " + d.toLocaleDateString("fr-LU", { day: "numeric", month: "long", year: "numeric" }) + "). Démonstration : rien n'a été envoyé.";
    ok.hidden = false; ok.focus();
    $("#demande").reset(); $("#d-occasion").value = occ;
  });
  majOcc();

  /* ------------------------------------------------------------ horaires */
  function ouvertMaintenant() {
    var d = new Date(), h = S.horaires[d.getDay()], m = d.getHours() * 60 + d.getMinutes();
    if (!h) return { txt: "Fermé aujourd'hui", det: prochaine(d) };
    if (m < h[0]) return { txt: "Ouvre à " + S.heure(h[0]), det: "aujourd'hui, jusqu'à " + S.heure(h[1]) };
    if (m >= h[1]) return { txt: "Fermé pour aujourd'hui", det: prochaine(d) };
    return { txt: "Ouvert", det: "jusqu'à " + S.heure(h[1]) };
  }
  function prochaine(d) {
    for (var i = 1; i < 8; i++) { var j = (d.getDay() + i) % 7; if (S.horaires[j]) return "réouverture " + (i === 1 ? "demain" : S.JOURS[j].toLowerCase()) + " à " + S.heure(S.horaires[j][0]); }
    return "";
  }
  var o = ouvertMaintenant();
  $("#auj").textContent = o.txt; $("#auj-detail").textContent = o.det;
  var ordre = [2, 3, 4, 5, 6, 0, 1], jourAuj = new Date().getDay();
  $("#horaires tbody").innerHTML = ordre.map(function (j) {
    var h = S.horaires[j];
    return "<tr" + (j === jourAuj ? ' class="auj"' : "") + "><th scope=\"row\">" + S.JOURS[j] + "</th><td>" + (h ? S.heure(h[0]) + " – " + S.heure(h[1]) : "Fermé") + "</td></tr>";
  }).join("");

  /* ------------------------------------------------------------ panier */
  var panier = S.lire("sauvane-panier", []);
  function sauver() { S.ecrire("sauvane-panier", panier); }
  function cle(l) { return l.type === "produit" ? l.id + ":" + l.taille : "compo:" + JSON.stringify(l.tiges) + l.papier; }
  function ajouter(l) {
    var k = cle(l), ex = panier.filter(function (x) { return cle(x) === k; })[0];
    if (ex) ex.qte++; else { l.qte = 1; panier.push(l); }
    sauver(); majPanier();
    var n = $("#panier-n"); n.classList.remove("saute"); void n.offsetWidth; n.classList.add("saute");
  }
  function libelle(l) {
    if (l.type === "produit") { var p = S.produit(l.id); return { nom: p.nom, det: p.tailles.length > 1 ? p.tailles[l.taille].n : p.cat, img: p.img }; }
    var parts = []; for (var k in l.tiges) var nm = S.tige(k).nom.toLowerCase(); parts.push(l.tiges[k] + " " + nm + (l.tiges[k] > 1 && !/s$/.test(nm) ? "s" : ""));
    return { nom: "Votre composition", det: parts.join(", ") + " · " + S.papier(l.papier).nom.toLowerCase(), img: null, tiges: l.tiges };
  }
  function sousTotal() { return panier.reduce(function (s, l) { return s + l.prix * l.qte; }, 0); }
  function nArticles() { return panier.reduce(function (s, l) { return s + l.qte; }, 0); }
  function modeLiv() { return $('input[name="mode"]:checked').value === "livraison"; }
  function majPanier() {
    $("#panier-n").textContent = nArticles();
    var ul = $("#lignes");
    if (!panier.length) {
      ul.innerHTML = '<li class="lignes-vide">Votre panier est vide. <a href="#atelier" data-fermer>Composer un bouquet</a> ou <a href="#boutique" data-fermer>voir la boutique du jour</a>.</li>';
    } else {
      ul.innerHTML = panier.map(function (l, i) {
        var b = libelle(l), vis;
        if (b.img) vis = '<img src="photos/' + b.img + '-560.webp" alt="" width="64" height="80">';
        else {
          vis = '<span class="ligne-compo" aria-hidden="true">';
          for (var k in b.tiges) vis += '<i style="--c:' + S.tige(k).teinte + ";flex:" + b.tiges[k] + '"></i>';
          vis += "</span>";
        }
        return '<li class="ligne">' + vis + '<div class="ligne-txt"><p class="ligne-nom">' + b.nom + '</p><p class="ligne-det">' + esc(b.det) + '</p>' +
          '<span class="pas pas-petit"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Retirer un exemplaire de ' + esc(b.nom) + '">−</button><output>' + l.qte + '</output><button type="button" data-i="' + i + '" data-d="1" aria-label="Ajouter un exemplaire de ' + esc(b.nom) + '">+</button></span></div>' +
          '<p class="ligne-prix">' + euro(l.prix * l.qte) + "</p></li>";
      }).join("");
    }
    $("#commande").hidden = !panier.length;
    var liv = modeLiv(), st = sousTotal(), frais = liv ? (st >= 80 ? 0 : S.LIVRAISON) : 0;
    $("#frais").textContent = st >= 80 ? "offerte" : "+" + euro(S.LIVRAISON);
    $("#k-sous").textContent = euro(st);
    $("#k-liv-l").hidden = !liv; $("#k-liv").textContent = frais ? euro(frais) : "Offerte";
    $("#k-total").textContent = euro(st + frais);
  }
  $("#lignes").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-i]"); if (!b) return;
    var l = panier[+b.dataset.i]; l.qte += +b.dataset.d;
    if (l.qte <= 0) panier.splice(+b.dataset.i, 1);
    sauver(); majPanier();
    var f = $("#lignes button[data-i]"); if (f) f.focus(); else $("#panier .fermer").focus();
  });

  /* créneaux : retrait 2 h après la commande, aux heures d'ouverture ; livraison dès le lendemain, matin ou après-midi */
  function jours() {
    var liv = modeLiv(), r = [], d = new Date();
    for (var i = 0; i < 9 && r.length < 6; i++) {
      var j = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      var h = S.horaires[j.getDay()];
      if (liv) { if (i === 0 || j.getDay() === 0 || !h) continue; }
      else { if (!h || creneaux(j).length === 0) continue; }
      r.push(j);
    }
    return r;
  }
  function creneaux(j) {
    if (modeLiv()) return [["matin", "Le matin, 9 h – 12 h"], ["aprem", "L'après-midi, 14 h – 18 h"]];
    var h = S.horaires[j.getDay()]; if (!h) return [];
    var maint = new Date(), debut = h[0] + 30;
    if (j.toDateString() === maint.toDateString()) debut = Math.max(debut, Math.ceil((maint.getHours() * 60 + maint.getMinutes() + S.DELAI_RETRAIT) / 30) * 30);
    var r = []; for (var m = debut; m <= h[1] - 15; m += 30) r.push([String(m), S.heure(m)]);
    return r;
  }
  function nomJour(j, i) {
    var auj = new Date(), dem = new Date(); dem.setDate(auj.getDate() + 1);
    if (j.toDateString() === auj.toDateString()) return "Aujourd'hui";
    if (j.toDateString() === dem.toDateString()) return "Demain";
    return j.toLocaleDateString("fr-LU", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, function (c) { return c.toUpperCase(); });
  }
  var listeJours = [];
  function majJours() {
    listeJours = jours();
    $("#k-jour").innerHTML = listeJours.map(function (j, i) { return '<option value="' + i + '">' + nomJour(j) + "</option>"; }).join("");
    majHeures();
  }
  function majHeures() {
    var j = listeJours[+$("#k-jour").value || 0];
    $("#k-heure").innerHTML = (j ? creneaux(j) : []).map(function (c) { return '<option value="' + c[0] + '">' + c[1] + "</option>"; }).join("");
  }
  $("#k-jour").addEventListener("change", majHeures);
  $$('input[name="mode"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var liv = modeLiv();
      $("#k-adresse-champ").hidden = !liv;
      $("#k-heure-l").textContent = liv ? "Moment de livraison" : "Heure de retrait";
      majJours(); majPanier();
    });
  });

  $("#commande").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#k-erreur"), prenom = $("#k-prenom"), tel = $("#k-tel"), adr = $("#k-adresse");
    [prenom, tel, adr].forEach(function (c) { c.removeAttribute("aria-invalid"); });
    var liv = modeLiv(), manque = null;
    if (!panier.length) manque = [null, "Votre panier est vide."];
    else if (liv && adr.value.trim().length < 6) manque = [adr, "Indiquez l'adresse de livraison."];
    else if (prenom.value.trim().length < 2) manque = [prenom, "Indiquez votre prénom."];
    else if (tel.value.replace(/\D/g, "").length < 8) manque = [tel, "Indiquez un numéro de téléphone complet, pour vous prévenir quand c'est prêt."];
    else if (!$("#k-heure").value) manque = [$("#k-jour"), "Choisissez un autre jour : plus de créneau disponible celui-ci."];
    if (manque) { err.textContent = manque[1]; if (manque[0]) { manque[0].setAttribute("aria-invalid", "true"); manque[0].focus(); } return; }
    err.textContent = "";
    var j = listeJours[+$("#k-jour").value], st = sousTotal(), frais = liv ? (st >= 80 ? 0 : S.LIVRAISON) : 0;
    var num = "SV-" + String(Date.now()).slice(-6);
    var quand = nomJour(j).toLowerCase() + ", " + $("#k-heure").selectedOptions[0].textContent.toLowerCase();
    var cmd = { num: num, lignes: panier, mode: liv ? "livraison" : "retrait", jour: iso(j), heure: $("#k-heure").value, adresse: liv ? adr.value.trim() : "", carte: $("#k-carte").value.trim(), prenom: prenom.value.trim(), tel: tel.value.trim(), total: st + frais, le: Date.now() };
    var cmds = S.lire("sauvane-commandes", []); cmds.push(cmd); S.ecrire("sauvane-commandes", cmds);
    $("#m-prenom").textContent = cmd.prenom;
    $("#m-detail").textContent = (liv ? "Livraison " + quand + ", " + cmd.adresse : "À retirer à l'atelier " + quand.replace(/^(aujourd'hui|demain), /, "$1 à ").replace("à à", "à")) +
      ". Total " + euro(cmd.total) + ", réglé sur place. " + (cmd.carte ? "Votre mot sera écrit à la main sur la carte. " : "") + "Démonstration : rien n'a été envoyé ni payé.";
    $("#m-num").textContent = num;
    panier = []; sauver(); majPanier();
    $("#commande").reset(); $("#k-adresse-champ").hidden = true; $("#k-heure-l").textContent = "Heure de retrait"; majJours();
    $("#panier-contenu").hidden = true; $("#merci").hidden = false; $("#merci").focus();
  });

  /* tiroir : focus piégé, Échap, voile */
  var tiroir = $("#panier"), voile = $("#voile"), retour = null;
  function ouvrir() {
    retour = document.activeElement;
    $("#panier-contenu").hidden = false; $("#merci").hidden = true;
    majJours(); majPanier();
    tiroir.hidden = false; voile.hidden = false;
    document.body.style.overflow = "hidden"; document.body.classList.add("panneau-ouvert");
    requestAnimationFrame(function () { tiroir.classList.add("ouvert"); voile.classList.add("ouvert"); });
    $(".fermer", tiroir).focus();
  }
  function fermer() {
    tiroir.classList.remove("ouvert"); voile.classList.remove("ouvert");
    document.body.style.overflow = ""; document.body.classList.remove("panneau-ouvert");
    setTimeout(function () { tiroir.hidden = true; voile.hidden = true; }, calme ? 0 : 380);
    if (retour && retour.focus) retour.focus();
  }
  $("#panier-ouvrir").addEventListener("click", ouvrir);
  voile.addEventListener("click", fermer);
  tiroir.addEventListener("click", function (e) { if (e.target.closest("[data-fermer]")) fermer(); });
  tiroir.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { fermer(); return; }
    if (e.key !== "Tab") return;
    var f = $$("button, a, input, select, textarea", tiroir).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  majPanier();
})();
