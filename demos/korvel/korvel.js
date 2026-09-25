/* ============================================================
   KORVEL (démo fictive) — boutique, panier, studio, devis
   Maquette NS Development. Aucune dépendance.
   ============================================================ */
(function () {
  "use strict";
  var P = window.KORVEL_PRODUITS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var eur = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var byId = {}; P.forEach(function (p) { byId[p.id] = p; });
  var LANG = "fr", MAP = window.KORVEL_I18N || {}, LI = { de: 0, en: 1 };
  function t(k, fr) { if (LANG === "fr") return fr; var e = MAP[fr]; return e ? e[LI[LANG]] : fr; }
  function tt(fr) { return t(null, fr); }

  var CATS = [
    ["all", "Tout"], ["brodes", "Écussons brodés"], ["pvc", "Écussons PVC"], ["laser", "Laser cut"],
    ["pins", "Pin's"], ["keys", "Porte-clés"], ["textile", "Textile"], ["perso", "Personnalisé"]
  ];
  var CAT_LABEL = { brodes: "Écusson brodé", pvc: "Écusson PVC", laser: "Écusson laser cut", pins: "Pin's", keys: "Porte-clés", textile: "Textile", perso: "Personnalisé" };
  var COLORS = [
    ["drapeau", "Couleurs du Luxembourg", "linear-gradient(#ef3340 33%,#fff 33% 66%,#00a3e0 66%)"],
    ["noir", "Noir", "#16181a"], ["gris", "Gris", "#9aa3a8"], ["bleu", "Bleu", "#1e4fa3"], ["rouge", "Rouge", "#c8102e"],
    ["marron", "Marron", "#7a5634"], ["vert", "Vert et camo", "#4d5d33"], ["rose", "Rose", "#e84c9a"],
    ["phospho", "Phosphorescent", "#d7f24a"],
    ["jaune", "Jaune", "#f5cf00"], ["orange", "Orange", "#f07a14"]
  ];
  // Sélection de l'atelier : les pièces fortes d'abord
  var FEATURED = ["b01", "l01", "x01", "t03", "b08", "n02", "v01", "l06", "k01", "b03", "t01"];

  /* ---------------- toast ---------------- */
  var toastT;
  function toast(msg) {
    var t = $("[data-toast]"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------------- panier (localStorage protégé) ---------------- */
  var KEY = "korvel-demo-panier";
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} renderCart(); }
  function lineKey(id, opt) { return id + (opt ? "|" + opt : ""); }
  function addToCart(id, qty, opt) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var k = lineKey(id, opt);
    var l = cart.filter(function (x) { return x.k === k; })[0];
    if (l) l.q += qty; else cart.push({ k: k, id: id, q: qty, opt: opt || "" });
    save();
    var c = $("[data-cart-count]"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
    toast(tt("Ajouté au panier :") + " " + tt(byId[id].n) + (qty > 1 ? " × " + qty : ""));
  }
  function subtotal() { return cart.reduce(function (s, l) { return s + byId[l.id].p * l.q; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.q; }, 0); }

  function renderCart() {
    var n = count();
    $("[data-cart-count]").textContent = n;
    $("[data-cart-n]").textContent = n ? "(" + n + ")" : "";
    var ul = $("[data-lines]"); ul.innerHTML = "";
    cart.forEach(function (l) {
      var p = byId[l.id]; if (!p) return;
      var li = document.createElement("li"); li.className = "line";
      li.innerHTML = '<img src="' + p.img + '" alt="">' +
        '<div><p class="line-n"></p><div class="qty"><button type="button" aria-label="Moins">−</button><input type="number" min="1" max="999" aria-label="Quantité"><button type="button" aria-label="Plus">+</button></div></div>' +
        '<div class="line-r"><span class="line-p">' + eur(p.p * l.q) + '</span><button type="button" class="rm">' + tt("Retirer") + '</button></div>';
      $(".line-n", li).textContent = tt(p.n) + (l.opt ? " · " + l.opt : "");
      var inp = $("input", li); inp.value = l.q;
      var bs = $$(".qty button", li);
      bs[0].onclick = function () { if (l.q > 1) { l.q--; save(); } };
      bs[1].onclick = function () { l.q++; save(); };
      inp.onchange = function () { l.q = Math.max(1, parseInt(inp.value, 10) || 1); save(); };
      $(".rm", li).onclick = function () { cart = cart.filter(function (x) { return x !== l; }); save(); };
      ul.appendChild(li);
    });
    $("[data-cart-empty]").hidden = n > 0;
    $("[data-cart-foot]").hidden = n === 0;
    $("[data-subtotal]").textContent = eur(subtotal());
    $("[data-total]").textContent = eur(subtotal());
  }

  var drawer = $("[data-drawer]");
  var lastFocus;
  function view(name) { $$(".p-view", drawer).forEach(function (v) { v.classList.toggle("on", v.dataset.view === name); }); }
  function openCart() { lastFocus = document.activeElement; view("cart"); drawer.hidden = false; document.body.style.overflow = "hidden"; $(".x", drawer).focus(); }
  function closeCart() { drawer.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  $$("[data-open-cart]").forEach(function (b) { b.onclick = openCart; });
  drawer.addEventListener("click", function (e) { if (e.target.closest("[data-close-cart]")) closeCart(); });
  $("[data-go-checkout]").onclick = function () { view("checkout"); };
  $("[data-back-cart]").onclick = function () { view("cart"); };

  var co = $("[data-checkout]");
  co.addEventListener("input", function (e) { e.target.classList.remove("invalid"); });
  co.addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = co.nom, mail = co.email, ok = true;
    [nom, mail].forEach(function (f) { f.classList.remove("invalid"); });
    if (!nom.value.trim()) { nom.classList.add("invalid"); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim())) { mail.classList.add("invalid"); ok = false; }
    $("[data-co-err]").hidden = ok;
    if (!ok) return;
    var info = { mail: mail.value.trim(), pay: co.paiement.value, ship: co.livraison.value };
    if (info.pay === "Apple Pay") applePay(info.mail, function () { finishOrder(info); });
    else finishOrder(info);
  });
  function finishOrder(info) {
    var ref = "RC-" + String(Date.now()).slice(-6);
    $("[data-order-ref]").textContent = ref;
    $("[data-order-mail]").textContent = info.mail;
    var rec = $("[data-order-recap]"); rec.innerHTML = "";
    var n = count();
    var rows = [[t("r.items", "Articles"), n + " " + (n > 1 ? t("r.pcs", "pièces") : t("r.pc", "pièce"))], ["Total", eur(subtotal())],
      [t("r.ship", "Réception"), info.ship === "poste" ? t("r.post", "Envoi postal") : t("r.pick", "Retrait à l'atelier, Esch-sur-Alzette")],
      [t("r.pay", "Paiement"), info.pay]];
    rows.forEach(function (r) { var dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = r[0]; dd.textContent = r[1]; rec.appendChild(dt); rec.appendChild(dd); });
    cart = []; save(); co.reset();
    view("done");
    if (drawer.hidden) openCart(), view("done");
  }

  /* ---------------- Apple Pay (simulation fidèle au parcours iPhone) ---------------- */
  var ap = $("[data-ap]"), apCb = null, apTimer;
  function applePay(contact, cb) {
    apCb = cb;
    $("[data-ap-total]").textContent = eur(subtotal());
    $("[data-ap-contact]").textContent = contact || t("ap.contactv", "Fourni par Apple Pay");
    $("[data-ap-face]").hidden = true; $("[data-ap-confirm]").hidden = false;
    $("[data-ap-face]").classList.remove("done", "scan");
    ap.hidden = false;
    requestAnimationFrame(function () { ap.classList.add("open"); });
    $("[data-ap-confirm]").focus();
  }
  function apClose() { ap.classList.remove("open"); clearTimeout(apTimer); setTimeout(function () { ap.hidden = true; }, 350); }
  $$("[data-ap-cancel]").forEach(function (b) { b.onclick = apClose; });
  $("[data-ap-confirm]").onclick = function () {
    var face = $("[data-ap-face]"), st = $("[data-ap-state]");
    this.hidden = true; face.hidden = false; face.classList.add("scan"); st.textContent = "Face ID";
    apTimer = setTimeout(function () {
      face.classList.remove("scan"); face.classList.add("done"); st.textContent = t("ap.done", "Terminé");
      apTimer = setTimeout(function () { apClose(); if (apCb) apCb(); }, 900);
    }, 1400);
  };
  $("[data-apay-express]").onclick = function () {
    if (!count()) return;
    applePay(null, function () { finishOrder({ mail: t("ap.mail", "l'adresse de votre compte Apple"), pay: "Apple Pay", ship: "retrait" }); });
  };

  /* ---------------- boutique ---------------- */
  var state = { cat: "all", colors: [], q: "", sort: "pop" };
  var grid = $("[data-grid]");

  var catsEl = $("[data-cats]");
  CATS.forEach(function (c) {
    var n = c[0] === "all" ? P.length : P.filter(function (p) { return p.c === c[0]; }).length;
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.setAttribute("role", "tab"); b.dataset.cat = c[0];
    b.innerHTML = "<span></span> <small>" + n + "</small>"; b.firstChild.textContent = tt(c[1]); b.dataset.label = c[1];
    b.setAttribute("aria-selected", c[0] === "all");
    b.onclick = function () { state.cat = c[0]; render(); };
    catsEl.appendChild(b);
  });
  var colEl = $("[data-colors]");
  COLORS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "sw"; b.style.background = c[2];
    b.title = tt(c[1]); b.setAttribute("aria-label", tt(c[1])); b.setAttribute("aria-pressed", "false"); b.dataset.label = c[1];
    b.onclick = function () {
      var i = state.colors.indexOf(c[0]);
      if (i > -1) state.colors.splice(i, 1); else state.colors.push(c[0]);
      render();
    };
    b.dataset.col = c[0];
    colEl.appendChild(b);
  });

  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var ALIASES = { "noir": "black", "gris": "grey", "bleu": "blue", "rouge": "red", "vert": "green", "rose": "pink", "marron": "maron", "phosphorescent": "glow", "ecusson": "badge", "t-shirt": "t-shirt", "sweat": "hoodie" };
  function matches(p) {
    if (state.cat !== "all" && p.c !== state.cat) return false;
    if (state.colors.length && !state.colors.some(function (c) { return p.col.indexOf(c) > -1; })) return false;
    if (state.q) {
      var hay = norm(p.n + " " + tt(p.n) + " " + (CAT_LABEL[p.c] || "") + " " + tt(CAT_LABEL[p.c] || "") + " " + p.col.join(" ") + " " + p.d + " " + tt(p.d));
      return norm(state.q).split(/\s+/).every(function (w) { return hay.indexOf(w) > -1 || (ALIASES[w] && hay.indexOf(ALIASES[w]) > -1); });
    }
    return true;
  }
  function sorted(list) {
    var l = list.slice();
    if (state.sort === "asc") l.sort(function (a, b) { return a.p - b.p || a.n.localeCompare(b.n); });
    else if (state.sort === "desc") l.sort(function (a, b) { return b.p - a.p || a.n.localeCompare(b.n); });
    else if (state.sort === "az") l.sort(function (a, b) { return a.n.localeCompare(b.n, "fr"); });
    else l.sort(function (a, b) {
      var fa = FEATURED.indexOf(a.id), fb = FEATURED.indexOf(b.id);
      return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
    });
    return l;
  }
  function render() {
    $$(".chip", catsEl).forEach(function (b) { b.setAttribute("aria-selected", b.dataset.cat === state.cat); });
    $$(".sw", colEl).forEach(function (b) { b.setAttribute("aria-pressed", state.colors.indexOf(b.dataset.col) > -1); });
    var list = sorted(P.filter(matches));
    grid.innerHTML = "";
    list.forEach(function (p, i) {
      var a = document.createElement("article"); a.className = "card"; a.style.setProperty("--i", Math.min(i, 16));
      a.innerHTML = '<span class="card-cat">' + tt(CAT_LABEL[p.c]) + '</span>' +
        '<button type="button" class="card-img" aria-label="Voir la fiche"><img loading="lazy" src="' + p.img + '" alt="" width="640" height="640"></button>' +
        '<div class="card-body"><p class="card-name"></p><div class="card-foot"><span class="card-price">' + eur(p.p) + '</span>' +
        '<button type="button" class="add" aria-label="Ajouter au panier">+</button></div></div>';
      $(".card-name", a).textContent = tt(p.n);
      $("img", a).alt = tt(p.n);
      $(".card-img", a).setAttribute("aria-label", tt("Voir la fiche :") + " " + tt(p.n));
      $(".card-img", a).onclick = function () { openProduct(p.id); };
      var add = $(".add", a);
      add.onclick = function () {
        if (p.id === "x01") { location.hash = "#studio"; toast(tt("Le badge nominatif se compose dans le studio")); return; }
        addToCart(p.id, 1); add.classList.add("ok"); add.textContent = "✓";
        setTimeout(function () { add.classList.remove("ok"); add.textContent = "+"; }, 1200);
      };
      grid.appendChild(a);
    });
    $("[data-result-count]").textContent = list.length;
    $("[data-empty]").hidden = list.length > 0;
    var dirty = state.cat !== "all" || state.colors.length || state.q;
    $(".shop-meta [data-reset]").hidden = !dirty;
  }
  var sT;
  $("[data-search]").addEventListener("input", function (e) { clearTimeout(sT); sT = setTimeout(function () { state.q = e.target.value.trim(); render(); }, 120); });
  $("[data-sort]").onchange = function (e) { state.sort = e.target.value; render(); };
  $$("[data-reset]").forEach(function (b) { b.onclick = function () { state = { cat: "all", colors: [], q: "", sort: state.sort }; $("[data-search]").value = ""; render(); }; });

  /* ---------------- fiche produit ---------------- */
  var modal = $("[data-modal]"), cur = null, modalFocus;
  function openProduct(id) {
    var p = byId[id]; cur = p;
    if (modal.hidden) modalFocus = document.activeElement;
    $("[data-m-img]").src = p.img; $("[data-m-img]").alt = tt(p.n);
    $("[data-m-cat]").textContent = tt(CAT_LABEL[p.c]);
    $("[data-m-name]").textContent = tt(p.n);
    $("[data-m-price]").textContent = eur(p.p);
    $("[data-m-desc]").textContent = tt(p.d);
    $("[data-m-qty] input").value = 1;
    var addB = $("[data-m-add]");
    addB.textContent = tt(p.id === "x01" ? "Composer dans le studio" : "Ajouter au panier");
    var sib = $("[data-m-sib]"); sib.innerHTML = "";
    P.filter(function (x) { return x.c === p.c; }).forEach(function (x) {
      var b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-label", x.n); b.setAttribute("aria-current", x.id === p.id);
      b.innerHTML = '<img src="' + x.img + '" alt="" loading="lazy">';
      b.onclick = function () { openProduct(x.id); };
      sib.appendChild(b);
    });
    $(".m-sib-t").hidden = sib.children.length < 2; sib.hidden = sib.children.length < 2;
    modal.hidden = false; document.body.style.overflow = "hidden";
    $(".x", modal).focus();
  }
  function closeProduct() { modal.hidden = true; document.body.style.overflow = ""; if (modalFocus) modalFocus.focus(); }
  modal.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeProduct(); });
  $("[data-m-add]").onclick = function () {
    if (cur.id === "x01") { closeProduct(); location.hash = "#studio"; return; }
    addToCart(cur.id, $("[data-m-qty] input").value); closeProduct();
  };
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeProduct(); else if (!drawer.hidden) closeCart();
    else if (!menu.hidden) toggleMenu(false);
  });

  // boutons +/- génériques
  function wireQty(box, onChange) {
    var inp = $("input", box);
    $$("button", box).forEach(function (b) {
      b.onclick = function () { inp.value = Math.max(1, Math.min(+inp.max || 999, (parseInt(inp.value, 10) || 1) + (+b.dataset.q))); onChange && onChange(); };
    });
    inp.addEventListener("input", function () { onChange && onChange(); });
  }
  wireQty($("[data-m-qty]"));

  /* ---------------- hero : produit à la une ---------------- */
  var HERO = ["b01", "l01", "t03", "b08", "n02"];
  var hIdx = 0, hTimer, hStart;
  $("[data-hero-total]").textContent = String(HERO.length).padStart(2, "0");
  function heroShow(i) {
    hIdx = (i + HERO.length) % HERO.length;
    var p = byId[HERO[hIdx]], img = $("[data-hero-img]");
    img.classList.add("swap");
    setTimeout(function () {
      img.src = p.img; img.alt = tt(p.n);
      img.onload = function () { img.classList.remove("swap"); };
      $("[data-hero-cat]").textContent = tt(CAT_LABEL[p.c]);
      $("[data-hero-name]").textContent = tt(p.n);
      $("[data-hero-price]").textContent = eur(p.p);
      $("[data-hero-idx]").textContent = String(hIdx + 1).padStart(2, "0");
    }, 300);
  }
  var bar = $("[data-hero-bar]"), DUR = 4200, paused = false;
  function tick(t) {
    if (!hStart) hStart = t;
    if (paused) hStart = t - (parseFloat(bar.style.width) || 0) / 100 * DUR;
    var k = (t - hStart) / DUR;
    if (k >= 1) { hStart = t; k = 0; heroShow(hIdx + 1); }
    bar.style.width = (k * 100) + "%";
    hTimer = requestAnimationFrame(tick);
  }
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) hTimer = requestAnimationFrame(tick);
  var hc = $(".hero-card");
  hc.addEventListener("mouseenter", function () { paused = true; });
  hc.addEventListener("mouseleave", function () { paused = false; });
  $("[data-hero-open]").onclick = function () { openProduct(HERO[hIdx]); };
  $("[data-hero-add]").onclick = function () { addToCart(HERO[hIdx], 1); };

  /* ---------------- hero : repérage des plaques C, M, J, N ---------------- */
  var plates = $(".plates");
  setTimeout(function () { plates.classList.add("registered"); }, 300);
  if (!reduced && window.matchMedia("(hover:hover)").matches) {
    var hero = $(".hero");
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - .5) * 8, y = ((e.clientY - r.top) / r.height - .5) * 6;
      plates.style.setProperty("--mx", x.toFixed(1) + "px"); plates.style.setProperty("--my", y.toFixed(1) + "px");
    });
    hero.addEventListener("mouseleave", function () { plates.style.setProperty("--mx", "0px"); plates.style.setProperty("--my", "0px"); });
  }

  /* ---------------- studio : badge nominatif ---------------- */
  var st = $("[data-studio]"), stName = $("[data-st-name]"), stText = $("[data-st-text]"), stSvg = $("[data-st-svg]");
  var stQty = $("[data-st-qty]");
  function stUpdate() {
    var v = stName.value.trim() || tt("Votre nom");
    stText.textContent = v;
    $("[data-st-left]").textContent = 16 - stName.value.length;
    var fin = st.querySelector("input[name=fin]:checked").value;
    stSvg.classList.toggle("marine", fin === "marine");
    // réduit la police pour les noms longs
    stText.style.fontSize = v.length > 11 ? (56 * 11 / v.length).toFixed(0) + "px" : "";
    var q = Math.max(1, parseInt($("input", stQty).value, 10) || 1);
    $("[data-st-total]").textContent = eur(9.5 * q);
  }
  stName.addEventListener("input", stUpdate);
  $$("input[name=fin]", st).forEach(function (r) { r.onchange = stUpdate; });
  wireQty(stQty, stUpdate);
  st.addEventListener("submit", function (e) {
    e.preventDefault();
    var fin = st.querySelector("input[name=fin]:checked").value === "marine" ? "marine, liseré rouge" : "noir, liseré gris";
    addToCart("x01", $("input", stQty).value, "« " + (stName.value.trim() || "sans nom") + " », " + fin);
  });
  stUpdate();

  /* ---------------- devis en trois étapes ---------------- */
  var dv = $("[data-devis]"), stepN = 1, files = [];
  function goStep(n) {
    stepN = n;
    $$(".step", dv).forEach(function (s) { s.classList.toggle("on", +s.dataset.step === n); });
    $$("[data-steps] li").forEach(function (li, i) { li.classList.toggle("on", i + 1 === n); li.classList.toggle("ok", i + 1 < n); });
    if (n > 1) { var top = $("#devis").getBoundingClientRect().top; if (top < 0) $("#devis").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }
  }
  function valid(n) {
    var ok = true;
    if (n === 1) ok = !!dv.querySelector("input[name=besoin]:checked");
    if (n === 2) { var q = dv.quantite; ok = +q.value > 0; q.classList.toggle("invalid", !ok); }
    if (n === 3) {
      var nm = dv.nom, em = dv.email;
      var a = !!nm.value.trim(), b = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim());
      nm.classList.toggle("invalid", !a); em.classList.toggle("invalid", !b); ok = a && b;
    }
    $('[data-err="' + n + '"]', dv).hidden = ok;
    return ok;
  }
  dv.addEventListener("input", function (e) {
    if (e.target.classList.contains("invalid")) { e.target.classList.remove("invalid"); $('[data-err="' + stepN + '"]', dv).hidden = true; }
  });
  $$("[data-next]", dv).forEach(function (b) { b.onclick = function () { if (valid(stepN)) goStep(stepN + 1); }; });
  $$("[data-prev]", dv).forEach(function (b) { b.onclick = function () { goStep(stepN - 1); }; });
  $$("input[name=besoin]", dv).forEach(function (r) {
    r.onchange = function () {
      $('[data-err="1"]', dv).hidden = true;
      $("[data-tech-field]", dv).hidden = r.value.indexOf("Textile") !== 0;
    };
  });
  // fichiers : clic ou glisser-déposer
  var drop = $("[data-drop]"), fin = $("[data-files]"), fl = $("[data-file-list]");
  function listFiles() {
    fl.innerHTML = "";
    files.forEach(function (f, i) {
      var li = document.createElement("li");
      li.innerHTML = '<b></b><span>' + (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " Mo" : Math.max(1, Math.round(f.size / 1024)) + " Ko") + '</span><button type="button">Retirer</button>';
      $("b", li).textContent = f.name;
      $("button", li).onclick = function () { files.splice(i, 1); listFiles(); };
      fl.appendChild(li);
    });
  }
  fin.onchange = function () { files = files.concat(Array.prototype.slice.call(fin.files)); fin.value = ""; listFiles(); };
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { files = files.concat(Array.prototype.slice.call(e.dataTransfer.files)); listFiles(); });

  dv.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!valid(3)) return;
    var ref = "RQ-" + String(Date.now()).slice(-5);
    $("[data-devis-ref]").textContent = ref;
    $("[data-devis-mail]").textContent = dv.email.value.trim();
    var rec = $("[data-devis-recap]"); rec.innerHTML = "";
    var d = dv.date.value ? new Date(dv.date.value + "T12:00").toLocaleDateString(LANG + "-LU", { day: "numeric", month: "long", year: "numeric" }) : tt("Pas de date imposée");
    [[tt("Projet"), dv.querySelector("input[name=besoin]:checked").value], [tt("Quantité"), dv.quantite.value], [tt("Pour le"), d],
      dv.technique.value && !$("[data-tech-field]").hidden ? ["Technique", dv.technique.value] : null,
      [tt("Fichiers"), files.length ? files.map(function (f) { return f.name; }).join(", ") : tt("Aucun")],
      [tt("Contact"), dv.nom.value.trim() + (dv.societe.value.trim() ? ", " + dv.societe.value.trim() : "")]
    ].forEach(function (r) {
      if (!r) return;
      var dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = r[0]; dd.textContent = r[1];
      rec.appendChild(dt); rec.appendChild(dd);
    });
    goStep(4);
    $$("[data-steps] li").forEach(function (li) { li.classList.remove("on"); li.classList.add("ok"); });
  });
  $("[data-restart]").onclick = function () { dv.reset(); files = []; listFiles(); goStep(1); };
  var today = new Date(); today.setDate(today.getDate() + 1);
  dv.date.min = today.toISOString().slice(0, 10);


  /* ---------------- configurateur textile ---------------- */
  var cf = { type: "tshirt", face: "front", color: "#16181a", colorName: "Noir", tech: "DTF",
    logo: { front: { x: 160, y: 140, w: 80 }, back: { x: 140, y: 150, w: 120 } }, src: "assets/logo-exemple.svg", file: null };
  var CF_COLORS = [["Noir", "#16181a"], ["Blanc", "#f4f4f2"], ["Gris chiné", "#9ca3a8"], ["Marine", "#1d2a4a"], ["Rouge", "#b3152b"], ["Jaune", "#f2c500"], ["Vert kaki", "#4f5a3a"]];
  var CF_TECH = {
    DTF: ["Transfert par film : couleurs vives, dégradés, idéal en petite et moyenne série.", "Filmtransfer: kräftige Farben, Verläufe, ideal für kleine und mittlere Serien.", "Film transfer: vivid colours and gradients, ideal for small and medium runs."],
    DTG: ["Impression directe sur le tissu : toucher doux, parfait pour les photos et les visuels détaillés.", "Direktdruck auf den Stoff: weicher Griff, perfekt für Fotos und detaillierte Motive.", "Direct-to-garment: soft feel, perfect for photos and detailed artwork."],
    Broderie: ["Fil brodé : rendu premium et très durable, idéal pour les logos sur vestes et polos.", "Stickerei: hochwertige, sehr langlebige Optik, ideal für Logos auf Jacken und Polos.", "Embroidery: premium, very durable finish, ideal for logos on jackets and polos."],
    Flex: ["Vinyle découpé : net et résistant, parfait pour les noms, numéros et textes.", "Geschnittenes Vinyl: sauber und robust, perfekt für Namen, Nummern und Texte.", "Cut vinyl: crisp and hard-wearing, perfect for names, numbers and lettering."],
    Flock: ["Vinyle velouté : effet relief au toucher, très apprécié pour les tenues de sport.", "Samtiges Vinyl: fühlbarer Relief-Effekt, beliebt für Sportbekleidung.", "Velvety vinyl: raised, textured feel, popular for sportswear."]
  };
  var SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  var cfSvg = $("[data-cf-svg]"), cfLogo = $("[data-cf-logo]");
  var ZONE = { front: { x: 132, y: 118, w: 136, h: 176 }, back: { x: 122, y: 96, w: 156, h: 210 } };

  var colEl2 = $("[data-cf-colors]");
  CF_COLORS.forEach(function (c, i) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sw" + (i === 0 ? " on" : "");
    b.style.background = c[1]; b.title = tt(c[0]); b.setAttribute("aria-label", tt(c[0])); b.dataset.label = c[0]; b.setAttribute("aria-pressed", i === 0);
    b.onclick = function () {
      cf.color = c[1]; cf.colorName = c[0];
      $$(".sw", colEl2).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      cfDraw();
    };
    colEl2.appendChild(b);
  });
  var sizesEl = $("[data-cf-sizes]");
  SIZES.forEach(function (sz) {
    var l = document.createElement("label");
    l.innerHTML = "<span>" + sz + "</span><input type=\"number\" min=\"0\" max=\"999\" value=\"" + (sz === "M" ? 10 : sz === "L" ? 10 : sz === "S" ? 5 : 0) + "\" inputmode=\"numeric\">";
    $("input", l).dataset.size = sz;
    $("input", l).addEventListener("input", cfTotal);
    sizesEl.appendChild(l);
  });
  function cfQty() { var o = {}; $$("input", sizesEl).forEach(function (i) { var v = Math.max(0, parseInt(i.value, 10) || 0); if (v) o[i.dataset.size] = v; }); return o; }
  function cfTotal() { var q = cfQty(), n = 0; for (var k in q) n += q[k]; $("[data-cf-total]").textContent = n; return n; }

  function cfDraw() {
    var hoodie = cf.type === "hoodie", back = cf.face === "back";
    $$("[data-cf-fill]").forEach(function (p) { p.setAttribute("fill", cf.color); });
    $("[data-cf-hood]").style.display = hoodie ? "" : "none";
    $("[data-cf-pocket]").style.display = hoodie && !back ? "" : "none";
    $("[data-cf-collar]").setAttribute("d", back ? "M128 26 C150 40 250 40 272 26" : (hoodie ? "M138 40 C160 78 240 78 262 40" : "M128 26 C150 64 250 64 272 26"));
    var light = ["#f4f4f2", "#f2c500", "#9ca3a8"].indexOf(cf.color) > -1;
    $("[data-cf-collar]").setAttribute("stroke-opacity", light ? ".18" : ".35");
    var z = ZONE[cf.face], zr = $("[data-cf-zone]"), cr = $("[data-cf-clip]");
    [zr, cr].forEach(function (r) { r.setAttribute("x", z.x); r.setAttribute("y", z.y); r.setAttribute("width", z.w); r.setAttribute("height", z.h); });
    zr.classList.toggle("light", light);
    var L = cf.logo[cf.face];
    cfLogo.setAttribute("x", L.x); cfLogo.setAttribute("y", L.y); cfLogo.setAttribute("width", L.w); cfLogo.setAttribute("height", L.w);
    cfLogo.setAttribute("href", cf.src);
    $("[data-cf-size]").max = Math.min(z.w, z.h); $("[data-cf-size]").value = L.w;
  }
  function clampLogo() {
    var z = ZONE[cf.face], L = cf.logo[cf.face]; L.touched = true;
    L.w = Math.min(L.w, z.w, z.h);
    L.x = Math.max(z.x, Math.min(z.x + z.w - L.w, L.x)); L.y = Math.max(z.y, Math.min(z.y + z.h - L.w, L.y));
  }
  $$("[data-cf-type]").forEach(function (b) { b.onclick = function () { cf.type = b.dataset.cfType; $$("[data-cf-type]").forEach(function (x) { x.classList.toggle("on", x === b); }); cfDraw(); }; });
  $$("[data-cf-face]").forEach(function (b) { b.onclick = function () { cf.face = b.dataset.cfFace; $$("[data-cf-face]").forEach(function (x) { x.classList.toggle("on", x === b); }); cfDraw(); }; });
  $("[data-cf-size]").addEventListener("input", function (e) {
    var L = cf.logo[cf.face], c = L.x + L.w / 2, m = L.y + L.w / 2; L.w = +e.target.value; L.x = c - L.w / 2; L.y = m - L.w / 2; clampLogo(); cfDraw();
  });
  $("[data-cf-center]").onclick = function () { var z = ZONE[cf.face], L = cf.logo[cf.face]; L.x = z.x + (z.w - L.w) / 2; L.y = z.y + Math.min(24, (z.h - L.w) / 2); cfDraw(); };
  $$("[data-cf-techs] button").forEach(function (b) {
    b.onclick = function () { cf.tech = b.dataset.t; $$("[data-cf-techs] button").forEach(function (x) { x.classList.toggle("on", x === b); }); cfTech(); };
  });
  function cfTech() { var i = { fr: 0, de: 1, en: 2 }[LANG] || 0; $("[data-cf-tdesc]").textContent = CF_TECH[cf.tech][i]; }
  $("[data-cf-file]").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1048576) { toast(t("cf.big", "Fichier trop lourd (8 Mo maximum)")); return; }
    var rd = new FileReader();
    rd.onload = function () { cf.src = rd.result; cf.file = f; $("[data-cf-fname]").textContent = f.name; cfDraw(); toast(t("cf.loaded", "Logo importé : placez-le à la souris ou au doigt")); };
    rd.readAsDataURL(f);
  };
  // glisser le logo (souris et tactile)
  var drag = null;
  function svgPt(e) { var p = cfSvg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(cfSvg.getScreenCTM().inverse()); }
  cfLogo.addEventListener("pointerdown", function (e) { e.preventDefault(); var p = svgPt(e), L = cf.logo[cf.face]; drag = { dx: p.x - L.x, dy: p.y - L.y }; cfLogo.setPointerCapture(e.pointerId); cfSvg.classList.add("dragging"); });
  cfLogo.addEventListener("pointermove", function (e) { if (!drag) return; var p = svgPt(e), L = cf.logo[cf.face]; L.x = p.x - drag.dx; L.y = p.y - drag.dy; clampLogo(); cfDraw(); });
  ["pointerup", "pointercancel"].forEach(function (ev) { cfLogo.addEventListener(ev, function () { drag = null; cfSvg.classList.remove("dragging"); }); });
  // clavier : flèches pour déplacer
  cfLogo.setAttribute("tabindex", "0"); cfLogo.setAttribute("role", "button"); cfLogo.setAttribute("aria-label", "Logo : flèches pour le déplacer");
  cfLogo.addEventListener("keydown", function (e) {
    var d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key]; if (!d) return;
    e.preventDefault(); var L = cf.logo[cf.face]; L.x += d[0]; L.y += d[1]; clampLogo(); cfDraw();
  });
  // export PNG de l'aperçu
  $("[data-cf-dl]").onclick = function () {
    var clone = cfSvg.cloneNode(true);
    clone.querySelector("[data-cf-zone]").remove();
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg"); clone.setAttribute("width", 1200); clone.setAttribute("height", 1380);
    function go(href) {
      clone.querySelector("[data-cf-logo]").setAttribute("href", href);
      var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas"); c.width = 1200; c.height = 1380; var x = c.getContext("2d");
        var g = x.createRadialGradient(600, 560, 80, 600, 690, 900); g.addColorStop(0, "#f4f6f7"); g.addColorStop(1, "#d9dfe2");
        x.fillStyle = g; x.fillRect(0, 0, 1200, 1380); x.drawImage(img, 0, 0, 1200, 1380);
        x.fillStyle = "#0b0d0f"; x.font = "700 28px Barlow, sans-serif"; x.fillText("KORVEL · " + cf.tech + " · " + cf.colorName, 40, 1344);
        var a = document.createElement("a"); a.download = "korvel-apercu-" + cf.type + ".png"; a.href = c.toDataURL("image/png"); document.body.appendChild(a); a.click(); a.remove();
      };
      img.src = url;
    }
    if (cf.src.indexOf("data:") === 0) go(cf.src);
    else fetch(cf.src).then(function (r) { return r.text(); }).then(function (txt) { go("data:image/svg+xml;charset=utf-8," + encodeURIComponent(txt)); });
  };
  // passage au devis, prérempli
  $("[data-cf-quote]").onclick = function () {
    var n = cfTotal(); $("[data-cf-err]").hidden = n > 0; if (!n) return;
    var q = cfQty(), parts = []; for (var k in q) parts.push(k + " × " + q[k]);
    var r = dv.querySelector('input[name=besoin][value^="Textile"]'); r.checked = true; r.onchange();
    dv.quantite.value = n; dv.technique.value = cf.tech;
    var faces = []; ["front", "back"].forEach(function (fc) { if (cf.logo[fc].touched || fc === cf.face) faces.push(fc === "front" ? t("cf.front", "Devant") : t("cf.back", "Dos")); });
    dv.message.value = (cf.type === "hoodie" ? "Hoodie" : "T-shirt") + " " + cf.colorName.toLowerCase() + ", " + cf.tech + ", logo : " + faces.join(" + ") + ". " + t("cf.sizes", "Tailles") + " : " + parts.join(", ") + ".";
    if (cf.file && files.indexOf(cf.file) < 0) { files.push(cf.file); listFiles(); }
    goStep(2);
    $("#devis").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    toast(t("cf.sent", "Votre configuration est reprise dans le devis"));
  };
  cfTotal(); cfDraw(); cfTech();


  /* ---------------- catalogue print : flipbook fait main (CSS 3D, sans librairie) ---------------- */
  var RANGES = [
    ["cartes", "Cartes de visite", 4, "La première impression, au sens propre."],
    ["flyers", "Flyers", 5, "Le support qui fait venir du monde, vite."],
    ["depliants", "Dépliants", 6, "Plusieurs volets pour raconter une offre complète."],
    ["affiches", "Affiches", 7, "Du A3 au grand format, pour être vu de loin."],
    ["brochures", "Brochures", 8, "Catalogues, magazines et livrets qui se gardent."],
    ["etiquettes", "Étiquettes et stickers", 9, "Pour vos produits, emballages et vitrines."],
    ["signa", "Signalétique", 10, "Guider, informer et habiller vos locaux."],
    ["salons", "Salons et événements", 11, "Roll-up, stands et drapeaux pour sortir du lot."],
    ["textile", "Textile", 12, "Vos équipes et vos clients portent votre marque."],
    ["ecussons", "Écussons et badges", 13, "Brodés, PVC ou laser cut, à votre dessin."],
    ["objets", "Objets publicitaires", 14, "Des cadeaux utiles qu'on garde et qu'on montre."],
    ["covering", "Covering véhicule", 15, "Votre flotte devient un panneau qui roule."]
  ];
  var NP = 16, NL = Math.ceil(NP / 2), bookEl = $("[data-book]"), flipped = 0, single = false, sp = 1;
  function pg(n) { return "assets/cat/p" + (n < 10 ? "0" : "") + n + ".svg"; }
  var leaves = [];
  for (var k = 0; k < NL; k++) {
    var lf = document.createElement("div"); lf.className = "leaf";
    lf.innerHTML = '<div class="face front"></div><div class="face back"></div>';
    lf.dataset.k = k; bookEl.appendChild(lf); leaves.push(lf);
  }
  var singleEl = document.createElement("div"); singleEl.className = "single"; bookEl.appendChild(singleEl);
  var singleImg = new Image(); singleImg.alt = "Page 1"; singleImg.src = pg(1); singleEl.appendChild(singleImg);
  function loadNear() {
    leaves.forEach(function (lf, k) {
      if (Math.abs(k - flipped) > 2) return;
      // les images ne sont créées qu'à l'approche de la page : jamais de balise vide
      [[".front", 2 * k + 1], [".back", 2 * k + 2]].forEach(function (f) {
        var face = $(f[0], lf); if (f[1] > NP || $("img", face)) return;
        var im = new Image(); im.alt = "Page " + f[1]; im.src = pg(f[1]); face.appendChild(im);
      });
    });
  }
  function bookRender(moving) {
    single = window.innerWidth < 760;
    bookEl.classList.toggle("is-single", single);
    if (single) {
      singleImg.src = pg(sp); singleImg.alt = "Page " + sp;
      $("[data-book-count]").textContent = sp + " / " + NP; $("[data-book-range]").value = sp; return;
    }
    leaves.forEach(function (lf, k) {
      var f = k < flipped;
      lf.classList.toggle("flipped", f);
      lf.style.zIndex = k === moving ? 200 : (f ? k + 1 : NL - k);
    });
    bookEl.classList.toggle("at-start", flipped === 0);
    bookEl.classList.toggle("at-end", flipped === NL);
    loadNear();
    var txt = flipped === 0 ? "1" : flipped === NL ? String(NP) : (2 * flipped) + "–" + (2 * flipped + 1);
    $("[data-book-count]").textContent = txt + " / " + NP;
    $("[data-book-range]").value = flipped === 0 ? 1 : 2 * flipped;
    $$(".chip", $("[data-book-chips]")).forEach(function (c) {
      var r = RANGES[+c.dataset.i], nx = RANGES[+c.dataset.i + 1], p = flipped === 0 ? 1 : 2 * flipped;
      c.setAttribute("aria-selected", p >= r[2] - 1 && (!nx || p < nx[2] - 1));
    });
  }
  function bookGo(page) {
    page = Math.max(1, Math.min(NP, page));
    var wasSingle = single;
    if (!wasSingle) sp = page;
    if (single) { singleEl.classList.remove("turn"); void singleEl.offsetWidth; singleEl.classList.add("turn"); sp = page; bookRender(); return; }
    var target = Math.min(NL, Math.floor(page / 2));
    if (target === flipped) return;
    var dir = target > flipped ? 1 : -1;
    // on feuillette page par page quand c'est proche, on saute sinon
    var steps = Math.abs(target - flipped);
    if (steps > 4 || reduced) { flipped = target; bookRender(); return; }
    (function step() {
      var mv = dir > 0 ? flipped : flipped - 1;
      flipped += dir; bookRender(mv);
      if (flipped !== target) setTimeout(step, 160); else setTimeout(function () { bookRender(); }, 950);
    })();
  }
  function bookNext() { if (single) bookGo(sp + 1); else bookGo(flipped === 0 ? 2 : 2 * flipped + 2); }
  function bookPrev() { if (single) bookGo(sp - 1); else bookGo(flipped <= 1 ? 1 : 2 * flipped - 2); }
  $("[data-book-first]").onclick = function () { bookGo(1); };
  $("[data-book-next]").onclick = bookNext; $("[data-book-prev]").onclick = bookPrev;
  $("[data-book-range]").addEventListener("change", function (e) { bookGo(+e.target.value); });
  bookEl.addEventListener("click", function (e) {
    if (single) { var r = bookEl.getBoundingClientRect(); (e.clientX - r.left > r.width / 2 ? bookNext : bookPrev)(); return; }
    var lf = e.target.closest(".leaf"); if (!lf) return;
    lf.classList.contains("flipped") ? bookPrev() : bookNext();
  });
  var sx = null;
  bookEl.addEventListener("pointerdown", function (e) { sx = e.clientX; });
  bookEl.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { (dx < 0 ? bookNext : bookPrev)(); } });
  document.addEventListener("keydown", function (e) {
    if (!modal.hidden || !drawer.hidden) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var r = $("[data-book-wrap]").getBoundingClientRect();
    if (r.top > window.innerHeight * .6 || r.bottom < window.innerHeight * .4) return;
    if (e.key === "ArrowRight") { e.preventDefault(); bookNext(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); bookPrev(); }
  });
  $("[data-book-fs]").onclick = function () {
    var w = $("[data-book-wrap]");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (w.requestFullscreen) w.requestFullscreen(); else if (w.webkitRequestFullscreen) w.webkitRequestFullscreen();
  };
  var chipsEl = $("[data-book-chips]"), rangesEl = $("[data-ranges]");
  RANGES.forEach(function (r, i) {
    var c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.dataset.i = i;
    c.textContent = tt(r[1]); c.dataset.label = r[1]; c.onclick = function () { bookGo(r[2]); };
    chipsEl.appendChild(c);
    var a = document.createElement("button"); a.type = "button"; a.className = "range";
    a.innerHTML = '<span class="range-sheet"><img loading="lazy" alt="" src="assets/cat/p' + (r[2] < 10 ? "0" : "") + r[2] + '.svg"></span>' +
      '<span class="range-n"></span><span class="range-d"></span><span class="range-p"></span>';
    $(".range-n", a).textContent = tt(r[1]); $(".range-n", a).dataset.label = r[1];
    $(".range-d", a).textContent = tt(r[3]); $(".range-d", a).dataset.label = r[3];
    $(".range-p", a).textContent = "p. " + r[2];
    a.onclick = function () { bookGo(r[2]); $("[data-book-wrap]").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }); };
    rangesEl.appendChild(a);
  });
  var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(function () { bookRender(); }, 150); });
  bookRender();


  /* ---------------- recherche instantanée ⌘K ---------------- */
  var kp = $("[data-kp]"), kIn = $("[data-k-input]"), kList = $("[data-k-list]"), kSel = 0, kItems = [], kFocus;
  var SECTIONS = [["Boutique", "#boutique"], ["Studio badge nominatif", "#studio"], ["Configurateur textile", "#textile"], ["Le catalogue print", "#catalogue"], ["Solutions", "#solutions"], ["Demande de devis", "#devis"], ["Le patron", "#patron"], ["Contact", "#contact"]];
  function kOpen() { kFocus = document.activeElement; kp.hidden = false; kIn.value = ""; kRun(); setTimeout(function () { kIn.focus(); }, 30); document.body.style.overflow = "hidden"; }
  function kClose() { kp.hidden = true; document.body.style.overflow = ""; if (kFocus) kFocus.focus(); }
  function kRun() {
    var q = norm(kIn.value.trim()), out = [];
    function hit(s) { return !q || q.split(/\s+/).every(function (w) { return norm(s).indexOf(w) > -1 || (ALIASES[w] && norm(s).indexOf(ALIASES[w]) > -1); }); }
    var prods = P.filter(function (p) { return hit(p.n + " " + tt(p.n) + " " + CAT_LABEL[p.c] + " " + tt(CAT_LABEL[p.c]) + " " + p.col.join(" ")); }).slice(0, q ? 8 : 4);
    if (prods.length) out.push({ h: tt("Produits") });
    prods.forEach(function (p) { out.push({ img: p.img, n: tt(p.n), m: eur(p.p), go: function () { openProduct(p.id); } }); });
    var rg = RANGES.filter(function (r) { return hit(r[1] + " " + tt(r[1]) + " " + r[3] + " " + tt(r[3])); }).slice(0, q ? 6 : 3);
    if (rg.length) out.push({ h: tt("Gammes du catalogue") });
    rg.forEach(function (r) { out.push({ img: "assets/cat/p" + (r[2] < 10 ? "0" : "") + r[2] + ".svg", n: tt(r[1]), m: tt("page") + " " + r[2], go: function () { bookGo(r[2]); $("[data-book-wrap]").scrollIntoView({ block: "center" }); } }); });
    var sc = SECTIONS.filter(function (x) { return hit(x[0] + " " + tt(x[0])); });
    if (sc.length) out.push({ h: tt("Rubriques") });
    sc.forEach(function (x) { out.push({ n: tt(x[0]), m: "→", go: function () { location.hash = x[1]; } }); });
    kList.innerHTML = ""; kItems = [];
    if (!out.length) { kList.innerHTML = '<li class="kp-empty"></li>'; kList.firstChild.textContent = tt("Aucun résultat."); return; }
    out.forEach(function (o) {
      var li = document.createElement("li");
      if (o.h) { li.className = "kp-h"; li.textContent = o.h; kList.appendChild(li); return; }
      li.className = "kp-it"; li.setAttribute("role", "option");
      li.innerHTML = (o.img ? '<img alt="" src="' + o.img + '">' : '<span class="kp-ic">#</span>') + '<span class="kp-n"></span><span class="kp-m"></span>';
      $(".kp-n", li).textContent = o.n; $(".kp-m", li).textContent = o.m;
      var idx = kItems.length; li.onmouseenter = function () { kSelect(idx); };
      li.onclick = function () { kp.hidden = true; document.body.style.overflow = ""; o.go(); };
      kItems.push(li); kList.appendChild(li);
    });
    kSelect(0);
  }
  function kSelect(i) { kSel = (i + kItems.length) % kItems.length; kItems.forEach(function (li, j) { li.setAttribute("aria-selected", j === kSel); }); if (kItems[kSel]) kItems[kSel].scrollIntoView({ block: "nearest" }); }
  kIn.addEventListener("input", kRun);
  kIn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); kSelect(kSel + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); kSelect(kSel - 1); }
    else if (e.key === "Enter" && kItems[kSel]) { e.preventDefault(); kItems[kSel].click(); }
  });
  kp.addEventListener("click", function (e) { if (e.target.closest("[data-k-close]")) kClose(); });
  $("[data-k-open]").onclick = kOpen;
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); kp.hidden ? kOpen() : kClose(); }
    else if (e.key === "Escape" && !kp.hidden) kClose();
    else if (e.key === "/" && kp.hidden && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); kOpen(); }
  });

  /* ---------------- menu mobile ---------------- */
  var menu = $("[data-mobile-menu]"), burger = $("[data-burger]");
  function toggleMenu(open) {
    menu.hidden = !open; burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.onclick = function () { toggleMenu(menu.hidden); };
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });


  /* ---------------- langues FR / DE / EN ---------------- */
  var ATTRS = ["placeholder", "aria-label", "title"];
  function applyLang(lang) {
    LANG = lang; document.documentElement.lang = lang;
    try { localStorage.setItem("korvel-lang", lang); } catch (e) {}
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var p = n.parentElement; if (!p || p.closest("script,style")) continue;
      if (n.__fr === undefined) { var k0 = n.textContent.replace(/\s+/g, " ").trim(); if (!MAP[k0]) continue; n.__fr = n.textContent; }
      var key = n.__fr.replace(/\s+/g, " ").trim();
      n.textContent = lang === "fr" ? n.__fr : n.__fr.replace(key, MAP[key][LI[lang]]);
    }
    $$("[placeholder],[aria-label],[title]").forEach(function (el) {
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var fk = "fr" + a.replace(/-/g, ""); if (!(fk in el.dataset)) { if (!MAP[el.getAttribute(a)]) return; el.dataset[fk] = el.getAttribute(a); }
        el.setAttribute(a, tt(el.dataset[fk]));
      });
    });
    $$("[data-label]").forEach(function (el) {
      var target = el.classList.contains("chip") && el.firstChild && el.firstChild.nodeType === 1 ? el.firstChild : el;
      if (el.classList.contains("sw")) { el.title = tt(el.dataset.label); el.setAttribute("aria-label", tt(el.dataset.label)); return; }
      target.textContent = tt(el.dataset.label);
    });
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.lang === lang); });
    render(); renderCart(); cfTech(); stUpdate();
    heroShow(hIdx);
  }
  $$("[data-lang]").forEach(function (b) { b.onclick = function () { applyLang(b.dataset.lang); }; });
  var saved = null; try { saved = localStorage.getItem("korvel-lang"); } catch (e) {}
  if (saved && saved !== "fr" && LI[saved] !== undefined) applyLang(saved);
  render();
  renderCart();
  // la grille est construite en JS : on recale l'ancre après coup
  if (location.hash.length > 1) {
    try { var t = document.querySelector(location.hash); if (t) setTimeout(function () { window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 84, behavior: "instant" }); }, 60); } catch (e) {}
  }
})();
