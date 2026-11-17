/* ==================================================================
   HORIZON : maisons et villas explorables en 3D.
   On tourne autour, on s'approche de la façade, de la terrasse, de la
   piscine, du jardin. D'une maison à l'autre, la première se défait en
   traits d'architecte, la suivante se dessine puis prend du volume.
   ================================================================== */
import {
  THREE, MOBILE, CALME, creerRendu, ombreCamera, materiaux, Fusion, arbres,
  Animateur, Orbite, controles, boucle, traits, gardeCorps, menuiseries
} from "./scene3d.js";

const HZ = window.HZ;

/* ---------- les trois modèles ---------- */
function haie(f, x, z, w, d) { f.boite(w, 1.1, d, x, 0.55, z); }

/* vitrage + menuiseries en saillie (4 cm), enregistrés ensemble */
function atelier() {
  const men = new Fusion(), int = new Fusion(), tx = new Fusion(), bo = new Fusion();
  return { men, int, tx, bo, vit(v, w, h, d, x, y, z) { v.boite(w, h, d, x, y, z); menuiseries(men, Math.max(w, d), h, x, y, z, w >= d ? "x" : "z", 1.6); } };
}
function finitions(M, A) {
  const out = [A.men.maillage(M.menuiserie)];
  if (A.int.n) { const s = A.int.maillage(M.sol, false); out.push(s); }
  if (A.tx.n) out.push(A.tx.maillage(M.textile));
  if (A.bo.n) out.push(A.bo.maillage(M.bois));
  out.forEach((o) => { o.userData.sansTraits = true; });
  return out;
}

const MODELES = {
  /* Villa Aster : deux volumes croisés, l'étage en porte-à-faux */
  "porte-a-faux"(M) {
    const A = atelier();
    const c = new Fusion(), n = new Fusion(), v = new Fusion(), p = new Fusion(), h = new Fusion(), m = new Fusion();
    p.boite(26, 0.3, 24, 0, 0.15, 2);                      /* socle minéral */
    c.boite(19, 0.35, 11, 0, 0.47, -1);                   /* dalle RDC */
    n.boite(6, 3.1, 10, -6.4, 2.2, -1);                   /* volume habillé sombre */
    A.vit(v, 12.6, 3, 0.05, 3.1, 2.15, 4.45);              /* grande baie */
    A.vit(v, 0.05, 3, 9.9, 9.45, 2.15, -1);
    c.boite(12.8, 0.25, 0.25, 3.1, 0.75, 4.4);
    A.int.boite(12.2, 0.04, 10.2, 3.1, 0.67, -0.9);
    A.tx.boite(3, 0.44, 0.95, 4.2, 0.9, 1.6); A.tx.boite(0.9, 0.44, 1.8, 2.3, 0.9, 1.1);
    A.bo.boite(2.4, 0.05, 1, 6.6, 1.42, -2.4); A.bo.boite(3.6, 0.9, 0.6, -1.6, 1.1, -5.4);
    c.boite(19.2, 0.4, 11.2, 0, 3.85, -1);                /* toit RDC = terrasse */
    c.boite(8.4, 3.3, 20, 3, 5.7, 2.2);                   /* étage en porte-à-faux */
    A.vit(v, 7.8, 2.2, 0.05, 3, 5.7, 12.22);
    A.vit(v, 0.05, 1.4, 14, -1.22, 5.9, 3);
    A.vit(v, 0.05, 1.5, 16, 7.22, 5.9, 2.6);
    m.boite(0.06, 2.6, 0.06, 6.8, 5.6, 12.25);
    for (let x = -8.6; x <= -1; x += 0.5) m.boite(0.04, 0.9, 0.04, x, 4.5, 4.35); /* garde-corps fil */
    m.boite(7.8, 0.05, 0.05, -4.9, 4.95, 4.35);
    p.boite(13.4, 0.18, 5.4, 2.4, 0.4, 7.8);             /* terrasse */
    p.boite(13.2, 0.2, 5.2, 2.4, 0.05, 13.4);            /* margelle */
    h.boite(30, 0.06, 30, 0, 0.02, 2);
    haie(h, -11, 9, 1.2, 12); haie(h, 12.5, -2, 1.2, 14);
    const eau = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 4), M.eau); eau.position.set(2.4, 0.16, 13.4);
    return {
      maillages: [c.maillage(M.beton), n.maillage(M.noir), v.maillage(M.verre, false), p.maillage(M.betonGris), h.maillage(M.herbe), m.maillage(M.metal), eau, ...finitions(M, A)],
      arbres: [[-12, 15, 0.9], [-14, -6, 1.1], [13, 12, 0.8], [11, -10, 1], [-9, -12, 0.85]],
      vues: {
        ensemble: { cible: [1, 3, 2], az: 0.62, el: 0.3, dist: 54 },
        facade: { cible: [0, 3.5, -1], az: Math.PI - 0.35, el: 0.12, dist: 34 },
        terrasse: { cible: [2, 2.4, 6], az: 0.28, el: 0.14, dist: 24 },
        piscine: { cible: [2.4, 0.5, 13], az: 0.9, el: 0.42, dist: 22 },
        jardin: { cible: [0, 1, 4], az: -0.8, el: 0.7, dist: 50 }
      },
      points: { facade: [-6.4, 3, -6.2], terrasse: [-2, 1.4, 7.5], piscine: [2.4, 0.6, 13.4], jardin: [-11, 1.5, 12] }
    };
  },

  /* Maison Halde : un pavillon de plain-pied autour d'un patio */
  pavillon(M) {
    const A = atelier();
    const c = new Fusion(), n = new Fusion(), v = new Fusion(), p = new Fusion(), h = new Fusion(), m = new Fusion(), t = new Fusion();
    p.boite(36, 0.25, 26, 0, 0.12, 1);
    c.boite(30, 0.3, 13, 0, 0.4, 0);
    /* trois ailes en U autour du patio central (x -4..4, z -2..4) */
    n.boite(30, 2.9, 0.3, 0, 2, -6.35);                    /* façade rue, sombre */
    for (let x = -14.5; x <= 14.5; x += 0.42) m.boite(0.08, 2.9, 0.12, x, 2, -6.6);
    c.boite(0.3, 2.9, 13, -15, 2, 0); c.boite(0.3, 2.9, 13, 15, 2, 0);
    A.vit(v, 11, 2.8, 0.05, -9.5, 2, 6.4); A.vit(v, 11, 2.8, 0.05, 9.5, 2, 6.4);
    A.vit(v, 8, 2.8, 0.05, 0, 2, -2); A.vit(v, 0.05, 2.8, 6, -4, 2, 1); A.vit(v, 0.05, 2.8, 6, 4, 2, 1);
    c.boite(0.3, 2.9, 4.4, -4, 2, -4.2); c.boite(0.3, 2.9, 4.4, 4, 2, -4.2);
    A.int.boite(10.6, 0.04, 12.4, -9.6, 0.57, 0.1); A.int.boite(10.6, 0.04, 12.4, 9.6, 0.57, 0.1);
    A.tx.boite(3, 0.44, 0.95, -9.5, 0.8, 3.6); A.tx.boite(0.9, 0.44, 1.8, -11.4, 0.8, 3.1);
    A.bo.boite(2.6, 0.05, 1, 9.4, 1.32, 3); A.bo.boite(4, 0.9, 0.6, 9.4, 1.0, -5.4);
    /* toiture plate débordante, ouverte au-dessus du patio */
    c.boite(11.8, 0.35, 15, -10.1, 3.6, 0.2); c.boite(11.8, 0.35, 15, 10.1, 3.6, 0.2);
    c.boite(8.4, 0.35, 4.6, 0, 3.6, -4.5);
    h.boite(11, 0.12, 14, -10.1, 3.84, 0.2); h.boite(11, 0.12, 14, 10.1, 3.84, 0.2);
    h.boite(42, 0.06, 34, 0, 0.02, 3);
    t.boite(7.6, 0.06, 5.6, 0, 0.56, 1.4);                 /* patio planté */
    p.boite(30, 0.15, 3.5, 0, 0.32, 8.2);                 /* terrasse jardin */
    p.boite(18.6, 0.2, 3.1, 0, 0.05, 13);                 /* bassin de nage */
    haie(h, -17, 4, 1, 22); haie(h, 17, 4, 1, 22);
    const eau = new THREE.Mesh(new THREE.BoxGeometry(18, 0.12, 2.5), M.eau); eau.position.set(0, 0.16, 13);
    return {
      maillages: [c.maillage(M.beton), n.maillage(M.noir), v.maillage(M.verre, false), p.maillage(M.betonGris), h.maillage(M.herbe), m.maillage(M.metal), t.maillage(M.herbe), eau, ...finitions(M, A)],
      arbres: [[0, 1.4, 0.75], [-12, 17, 1], [-6, 18, 0.8], [8, 18, 0.95], [13, 16, 0.85], [-18, -9, 1], [18, -10, 0.9]],
      vues: {
        ensemble: { cible: [0, 2, 2], az: 0.5, el: 0.4, dist: 60 },
        facade: { cible: [0, 2, -6], az: Math.PI + 0.3, el: 0.1, dist: 36 },
        terrasse: { cible: [0, 1.5, 1], az: 0.15, el: 0.85, dist: 26 },
        piscine: { cible: [0, 0.4, 12.5], az: 0.75, el: 0.3, dist: 26 },
        jardin: { cible: [0, 1, 12], az: -0.5, el: 0.55, dist: 44 }
      },
      points: { facade: [0, 2.5, -7], terrasse: [0, 1.2, 1.4], piscine: [6, 0.5, 13], jardin: [-9, 1.5, 17] }
    };
  },

  /* Villa Bel-Orée : trois volumes décalés en gradins */
  gradins(M) {
    const A = atelier();
    const c = new Fusion(), n = new Fusion(), v = new Fusion(), p = new Fusion(), h = new Fusion(), m = new Fusion(), g = new Fusion();
    p.boite(30, 0.3, 28, 0, 0.15, 2);
    /* niveau 1 */
    c.boite(18, 0.35, 11, 0, 0.47, 1);
    A.vit(v, 17.4, 3, 0.05, 0, 2.15, 6.45); A.vit(v, 0.05, 3, 10.6, 8.95, 2.15, 1);
    n.boite(0.3, 3, 11, -9, 2.15, 1); c.boite(18, 0.3, 0.3, 0, 0.8, 6.4);
    c.boite(18.4, 0.45, 11.4, 0, 3.85, 1);
    /* niveau 2, en retrait */
    A.vit(v, 13.4, 3, 0.05, -1.5, 5.55, 2.45); n.boite(0.3, 3, 8, -8.3, 5.55, -1.5); A.vit(v, 0.05, 3, 7.8, 5.2, 5.55, -1.5);
    c.boite(14.4, 0.45, 8.4, -1.5, 7.3, -1.5);
    /* niveau 3, attique */
    A.vit(v, 9, 2.8, 0.05, -3, 8.95, -1.6); n.boite(10, 2.8, 0.3, -3, 8.95, -5.6);
    c.boite(10.6, 0.4, 4.6, -3, 10.55, -3.6);
    /* garde-corps vitrés des toits-terrasses, raccordés aux angles */
    gardeCorps(g, m, [[-9.05, 2.6], [-9.05, 6.62], [9.05, 6.62], [9.05, -4.3], [5.4, -4.3]], 4.08);
    gardeCorps(g, m, [[-8.55, -1.6], [-8.55, 2.42], [5.55, 2.42], [5.55, -5.5]], 7.53);
    A.int.boite(17.2, 0.04, 10.2, 0, 0.67, 1); A.int.boite(13, 0.04, 7.6, -1.5, 4.1, -1.5);
    A.tx.boite(3.2, 0.44, 1, -2, 0.9, 3.4); A.tx.boite(1, 0.44, 2, -4.1, 0.9, 2.9);
    A.bo.boite(2.6, 0.05, 1, 4.5, 1.42, 0.5); A.tx.boite(2, 0.5, 2.2, -3.5, 4.37, -1.6);
    /* piscine à débordement + restanques */
    p.boite(15, 0.5, 5, 0, 0.25, 10.2);
    p.boite(26, 0.6, 0.5, 0, 0.3, 15.5); p.boite(26, 0.35, 0.5, 0, 0.18, 18.5);
    h.boite(34, 0.06, 34, 0, 0.02, 4);
    haie(h, -14, 0, 1, 18);
    const eau = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.12, 4.4), M.eau); eau.position.set(0, 0.52, 10.2);
    return {
      maillages: [c.maillage(M.beton), n.maillage(M.noir), v.maillage(M.verre, false), g.maillage(M.gardecorps, false), p.maillage(M.betonGris), h.maillage(M.herbe), m.maillage(M.metal), eau, ...finitions(M, A)],
      arbres: [[-13, 12, 0.9], [12, 14, 1], [13, -6, 1.1], [-12, -9, 0.95], [6, 19, 0.7], [-6, 19, 0.75]],
      vues: {
        ensemble: { cible: [0, 4, 2], az: 0.55, el: 0.26, dist: 58 },
        facade: { cible: [0, 4.5, 1], az: 0.05, el: 0.08, dist: 40 },
        terrasse: { cible: [-1.5, 7.5, 0], az: 0.45, el: 0.42, dist: 26 },
        piscine: { cible: [0, 0.6, 10], az: -0.6, el: 0.3, dist: 24 },
        jardin: { cible: [0, 1, 12], az: 0.9, el: 0.6, dist: 46 }
      },
      points: { facade: [5, 2.2, 6.5], terrasse: [-1.5, 8.6, 1.6], piscine: [0, 0.8, 10.2], jardin: [6, 0.8, 17] }
    };
  }
};

export function initMaisons(root) {
  const canvas = root.querySelector("canvas");
  const { renderer, scene, sun } = creerRendu(canvas);
  renderer.shadowMap.autoUpdate = false;
  ombreCamera(sun, 34);
  const M = materiaux();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 500);
  const orbite = new Orbite(camera);
  const anim = new Animateur();

  const sol = new THREE.Mesh(new THREE.CircleGeometry(140, 64), new THREE.ShadowMaterial({ opacity: 0.15 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  /* chaque maison : ses volumes + ses traits (pour les transitions) */
  const maisons = HZ.MAISONS.map((d) => {
    const def = MODELES[d.forme](M);
    const g = new THREE.Group(), lignes = new THREE.Group();
    const mats = [];
    def.maillages.forEach((mesh) => {
      mesh.material = mesh.material.clone();
      mesh.material.userData.base = mesh.material.opacity;
      mesh.material.userData.transBase = mesh.material.transparent;
      mats.push(mesh.material);
      mesh.castShadow = !mesh.material.userData.transBase; mesh.receiveShadow = true;
      g.add(mesh);
      if (!mesh.userData.sansTraits && mesh.material.color.getHex() !== M.herbe.color.getHex()) {
        const t = traits(mesh, 0x24262a, 25); t.material.opacity = 0; lignes.add(t);
      }
    });
    const a = arbres(def.arbres);
    a.material.userData.base = a.material.opacity; a.material.userData.transBase = true; mats.push(a.material); g.add(a);
    scene.add(g, lignes);
    g.visible = false; lignes.visible = false;
    return { d, def, g, lignes, mats };
  });

  function opacite(m, a) {
    m.mats.forEach((mat) => {
      mat.opacity = (mat.userData.base ?? 1) * a;
      mat.transparent = mat.userData.transBase || a < 0.999;
      mat.depthWrite = !mat.userData.transBase && a > 0.5;
    });
    m.g.visible = a > 0.01;
    renderer.shadowMap.needsUpdate = true;
  }
  function dessin(m, part, op) {
    m.lignes.visible = op > 0.01;
    m.lignes.children.forEach((l) => {
      l.geometry.setDrawRange(0, Math.floor(l.userData.total * part / 2) * 2);
      l.material.opacity = op;
    });
  }

  /* ---------- interface ---------- */
  const ui = {
    onglets: root.querySelector(".mai-onglets"),
    fiche: root.querySelector(".mai-fiche"),
    points: root.querySelector(".mai-points"),
    zones: root.querySelector(".mai-zones"),
    legende: root.querySelector(".mai-legende"),
    prec: root.querySelector("[data-mai='prec']"),
    suiv: root.querySelector("[data-mai='suiv']"),
    plus: root.querySelector("[data-mai='plus']"),
    moins: root.querySelector("[data-mai='moins']")
  };
  ui.onglets.innerHTML = maisons.map((m, i) => '<button type="button" role="tab" data-i="' + i + '"><span class="n">0' + (i + 1) + "</span>" + m.d.nom + "<em>" + m.d.loc + "</em></button>").join("");

  let courant = -1, enCours = false, zone = "ensemble", auto = !CALME, repos = 0;

  function vue(nom, duree = 1400) {
    if (courant < 0) return;
    const v = maisons[courant].def.vues[nom];
    zone = nom;
    orbite.aller(anim, { cible: new THREE.Vector3(...v.cible), az: v.az, el: v.el, dist: v.dist * Math.max(1, 1.2 / Math.max(0.3, camera.aspect)) }, duree);
    ui.zones.querySelectorAll("[data-zone]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.zone === nom ? "true" : "false"));
    ui.points.querySelectorAll("[data-zone]").forEach((b) => b.classList.toggle("on", b.dataset.zone === nom));
    const d = maisons[courant].d;
    ui.legende.textContent = nom === "ensemble" ? d.nom + " · " + d.loc : d.zones[nom];
    auto = false; repos = performance.now();
  }

  function remplirFiche(d) {
    ui.fiche.innerHTML =
      '<p class="mf-ref">Réf. ' + d.ref + " · " + d.loc + "</p>" +
      "<h3>" + d.nom + "</h3>" +
      '<p class="mf-prix">' + HZ.euros(d.prix) + "</p>" +
      '<p class="mf-desc">' + d.desc + "</p>" +
      '<dl class="mf-chiffres"><div><dt>Habitable</dt><dd>' + d.m2 + ' m²</dd></div><div><dt>Terrain</dt><dd>' + (d.terrain / 100) + ' ares</dd></div><div><dt>Chambres</dt><dd>' + d.ch + '</dd></div><div><dt>Salles de bain</dt><dd>' + d.sdb + "</dd></div></dl>" +
      '<ul class="mf-equip">' + d.equipements.map((e) => "<li>" + e + "</li>").join("") + "</ul>" +
      '<div class="mf-galerie">' + d.photos.map((p, i) => '<a href="bien.html?ref=' + d.ref + '&photo=' + i + '"><img src="' + p + '" alt="' + d.nom + (i ? ", intérieur" : ", vue extérieure") + '" loading="lazy"></a>').join("") + "</div>" +
      '<div class="mf-actions"><a class="btn-plein" href="#contact" data-sujet="Visite · ' + d.nom + ' (' + d.ref + ')">Demander une visite</a><a class="lien" href="bien.html?ref=' + d.ref + '">Fiche complète <span aria-hidden="true">→</span></a></div>' +
      '<p class="mf-note">Bien fictif, présenté pour la démonstration.</p>';
    ui.fiche.querySelector("[data-sujet]").addEventListener("click", (e) => document.dispatchEvent(new CustomEvent("hz:sujet", { detail: e.currentTarget.dataset.sujet })));
    ui.points.innerHTML = Object.entries(maisons[courant].def.points).map(([z, p]) =>
      '<button type="button" class="pt" data-zone="' + z + '" data-p="' + p.join(",") + '" aria-label="' + d.zones[z] + '"><i aria-hidden="true"></i><span>' + d.zones[z] + "</span></button>").join("");
    ui.zones.querySelectorAll("[data-zone]").forEach((b) => { if (b.dataset.zone !== "ensemble") b.textContent = { facade: "Façade", terrasse: "Terrasse", piscine: "Piscine", jardin: "Jardin" }[b.dataset.zone]; });
  }

  function montrer(i) {
    if (enCours || i === courant) return;
    const ancien = courant >= 0 ? maisons[courant] : null, nouveau = maisons[i];
    enCours = true;
    ui.onglets.querySelectorAll("[data-i]").forEach((b) => b.setAttribute("aria-selected", +b.dataset.i === i ? "true" : "false"));
    ui.fiche.classList.add("change");
    const suite = () => {
      if (ancien) { ancien.g.visible = false; ancien.lignes.visible = false; }
      courant = i;
      remplirFiche(nouveau.d);
      ui.fiche.classList.remove("change");
      const v = nouveau.def.vues.ensemble;
      orbite.aller(anim, { cible: new THREE.Vector3(...v.cible), az: v.az, el: v.el, dist: v.dist * Math.max(1, 1.2 / Math.max(0.3, camera.aspect)) }, CALME ? 1 : 2200);
      zone = "ensemble"; ui.legende.textContent = nouveau.d.nom + " · " + nouveau.d.loc;
      ui.zones.querySelectorAll("[data-zone]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.zone === "ensemble" ? "true" : "false"));
      opacite(nouveau, 0); dessin(nouveau, 0, 1);
      /* le dessin se trace, puis la matière arrive */
      anim.vers(CALME ? 1 : 1300, (k) => dessin(nouveau, k, 1), () => {
        anim.vers(CALME ? 1 : 1000, (k) => { opacite(nouveau, k); dessin(nouveau, 1, 1 - 0.85 * k); }, () => { enCours = false; auto = !CALME; });
      });
    };
    if (!ancien) return suite();
    /* l'ancienne maison perd sa matière et ne garde que ses traits, qui se retirent */
    anim.vers(CALME ? 1 : 700, (k) => { opacite(ancien, 1 - k); dessin(ancien, 1, 0.15 + 0.85 * k); }, () => {
      anim.vers(CALME ? 1 : 800, (k) => dessin(ancien, 1 - k, 1), suite);
    });
  }

  ui.onglets.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) montrer(+b.dataset.i); });
  ui.onglets.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (courant + (e.key === "ArrowRight" ? 1 : -1) + maisons.length) % maisons.length;
    montrer(n); ui.onglets.querySelector('[data-i="' + n + '"]').focus();
  });
  ui.prec.addEventListener("click", () => montrer((courant - 1 + maisons.length) % maisons.length));
  ui.suiv.addEventListener("click", () => montrer((courant + 1) % maisons.length));
  ui.zones.addEventListener("click", (e) => { const b = e.target.closest("[data-zone]"); if (b) vue(b.dataset.zone); });
  ui.points.addEventListener("click", (e) => { const b = e.target.closest("[data-zone]"); if (b) vue(b.dataset.zone); });
  ui.plus.addEventListener("click", () => { orbite.aller(anim, { ...orbite.etat(), dist: Math.max(14, orbite.dist * 0.75) }, 600); auto = false; repos = performance.now(); });
  ui.moins.addEventListener("click", () => { orbite.aller(anim, { ...orbite.etat(), dist: Math.min(110, orbite.dist * 1.3) }, 600); auto = false; repos = performance.now(); });

  controles(canvas, orbite, { azMin: -Infinity, azMax: Infinity, elMin: 0.04, elMax: 1.1, zoom: true, distMin: 14, distMax: 110, zoomActif: () => false,
    change: () => { auto = false; repos = performance.now(); } });

  function taille() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  new ResizeObserver(taille).observe(canvas); taille();

  const v3 = new THREE.Vector3();
  let derniere = performance.now();
  const b = boucle(root, (now) => {
    const dt = Math.min(0.05, (now - derniere) / 1000); derniere = now;
    anim.tick(now);
    if (!auto && !enCours && zone === "ensemble" && now - repos > 6000 && !CALME) auto = true;
    if (auto && !enCours) orbite.az += dt * 0.06;
    orbite.appliquer();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ui.points.querySelectorAll(".pt").forEach((el) => {
      const p = el.dataset.p.split(",").map(Number);
      v3.set(p[0], p[1], p[2]).project(camera);
      const devant = v3.z < 1;
      el.style.transform = "translate(" + ((v3.x * 0.5 + 0.5) * w).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * h).toFixed(1) + "px)";
      el.style.opacity = devant && !enCours ? "" : "0";
    });
    renderer.render(scene, camera);
  });

  const v0 = maisons[0].def.vues.ensemble;
  Object.assign(orbite, { az: v0.az + 0.6, el: v0.el, dist: v0.dist * 1.2 }); orbite.cible.set(...v0.cible); orbite.appliquer();
  let entre = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !entre) { entre = true; montrer(0); b.reveiller(); }
  }, { rootMargin: "-25% 0px -25% 0px" }).observe(root.querySelector(".mai-scene"));

  const p = new URLSearchParams(location.search).get("maison");
  if (p) { const i = maisons.findIndex((m) => m.d.ref === p); if (i >= 0) { entre = true; setTimeout(() => montrer(i), 300); } }

  return { montrer, vue, _debug: { scene, camera, orbite } };
}
