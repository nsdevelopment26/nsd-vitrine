/* KORVEL : dessin du textile à plat (T-shirt, hoodie), commun à la presse 3D et à l'aperçu sans 3D.
   Tout est dessiné dans un carré de 1024 px qui représente 0,9 m de tissu posé sur le plateau.
   Rien n'est chargé de l'extérieur : le logo d'exemple est dessiné ici, le logo du client arrive
   par site.js (fichier déposé). Global : window.KorvelTextile. */
(function () {
  "use strict";
  var N = 1024;                      // côté du canevas
  var M = 0.9;                       // mètres représentés par le côté
  var COULEURS = {
    noir:    { hex: "#111215", fil: "#25272c" },
    anthra:  { hex: "#3a3d42", fil: "#4c5056" },
    blanc:   { hex: "#eceeef", fil: "#d9dcdf" },
    marine:  { hex: "#1d2a44", fil: "#2b3a59" },
    rouge:   { hex: "#a3192b", fil: "#b8283b" },
    magenta: { hex: "#c2177a", fil: "#d42a8b" },
    olive:   { hex: "#4a5233", fil: "#5b6440" }
  };
  /* Zones d'impression (px du canevas) : centre, demi-taille maximale */
  var ZONES = {
    tshirt: { coeur: { x: 650, y: 330, w: 120, h: 120 }, centre: { x: 512, y: 450, w: 210, h: 230 }, dos: { x: 512, y: 470, w: 230, h: 250 }, nom: { x: 512, y: 250 } },
    hoodie: { coeur: { x: 650, y: 360, w: 110, h: 110 }, centre: { x: 512, y: 450, w: 200, h: 150 }, dos: { x: 512, y: 500, w: 220, h: 240 }, nom: { x: 512, y: 280 } }
  };

  /* ---------- silhouettes (moitié droite, symétrisée) ---------- */
  function tracer(ctx, piece, face) {
    ctx.beginPath();
    if (piece === "hoodie") {
      var col = face === "dos" ? 150 : 205;
      ctx.moveTo(512, col);
      ctx.bezierCurveTo(560, col, 590, 172, 598, 150);
      ctx.lineTo(808, 172);
      ctx.bezierCurveTo(850, 190, 872, 230, 884, 280);
      ctx.lineTo(1000, 700);
      ctx.lineTo(1004, 760);
      ctx.lineTo(914, 784);
      ctx.lineTo(892, 730);
      ctx.lineTo(820, 420);
      ctx.lineTo(818, 900);
      ctx.lineTo(808, 968);
      ctx.quadraticCurveTo(512, 980, 216, 968);
      ctx.lineTo(206, 900);
      ctx.lineTo(204, 420);
      ctx.lineTo(132, 730);
      ctx.lineTo(110, 784);
      ctx.lineTo(20, 760);
      ctx.lineTo(24, 700);
      ctx.lineTo(140, 280);
      ctx.bezierCurveTo(152, 230, 174, 190, 216, 172);
      ctx.lineTo(426, 150);
      ctx.bezierCurveTo(434, 172, 464, col, 512, col);
      ctx.closePath();
      // capuche posée à plat derrière l'encolure
      ctx.moveTo(392, 168);
      ctx.bezierCurveTo(380, 70, 440, 14, 512, 14);
      ctx.bezierCurveTo(584, 14, 644, 70, 632, 168);
      ctx.closePath();
    } else {
      var enc = face === "dos" ? 128 : 186;
      ctx.moveTo(512, enc);
      ctx.bezierCurveTo(566, enc, 590, 118, 592, 96);
      ctx.lineTo(800, 138);
      ctx.bezierCurveTo(840, 150, 870, 182, 890, 220);
      ctx.lineTo(992, 330);
      ctx.lineTo(904, 424);
      ctx.lineTo(814, 336);
      ctx.lineTo(818, 930);
      ctx.quadraticCurveTo(512, 946, 206, 930);
      ctx.lineTo(210, 336);
      ctx.lineTo(120, 424);
      ctx.lineTo(32, 330);
      ctx.lineTo(134, 220);
      ctx.bezierCurveTo(154, 182, 184, 150, 224, 138);
      ctx.lineTo(432, 96);
      ctx.bezierCurveTo(434, 118, 458, enc, 512, enc);
      ctx.closePath();
    }
  }

  /* bruit de maille, une fois */
  var maille = null;
  function grain() {
    if (maille) return maille;
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var x = c.getContext("2d"), d = x.createImageData(256, 256), p = d.data;
    for (var i = 0; i < 256 * 256; i++) {
      var col = i % 256, row = (i / 256) | 0;
      var rib = ((col % 4) < 2 ? 1 : -1) * (((row + (col >> 2)) % 6) < 3 ? 1 : 0.4);
      var v = 128 + rib * 9 + (Math.random() - 0.5) * 22;
      p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v; p[i * 4 + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    maille = c; return c;
  }

  /* ---------- logo d'exemple (traduit) ---------- */
  function logoExemple(texte) {
    var c = document.createElement("canvas"); c.width = c.height = 512;
    var x = c.getContext("2d");
    x.translate(256, 256);
    x.lineWidth = 22; x.strokeStyle = "#ffffff";
    x.beginPath(); x.arc(0, 0, 222, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "#ff3d9a";
    x.beginPath(); x.arc(0, 0, 196, 0, Math.PI * 2); x.fill();
    // montagne et soleil
    x.fillStyle = "#16171a";
    x.beginPath(); x.moveTo(-128, 40); x.lineTo(-34, -84); x.lineTo(8, -32); x.lineTo(52, -74); x.lineTo(128, 40); x.closePath(); x.fill();
    x.fillStyle = "#ffffff";
    x.beginPath(); x.moveTo(-34, -84); x.lineTo(-10, -52); x.lineTo(-34, -60); x.lineTo(-56, -54); x.closePath(); x.fill();
    x.fillStyle = "#3fd0ff";
    x.beginPath(); x.arc(64, -120, 26, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#16171a";
    x.font = "800 64px 'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(String(texte || "VOTRE LOGO").toUpperCase(), 0, 104, 250);
    return c;
  }

  /* Prépare un logo importé : fond blanc retiré pour les JPEG, recadré sur son contenu */
  function preparerLogo(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var k = Math.min(1, 900 / Math.max(w, h));
    w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
    var d, p, i, opaque = true;
    try { d = x.getImageData(0, 0, w, h); } catch (e) { return c; }
    p = d.data;
    for (i = 3; i < p.length; i += 4) if (p[i] < 250) { opaque = false; break; }
    if (opaque) { // fond clair supprimé (logo sur fond blanc)
      for (i = 0; i < p.length; i += 4) {
        var l = Math.min(p[i], p[i + 1], p[i + 2]);
        if (l > 238) p[i + 3] = 0; else if (l > 215) p[i + 3] = Math.round(255 * (238 - l) / 23);
      }
      x.putImageData(d, 0, 0);
    }
    // recadrage sur les pixels visibles
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y++) for (var xx = 0; xx < w; xx++) {
      if (p[(y * w + xx) * 4 + 3] > 20) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxX < 0) return c;
    var r = document.createElement("canvas"); r.width = maxX - minX + 1; r.height = maxY - minY + 1;
    r.getContext("2d").drawImage(c, minX, minY, r.width, r.height, 0, 0, r.width, r.height);
    return r;
  }

  /* Rendu du logo selon la technique : DTF = couleurs, flex = aplat satiné, flock = aplat velours */
  var TEINTES = { blanc: "#f4f5f6", noir: "#121316", magenta: "#ff3d9a", or: "#d6b25e", cyan: "#3fd0ff" };
  function logoTechnique(src, technique, teinte) {
    if (technique === "dtf") return src;
    var c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    var x = c.getContext("2d");
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = TEINTES[teinte] || TEINTES.blanc;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = "source-atop";
    if (technique === "flock") {
      for (var i = 0; i < c.width * c.height / 40; i++) {
        x.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.07)";
        x.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
      }
    } else {
      var g = x.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.10)");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    }
    return c;
  }

  /* Place un visuel dans une zone : retourne le rectangle (px) en respectant les proportions */
  function rectDans(zone, img, echelle, dx, dy) {
    var k = Math.min(zone.w * 2 / img.width, zone.h * 2 / img.height) * echelle;
    var w = img.width * k, h = img.height * k;
    return { x: zone.x + (dx || 0) - w / 2, y: zone.y + (dy || 0) - h / 2, w: w, h: h };
  }

  function texteNom(ctx, piece, nom, numero, couleurTexte) {
    var z = ZONES[piece].nom;
    ctx.save();
    ctx.fillStyle = couleurTexte;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 88px 'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif";
    ctx.fillText(String(nom || "").toUpperCase(), z.x, z.y, 420);
    if (numero) {
      ctx.font = "800 300px 'Sofia Sans Extra Condensed', 'Arial Narrow', sans-serif";
      ctx.fillText(String(numero), z.x, z.y + 260, 420);
    }
    ctx.restore();
  }

  /* ---------- le canevas complet d'une face ----------
     o = { piece, couleur, face: 'devant'|'dos', imprime: [ {img, rect} ], nom, numero, texteNom } */
  function dessiner(o, cible) {
    var c = cible || document.createElement("canvas");
    c.width = c.height = N;
    var x = c.getContext("2d");
    var col = COULEURS[o.couleur] || COULEURS.noir;
    x.clearRect(0, 0, N, N);
    // tissu
    x.save();
    tracer(x, o.piece, "dos");   // la pièce posée est entière : le dos ferme l'encolure du devant
    x.fillStyle = col.hex; x.fill("nonzero");
    x.clip("nonzero");
    x.globalAlpha = 0.5;
    x.globalCompositeOperation = "overlay";
    var pat = x.createPattern(grain(), "repeat");
    x.fillStyle = pat; x.fillRect(0, 0, N, N);
    x.globalCompositeOperation = "source-over";
    x.globalAlpha = 1;
    // ombre douce des plis vers les bords (lisibilité du volume)
    var g = x.createRadialGradient(512, 520, 120, 512, 520, 620);
    g.addColorStop(0, "rgba(255,255,255,.035)"); g.addColorStop(1, "rgba(0,0,0,.22)");
    x.fillStyle = g; x.fillRect(0, 0, N, N);
    // coutures
    x.strokeStyle = col.fil; x.lineWidth = 3; x.setLineDash([7, 6]);
    if (o.piece === "hoodie") {
      x.beginPath(); x.moveTo(206, 930); x.quadraticCurveTo(512, 944, 818, 930); x.stroke(); // bord-côte
      x.beginPath(); x.moveTo(892, 712); x.lineTo(990, 690); x.stroke();
      x.beginPath(); x.moveTo(132, 712); x.lineTo(34, 690); x.stroke();
      if (o.face !== "dos") { // poche kangourou et cordons
        x.setLineDash([]); x.lineWidth = 4; x.strokeStyle = "rgba(0,0,0,.28)";
        x.beginPath(); x.moveTo(330, 900); x.lineTo(370, 680); x.lineTo(654, 680); x.lineTo(694, 900); x.stroke();
        x.strokeStyle = col.fil; x.lineWidth = 3; x.setLineDash([7, 6]);
        x.beginPath(); x.moveTo(340, 896); x.lineTo(378, 690); x.lineTo(646, 690); x.lineTo(684, 896); x.stroke();
        x.setLineDash([]); x.lineWidth = 7; x.lineCap = "round"; x.strokeStyle = "#e9eaec";
        x.beginPath(); x.moveTo(486, 214); x.quadraticCurveTo(478, 290, 490, 340); x.stroke();
        x.beginPath(); x.moveTo(538, 214); x.quadraticCurveTo(548, 290, 534, 336); x.stroke();
      }
    } else {
      x.beginPath(); x.moveTo(210, 906); x.quadraticCurveTo(512, 922, 818, 906); x.stroke();
      x.beginPath(); x.moveTo(986, 342); x.lineTo(912, 418); x.stroke();
      x.beginPath(); x.moveTo(38, 342); x.lineTo(112, 418); x.stroke();
    }
    x.setLineDash([]);
    // emmanchures et volume des manches (le T-shirt n'est pas une découpe plate)
    if (o.piece !== "hoodie") {
      x.save();
      [[1, 800, 138, 814, 336, 992, 330, 904, 424], [-1, 224, 138, 210, 336, 32, 330, 120, 424]].forEach(function (m) {
        // ombre de la manche, plus sombre vers l'ourlet
        var g2 = x.createLinearGradient(m[1], m[2], (m[5] + m[7]) / 2, (m[6] + m[8]) / 2);
        g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,.16)");
        x.fillStyle = g2;
        x.beginPath(); x.moveTo(m[1], m[2]); x.lineTo(m[5], m[6]); x.lineTo(m[7], m[8]); x.lineTo(m[3], m[4]); x.closePath(); x.fill();
        // couture d'emmanchure, légèrement creusée
        x.strokeStyle = "rgba(0,0,0,.28)"; x.lineWidth = 3;
        x.beginPath(); x.moveTo(m[1], m[2]); x.quadraticCurveTo(m[1] + m[0] * 22, (m[2] + m[4]) / 2, m[3], m[4]); x.stroke();
        x.strokeStyle = col.fil; x.lineWidth = 2; x.setLineDash([6, 5]);
        x.beginPath(); x.moveTo(m[1] + m[0] * 8, m[2] + 4); x.quadraticCurveTo(m[1] + m[0] * 30, (m[2] + m[4]) / 2, m[3] + m[0] * 8, m[4]); x.stroke();
        x.setLineDash([]);
        // pli de la manche posée
        x.strokeStyle = "rgba(255,255,255,.05)"; x.lineWidth = 10;
        x.beginPath(); x.moveTo(m[1] + m[0] * 40, m[2] + 40); x.lineTo((m[5] + m[7]) / 2 - m[0] * 30, (m[6] + m[8]) / 2 - 20); x.stroke();
      });
      x.restore();
    }
    // encolure : au devant, l'intérieur du dos se voit dans le creux, bord-côte autour
    if (o.piece !== "hoodie") {
      var fond = "rgba(0,0,0,.34)";
      if (o.face !== "dos") {
        x.fillStyle = fond;
        x.beginPath(); x.moveTo(432, 96); x.bezierCurveTo(434, 118, 458, 186, 512, 186); x.bezierCurveTo(566, 186, 590, 118, 592, 96);
        x.bezierCurveTo(574, 118, 556, 128, 512, 128); x.bezierCurveTo(468, 128, 450, 118, 432, 96); x.closePath(); x.fill();
        // bord-côte du dos vu de l'intérieur
        x.strokeStyle = "rgba(0,0,0,.22)"; x.lineWidth = 9;
        x.beginPath(); x.moveTo(440, 100); x.bezierCurveTo(456, 116, 474, 124, 512, 124); x.bezierCurveTo(550, 124, 568, 116, 584, 100); x.stroke();
      }
      var enc = o.face === "dos" ? 128 : 186;
      // bord-côte : bande plus claire, fines côtes, ombre portée sur le corps
      x.lineCap = "round";
      x.strokeStyle = "rgba(0,0,0,.30)"; x.lineWidth = 22;
      x.beginPath(); x.moveTo(434, 98); x.bezierCurveTo(438, 126, 460, enc + 4, 512, enc + 4); x.bezierCurveTo(564, enc + 4, 586, 126, 590, 98); x.stroke();
      x.strokeStyle = col.fil; x.lineWidth = 16;
      x.beginPath(); x.moveTo(436, 98); x.bezierCurveTo(440, 122, 462, enc - 2, 512, enc - 2); x.bezierCurveTo(562, enc - 2, 584, 122, 588, 98); x.stroke();
      x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 16; x.setLineDash([1.5, 3]);
      x.stroke();
      x.setLineDash([]); x.lineCap = "butt";
    } else if (o.face !== "dos") {
      // hoodie : l'intérieur de la capuche dans l'encolure
      x.fillStyle = "rgba(0,0,0,.32)";
      x.beginPath(); x.moveTo(426, 150); x.bezierCurveTo(434, 172, 464, 205, 512, 205); x.bezierCurveTo(560, 205, 590, 172, 598, 150);
      x.bezierCurveTo(570, 166, 548, 172, 512, 172); x.bezierCurveTo(476, 172, 454, 166, 426, 150); x.closePath(); x.fill();
    }
    // impressions
    (o.imprime || []).forEach(function (p) {
      x.save();
      x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 2;
      x.drawImage(p.img, p.rect.x, p.rect.y, p.rect.w, p.rect.h);
      x.restore();
    });
    if (o.nom || o.numero) texteNom(x, o.piece, o.nom, o.numero, o.texteNom || "#f4f5f6");
    x.restore();
    return c;
  }

  /* Masque de hauteur (bords arrondis du tissu) : alpha flouté de la silhouette */
  function masque(piece, face, taille) {
    taille = taille || 192;
    var c = document.createElement("canvas"); c.width = c.height = taille;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.filter = "blur(" + Math.round(taille / 60) + "px)";
    x.scale(taille / N, taille / N);
    tracer(x, piece, face);
    x.fillStyle = "#fff"; x.fill("nonzero");
    return x.getImageData(0, 0, taille, taille);
  }

  window.KorvelTextile = {
    N: N, M: M, COULEURS: COULEURS, ZONES: ZONES, TEINTES: TEINTES,
    tracer: tracer, dessiner: dessiner, masque: masque, grain: grain,
    logoExemple: logoExemple, preparerLogo: preparerLogo, logoTechnique: logoTechnique, rectDans: rectDans
  };
})();
