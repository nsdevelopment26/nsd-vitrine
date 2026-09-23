/* Ashcombe Lorant — Édition de nuit
   Carte de localisation en pointillé (canvas 2D, aucune librairie) synchronisée avec les dépêches,
   heure réelle des quatre places, date de l'édition, coupon-réponse. */
(function () {
  "use strict";

  var RAD = Math.PI / 180;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(document.documentElement);
  var INK = css.getPropertyValue("--encre").trim() || "#1b1714";
  var RED = css.getPropertyValue("--sang").trim() || "#8e2a2a";

  /* ---------- Heure des places et date de l'édition ---------- */
  function tick() {
    var now = new Date();
    document.querySelectorAll("time[data-tz]").forEach(function (t) {
      t.textContent = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: t.dataset.tz }).format(now);
    });
    // L'édition affichée est la dernière bouclée à 23 h 40, heure de Luxembourg.
    // Son numéro est le jour de l'année, l'article de une est daté de la veille.
    var lux = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Luxembourg" }));
    var ed = new Date(lux.getFullYear(), lux.getMonth(), lux.getDate());
    if (lux.getHours() * 60 + lux.getMinutes() < 23 * 60 + 40) ed.setDate(ed.getDate() - 1);
    var eve = new Date(ed); eve.setDate(ed.getDate() - 1);
    var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    set("today", new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(ed));
    set("issue", String(Math.round((ed - new Date(ed.getFullYear(), 0, 0)) / 864e5)));
    set("story-date", new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(eve));
  }
  tick(); setInterval(tick, 15000);

  /* ---------- Dossiers ---------- */
  var HOME = [49.61, 6.13];
  var CASES = [
    { city: "Singapour", ref: "AL-2025-014", at: [1.35, 103.82] },
    { city: "Londres", ref: "AL-2025-008", at: [51.5, -0.12] },
    { city: "Genève", ref: "AL-2025-003", at: [46.2, 6.14] },
    { city: "São Paulo", ref: "AL-2024-017", at: [-23.55, -46.63] },
    { city: "New York", ref: "AL-2024-031", at: [40.71, -74.0] },
    { city: "Dubaï", ref: "AL-2023-022", at: [25.2, 55.27] }
  ];
  // Autres places où le cabinet a travaillé : simples repères.
  var PINS = [[22.3, 114.2], [35.68, 139.7], [-26.2, 28.0], [43.65, -79.4], [50.1, 8.68], [19.07, 72.88], [-33.87, 151.2], [37.77, -122.4], [-34.6, -58.4], [52.37, 4.9]];

  // Arc de grand cercle, rendu en latitude/longitude
  function route(a, b) {
    function v(p) { var la = p[0] * RAD, lo = p[1] * RAD; return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]; }
    var A = v(a), B = v(b), dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
    var om = Math.acos(Math.max(-1, Math.min(1, dot))), s = Math.sin(om) || 1, pts = [];
    for (var k = 0; k <= 80; k++) {
      var t = k / 80, fa = Math.sin((1 - t) * om) / s, fb = Math.sin(t * om) / s;
      var x = A[0] * fa + B[0] * fb, y = A[1] * fa + B[1] * fb, z = A[2] * fa + B[2] * fb;
      pts.push([Math.atan2(z, Math.hypot(x, y)) / RAD, Math.atan2(y, x) / RAD]);
    }
    return pts;
  }
  CASES.forEach(function (c) { c.route = route(HOME, c.at); });

  /* ---------- Carte ---------- */
  var canvas = document.getElementById("map");
  var ctx = canvas && canvas.getContext("2d");
  var base = document.createElement("canvas"), bctx = base.getContext("2d");
  var W = 0, H = 0, dpr = 1, active = 0, t0 = 0, drawing = false, visible = true;
  var LAT_N = 78, LAT_S = -58;

  function X(lon) { return (lon + 180) / 360 * W; }
  function Y(lat) { return (LAT_N - lat) / (LAT_N - LAT_S) * H; }

  function paintBase() {
    base.width = canvas.width; base.height = canvas.height;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // terres en trame d'encre pleine, comme une carte de localisation imprimée
    var land = window.LAND || [], step = W / 240, r = Math.max(0.6, step * 0.4);
    bctx.fillStyle = INK;
    for (var i = 0; i < land.length; i += 2) {
      bctx.beginPath(); bctx.arc(X(land[i + 1] / 10), Y(land[i] / 10), r, 0, 6.283); bctx.fill();
    }
    // repères secondaires
    bctx.fillStyle = INK;
    PINS.forEach(function (p) { bctx.beginPath(); bctx.arc(X(p[1]), Y(p[0]), Math.max(1.6, step * 0.55), 0, 6.283); bctx.fill(); });
  }

  function size() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    paintBase(); draw(1);
  }

  function path(pts, upto) {
    ctx.beginPath();
    for (var k = 0; k <= upto; k++) {
      var p = pts[k], x = X(p[1]), y = Y(p[0]);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function label(text, x, y, color, right) {
    ctx.font = "700 " + Math.max(11, Math.min(13, W / 60)) + "px 'Libre Franklin', Helvetica, sans-serif";
    ctx.textAlign = right ? "right" : "left";
    var w = ctx.measureText(text).width, pad = 4, lx = right ? x - 9 : x + 9;
    ctx.fillStyle = "rgba(243,220,203,.92)";
    ctx.fillRect(right ? lx - w - pad : lx - pad, y - 16, w + pad * 2, 18);
    ctx.fillStyle = color; ctx.fillText(text, lx, y - 3);
  }

  function draw(p) {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0, W, H);
    ctx.lineCap = "round";
    // routes au repos : tirets d'encre
    ctx.setLineDash([2, 4]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(27,23,20,.45)";
    CASES.forEach(function (c, i) { if (i !== active) path(c.route, c.route.length - 1); });
    ctx.setLineDash([]);
    // route active : trait plein, tracé progressivement
    var c = CASES[active], n = c.route.length - 1, upto = Math.max(1, Math.round(n * p));
    ctx.strokeStyle = RED; ctx.lineWidth = 2; path(c.route, upto);
    // destinations
    CASES.forEach(function (d, i) {
      var x = X(d.at[1]), y = Y(d.at[0]);
      ctx.fillStyle = i === active ? RED : INK;
      ctx.beginPath(); ctx.arc(x, y, i === active ? 4.5 : 3, 0, 6.283); ctx.fill();
    });
    // Luxembourg : un carré, le point de départ
    var hx = X(HOME[1]), hy = Y(HOME[0]);
    ctx.fillStyle = INK; ctx.fillRect(hx - 4, hy - 4, 8, 8);
    ctx.fillStyle = "#f3dccb"; ctx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
    if (["Londres", "Genève"].indexOf(c.city) < 0) label("Luxembourg", hx, hy - 6, INK, true);
    if (p >= 1) {
      var ax = X(c.at[1]), ay = Y(c.at[0]);
      label(c.city, ax, ay, RED, c.at[1] < -20 || c.city === "Londres");
    }
  }

  var now = document.getElementById("map-now");
  var deps = document.querySelectorAll(".dep");
  function show(i, animate) {
    active = i;
    now.textContent = CASES[i].city + " · " + CASES[i].ref;
    deps.forEach(function (d) { d.classList.toggle("on", +d.dataset.case === i); });
    if (animate && !reduce) { t0 = performance.now(); if (!drawing) { drawing = true; requestAnimationFrame(frame); } }
    else draw(1);
  }
  function frame(t) {
    var p = Math.min(1, (t - t0) / 1400);
    draw(1 - Math.pow(1 - p, 3));
    if (p < 1) requestAnimationFrame(frame); else drawing = false;
  }

  if (canvas) {
    size();
    new ResizeObserver(size).observe(canvas);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
    if (document.fonts) document.fonts.ready.then(function () { draw(drawing ? 0 : 1); });

    // Le tour des dossiers : une nouvelle dépêche toutes les six secondes, suspendu si le lecteur choisit
    var hold = 0;
    deps.forEach(function (d) {
      function pick() { hold = performance.now(); show(+d.dataset.case, true); }
      d.addEventListener("mouseenter", pick); d.addEventListener("focus", pick); d.addEventListener("click", pick);
    });
    show(0, true);
    if (!reduce) setInterval(function () {
      if (!visible || document.hidden || performance.now() - hold < 12000) return;
      show((active + 1) % CASES.length, true);
    }, 6000);
  }

  /* ---------- Coupon-réponse : repli mailto en attendant un vrai service ---------- */
  var form = document.getElementById("form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var note = document.getElementById("form-note");
    if (!form.checkValidity()) {
      note.textContent = "Il manque votre nom, votre email ou quelques lignes sur le dossier.";
      note.classList.add("err"); form.reportValidity(); return;
    }
    note.classList.remove("err");
    // Aperçu privé (lien Claude) : la messagerie ne peut pas s'ouvrir depuis ce cadre.
    if (/claude\.ai|claudeusercontent/.test(location.hostname)) {
      note.textContent = "Coupon bien rempli. Sur le vrai site, il part directement au cabinet.";
      return;
    }
    var d = new FormData(form);
    var body = "Nom : " + d.get("nom") + "\nSociété : " + d.get("societe") + "\nEmail : " + d.get("email") +
      "\nTéléphone : " + d.get("tel") + "\nLieu du dossier : " + d.get("lieu") + "\n\n" + d.get("msg");
    window.location.href = "mailto:contact@exemple.lu?subject=" + encodeURIComponent("Coupon-réponse, " + d.get("nom")) + "&body=" + encodeURIComponent(body);
    note.textContent = "Votre messagerie s'ouvre avec le coupon prêt à partir.";
  });
})();
