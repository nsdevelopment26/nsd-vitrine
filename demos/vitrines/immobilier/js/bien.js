/* HORIZON : fiche d'un bien (bien.html?ref=…), mode classique.
   Tout vient de data/biens.js ; le mode immersif renvoie vers la 3D. */
(function () {
  "use strict";
  var HZ = window.HZ, $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var q = new URLSearchParams(location.search), ref = q.get("ref"), b = ref && HZ.trouver(ref);
  var fiche = $("#fiche");
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  if (!b) {
    fiche.innerHTML = '<section class="cadre introuvable"><h1>Ce bien n\'est plus en ligne.</h1><p>Il a peut-être été vendu, ou la référence est incomplète.</p><a class="btn" href="index.html#biens">Voir tous les biens <span class="fl" aria-hidden="true">→</span></a></section>';
    return;
  }

  document.title = b.nom + " · " + b.loc + " — HORIZON Immobilier";
  var lot = b.source === "lumen" ? HZ.LOTS.filter(function (l) { return l.id === b.lot; })[0] : null;
  var plan = b.plan ? HZ.PLANS[b.plan] : null;
  var immersif = b.source === "lumen" ? "index.html?lot=" + b.lot + "#immeuble" : b.source === "maison" ? "index.html?maison=" + b.ref + "#maisons" : null;
  var prix = HZ.euros(b.prix) + (b.t === "location" ? " <small>/ mois</small>" : "");
  var i0 = Math.min(+q.get("photo") || 0, b.photos.length - 1);

  var carac = [["Surface habitable", b.m2 + " m²"]];
  if (b.terrain) carac.push(["Terrain", (b.terrain / 100) + " ares"]);
  if (b.ch) carac.push(["Chambres", b.ch]);
  if (b.sdb) carac.push(["Salles de bain", b.sdb]);
  if (lot) { carac.push(["Étage", lot.etage === 6 ? "6e, dernier étage" : lot.etage + (lot.etage === 1 ? "er" : "e")]); carac.push([lot.extNom, lot.ext + " m²"]); carac.push(["Orientation", lot.orient]); }
  carac.push(["Type", b.type]); carac.push(["Référence", b.ref]);

  var similaires = HZ.CATALOGUE.filter(function (x) { return x !== b && x.t === b.t && (x.type === b.type || x.loc === b.loc); }).slice(0, 3);
  if (similaires.length < 3) similaires = similaires.concat(HZ.CATALOGUE.filter(function (x) { return x !== b && x.t === b.t && similaires.indexOf(x) < 0; }).slice(0, 3 - similaires.length));

  fiche.innerHTML =
    '<nav class="cadre fil" aria-label="Fil d\'Ariane"><a href="index.html">Accueil</a><i>/</i><a href="index.html#biens">Nos biens</a><i>/</i><span>' + esc(b.ref) + "</span></nav>" +
    '<section class="f-hero">' +
      '<figure class="f-photo"><img id="f-img" src="' + b.photos[i0] + '" alt="' + esc(b.nom + ", " + b.loc) + '" fetchpriority="high"></figure>' +
      '<div class="cadre f-titre">' +
        '<div><p class="mono f-sur">' + (b.t === "vente" ? "À vendre" : "À louer") + " · " + esc(b.loc) + (b.source === "lumen" ? " · Résidence Lumen" : "") + "</p>" +
        "<h1>" + esc(b.nom) + "</h1>" +
        '<p class="f-prix">' + prix + "</p></div>" +
        (immersif ? '<div class="f-modes" role="group" aria-label="Mode de consultation"><span aria-current="true">Mode classique</span><a href="' + immersif + '">Mode immersif 3D <span aria-hidden="true">→</span></a></div>' : "") +
      "</div>" +
    "</section>" +
    (b.photos.length > 1 ? '<div class="cadre f-galerie" role="group" aria-label="Galerie">' + b.photos.map(function (p, i) {
      return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === i0) + '" aria-label="Photo ' + (i + 1) + " sur " + b.photos.length + '"><img src="' + p + '" alt="" loading="lazy"></button>';
    }).join("") + "</div>" : "") +
    '<div class="cadre f-corps">' +
      '<div class="f-gauche">' +
        '<section aria-labelledby="t-carac"><h2 id="t-carac">Caractéristiques</h2><dl class="f-carac">' + carac.map(function (c) { return "<div><dt>" + c[0] + "</dt><dd>" + esc(c[1]) + "</dd></div>"; }).join("") + "</dl></section>" +
        '<section aria-labelledby="t-desc"><h2 id="t-desc">Description</h2><p class="f-desc">' + esc(b.desc) + "</p></section>" +
        '<section aria-labelledby="t-eq"><h2 id="t-eq">Équipements</h2><ul class="f-equip">' + (b.equipements || []).map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul></section>" +
        '<section aria-labelledby="t-plan"><h2 id="t-plan">Plan</h2>' + (plan
          ? '<div class="f-plan">' + HZ.svgPlan(b.plan, { miroir: b.miroir, echelle: 36 }) + "</div>"
          : '<p class="f-vide">Le plan de ce bien est disponible sur demande, envoyé avec le dossier complet.</p>') + "</section>" +
        (plan ? '<section aria-labelledby="t-pieces"><h2 id="t-pieces">Les pièces</h2><ul class="f-pieces">' + plan.pieces.map(function (p) {
          return "<li><span>" + esc(p.n) + "</span><span class=\"mono\">" + (Math.round(p.w * p.d * 10) / 10).toString().replace(".", ",") + " m²</span></li>";
        }).join("") + '<li class="ext"><span>' + plan.exterieur.nom + '</span><span class="mono">' + Math.round(plan.exterieur.w * plan.exterieur.d) + " m²</span></li></ul></section>" : "") +
        '<p class="f-note mono">Bien fictif, présenté pour la démonstration : aucune disponibilité réelle.</p>' +
      "</div>" +
      '<aside class="f-droite" id="visite">' +
        '<form class="f-form sombre" id="form-visite" novalidate aria-label="Demander une visite">' +
          "<h2>Demander une visite</h2>" +
          '<p class="f-form-sous">' + esc(b.nom) + " · réf. " + esc(b.ref) + "</p>" +
          '<div class="rangee"><div class="champ"><label for="v-date">Date souhaitée</label><input id="v-date" name="date" type="date" required><p class="err" role="alert"></p></div>' +
          '<div class="champ"><label for="v-creneau">Créneau</label><select id="v-creneau" name="creneau"><option>Matin</option><option selected>Après-midi</option><option>Fin de journée</option></select></div></div>' +
          '<div class="champ"><label for="v-nom">Nom</label><input id="v-nom" name="nom" required autocomplete="name"><p class="err" role="alert"></p></div>' +
          '<div class="rangee"><div class="champ"><label for="v-tel">Téléphone</label><input id="v-tel" name="tel" type="tel" required autocomplete="tel"><p class="err" role="alert"></p></div>' +
          '<div class="champ"><label for="v-mail">E-mail</label><input id="v-mail" name="email" type="email" required autocomplete="email"><p class="err" role="alert"></p></div></div>' +
          '<div class="champ"><label for="v-msg">Message</label><textarea id="v-msg" name="message" placeholder="Facultatif"></textarea></div>' +
          '<label class="consent"><input type="checkbox" name="rgpd" required> J\'accepte d\'être recontacté pour organiser cette visite.</label><p class="err" data-err="rgpd" role="alert"></p>' +
          '<button type="submit" class="btn clair">Envoyer la demande <span class="fl" aria-hidden="true">→</span></button>' +
          '<div class="merci" role="status" tabindex="-1"><svg class="coche" viewBox="0 0 56 56" aria-hidden="true"><path d="M3 28a25 25 0 1 0 50 0a25 25 0 1 0-50 0M17 29l8 8 15-17"/></svg><h4>Demande de visite reçue.</h4><p>Un conseiller vous appelle pour confirmer le créneau.</p><p class="demo-note">Démonstration : aucune donnée n\'est envoyée ni conservée.</p></div>' +
        "</form>" +
        '<div class="f-agence"><p class="mono">Votre conseiller</p><p><a href="' + HZ.TEL_HREF + '">' + HZ.TEL + '</a><br><a href="mailto:' + HZ.MAIL + '">' + HZ.MAIL + "</a></p></div>" +
      "</aside>" +
    "</div>" +
    '<section class="cadre f-sim" aria-labelledby="t-sim"><h2 id="t-sim">Dans le même esprit</h2><div class="f-sim-l">' + similaires.map(function (x) {
      return '<a class="f-sim-c" href="bien.html?ref=' + x.ref + '"><span class="ph"><img src="' + x.photos[0] + '" alt="" loading="lazy"></span><span class="mono">Réf. ' + x.ref + " · " + esc(x.loc) + "</span><b>" + esc(x.nom) + "</b><span>" + HZ.euros(x.prix) + (x.t === "location" ? " / mois" : "") + "</span></a>";
    }).join("") + "</div></section>";

  /* galerie */
  var img = $("#f-img");
  $$(".f-galerie button").forEach(function (bt) {
    bt.addEventListener("click", function () {
      var i = +bt.dataset.i;
      img.classList.add("change");
      setTimeout(function () { img.src = b.photos[i]; img.onload = function () { img.classList.remove("change"); }; }, 220);
      $$(".f-galerie button").forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); });
    });
  });

  /* date minimale : demain */
  var d = new Date(); d.setDate(d.getDate() + 1);
  $("#v-date").min = d.toISOString().slice(0, 10);

  /* formulaire de visite */
  var MSG = { valueMissing: "Ce champ est nécessaire.", typeMismatch: "Adresse e-mail incomplète.", rangeUnderflow: "Choisissez une date à partir de demain." };
  var f = $("#form-visite");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var premier = null;
    $$("[required]", f).forEach(function (inp) {
      var box = inp.closest(".champ"), err = box ? $(".err", box) : $('[data-err="' + inp.name + '"]', f), msg = "";
      if (!inp.validity.valid) { for (var k in MSG) if (inp.validity[k]) { msg = MSG[k]; break; } if (inp.type === "checkbox") msg = "Merci de cocher cette case."; if (!msg) msg = "Valeur à vérifier."; }
      if (box) box.classList.toggle("ko", !!msg); if (err) err.textContent = msg;
      inp.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg && !premier) premier = inp;
    });
    if (premier) { premier.focus(); return; }
    $$(".champ, .rangee, .consent, button[type=submit], .f-form-sous", f).forEach(function (x) { x.hidden = true; });
    var m = $(".merci", f); m.classList.add("on"); m.focus();
  });
})();
