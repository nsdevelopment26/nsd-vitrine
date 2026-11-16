/* ==================================================================
   HORIZON : la Résidence Lumen, immeuble 3D explorable.
   Vue façade (survol = étage), vue par étage (les niveaux supérieurs
   se soulèvent, on choisit un logement), vue éclatée, vue intérieure
   (la façade s'efface, le plan monte en volume).
   Les lots, prix, statuts et plans viennent de data/biens.js.
   ================================================================== */
import {
  THREE, MOBILE, CALME, creerRendu, ombreCamera, materiaux, Fusion, arbres,
  prepareFondu, appliquerFondu, Animateur, Orbite, controles, boucle, traits
} from "./scene3d.js";

const HZ = window.HZ;
const R = HZ.RESIDENCE;
const H0 = R.hauteurRdc, HE = R.hauteurEtage, NB = R.etages;
const base = (n) => (n === 0 ? 0 : H0 + (n - 1) * HE);
const DALLE = 0.35;

/* repère d'un lot : x local → x monde, z local (0 = façade) → z monde */
function repere(l) {
  if (l.plan === "P") return { ox: -10, sx: 1 };
  if (l.pos === "O") return { ox: -15, sx: 1 };
  if (l.pos === "C") return { ox: -5, sx: 1 };
  return { ox: 15, sx: -1 };
}
const X = (rep, x) => rep.ox + rep.sx * x;
const Z = (z) => 7 - z;

export function initImmeuble(root) {
  const canvas = root.querySelector("canvas");
  const { renderer, scene, sun } = creerRendu(canvas);
  renderer.shadowMap.autoUpdate = false;
  ombreCamera(sun, 48);
  const M = materiaux();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  const orbite = new Orbite(camera);
  const anim = new Animateur();

  /* ---------- sol, place, contexte urbain en traits ---------- */
  const sol = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.ShadowMaterial({ opacity: 0.16 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
  const place = new Fusion();
  place.boite(48, 0.12, 30, 0, 0.06, 3);
  place.boite(6, 0.14, 12, -24, 0.07, 20);
  const placeM = place.maillage(M.betonGris, false); scene.add(placeM);
  scene.add(arbres([[-21, 13, 1.1], [-25, 4, 0.9], [-19, -4, 1], [21, 14, 1], [25, 6, 1.2], [20, -6, 0.9], [-8, 16, 0.8], [9, 17, 0.85], [-27, 18, 0.75], [28, 16, 0.8]], M.arbre));

  /* immeubles voisins : seulement leurs arêtes, comme sur un plan masse */
  const voisins = new THREE.Group();
  [[-46, 9, -10, 16, 22, 18], [44, 15, -6, 18, 30, 16], [-2, 12, -42, 40, 24, 14], [52, 7, 26, 12, 14, 14], [-52, 11, 28, 14, 22, 12]].forEach(([x, h2, z, w, h, d]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d)); b.position.set(x, h / 2, z);
    const t = traits(b, 0x8d9094); t.material.opacity = 0.35; voisins.add(t);
    for (let y = 3.3; y < h; y += 3.3) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2, y - h / 2, d / 2), new THREE.Vector3(w / 2, y - h / 2, d / 2)]);
      const l = new THREE.Line(g, t.material); l.position.copy(b.position); voisins.add(l);
    }
  });
  scene.add(voisins);

  /* ---------- l'immeuble ---------- */
  const immeuble = new THREE.Group(); scene.add(immeuble);
  const etages = [];      /* groupe par niveau (0 = RDC … 6 = penthouse) */
  const lotsObj = {};     /* id → { lot, groupe, verre, interieur, hit, centre } */
  const hits = [];
  const toit = new THREE.Group();

  function verreFacade(f, x0, x1, y0, h, z) {
    f.boite(Math.abs(x1 - x0), h, 0.05, (x0 + x1) / 2, y0 + h / 2, z);
  }

  /* intérieur d'un lot, tiré de son plan type */
  function interieur(l, y) {
    const plan = HZ.PLANS[l.plan], rep = repere(l), g = HZ.murs(plan);
    const grp = new THREE.Group();
    const fs = new Fusion(), fm = new Fusion(), fb = new Fusion();
    const hm = HE - DALLE - 0.02;
    fs.boite(plan.l - 0.1, 0.04, plan.p - 0.1, X(rep, plan.l / 2), y + 0.02, Z(plan.p / 2));
    g.murs.forEach((m) => {
      if (m.ext && m.z0 === m.z1 && Math.abs(m.z0 - plan.p) < 0.01 && l.plan !== "P") { /* mur du fond */ }
      const ep = m.ext ? 0.22 : 0.1;
      const x0 = X(rep, m.x0), x1 = X(rep, m.x1), z0 = Z(m.z0), z1 = Z(m.z1);
      if (m.z0 === m.z1) fm.boite(Math.abs(x1 - x0) + ep, hm, ep, (x0 + x1) / 2, y + hm / 2, z0);
      else fm.boite(ep, hm, Math.abs(z1 - z0) + ep, x0, y + hm / 2, (z0 + z1) / 2);
    });
    plan.pieces.forEach((p) => {
      const cx = X(rep, p.x + p.w / 2), cz = Z(p.z + p.d / 2);
      if (p.t === "sejour") {
        fb.boite(Math.min(2.6, p.w * 0.45), 0.42, 0.95, cx - p.w * 0.12 * rep.sx, y + 0.21, cz + p.d * 0.12);
        fb.boite(1.1, 0.3, 0.6, cx - p.w * 0.12 * rep.sx, y + 0.15, cz - p.d * 0.05);
        fb.boite(2, 0.76, 0.95, cx + p.w * 0.2 * rep.sx, y + 0.38, cz - p.d * 0.25);
        fb.boite(Math.max(1.5, p.w - 1.2), 0.92, 0.62, cx, y + 0.46, Z(p.z + p.d) + 0.45);
      } else if (p.t === "chambre") {
        fb.boite(1.65, 0.5, 2.05, cx, y + 0.25, Z(p.z + p.d) + 1.15);
        fb.boite(0.45, 0.5, 0.4, cx - 1.15, y + 0.25, Z(p.z + p.d) + 0.35);
        fb.boite(0.45, 0.5, 0.4, cx + 1.15, y + 0.25, Z(p.z + p.d) + 0.35);
      } else if (p.t === "eau") {
        fb.boite(Math.min(1.7, p.w - 0.3), 0.58, 0.75, cx, y + 0.29, Z(p.z + p.d) + 0.5);
      }
    });
    const sMesh = fs.maillage(M.sol, false), mMesh = fm.maillage(M.mur), bMesh = fb.maillage(M.meuble);
    /* les murs se coupent à 1,2 m en vue intérieure : le plan devient lisible */
    mMesh.geometry.translate(0, -y, 0); mMesh.position.y = y; mMesh.userData.murs = true;
    grp.add(sMesh, mMesh, bMesh);
    /* plafonnier : s'allume le soir et à la sélection */
    const lum = new THREE.Mesh(new THREE.PlaneGeometry(plan.l - 1, plan.p - 1), M.lumiere.clone());
    lum.rotation.x = Math.PI / 2; lum.position.set(X(rep, plan.l / 2), y + hm - 0.05, Z(plan.p / 2));
    lum.userData.horsFondu = true; lum.userData.lumiere = true;
    grp.add(lum);
    return grp;
  }

  for (let n = 0; n <= NB; n++) {
    const grp = new THREE.Group(); grp.userData.n = n;
    const y = base(n), h = n === 0 ? H0 : HE;
    const fc = new Fusion(), fv = new Fusion(), fg = new Fusion(), fmet = new Fusion();
    if (n === 0) {
      /* hall : verre en retrait, poteaux, auvent */
      fc.boite(30.4, 0.3, 14.4, 0, 0.15, 0);
      fv.boite(26, H0 - 0.3, 0.05, 0, 0.3 + (H0 - 0.3) / 2, 4.6);
      fv.boite(0.05, H0 - 0.3, 11.6, -13, 0.3 + (H0 - 0.3) / 2, -1.2);
      fv.boite(0.05, H0 - 0.3, 11.6, 13, 0.3 + (H0 - 0.3) / 2, -1.2);
      for (let x = -15; x <= 15.01; x += 5) fc.boite(0.55, H0, 0.55, x, H0 / 2, 6.6);
      fc.boite(5, H0 - 0.3, 5, 0, H0 / 2, -4.5); /* noyau */
      fmet.boite(8, 0.08, 2.2, 0, 3.4, 5.8);
    } else if (n < NB) {
      fc.boite(30.4, DALLE, 14.4, 0, y + DALLE / 2, 0);
      /* balcons : A profond, B plus court, nez de dalle épais */
      [["O", -10, 2.4], ["C", 0, 1.6], ["E", 10, 2.4]].forEach(([pos, cx, d]) => {
        const dd = d + (n % 2 && pos !== "C" ? 0.4 : 0);
        fc.boite(10, 0.32, dd, cx, y + 0.16, 7 + dd / 2);
        fg.boite(10, 1.05, 0.03, cx, y + 0.32 + 0.52, 7 + dd - 0.05);
        fmet.boite(10, 0.05, 0.06, cx, y + 1.4, 7 + dd - 0.05);
      });
      fg.boite(0.03, 1.05, 2.8, -5, y + 0.84, 8.4); fg.boite(0.03, 1.05, 2.8, 5, y + 0.84, 8.4);
      const hv = HE - DALLE;
      for (let x = -15; x <= 15.01; x += 2.5) fc.boite(x % 5 === 0 ? 0.3 : 0.12, hv, x % 5 === 0 ? 0.5 : 0.35, x, y + DALLE + hv / 2, 6.85);
      /* pignons percés d'une fente, façade arrière */
      [-15, 15].forEach((x) => {
        fc.boite(0.3, hv, 9.5, x, y + DALLE + hv / 2, -2.25);
        fc.boite(0.3, hv, 1.4, x, y + DALLE + hv / 2, 6.3);
        fv.boite(0.05, hv, 3.1, x, y + DALLE + hv / 2, 4.05);
      });
      fc.boite(30.4, 0.9, 0.3, 0, y + DALLE + 0.45, -7.05);
      fc.boite(30.4, 0.45, 0.3, 0, y + HE - 0.22, -7.05);
      fv.boite(30, hv - 1.35, 0.05, 0, y + DALLE + 0.9 + (hv - 1.35) / 2, -7);
      for (let x = -15; x <= 15.01; x += 3.75) fc.boite(0.35, hv, 0.32, x, y + DALLE + hv / 2, -7.05);
      fc.boite(5, hv, 5, 0, y + DALLE + hv / 2, -4.5);
    } else {
      /* penthouse en retrait, toits-terrasses latéraux, auvent qui file */
      fc.boite(30.4, DALLE, 14.4, 0, y + DALLE / 2, 0);
      fc.boite(20.4, 0.32, 4, 0, y + 0.16, 9);
      const hv = HE - DALLE + 0.4;
      fv.boite(0.05, hv, 14, -10, y + DALLE + hv / 2, 0);
      fv.boite(0.05, hv, 14, 10, y + DALLE + hv / 2, 0);
      fc.boite(20.4, hv, 0.3, 0, y + DALLE + hv / 2, -7);
      for (let x = -10; x <= 10.01; x += 2.5) fc.boite(0.12, hv, 0.3, x, y + DALLE + hv / 2, 6.9);
      fg.boite(20.4, 1.05, 0.03, 0, y + 0.84, 10.95);
      fg.boite(0.03, 1.05, 18, -15.1, y + 0.84, 0); fg.boite(0.03, 1.05, 18, 15.1, y + 0.84, 0);
      fg.boite(30.2, 1.05, 0.03, 0, y + 0.84, 7.15 - 0.01);
      fmet.boite(20.4, 0.05, 0.06, 0, y + 1.4, 10.95);
      fc.boite(5, hv, 5, 0, y + DALLE + hv / 2, -4.5);
      /* toit et auvent */
      const yt = y + DALLE + hv;
      const ft = new Fusion();
      ft.boite(21.6, 0.4, 19, 0, yt + 0.2, 2.2);
      ft.boite(5.4, 1.4, 5.4, 0, yt + 1.1, -4.5);
      const toitM = ft.maillage(M.beton); toit.add(toitM);
      const fmt = new Fusion();
      fmt.boite(0.16, hv + 0.02, 0.16, -10.6, y + DALLE + hv / 2, 11.4);
      fmt.boite(0.16, hv + 0.02, 0.16, 10.6, y + DALLE + hv / 2, 11.4);
      for (let x = -10; x <= 10.01; x += 1) fmt.boite(0.05, 0.5, 0.06, x, yt - 0.25, 11.6);
      toit.add(fmt.maillage(M.metal));
      prepareFondu(toit);
    }
    const struct = fc.maillage(M.beton); grp.add(struct); grp.userData.struct = struct;
    const verre = fv.maillage(M.verre, false); verre.userData.ombre = false; grp.add(verre);
    if (fg.n) { const gc = fg.maillage(M.gardecorps, false); gc.userData.ombre = false; grp.add(gc); }
    if (fmet.n) grp.add(fmet.maillage(M.metal));
    etages[n] = grp; immeuble.add(grp);
  }
  immeuble.add(toit);

  /* lots : intérieur, verre propre au lot (pour l'effacer), volume de sélection */
  HZ.LOTS.forEach((l) => {
    const plan = HZ.PLANS[l.plan], rep = repere(l), y = base(l.etage) + DALLE;
    const g = etages[l.etage];
    const int = interieur(l, y);
    g.add(int);
    const x0 = X(rep, 0), x1 = X(rep, plan.l);
    const cx = (x0 + x1) / 2, w = Math.abs(x1 - x0);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w, HE, plan.p + plan.exterieur.d), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(cx, base(l.etage) + HE / 2, Z(plan.p / 2) + plan.exterieur.d / 2);
    hit.userData = { lot: l.id, etage: l.etage };
    g.add(hit); hits.push(hit);
    lotsObj[l.id] = { lot: l, groupe: g, interieur: int, hit, centre: new THREE.Vector3(cx, y, Z(plan.p / 2)), w, d: plan.p };
  });
  /* le hall se survole aussi (pour l'info), sans logement */
  const hitHall = new THREE.Mesh(new THREE.BoxGeometry(30, H0, 14), new THREE.MeshBasicMaterial({ visible: false }));
  hitHall.position.set(0, H0 / 2, 0); hitHall.userData = { etage: 0 }; etages[0].add(hitHall); hits.push(hitHall);

  etages.forEach(prepareFondu);
  /* verre du lot : un maillage séparé posé devant son intérieur, pour l'effacer seul */
  HZ.LOTS.forEach((l) => {
    const o = lotsObj[l.id], plan = HZ.PLANS[l.plan];
    const hv = HE - DALLE + (l.plan === "P" ? 0.4 : 0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.1, hv - 0.02, 0.02), M.verre.clone());
    m.material.userData.base = M.verre.opacity; m.material.opacity = M.verre.opacity;
    m.position.set(o.centre.x, base(l.etage) + DALLE + hv / 2, 6.97);
    m.userData.horsFondu = true; m.userData.verreLot = true;
    o.groupe.add(m); o.verre = m;
  });

  /* ---------- contour + voile de sélection ---------- */
  const contour = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x8c7650, transparent: true, opacity: 0 }));
  const voile = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xc9ab73, transparent: true, opacity: 0, depthWrite: false }));
  contour.renderOrder = 10; voile.renderOrder = 9;
  scene.add(contour, voile);
  let contourCible = 0;
  function cadrer(box) {
    const s = new THREE.Vector3(), c = new THREE.Vector3();
    box.getSize(s); box.getCenter(c);
    contour.scale.copy(s).addScalar(0.25); contour.position.copy(c);
    voile.scale.copy(s).addScalar(0.2); voile.position.copy(c);
  }
  function boiteEtage(n) {
    const g = etages[n], b = new THREE.Box3();
    const y = base(n) + g.position.y, h = n === 0 ? H0 : n === NB ? HE + 0.4 : HE;
    if (n === NB) b.set(new THREE.Vector3(-10.2, y, -7.2), new THREE.Vector3(10.2, y + h, 11));
    else b.set(new THREE.Vector3(-15.3, y, -7.2), new THREE.Vector3(15.3, y + h, n === 0 ? 7 : 9.6));
    return b;
  }
  function boiteLot(id) {
    const o = lotsObj[id]; const b = new THREE.Box3().setFromObject(o.hit);
    return b;
  }

  /* ---------- état et vues ---------- */
  /* recul de caméra selon le format de l'écran : en portrait, on s'éloigne */
  const recul = () => Math.max(1, 1.15 / Math.max(0.3, camera.aspect));
  const PRESETS = {
    facade: () => ({ cible: new THREE.Vector3(0, 11.5, 2), az: 0.5, el: 0.1, dist: 74 * recul() }),
    eclate: () => ({ cible: new THREE.Vector3(0, 23, 0), az: 0.62, el: 0.2, dist: 116 * recul() }),
    etage: (n) => ({ cible: new THREE.Vector3(0, base(n) + 1, 1.5), az: 0.32, el: 0.82, dist: 62 * recul() }),
    lot: (id) => {
      const o = lotsObj[id];
      return { cible: new THREE.Vector3(o.centre.x, o.centre.y + 0.6, o.centre.z + 1.2), az: o.lot.pos === "E" ? -0.3 : 0.3, el: 1.08, dist: 44 * recul() * (o.lot.plan === "P" ? 1.4 : 1) };
    }
  };
  const S = { mode: "facade", etage: null, lot: null, survol: null };
  const AZ = { min: -0.95, max: 1.2 };

  function decalages(mode, n) {
    /* position verticale et opacité cible de chaque niveau */
    return etages.map((g, k) => {
      if (mode === "eclate") return { y: k * 4.6, a: 1 };
      if (mode === "etage" || mode === "lot") {
        if (k > n) return { y: 16 + (k - n) * 3, a: 0.07 };
        if (k < n) return { y: 0, a: 0.32 };
        return { y: 0, a: 1 };
      }
      return { y: 0, a: 1 };
    });
  }

  let tacheEtages = null;
  function poserEtages(mode, n, duree = 1300) {
    const vers = decalages(mode, n);
    const de = etages.map((g) => ({ y: g.position.y, a: g.userData.fondu }));
    const toitDe = { y: toit.position.y, a: toit.userData.fondu };
    const toitVers = mode === "eclate" ? { y: (NB + 1) * 4.6 - 2, a: 1 } : (mode === "etage" || mode === "lot") ? { y: 22, a: 0.05 } : { y: 0, a: 1 };
    if (tacheEtages) anim.annuler(tacheEtages);
    tacheEtages = anim.vers(duree, (k) => {
      etages.forEach((g, i) => {
        g.position.y = de[i].y + (vers[i].y - de[i].y) * k;
        appliquerFondu(g, de[i].a + (vers[i].a - de[i].a) * k);
      });
      toit.position.y = toitDe.y + (toitVers.y - toitDe.y) * k;
      appliquerFondu(toit, toitDe.a + (toitVers.a - toitDe.a) * k);
      renderer.shadowMap.needsUpdate = true;
    });
  }

  /* lots d'un étage : les autres s'effacent en vue intérieure, le verre du lot choisi disparaît */
  function poserLots(idChoisi) {
    Object.values(lotsObj).forEach((o) => {
      const choisi = o.lot.id === idChoisi;
      const autreEtage = idChoisi && o.lot.etage === lotsObj[idChoisi].lot.etage && !choisi;
      const vDe = o.verre.material.opacity, vVers = choisi ? 0.0 : M.verre.opacity;
      const lum = o.interieur.children.find((c) => c.userData.lumiere);
      const lDe = lum.material.opacity, lVers = choisi ? 0.55 : (S.mode === "facade" && soir ? 0.35 * ((o.lot.etage * 7 + o.lot.pos.charCodeAt(0)) % 3 ? 1 : 0) : 0);
      const fDe = o.interieur.userData.facteur ?? 1, fVers = autreEtage ? 0.22 : 1;
      const murs = o.interieur.children.find((c) => c.userData.murs);
      const cDe = murs.scale.y, cVers = choisi ? 0.42 : 1;
      anim.vers(900, (k) => {
        o.verre.material.opacity = vDe + (vVers - vDe) * k;
        lum.material.opacity = lDe + (lVers - lDe) * k;
        const f = fDe + (fVers - fDe) * k;
        murs.scale.y = cDe + (cVers - cDe) * k;
        renderer.shadowMap.needsUpdate = true;
        o.interieur.userData.facteur = f;
        o.interieur.children.forEach((c) => { if (!c.userData.lumiere) c.userData.facteur = f; });
        appliquerFondu(o.groupe, o.groupe.userData.fondu);
      });
    });
  }
  let soir = false;

  /* ---------- interface ---------- */
  const ui = {
    info: root.querySelector(".imm-info"),
    panneau: root.querySelector(".imm-panneau"),
    fil: root.querySelector(".imm-fil"),
    liste: root.querySelector(".imm-etages"),
    modes: [...root.querySelectorAll("[data-vue]")],
    etiquettes: root.querySelector(".imm-pieces"),
    aide: root.querySelector(".imm-aide")
  };

  const nomEtage = (n) => (n === 0 ? "Rez-de-chaussée" : n === NB ? "Étage 0" + n + " · penthouse" : "Étage 0" + n);
  const resumeEtage = (n) => {
    if (n === 0) return "Hall d'accueil · conciergerie";
    const ls = HZ.LOTS.filter((l) => l.etage === n), dispo = ls.filter((l) => l.statut === "disponible").length;
    return ls.length + " logement" + (ls.length > 1 ? "s" : "") + " · " + (dispo ? dispo + " disponible" + (dispo > 1 ? "s" : "") : "aucun disponible");
  };
  const etiquetteStatut = (s) => '<span class="st st-' + (s === "réservé" ? "res" : s === "vendu" ? "vendu" : "dispo") + '">' + s + "</span>";

  /* liste des étages (accessible, synchronisée avec la 3D) */
  ui.liste.innerHTML = etages.map((g, n) => n).reverse().map((n) =>
    '<li><button type="button" data-etage="' + n + '"><span class="n">' + (n === 0 ? "RDC" : "0" + n) + '</span><span class="r">' + resumeEtage(n) + "</span></button></li>").join("");
  const btnEtage = (n) => ui.liste.querySelector('[data-etage="' + n + '"]');
  ui.liste.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-etage]"); if (b && S.mode !== "lot") survolEtage(+b.dataset.etage); });
  ui.liste.addEventListener("pointerleave", () => { if (S.mode === "facade" || S.mode === "eclate") survolEtage(null); });
  ui.liste.addEventListener("focusin", (e) => { const b = e.target.closest("[data-etage]"); if (b && S.mode !== "lot") survolEtage(+b.dataset.etage); });
  ui.liste.addEventListener("click", (e) => { const b = e.target.closest("[data-etage]"); if (b) { const n = +b.dataset.etage; if (n > 0) allerEtage(n); } });

  ui.modes.forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.vue;
    if (v === "facade") vueFacade();
    else if (v === "eclate") vueEclatee();
    else if (v === "etage") allerEtage(S.etage || 4);
    else if (v === "interieur") ouvrirLot(S.lot || HZ.LOTS.find((l) => l.statut === "disponible" && l.etage === (S.etage || 4))?.id || "04.02");
  }));

  function marquerModes() {
    const actif = S.mode === "lot" ? "interieur" : S.mode;
    ui.modes.forEach((b) => b.setAttribute("aria-pressed", b.dataset.vue === actif ? "true" : "false"));
    ui.liste.querySelectorAll("[data-etage]").forEach((b) => b.classList.toggle("on", +b.dataset.etage === S.etage && S.mode !== "facade" && S.mode !== "eclate"));
    const fil = ['<button type="button" data-fil="facade">' + R.nom + "</button>"];
    if (S.etage !== null && (S.mode === "etage" || S.mode === "lot")) fil.push('<button type="button" data-fil="etage">' + nomEtage(S.etage) + "</button>");
    if (S.mode === "lot") fil.push("<span>Appartement " + S.lot + "</span>");
    ui.fil.innerHTML = fil.join('<i aria-hidden="true">/</i>');
    root.dataset.mode = S.mode;
    const tactile = matchMedia("(hover: none)").matches;
    const aides = {
      facade: tactile ? "Touchez un étage pour l'ouvrir. Glissez pour tourner." : "Survolez un étage, cliquez pour l'ouvrir. Glissez pour tourner autour.",
      eclate: "Les six niveaux, écartés. Choisissez un étage.",
      etage: tactile ? "Touchez un logement pour le découvrir." : "Survolez un logement, cliquez pour entrer.",
      lot: "La façade s'efface : voici l'appartement, pièce par pièce."
    };
    ui.aide.textContent = aides[S.mode];
  }
  ui.fil.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fil]"); if (!b) return;
    b.dataset.fil === "facade" ? vueFacade() : allerEtage(S.etage);
  });

  function infoLot(id) {
    const l = lotsObj[id].lot;
    return '<p class="t">Appartement ' + l.id + "</p>" +
      '<ul><li>' + l.ch + " chambre" + (l.ch > 1 ? "s" : "") + "</li><li>" + l.m2 + " m²</li><li>" + l.extNom + " " + l.ext + " m²</li></ul>" +
      '<p class="px">' + (l.statut === "vendu" ? "Vendu" : HZ.euros(l.prix)) + " " + etiquetteStatut(l.statut) + "</p>";
  }

  function survolEtage(n) {
    S.survol = n;
    if (n === null) { contourCible = 0; if (S.mode === "facade") ui.info.hidden = true; marquerSurvolListe(null); return; }
    cadrer(boiteEtage(n)); contourCible = 1;
    marquerSurvolListe(n);
  }
  function marquerSurvolListe(n) { ui.liste.querySelectorAll("[data-etage]").forEach((b) => b.classList.toggle("survol", +b.dataset.etage === n)); }

  function vueFacade() {
    S.mode = "facade"; S.lot = null;
    orbite.aller(anim, PRESETS.facade(), 1400);
    poserEtages("facade"); poserLots(null);
    fermerPanneau(); marquerModes(); contourCible = 0;
  }
  function vueEclatee() {
    S.mode = "eclate"; S.lot = null;
    orbite.aller(anim, PRESETS.eclate(), 1500);
    poserEtages("eclate"); poserLots(null);
    fermerPanneau(); marquerModes(); contourCible = 0; ui.info.hidden = true;
  }
  function allerEtage(n) {
    if (!n) return;
    S.mode = "etage"; S.etage = n; S.lot = null;
    orbite.aller(anim, PRESETS.etage(n), 1500);
    poserEtages("etage", n); poserLots(null);
    contourCible = 0; marquerModes(); ui.info.hidden = true;
    panneauEtage(n);
  }
  function ouvrirLot(id) {
    const o = lotsObj[id]; if (!o) return;
    S.mode = "lot"; S.etage = o.lot.etage; S.lot = id;
    orbite.aller(anim, PRESETS.lot(id), 1600);
    poserEtages("lot", o.lot.etage); poserLots(id);
    cadrer(boiteLot(id)); contourCible = 0.6;
    marquerModes(); panneauLot(id);
    ui.info.hidden = true;
  }

  /* ---------- panneau latéral ---------- */
  function fermerPanneau() { ui.panneau.classList.remove("ouvert"); ui.panneau.setAttribute("aria-hidden", "true"); ui.panneau.inert = true; ui.etiquettes.innerHTML = ""; }
  function ouvrirPanneau(html) {
    ui.panneau.innerHTML = html; ui.panneau.classList.add("ouvert"); ui.panneau.removeAttribute("aria-hidden"); ui.panneau.inert = false;
  }
  function panneauEtage(n) {
    const ls = HZ.LOTS.filter((l) => l.etage === n);
    ouvrirPanneau('<p class="pn-sur">' + R.nom + " · " + R.loc + '</p><h3>' + nomEtage(n) + "</h3>" +
      '<ul class="pn-lots">' + ls.map((l) =>
        '<li><button type="button" data-lot="' + l.id + '"><span class="id">' + l.id + '</span><span class="d">' + l.ch + " ch. · " + l.m2 + " m² · " + l.extNom.toLowerCase() + " " + l.ext + " m²</span>" +
        '<span class="p">' + (l.statut === "vendu" ? "Vendu" : HZ.euros(l.prix)) + "</span>" + etiquetteStatut(l.statut) + "</button></li>").join("") + "</ul>" +
      '<p class="pn-note">Programme fictif de démonstration.</p>');
    ui.panneau.querySelectorAll("[data-lot]").forEach((b) => {
      b.addEventListener("click", () => ouvrirLot(b.dataset.lot));
      b.addEventListener("pointerenter", () => { cadrer(boiteLot(b.dataset.lot)); contourCible = 1; });
      b.addEventListener("focus", () => { cadrer(boiteLot(b.dataset.lot)); contourCible = 1; });
    });
  }
  function panneauLot(id) {
    const l = lotsObj[id].lot, plan = HZ.PLANS[l.plan], ph = R.photos[l.plan][0], ref = HZ.refLot(l);
    const dispo = l.statut === "disponible";
    ouvrirPanneau('<p class="pn-sur">' + nomEtage(l.etage) + " · " + plan.nom + '</p><h3>Appartement ' + l.id + "</h3>" +
      '<figure class="pn-photo"><img src="' + ph + '" alt="Séjour d\'un appartement ' + plan.nom.toLowerCase() + ', Résidence Lumen" loading="lazy"></figure>' +
      '<dl class="pn-chiffres"><div><dt>Surface</dt><dd>' + l.m2 + ' m²</dd></div><div><dt>Chambres</dt><dd>' + l.ch + '</dd></div><div><dt>' + l.extNom + '</dt><dd>' + l.ext + ' m²</dd></div><div><dt>Orientation</dt><dd>' + l.orient + "</dd></div></dl>" +
      '<p class="pn-prix">' + (l.statut === "vendu" ? "Vendu" : HZ.euros(l.prix)) + " " + etiquetteStatut(l.statut) + "</p>" +
      '<div class="pn-plan">' + HZ.svgPlan(l.plan, { miroir: l.miroir, echelle: 22 }) + "</div>" +
      (dispo ? '<a class="pn-cta" href="bien.html?ref=' + ref + '">Voir la fiche complète <span aria-hidden="true">→</span></a>'
             : '<a class="pn-cta sec" href="#contact" data-sujet="Appartement ' + l.id + '">Être prévenu si il se libère <span aria-hidden="true">→</span></a>') +
      '<button type="button" class="pn-retour">← Revenir à l\'étage</button>' +
      '<p class="pn-note">Programme fictif de démonstration.</p>');
    ui.panneau.querySelector(".pn-retour").addEventListener("click", () => allerEtage(l.etage));
    const lien = ui.panneau.querySelector("[data-sujet]");
    if (lien) lien.addEventListener("click", () => document.dispatchEvent(new CustomEvent("hz:sujet", { detail: lien.dataset.sujet })));
    /* étiquettes des pièces, posées dans la 3D */
    const rep = repere(l), y = base(l.etage) + DALLE + 1.4;
    ui.etiquettes.innerHTML = plan.pieces.filter((p) => p.w * p.d > 7).map((p) =>
      '<span class="pc" data-x="' + X(rep, p.x + p.w / 2) + '" data-y="' + y + '" data-z="' + Z(p.z + p.d / 2) + '">' + p.n + "<em>" + (Math.round(p.w * p.d * 10) / 10).toString().replace(".", ",") + " m²</em></span>").join("");
  }

  /* ---------- pointeur : survol et clic dans la 3D ---------- */
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  let pointeur = null;
  function viser(e) {
    const r = canvas.getBoundingClientRect();
    pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pt, camera);
    const visibles = hits.filter((h) => h.parent.visible && h.parent.userData.fondu > 0.5);
    const i = ray.intersectObjects(visibles, false)[0];
    return i ? i.object.userData : null;
  }
  const ctl = controles(canvas, orbite, { azMin: AZ.min, azMax: AZ.max, elMin: 0.02, elMax: 1.2, zoom: true, distMin: 16, distMax: 170, zoomActif: () => S.mode !== "facade" });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    pointeur = { x: e.clientX, y: e.clientY };
    const u = viser(e);
    const r = root.getBoundingClientRect();
    if (S.mode === "facade" || S.mode === "eclate") {
      if (u) {
        if (S.survol !== u.etage) survolEtage(u.etage);
        ui.info.innerHTML = '<p class="t">' + nomEtage(u.etage) + "</p><p>" + resumeEtage(u.etage) + "</p>";
        placerInfo(e.clientX - r.left, e.clientY - r.top); ui.info.hidden = false;
        canvas.style.cursor = u.etage > 0 ? "pointer" : "default";
      } else { survolEtage(null); canvas.style.cursor = "grab"; }
    } else if (S.mode === "etage") {
      if (u && u.lot && u.etage === S.etage) {
        cadrer(boiteLot(u.lot)); contourCible = 1;
        ui.info.innerHTML = infoLot(u.lot) + '<p class="go">Cliquer pour découvrir</p>';
        placerInfo(e.clientX - r.left, e.clientY - r.top); ui.info.hidden = false;
        canvas.style.cursor = "pointer";
      } else { contourCible = 0; ui.info.hidden = true; canvas.style.cursor = "grab"; }
    }
  });
  canvas.addEventListener("pointerleave", () => { if (S.mode !== "lot") { ui.info.hidden = true; if (S.mode !== "etage") survolEtage(null); else contourCible = 0; } });
  canvas.addEventListener("click", (e) => {
    if (ctl.aBouge()) return;
    const u = viser(e);
    if (!u) return;
    if ((S.mode === "facade" || S.mode === "eclate") && u.etage > 0) allerEtage(u.etage);
    else if (S.mode === "etage") { if (u.lot && u.etage === S.etage) ouvrirLot(u.lot); else if (u.etage > 0 && u.etage !== S.etage) allerEtage(u.etage); }
    else if (S.mode === "lot" && u.lot && u.lot !== S.lot && u.etage === S.etage) ouvrirLot(u.lot);
  });
  function placerInfo(x, y) {
    const w = ui.info.offsetWidth || 220, rw = root.clientWidth;
    ui.info.style.transform = "translate(" + Math.min(x + 18, rw - w - 12) + "px," + Math.max(12, y - 20) + "px)";
  }

  /* parallaxe douce en vue façade */
  let cibleDecal = 0;
  root.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || CALME) return;
    const r = root.getBoundingClientRect();
    cibleDecal = ((e.clientX - r.left) / r.width - 0.5) * 0.08;
  });

  /* ---------- rendu ---------- */
  const v3 = new THREE.Vector3();
  function taille() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  new ResizeObserver(taille).observe(canvas);
  taille();

  Object.assign(orbite, PRESETS.facade());
  orbite.az = 0.9; orbite.dist *= 1.15; /* entrée : la caméra glisse vers la façade */
  orbite.appliquer();
  renderer.shadowMap.needsUpdate = true;

  let decal = 0;
  const b = boucle(root, (now) => {
    anim.tick(now);
    const vise = innerWidth > 860 && ui.panneau.classList.contains("ouvert") ? Math.min(ui.panneau.offsetWidth, canvas.clientWidth * 0.4) / 2 : 0;
    if (Math.abs(vise - decal) > 0.5 || (decal && !camera.view)) {
      decal += (vise - decal) * 0.1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (decal > 0.5) camera.setViewOffset(w, h, decal, 0, w, h); else { decal = 0; camera.clearViewOffset(); }
    }
    orbite.decalAz += ((S.mode === "facade" ? cibleDecal : 0) - orbite.decalAz) * 0.05;
    orbite.appliquer();
    contour.material.opacity += (contourCible * 0.95 - contour.material.opacity) * 0.18;
    voile.material.opacity += (contourCible * (S.mode === "lot" ? 0 : 0.1) - voile.material.opacity) * 0.18;
    contour.visible = contour.material.opacity > 0.01; voile.visible = voile.material.opacity > 0.005;
    if (ui.etiquettes.childElementCount) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ui.etiquettes.querySelectorAll(".pc").forEach((el) => {
        v3.set(+el.dataset.x, +el.dataset.y + etages[S.etage].position.y, +el.dataset.z).project(camera);
        el.style.transform = "translate(" + ((v3.x * 0.5 + 0.5) * w).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * h).toFixed(1) + "px)";
      });
    }
    renderer.render(scene, camera);
  });

  /* entrée en scène quand la section arrive */
  let entre = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !entre) { entre = true; orbite.aller(anim, PRESETS.facade(), CALME ? 1 : 2400); b.reveiller(); }
  }, { threshold: 0.3 }).observe(root);

  marquerModes(); fermerPanneau();

  /* accès direct depuis une fiche : index.html?lot=04.02#immeuble */
  const p = new URLSearchParams(location.search).get("lot");
  if (p && lotsObj[p]) setTimeout(() => ouvrirLot(p), 400);

  /* Échap : remonter d'un niveau */
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (S.mode === "lot") allerEtage(S.etage);
    else if (S.mode !== "facade") vueFacade();
  });

  return {
    ouvrirLot, allerEtage, vueFacade,
    /* outil de production : projette les arêtes de l'immeuble avec la caméra du hero (?trace=1) */
    trace(cam) {
      const segs = [];
      const w = canvas.clientWidth, h = canvas.clientHeight;
      etages.forEach((g, n) => {
        const st = g.userData.struct; if (!st) return;
        const e = new THREE.EdgesGeometry(st.geometry, 30), p = e.attributes.position;
        const out = [];
        for (let i = 0; i < p.count; i += 2) {
          const a = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).project(cam || camera);
          const c = new THREE.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)).project(cam || camera);
          out.push("M" + ((a.x * 0.5 + 0.5) * w).toFixed(0) + " " + ((-a.y * 0.5 + 0.5) * h).toFixed(0) + "L" + ((c.x * 0.5 + 0.5) * w).toFixed(0) + " " + ((-c.y * 0.5 + 0.5) * h).toFixed(0));
        }
        segs.push(out.join(""));
      });
      return segs;
    },
    _debug: { scene, camera, orbite, renderer, S }
  };
}
