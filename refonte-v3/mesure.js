/* ============================================================
   NS Development · mesure d'audience sans cookie (NSD Pilotage)
   ------------------------------------------------------------
   À poser en bas de page :
   <script src="mesure.js" data-cle="CLE_DU_SITE" data-domaine="nsdevelopment.lu" data-api="URL_COLLECTE" defer></script>

   Ce que fait ce script, et rien d'autre :
   - signale la page vue, les clics (boutons, liens, téléphone,
     e-mail, réseaux, téléchargements), les formulaires commencés,
     envoyés ou abandonnés (JAMAIS leur contenu), la profondeur de
     défilement, les sections vues et le temps passé ;
   - ne dépose rien sur l'appareil (ni cookie, ni stockage) et
     n'envoie ni l'adresse de la page avec ses paramètres, ni rien
     qui identifie la personne. Le serveur ne garde pas l'IP.
   - Désactivé pour l'équipe (même réglage que suivi.js), pour un
     visiteur qui s'y oppose (bouton de la page Confidentialité, ou
     Global Privacy Control), et hors du domaine data-domaine.
   Nouvel événement sans toucher à ce fichier : ajouter
   data-suivi="nom" sur un élément (data-suivi="rdv" = prise de RDV).
   ============================================================ */
(function () {
  "use strict";
  try {
    var script = document.currentScript;
    var CLE = script && script.getAttribute("data-cle");
    var API = script && script.getAttribute("data-api");
    var DOMAINE = script && script.getAttribute("data-domaine");
    if (!CLE || !API) return;
    // Seulement sur le vrai domaine : ni la copie GitHub Pages, ni un essai en local.
    if (DOMAINE) {
      var h = location.hostname.replace(/^www\./, "");
      if (h !== DOMAINE && h.slice(-(DOMAINE.length + 1)) !== "." + DOMAINE) return;
    }
    try {
      // nsd_mesure_refus : posé par le visiteur lui-même (bouton de la page
      // Confidentialité) ; nsd_equipe / crmnsd_pin : téléphones de l'équipe.
      if (localStorage.getItem("nsd_mesure_refus") || localStorage.getItem("nsd_equipe") || localStorage.getItem("crmnsd_pin")) return;
    } catch (e) { /* stockage bloqué : on mesure quand même, sans rien écrire */ }
    if (navigator.globalPrivacyControl === true) return;
    if (navigator.webdriver) return;

    var hasard = function () {
      var s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
      return s.replace(/[^a-z0-9]/g, "").slice(0, 16);
    };
    var VUE = hasard();
    var CHEMIN = location.pathname;
    var q = new URLSearchParams(location.search);
    var debut = Date.now(), visible = document.hidden ? 0 : Date.now(), cumul = 0;
    var file = [], minuteur = 0, maxDefil = 0, paliers = {}, formulaires = {}, fini = false;

    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

    function entete() {
      return {
        k: CLE,
        r: document.referrer || "",
        us: q.get("utm_source") || "", um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "",
        tz: tz
      };
    }

    function envoyer(urgent) {
      if (!file.length) return;
      var corps = entete();
      corps.e = file.splice(0, 40);
      var texte = JSON.stringify(corps);
      try {
        if (urgent && navigator.sendBeacon && navigator.sendBeacon(API, new Blob([texte], { type: "text/plain" }))) return;
        fetch(API, { method: "POST", body: texte, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" } })
          .catch(function () {});
      } catch (e) {}
      if (file.length) envoyer(urgent);
    }

    function signal(type, extra) {
      var e = { t: type, v: VUE, p: CHEMIN, w: window.innerWidth, lg: (navigator.language || "").slice(0, 12) };
      if (extra) for (var k in extra) if (extra[k] != null && extra[k] !== "") e[k] = extra[k];
      file.push(e);
      if (type === "page" || type === "sortie") { envoyer(type === "sortie"); return; }
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { envoyer(false); }, 1500);
    }

    function dureeVisible() {
      return cumul + (visible ? Date.now() - visible : 0);
    }

    // ---- page vue ----
    signal("page", { ti: (document.title || "").slice(0, 140) });

    // ---- clics ----
    var RESEAUX = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|youtube\.com|youtu\.be|wa\.me|whatsapp\.com|x\.com|twitter\.com)$/i;
    var FICHIERS = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|png|jpe?g|mp4|mov|vcf|ics)$/i;

    function selecteur(el) {
      var s = el.tagName.toLowerCase();
      if (el.id) return s + "#" + el.id;
      var c = (el.getAttribute("class") || "").trim().split(/\s+/).slice(0, 2).join(".");
      return c ? s + "." + c : s;
    }
    function libelle(el) {
      var t = el.getAttribute("aria-label") || el.innerText || el.value || el.title || el.getAttribute("alt") || "";
      return t.replace(/\s+/g, " ").trim().slice(0, 80);
    }

    document.addEventListener("click", function (ev) {
      var el = ev.target && ev.target.closest && ev.target.closest("[data-suivi], a[href], button, [role=button], input[type=submit], input[type=button], summary");
      if (!el) return;
      var href = el.getAttribute("href") || "";
      var nom = el.getAttribute("data-suivi");
      var type = "clic", cible = null;
      if (nom === "rdv") type = "rdv";
      else if (nom) type = "perso";
      if (/^tel:/i.test(href)) { type = "tel"; cible = href; }
      else if (/^mailto:/i.test(href)) { type = "mail"; cible = href; }
      else if (href && !/^(#|javascript:)/i.test(href)) {
        try {
          var u = new URL(href, location.href);
          cible = u.href;
          if (RESEAUX.test(u.hostname)) type = type === "clic" ? "social" : type;
          else if (FICHIERS.test(u.pathname) || el.hasAttribute("download")) type = type === "clic" ? "telechargement" : type;
          else if (u.hostname !== location.hostname && type === "clic") type = "lien_sortant";
        } catch (e) {}
      }
      var doc = document.documentElement;
      var largeurPage = Math.max(doc.scrollWidth, window.innerWidth) || 1;
      signal(type, {
        n: nom || null, el: selecteur(el), l: libelle(el), c: cible,
        x: Math.round((ev.pageX / largeurPage) * 10000) / 100, y: Math.round(ev.pageY)
      });
      if (type !== "clic" && type !== "perso" && type !== "rdv") envoyer(true);
    }, true);

    // ---- formulaires (jamais le contenu) ----
    function nomFormulaire(f) {
      return (f.getAttribute("data-suivi") || f.getAttribute("name") || f.id || "formulaire").slice(0, 80);
    }
    document.addEventListener("focusin", function (ev) {
      var f = ev.target && ev.target.form;
      if (!f) return;
      var n = nomFormulaire(f);
      if (formulaires[n]) return;
      formulaires[n] = "commence";
      signal("formulaire_debut", { n: n });
    }, true);
    document.addEventListener("submit", function (ev) {
      var f = ev.target;
      if (!f || f.tagName !== "FORM") return;
      var n = nomFormulaire(f);
      formulaires[n] = "envoye";
      signal("formulaire_envoi", { n: n });
      envoyer(true);
    }, true);

    // ---- défilement : max atteint, envoyé par paliers de 25 % ----
    function defil() {
      var doc = document.documentElement;
      var haut = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var vu = window.scrollY + window.innerHeight;
      var pct = haut > 0 ? Math.min(100, Math.round((vu / haut) * 100)) : 100;
      if (pct > maxDefil) maxDefil = pct;
      [25, 50, 75, 100].forEach(function (p) {
        if (maxDefil >= (p === 100 ? 95 : p) && !paliers[p]) { paliers[p] = 1; signal("defilement", { d: p === 100 ? 100 : p }); }
      });
    }
    var attente = 0;
    window.addEventListener("scroll", function () {
      if (attente) return;
      attente = setTimeout(function () { attente = 0; defil(); }, 250);
    }, { passive: true });
    setTimeout(defil, 1200);

    // ---- sections vues (section[id] ou [data-section]) ----
    if ("IntersectionObserver" in window) {
      var vues = {};
      var obs = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (en) {
          if (!en.isIntersecting) return;
          var n = en.target.getAttribute("data-section") || en.target.id;
          if (!n || vues[n]) return;
          vues[n] = 1;
          signal("section", { n: n.slice(0, 80) });
          obs.unobserve(en.target);
        });
      }, { threshold: 0.5 });
      var lancer = function () {
        document.querySelectorAll("section[id], [data-section]").forEach(function (s) { obs.observe(s); });
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lancer); else lancer();
    }

    // ---- présence (direct) : un signal par minute tant que la page est affichée, 30 min au plus ----
    var presences = 0;
    var presence = setInterval(function () {
      if (document.hidden) return;
      if (++presences > 30) { clearInterval(presence); return; }
      signal("actif");
      envoyer(false);
    }, 60000);

    // ---- sortie ----
    function sortie() {
      if (fini) return;
      fini = true;
      for (var n in formulaires) if (formulaires[n] === "commence") signal("formulaire_abandon", { n: n });
      signal("sortie", { ms: Math.min(dureeVisible(), 86400000), d: maxDefil });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (visible) { cumul += Date.now() - visible; visible = 0; } envoyer(true); }
      else { visible = Date.now(); }
    });
    window.addEventListener("pagehide", sortie);
    void debut;
  } catch (e) { /* la mesure ne doit jamais casser la page */ }
})();
