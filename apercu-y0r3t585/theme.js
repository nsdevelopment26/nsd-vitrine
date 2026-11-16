/* Thème « Pierre & Lumière », comportements communs aux deux boutiques. */
(function () {
  "use strict";
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Ombres de feuillage d'olivier, dessinées une fois en SVG. */
  function branche(seed) {
    var r = seed, rnd = function () { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    var s = '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="#3a2a1c">';
    for (var b = 0; b < 3; b++) {
      var x = -20 + b * 70 + rnd() * 30, y = -30 + rnd() * 40, ang = 35 + rnd() * 25;
      s += '<path d="M' + x + ' ' + y + ' q 90 ' + (60 + b * 20) + ' 190 ' + (150 + b * 30) + '" stroke="#3a2a1c" stroke-width="2.5" fill="none"/>';
      for (var i = 0; i < 16; i++) {
        var t = i / 16, px = x + 190 * t, py = y + (150 + b * 30) * t * t * 0.9 + 60 * t;
        var cote = i % 2 ? 1 : -1, rot = ang + cote * (40 + rnd() * 25);
        s += '<ellipse cx="' + (px + cote * 10).toFixed(1) + '" cy="' + (py - cote * 6).toFixed(1) + '" rx="' + (16 + rnd() * 9).toFixed(1) + '" ry="' + (4 + rnd() * 2).toFixed(1) + '" transform="rotate(' + rot.toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>';
      }
    }
    return s + "</g></svg>";
  }
  document.querySelectorAll(".feuillage").forEach(function (el, i) { el.innerHTML = branche(7 + i * 13); });

  /* 2. La lumière glisse sur la pierre quand on défile. */
  var rayons = Array.prototype.slice.call(document.querySelectorAll(".rayon"));
  if (rayons.length && !reduit) {
    var tic = false;
    var maj = function () {
      tic = false;
      rayons.forEach(function (r) {
        var b = r.getBoundingClientRect(), h = window.innerHeight;
        var p = Math.min(1, Math.max(0, (h - b.top) / (h + b.height)));
        r.style.setProperty("--lum", (10 + p * 90).toFixed(1) + "%");
      });
    };
    window.addEventListener("scroll", function () { if (!tic) { tic = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
  }

  /* 3. Galerie produit : miniatures + teintes. */
  document.querySelectorAll("[data-galerie]").forEach(function (g) {
    var grande = g.querySelector(".grande img");
    g.querySelectorAll(".miniatures button").forEach(function (b) {
      b.addEventListener("click", function () {
        g.querySelectorAll(".miniatures button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        grande.style.opacity = 0;
        setTimeout(function () { grande.src = b.dataset.src; grande.alt = b.dataset.alt; grande.style.opacity = 1; }, reduit ? 0 : 220);
      });
    });
  });
  document.querySelectorAll(".teintes").forEach(function (t) {
    t.querySelectorAll(".teinte").forEach(function (b) {
      b.addEventListener("click", function () {
        t.querySelectorAll(".teinte").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
      });
    });
  });

  /* 4. Collections (Mawi) : onglets qui changent la scène. */
  document.querySelectorAll("[data-collections]").forEach(function (c) {
    var onglets = c.querySelectorAll('[role="tab"]'), imgs = c.querySelectorAll(".scene img");
    var nom = c.querySelector("[data-nom]"), txt = c.querySelector("[data-desc]");
    var auto, idx = 0;
    function montre(i, manuel) {
      idx = i;
      onglets.forEach(function (o, k) { o.setAttribute("aria-selected", k === i ? "true" : "false"); o.tabIndex = k === i ? 0 : -1; });
      imgs.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      nom.textContent = onglets[i].textContent;
      txt.textContent = onglets[i].dataset.texte;
      if (manuel) clearInterval(auto);
    }
    onglets.forEach(function (o, k) {
      o.addEventListener("click", function () { montre(k, true); });
      o.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          var n = (k + (e.key === "ArrowRight" ? 1 : onglets.length - 1)) % onglets.length;
          montre(n, true); onglets[n].focus();
        }
      });
    });
    if (!reduit) auto = setInterval(function () { montre((idx + 1) % onglets.length); }, 4200);
  });

  /* 5. Panier (démo) : ajout + tiroir. */
  var tiroir = document.querySelector(".tiroir"), voile = document.querySelector(".voile");
  var pastille = document.querySelector(".pastille"), liste = document.querySelector("[data-panier]");
  var n = 0, dernierFocus = null;
  function ouvrir() {
    if (!tiroir) return;
    dernierFocus = document.activeElement;
    tiroir.classList.add("ouvert"); voile.classList.add("ouvert");
    tiroir.setAttribute("aria-hidden", "false");
    tiroir.querySelector("button").focus();
  }
  function fermer() {
    if (!tiroir) return;
    tiroir.classList.remove("ouvert"); voile.classList.remove("ouvert");
    tiroir.setAttribute("aria-hidden", "true");
    if (dernierFocus) dernierFocus.focus();
  }
  document.querySelectorAll("[data-ouvrir-panier]").forEach(function (b) { b.addEventListener("click", ouvrir); });
  document.querySelectorAll("[data-fermer-panier]").forEach(function (b) { b.addEventListener("click", fermer); });
  if (voile) voile.addEventListener("click", fermer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermer(); });
  document.querySelectorAll("[data-ajouter]").forEach(function (b) {
    b.addEventListener("click", function () {
      n++;
      pastille.textContent = n; pastille.classList.add("on");
      var teinte = document.querySelector('.teinte[aria-pressed="true"]');
      liste.innerHTML = "<p>" + n + " × " + b.dataset.ajouter + (teinte ? ", " + teinte.textContent.trim().toLowerCase() : "") + "</p><p class=\"vide\">Démonstration : sur la vraie boutique, le paiement passe par Shopify.</p>";
      ouvrir();
    });
  });

  /* 6. Formulaires d'inscription : la maquette n'envoie rien. */
  document.querySelectorAll("form[data-inscription]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      f.parentNode.querySelector(".merci").textContent = "Merci, c'est noté. (Maquette : rien n'est envoyé.)";
      f.reset();
    });
  });
})();

/* ===== Ajouts du 16/11/2026 : diaporama, filtres, 360°, film ===== */
(function () {
  "use strict";
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Diaporama du hero */
  document.querySelectorAll("[data-diapo]").forEach(function (d) {
    var imgs = d.querySelectorAll("img"), pts = d.parentNode.querySelector(".points"), i = 0, t;
    var boutons = [];
    imgs.forEach(function (im, k) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Photo " + (k + 1));
      b.addEventListener("click", function () { va(k); clearInterval(t); });
      pts.appendChild(b); boutons.push(b);
    });
    function va(k) {
      i = k;
      imgs.forEach(function (im, j) { im.classList.toggle("on", j === k); });
      boutons.forEach(function (b, j) { b.setAttribute("aria-current", j === k ? "true" : "false"); });
    }
    va(0);
    if (!reduit) t = setInterval(function () { va((i + 1) % imgs.length); }, 5000);
  });

  /* Filtres du catalogue */
  document.querySelectorAll("[data-filtre]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-filtre]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var f = b.dataset.filtre;
      document.querySelectorAll("[data-catalogue] .piece").forEach(function (p) { p.hidden = !(f === "tout" || p.dataset.type === f); });
    });
  });

  /* Visionneuse 360° : images chargées à l'approche de la section */
  document.querySelectorAll("[data-visionneuse]").forEach(function (v) {
    var n = +v.dataset.nombre, base = v.dataset.images, cv = v.querySelector("canvas"), ctx = cv.getContext("2d");
    var range = document.getElementById("angle"), auto = document.querySelector("[data-auto]");
    var imgs = [], pret = 0, idx = 0, tourne = !reduit, dernier = 0, acc = 0, glisse = null;
    function taille() {
      var r = v.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); dessine();
    }
    function dessine() {
      var im = imgs[idx]; if (!im || !im.complete || !im.naturalWidth) return;
      var cw = cv.width, ch = cv.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
      var w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.clearRect(0, 0, cw, ch); ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    function montre(k) { idx = ((k % n) + n) % n; range.value = idx; dessine(); }
    function charge() {
      for (var k = 0; k < n; k++) {
        var im = new Image(); im.decoding = "async";
        im.onload = function () { pret++; if (pret === 1) { v.querySelector(".chargement").hidden = true; dessine(); } };
        im.src = base + (k < 10 ? "0" + k : k) + ".webp"; imgs.push(im);
      }
      requestAnimationFrame(boucle);
    }
    function boucle(ts) {
      if (tourne && pret === n) { acc += (ts - (dernier || ts)); if (acc > 70) { acc = 0; montre(idx + 1); } }
      dernier = ts; requestAnimationFrame(boucle);
    }
    function stop() { tourne = false; auto.setAttribute("aria-pressed", "false"); auto.textContent = "Tourner"; v.classList.add("touche"); }
    v.addEventListener("pointerdown", function (e) { stop(); glisse = { x: e.clientX, i: idx }; v.classList.add("tient"); v.setPointerCapture(e.pointerId); });
    v.addEventListener("pointermove", function (e) { if (!glisse) return; montre(glisse.i - Math.round((e.clientX - glisse.x) / (v.clientWidth / n * 1.6))); });
    ["pointerup", "pointercancel"].forEach(function (ev) { v.addEventListener(ev, function () { glisse = null; v.classList.remove("tient"); }); });
    v.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); stop(); montre(idx + (e.key === "ArrowRight" ? -1 : 1)); }
    });
    range.addEventListener("input", function () { stop(); montre(+range.value); });
    auto.addEventListener("click", function () {
      tourne = !tourne; auto.setAttribute("aria-pressed", tourne ? "true" : "false"); auto.textContent = tourne ? "Pause" : "Tourner";
    });
    if (!tourne) { auto.setAttribute("aria-pressed", "false"); auto.textContent = "Tourner"; }
    window.addEventListener("resize", taille);
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); taille(); charge(); } }, { rootMargin: "600px" });
    io.observe(v);
  });

  /* Film d'atelier : lecture quand il est à l'écran, étapes synchronisées */
  document.querySelectorAll("[data-film]").forEach(function (f) {
    var vid = f.querySelector("video"), etapes = f.querySelectorAll(".etapes li"), barre = f.querySelector(".barre");
    if (reduit) { vid.removeAttribute("loop"); }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!reduit) vid.play().catch(function () {}); } else vid.pause();
    }, { threshold: .35 });
    io.observe(f);
    vid.addEventListener("timeupdate", function () {
      var t = vid.currentTime;
      etapes.forEach(function (li, k) {
        var debut = +li.dataset.debut, fin = etapes[k + 1] ? +etapes[k + 1].dataset.debut : 99;
        li.classList.toggle("on", t >= debut && t < fin);
      });
      if (vid.duration) barre.style.width = (100 * t / vid.duration) + "%";
    });
  });
})();
