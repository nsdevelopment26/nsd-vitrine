/* ============================================================
   NS Development — pop-up « nos réseaux » des démos
   ------------------------------------------------------------
   Une carte qui monte en bas à gauche (le chat est à droite)
   après 9 secondes ou la moitié de la page, et renvoie vers
   les comptes Instagram et TikTok de NSD et de Sam.
   Une fois par visite de page. Rien n'est écrit sur l'appareil
   du visiteur (même promesse que suivi.js et confidentialite.html).

   Tout vit dans un Shadow DOM : le style de la démo ne peut pas
   l'abîmer, et lui ne touche à rien de la démo.

   Inclusion, en fin de <body> de chaque démo :
     <script src="../nsd-reseaux.js" defer></script>      (demos/x/)
     <script src="../../nsd-reseaux.js" defer></script>   (demos/vitrines/x/)
   Pour l'empêcher sur une page : <body data-nsd-reseaux="off">.
   Comptes vérifiés le 25/10/2026.
   ============================================================ */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || document.body.dataset.nsdReseaux === "off") return;
  var base = new URL("..", script.src).href;           // racine du site NSD
  var reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COMPTES = [
    { nom: "NS Development", handle: "nsdevelopment.lu", photo: base + "assets/reseaux/av-nsd.png",
      sous: "Nos sites, en vidéo",
      insta: "https://www.instagram.com/nsdevelopment.lu/", tiktok: "https://www.tiktok.com/@nsdevelopment.lu" },
    { nom: "Sam", handle: "samnsdevelopment", photo: base + "assets/reseaux/av-sam.jpg",
      sous: "La vie de l'agence",
      insta: "https://www.instagram.com/samnsdevelopment/", tiktok: "https://www.tiktok.com/@samnsdevelopment" }
  ];

  var IG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.6" cy="6.4" r="1.1" class="pl"/></svg>';
  var TT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl" d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.1-2.8V9a6.4 6.4 0 1 0 5.5 6.3V8.6a7.9 7.9 0 0 0 4.6 1.5V6.7a4.6 4.6 0 0 1-4.6-4.7z"/></svg>';

  var CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;margin:0}",
    ".carte{position:fixed;left:20px;bottom:20px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);",
    "  font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#f4f4f5;-webkit-font-smoothing:antialiased;",
    "  background:rgba(12,12,15,.92);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);",
    "  border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:20px;overflow:hidden;",
    "  box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.2);",
    "  transform:translateY(calc(100% + 40px)) scale(.96);opacity:0;visibility:hidden;",
    "  transition:transform .75s cubic-bezier(.2,1.25,.3,1),opacity .4s ease,visibility 0s .75s}",
    ".carte.ouvert{transform:none;opacity:1;visibility:visible;transition:transform .75s cubic-bezier(.2,1.25,.3,1),opacity .4s ease,visibility 0s}",
    ".carte.sort{transform:translateY(30px) scale(.97);opacity:0;visibility:hidden;transition:transform .35s ease-in,opacity .3s ease-in,visibility 0s .35s}",
    /* reflet qui traverse la carte une fois à l'ouverture */
    ".carte::before{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;pointer-events:none;",
    "  background:linear-gradient(100deg,transparent,rgba(255,255,255,.10),transparent);transform:skewX(-18deg)}",
    ".carte.ouvert::before{animation:reflet 1.4s .5s ease both}",
    "@keyframes reflet{to{left:130%}}",
    /* halo de couleur discret, rappel Instagram */
    ".carte::after{content:'';position:absolute;right:-70px;top:-90px;width:220px;height:220px;border-radius:50%;pointer-events:none;",
    "  background:radial-gradient(closest-side,rgba(214,41,118,.28),rgba(79,91,213,.12),transparent);filter:blur(6px)}",
    ".fermer{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:0;cursor:pointer;z-index:2;",
    "  background:rgba(255,255,255,.07);color:#d4d4d8;display:grid;place-items:center;transition:background .2s,transform .3s}",
    ".fermer:hover{background:rgba(255,255,255,.16);transform:rotate(90deg)}",
    ".fermer:focus-visible,a:focus-visible{outline:2px solid #fff;outline-offset:2px}",
    ".fermer svg{width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;stroke-linecap:round}",
    ".tag{position:relative;display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;letter-spacing:.04em;color:#a1a1aa}",
    ".tag i{width:7px;height:7px;border-radius:50%;background:#35d29a;box-shadow:0 0 0 0 rgba(53,210,154,.6);animation:pouls 2s infinite}",
    "@keyframes pouls{70%{box-shadow:0 0 0 7px rgba(53,210,154,0)}100%{box-shadow:0 0 0 0 rgba(53,210,154,0)}}",
    "h2{position:relative;font-size:19px;line-height:1.2;font-weight:750;letter-spacing:-.01em;margin:10px 34px 6px 0;color:#fff}",
    "p.txt{position:relative;color:#b4b4bc;font-size:13.5px;margin-bottom:16px}",
    ".compte{position:relative;display:flex;align-items:center;gap:12px;padding:10px;border-radius:15px;text-decoration:none;color:inherit;",
    "  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);transition:background .25s,border-color .25s,transform .3s}",
    ".compte+.compte{margin-top:8px}",
    ".compte:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);transform:translateX(3px)}",
    ".av{position:relative;width:46px;height:46px;flex:none;border-radius:50%;padding:2.5px;isolation:isolate}",
    ".av::before{content:'';position:absolute;inset:0;border-radius:50%;z-index:-1;",
    "  background:conic-gradient(from 0deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75);animation:tour 4s linear infinite}",
    "@keyframes tour{to{transform:rotate(360deg)}}",
    ".av img{width:100%;height:100%;display:block;border-radius:50%;object-fit:cover;border:2.5px solid #0c0c0f;background:#000}",
    ".id{flex:1;min-width:0}",
    ".id b{display:block;font-size:14.5px;font-weight:650;color:#fff}",
    ".id small{display:block;font-size:12px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".id small.sous{color:#8b8b94;font-size:11.5px}",
    ".suivre{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#0c0c0f;background:#fff;",
    "  padding:8px 12px;border-radius:999px;transition:transform .3s}",
    ".compte:hover .suivre{transform:scale(1.05)}",
    "svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9}",
    "svg .pl{fill:currentColor;stroke:none}",
    ".tt{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);font-size:12.5px;color:#a1a1aa}",
    ".tt a{display:inline-flex;align-items:center;gap:6px;color:#d4d4d8;text-decoration:none;transition:color .2s}",
    ".tt a:hover{color:#fff}",
    /* entrée en cascade des éléments */
    ".ouvert .an{animation:monte .6s cubic-bezier(.2,.9,.3,1.1) both}",
    ".ouvert .tag{animation-delay:.1s}.ouvert h2{animation-delay:.16s}.ouvert p.txt{animation-delay:.22s}.ouvert .tt{animation-delay:.5s}",
    ".ouvert .av{animation:pop .7s cubic-bezier(.16,1,.3,1) both;animation-delay:inherit}",
    "@keyframes monte{from{opacity:0;transform:translateY(14px)}}",
    "@keyframes pop{from{transform:scale(.4)}}",
    "@media(max-width:600px){.carte{left:16px;right:16px;width:auto;bottom:92px;padding:18px;border-radius:20px}p.txt{display:none}h2{margin-bottom:14px}}",
    "@media(prefers-reduced-motion:reduce){.carte,.carte.ouvert,.carte.sort{transition:opacity .2s}.carte{transform:none}",
    "  .carte::before,.ouvert .an,.ouvert .av,.av::before,.tag i{animation:none}}"
  ].join("\n");

  function lien(c, i) {
    return '<a class="compte an" href="' + c.insta + '" target="_blank" rel="noopener" style="animation-delay:' + (0.26 + i * 0.1) + 's">'
      + '<span class="av"><img src="' + c.photo + '" alt="" width="46" height="46"></span>'
      + '<span class="id"><b>' + c.nom + '</b><small>@' + c.handle + '</small><small class="sous">' + c.sous + '</small></span>'
      + '<span class="suivre">' + IG + 'Suivre</span></a>';
  }

  var hote = document.createElement("div");
  hote.id = "nsd-reseaux";
  var racine = hote.attachShadow({ mode: "open" });
  racine.innerHTML = "<style>" + CSS + "</style>"
    + '<aside class="carte" role="dialog" aria-modal="false" aria-labelledby="t" aria-hidden="true">'
    + '<button class="fermer" type="button" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    + '<span class="tag an"><i></i>Démo réalisée par NS Development</span>'
    + '<h2 class="an" id="t">Ce site vous plaît ? On montre les coulisses.</h2>'
    + '<p class="txt an">Chaque semaine, nos derniers sites et le quotidien de l\'agence, en vidéo.</p>'
    + COMPTES.map(lien).join("")
    + '<div class="tt an"><span>Aussi sur TikTok</span>'
    + COMPTES.map(function (c) { return '<a href="' + c.tiktok + '" target="_blank" rel="noopener">' + TT + '@' + c.handle + '</a>'; }).join("")
    + "</div></aside>";

  var carte = racine.querySelector(".carte");
  var ouvert = false, fait = false, minuteur;

  function ouvrir() {
    if (fait) return;
    fait = true;
    clearTimeout(minuteur);
    removeEventListener("scroll", auScroll);
    carte.classList.add("ouvert");
    carte.setAttribute("aria-hidden", "false");
    ouvert = true;
  }
  function fermer() {
    if (!ouvert) return;
    ouvert = false;
    carte.classList.remove("ouvert");
    carte.classList.add("sort");
    carte.setAttribute("aria-hidden", "true");
  }
  function auScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0 && scrollY / h > 0.5) ouvrir();
  }

  racine.querySelector(".fermer").addEventListener("click", fermer);
  racine.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setTimeout(fermer, 300); }); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") fermer(); });

  function demarrer() {
    document.body.appendChild(hote);
    minuteur = setTimeout(ouvrir, reduit ? 6000 : 9000);
    addEventListener("scroll", auScroll, { passive: true });
    auScroll();                                         // page rechargée déjà descendue
  }
  if (document.readyState === "complete") demarrer();
  else addEventListener("load", demarrer);
})();
