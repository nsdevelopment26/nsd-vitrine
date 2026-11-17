/* HORIZON : géométrie des plans, partagée par la 3D et les plans SVG.
   À partir des pièces d'un plan type (data/biens.js), calcule les murs
   (fusionnés, percés aux portes) et les fenêtres de la façade. */
(function () {
  "use strict";
  var PORTE = 0.9;

  function r(v) { return Math.round(v * 100) / 100; }

  function unir(intervals) {
    intervals.sort(function (a, b) { return a[0] - b[0]; });
    var out = [];
    intervals.forEach(function (iv) {
      var last = out[out.length - 1];
      if (last && iv[0] <= last[1] + 0.001) last[1] = Math.max(last[1], iv[1]);
      else out.push([iv[0], iv[1]]);
    });
    return out;
  }

  function soustraire(intervals, a, b) {
    var out = [];
    intervals.forEach(function (iv) {
      if (b <= iv[0] || a >= iv[1]) { out.push(iv); return; }
      if (a > iv[0]) out.push([iv[0], a]);
      if (b < iv[1]) out.push([b, iv[1]]);
    });
    return out;
  }

  /* Renvoie { murs:[{x0,z0,x1,z1,ext}], facade:[{x0,x1}], portes:[{x,z}] } */
  function murs(plan) {
    var H = {}, V = {};
    function addH(z, x0, x1) { var k = r(z); (H[k] = H[k] || []).push([r(x0), r(x1)]); }
    function addV(x, z0, z1) { var k = r(x); (V[k] = V[k] || []).push([r(z0), r(z1)]); }
    var rects = plan.pieces.slice();
    if (plan.noyau) rects.push(plan.noyau);
    rects.forEach(function (p) {
      addH(p.z, p.x, p.x + p.w); addH(p.z + p.d, p.x, p.x + p.w);
      addV(p.x, p.z, p.z + p.d); addV(p.x + p.w, p.z, p.z + p.d);
    });
    var out = [], facade = [];
    Object.keys(H).forEach(function (k) {
      var z = +k, iv = unir(H[k]);
      if (z === 0) { iv.forEach(function (s) { facade.push({ x0: s[0], x1: s[1] }); }); return; }
      plan.portes.forEach(function (d) { if (Math.abs(d[1] - z) < 0.01) iv = soustraire(iv, d[0] - PORTE / 2, d[0] + PORTE / 2); });
      iv.forEach(function (s) { out.push({ x0: s[0], z0: z, x1: s[1], z1: z, ext: Math.abs(z - plan.p) < 0.01 }); });
    });
    Object.keys(V).forEach(function (k) {
      var x = +k;
      unir(V[k]).forEach(function (s) { out.push({ x0: x, z0: s[0], x1: x, z1: s[1], ext: x === 0 || Math.abs(x - plan.l) < 0.01 }); });
    });
    return { murs: out, facade: facade, portes: plan.portes.map(function (d) { return { x: d[0], z: d[1] }; }) };
  }

  /* Plan SVG (chaîne) : utilisé par la section « plans » et la fiche.
     Chaque famille de traits porte une classe pour l'animation en étapes. */
  function svgPlan(planId, opts) {
    opts = opts || {};
    var plan = window.HZ.PLANS[planId], g = murs(plan), S = opts.echelle || 40, M = 60;
    var W = plan.l * S + M * 2, Hh = (plan.p + plan.exterieur.d) * S + M * 2;
    var oz = plan.exterieur.d * S + M; /* la terrasse est devant (en haut du plan) */
    function X(v) { return r(M + (opts.miroir ? plan.l - v : v) * S); }
    function Z(v) { return r(oz + v * S); }
    var s = [];
    s.push('<svg class="plan-svg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Plan ' + plan.nom + '">');
    /* terrasse */
    s.push('<g class="p-ext"><rect x="' + X(opts.miroir ? plan.l : 0) + '" y="' + (oz - plan.exterieur.d * S) + '" width="' + plan.exterieur.w * S + '" height="' + plan.exterieur.d * S + '" pathLength="1"/>' +
      '<text x="' + r(M + plan.l * S / 2) + '" y="' + r(oz - plan.exterieur.d * S / 2 + 5) + '">' + plan.exterieur.nom + ' · ' + Math.round(plan.exterieur.w * plan.exterieur.d) + ' m²</text></g>');
    /* contour + murs extérieurs */
    s.push('<g class="p-ext-murs">');
    g.murs.filter(function (m) { return m.ext; }).forEach(function (m) {
      s.push('<line x1="' + X(m.x0) + '" y1="' + Z(m.z0) + '" x2="' + X(m.x1) + '" y2="' + Z(m.z1) + '" pathLength="1"/>');
    });
    s.push('</g><g class="p-murs">');
    g.murs.filter(function (m) { return !m.ext; }).forEach(function (m) {
      s.push('<line x1="' + X(m.x0) + '" y1="' + Z(m.z0) + '" x2="' + X(m.x1) + '" y2="' + Z(m.z1) + '" pathLength="1"/>');
    });
    s.push('</g><g class="p-vitrages">');
    g.facade.forEach(function (f) {
      s.push('<line x1="' + X(f.x0) + '" y1="' + Z(0) + '" x2="' + X(f.x1) + '" y2="' + Z(0) + '" pathLength="1"/>');
      for (var x = f.x0 + 2.5; x < f.x1 - 0.1; x += 2.5) s.push('<line class="meneau" x1="' + X(x) + '" y1="' + (Z(0) - 5) + '" x2="' + X(x) + '" y2="' + (Z(0) + 5) + '" pathLength="1"/>');
    });
    s.push('</g><g class="p-portes">');
    g.portes.forEach(function (d) {
      var x = X(d.x - 0.45), x2 = X(d.x + 0.45), z = Z(d.z), rr = Math.abs(x2 - x);
      var a = opts.miroir ? x2 : x, b = opts.miroir ? x : x2;
      s.push('<path d="M' + a + ' ' + z + ' L' + a + ' ' + r(z + rr) + ' A' + rr + ' ' + rr + ' 0 0 ' + (opts.miroir ? 1 : 0) + ' ' + b + ' ' + z + '" pathLength="1"/>');
    });
    s.push('</g><g class="p-pieces">');
    plan.pieces.forEach(function (p) {
      var cx = X(p.x + p.w / 2), cz = Z(p.z + p.d / 2), petit = p.w * p.d < 8 ? ' class="petit"' : "";
      s.push('<text' + petit + ' x="' + cx + '" y="' + (cz - 2) + '">' + p.n + '</text><text class="m2" x="' + cx + '" y="' + (cz + 15) + '">' + (Math.round(p.w * p.d * 10) / 10).toString().replace(".", ",") + ' m²</text>');
    });
    if (plan.noyau) s.push('<text class="noyau" x="' + X(plan.noyau.x + plan.noyau.w / 2) + '" y="' + Z(plan.noyau.z + plan.noyau.d / 2) + '">Ascenseur · escalier</text>');
    s.push('</g><g class="p-cotes">');
    /* cotes : largeur totale en haut, profondeur à gauche */
    var y0 = oz - plan.exterieur.d * S - 26, x0 = M - 28;
    s.push('<line x1="' + X(0) + '" y1="' + y0 + '" x2="' + X(plan.l) + '" y2="' + y0 + '" pathLength="1"/>' +
      '<line x1="' + X(0) + '" y1="' + (y0 - 6) + '" x2="' + X(0) + '" y2="' + (y0 + 6) + '" pathLength="1"/>' +
      '<line x1="' + X(plan.l) + '" y1="' + (y0 - 6) + '" x2="' + X(plan.l) + '" y2="' + (y0 + 6) + '" pathLength="1"/>' +
      '<text x="' + r(M + plan.l * S / 2) + '" y="' + (y0 - 8) + '">' + plan.l.toFixed(2).replace(".", ",") + ' m</text>');
    s.push('<line x1="' + x0 + '" y1="' + Z(0) + '" x2="' + x0 + '" y2="' + Z(plan.p) + '" pathLength="1"/>' +
      '<line x1="' + (x0 - 6) + '" y1="' + Z(0) + '" x2="' + (x0 + 6) + '" y2="' + Z(0) + '" pathLength="1"/>' +
      '<line x1="' + (x0 - 6) + '" y1="' + Z(plan.p) + '" x2="' + (x0 + 6) + '" y2="' + Z(plan.p) + '" pathLength="1"/>' +
      '<text transform="translate(' + (x0 - 10) + ' ' + r((Z(0) + Z(plan.p)) / 2) + ') rotate(-90)">' + plan.p.toFixed(2).replace(".", ",") + ' m</text>');
    s.push('</g></svg>');
    return s.join("");
  }

  window.HZ = window.HZ || {};
  window.HZ.murs = murs;
  window.HZ.svgPlan = svgPlan;
})();
