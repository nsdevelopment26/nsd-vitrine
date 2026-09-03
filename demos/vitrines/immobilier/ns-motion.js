/* ============================================================
   NS MOTION KIT — moteur d'animations
   NS Development · aucune dépendance, à charger avec "defer"
   <script src="ns-motion.js" defer></script>
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------
     1. SPLIT TEXT — découpe le texte en mots / lettres
        <h1 data-split> ou <h1 data-split="chars">
     -------------------------------------------------------- */
  function splitText() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      if (el.dataset.nsSplitDone) return;
      var mode = el.getAttribute("data-split") || "words";
      var text = el.textContent.trim();
      var parts = mode === "chars" ? text.split("") : text.split(" ");
      var cls = mode === "chars" ? "ns-char" : "ns-word";
      el.textContent = "";
      el.classList.add("ns-split");
      parts.forEach(function (p, i) {
        var span = document.createElement("span");
        span.className = cls;
        // en mode lettres, l'espace doit être insécable :
        // un span inline-block ne conserve pas une espace simple
        if (mode === "chars" && p === " ") span.innerHTML = "&nbsp;";
        else span.textContent = p;
        span.style.transitionDelay = i * (mode === "chars" ? 25 : 60) + "ms";
        el.appendChild(span);
        if (mode !== "chars") el.appendChild(document.createTextNode(" "));
      });
      el.dataset.nsSplitDone = "1";
    });
  }

  /* --------------------------------------------------------
     2. REVEAL + STAGGER + SPLIT + COMPTEURS
        déclenchés quand l'élément entre dans l'écran
     -------------------------------------------------------- */
  var io = null, ro = null;

  function observeAll() {
    var targets = document.querySelectorAll("[data-reveal],[data-stagger],[data-split],[data-count]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("ns-in"); });
      return;
    }
    if (io) { targets.forEach(observe); return; }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;

        // délai personnalisé : data-delay="200"
        var delay = parseInt(el.getAttribute("data-delay") || 0, 10);
        setTimeout(function () { el.classList.add("ns-in"); }, delay);

        // cascade des enfants : data-stagger="80"
        if (el.hasAttribute("data-stagger")) {
          var step = parseInt(el.getAttribute("data-stagger") || 60, 10);
          Array.prototype.forEach.call(el.children, function (child, i) {
            child.style.transitionDelay = delay + i * step + "ms";
          });
        }

        // compteur animé : <span data-count="120" data-suffix="+">
        if (el.hasAttribute("data-count")) countUp(el);

        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });

    /* Un conteneur rempli par un script (module de réservation, galerie…) a une
       hauteur de 0 au moment où on l'observe. Le seuil de 0,14 ne peut alors
       jamais être franchi et l'élément reste invisible pour toujours.
       On le resurveille dès qu'il prend de la hauteur. */
    ro = ("ResizeObserver" in window) ? new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target.getBoundingClientRect().height < 1) return;
        ro.unobserve(e.target);
        io.unobserve(e.target);
        io.observe(e.target);
      });
    }) : null;

    targets.forEach(observe);
  }

  /* Surveille un élément, ou le resurveille après coup.
     Indispensable quand un script remplace un nœud animé par un clone :
     l'observateur suivait l'ancien nœud, le nouveau resterait invisible.
     Utilisation : NSMotion.observe(nouvelElement). */
  function observe(el) {
    if (!el) return;
    if (!io) { el.classList.add("ns-in"); return; }
    io.unobserve(el);
    io.observe(el);
    if (ro && el.getBoundingClientRect().height < 1) ro.observe(el);
  }

  /* --------------------------------------------------------
     3. COMPTEUR ANIMÉ
        <span data-count="250" data-suffix="+" data-decimal="1">
        data-nogroup : pas d'espace des milliers (années, numéros)
     -------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimal") || 0, 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    // Une année ne prend pas d'espace des milliers : « depuis 1837 », pas
    // « depuis 1 837 ». Même chose pour un numéro ou un code.
    var groupe = !el.hasAttribute("data-nogroup");
    if (isNaN(target)) return;
    // Mise en forme identique à celle de l'animation : sans ça, un visiteur qui
    // réduit les animations lisait « 24900 € » là où les autres voient « 24 900 € ».
    function format(v) {
      var n = Math.round(v);
      return prefix
        + (dec ? (v / Math.pow(10, dec)).toFixed(dec) : (groupe ? n.toLocaleString("fr") : String(n)))
        + suffix;
    }
    if (REDUCED) { el.textContent = format(target); return; }
    var dur = parseInt(el.getAttribute("data-duration") || 1500, 10);
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = target * eased;
      el.textContent = format(v);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* --------------------------------------------------------
     4. PARALLAX au scroll
        <div data-parallax="0.25">  (0.1 = discret, 0.4 = marqué)
     -------------------------------------------------------- */
  function parallax() {
    var items = document.querySelectorAll("[data-parallax]");
    if (!items.length || REDUCED) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.2;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* --------------------------------------------------------
     5. BOUTONS MAGNÉTIQUES — attirés par le curseur
        <a data-magnetic data-strength="0.35">
     -------------------------------------------------------- */
  function magnetic() {
    if (REDUCED || matchMedia("(hover:none)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var s = parseFloat(el.getAttribute("data-strength")) || 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * s + "px," + y * s + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* --------------------------------------------------------
     6. CARTES 3D (tilt)
        <div data-tilt data-tilt-max="10">
     -------------------------------------------------------- */
  function tilt() {
    if (REDUCED || matchMedia("(hover:none)").matches) return;
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var max = parseFloat(el.getAttribute("data-tilt-max")) || 8;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* --------------------------------------------------------
     7. BARRE DE PROGRESSION DE LECTURE
        <div class="ns-progress"></div>
     -------------------------------------------------------- */
  function progress() {
    var bar = document.querySelector(".ns-progress");
    if (!bar) return;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
    }
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* --------------------------------------------------------
     8. MARQUEE — duplique le contenu pour une boucle sans couture
     -------------------------------------------------------- */
  function marquee() {
    document.querySelectorAll(".ns-marquee__track").forEach(function (track) {
      if (track.dataset.nsCloned) return;
      track.innerHTML = track.innerHTML + track.innerHTML;
      track.dataset.nsCloned = "1";
    });
  }

  /* --------------------------------------------------------
     9. TRANSITION ENTRE PAGES (fondu sortant)
        <body data-page-transition>
     -------------------------------------------------------- */
  function pageTransition() {
    var body = document.querySelector("[data-page-transition]");
    if (!body || REDUCED) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank" ||
          href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
      if (a.hostname && a.hostname !== location.hostname) return;
      e.preventDefault();
      body.classList.add("ns-leaving");
      setTimeout(function () { location.href = href; }, 320);
    });
  }

  /* --------------------------------------------------------
     10. NAV qui devient opaque au scroll
         <nav data-nav-solid> → reçoit la classe .ns-solid après 40px
     -------------------------------------------------------- */
  function navSolid() {
    var nav = document.querySelector("[data-nav-solid]");
    if (!nav) return;
    function update() { nav.classList.toggle("ns-solid", scrollY > 40); }
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* --------------------------------------------------------
     Démarrage
     -------------------------------------------------------- */
  function init() {
    splitText();
    observeAll();
    parallax();
    magnetic();
    tilt();
    progress();
    marquee();
    pageTransition();
    navSolid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // exposé si besoin de relancer après un ajout dynamique de contenu
  window.NSMotion = { refresh: init, observe: observe };
})();
