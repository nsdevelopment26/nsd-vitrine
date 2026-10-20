/* ============================================================
   NS Development — ouverture d'une démo envoyée à un prospect
   ------------------------------------------------------------
   Le CRM ajoute l'identifiant du prospect au lien qu'il envoie
   (…/maison-vaurenne/?p=P0412). Cette page prévient alors le CRM
   qu'elle a été ouverte, puis combien de temps elle a été regardée.
   Sans ?p= dans le lien (un visiteur ordinaire), elle ne fait rien.
   Aucune adresse IP, aucun appareil, aucun nom : un ID, une page,
   une durée. Les téléphones de l'équipe s'excluent une fois pour
   toutes en ouvrant n'importe quelle démo avec ?equipe=1.
   ============================================================ */
(function () {
  "use strict";
  try {
    var API = "https://script.google.com/macros/s/AKfycbyiSscsc1tvQiekpyzHl6EvPLnqugkx0TKEkJoQPYsDyHeCqg9HZ5tJSx8OZV7WBnk0/exec";
    var q = new URLSearchParams(location.search);
    if (q.has("equipe")) localStorage.setItem("nsd_equipe", "1");
    if (localStorage.getItem("nsd_equipe") || localStorage.getItem("crmnsd_pin")) return;

    var p = (q.get("p") || "").toUpperCase();
    if (/^P\d{4,5}$/.test(p)) sessionStorage.setItem("nsd_p", p);
    else p = sessionStorage.getItem("nsd_p") || "";
    if (!p) return;

    /* le lien reste propre dans la barre d'adresse s'il est partagé ou mis en favori */
    if (q.has("p")) {
      q.delete("p");
      var reste = q.toString();
      history.replaceState(null, "", location.pathname + (reste ? "?" + reste : "") + location.hash);
    }

    var hasard = function () { return (Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)).replace(/[^a-z0-9]/g, ""); };
    var session = sessionStorage.getItem("nsd_s");
    if (!session) { session = hasard(); sessionStorage.setItem("nsd_s", session); }
    var visite = hasard();
    var page = (location.pathname.match(/demos\/.*$/) || [location.pathname])[0].replace(/index\.html$/, "");

    var cumul = 0, depuis = document.hidden ? 0 : Date.now();
    function arreter() { if (depuis) { cumul += Date.now() - depuis; depuis = 0; } }
    function envoyer() {
      var corps = JSON.stringify({ fn: "api_vue", args: [p, page, Math.round((cumul + (depuis ? Date.now() - depuis : 0)) / 1000), visite, session] });
      if (navigator.sendBeacon && navigator.sendBeacon(API, new Blob([corps], { type: "text/plain" }))) return;
      fetch(API, { method: "POST", body: corps, keepalive: true, mode: "no-cors" }).catch(function () {});
    }

    envoyer();
    /* une page laissée ouverte longtemps : un point toutes les 30 s pendant les 5 premières minutes */
    var points = 0, minuteur = setInterval(function () {
      if (++points > 10) return clearInterval(minuteur);
      if (!document.hidden) envoyer();
    }, 30000);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { arreter(); envoyer(); } else depuis = Date.now();
    });
    window.addEventListener("pagehide", function () { arreter(); envoyer(); });
  } catch (e) { /* jamais d'erreur visible pour le visiteur */ }
})();
