/* ============================================================================
   Chat NSD — widget de site client
   ----------------------------------------------------------------------------
   Une seule ligne à coller avant </body> :

     <script src="/nsd-chat.js" defer
             data-site="casa-tavares"
             data-nom="Casa Tavares"
             data-accent="#c9452f"
             data-endpoint="https://VOTRE-PROJET.supabase.co/functions/v1/chat-nsd"
             data-fiche="/fiche-chat.json"></script>

   Sans data-endpoint, le widget tourne en MODE DÉMO : il répond depuis la fiche
   locale, par mots-clés, sans appeler l'IA. C'est ce qui permet de le montrer à
   un prospect sans rien avoir déployé. Le jour où on branche l'endpoint, le même
   fichier passe en IA sans qu'on touche au site.
   ========================================================================== */
(() => {
  'use strict';

  const s = document.currentScript || document.querySelector('script[data-site]');
  const CFG = {
    site:     s?.dataset.site || 'demo',
    nom:      s?.dataset.nom || 'Assistant',
    accent:   s?.dataset.accent || '#1f4fd0',
    // Couleur du texte posé SUR l'accent. À passer en sombre quand l'accent du
    // client est clair, sinon le blanc par défaut devient illisible.
    encre:    s?.dataset.encre || '#ffffff',
    // Couleur d'un curseur dessiné, appliqué uniquement au chat. Utile sur un
    // site qui masque le curseur natif ou dont le curseur clair devient
    // invisible sur le panneau blanc. Vide = curseur du système.
    curseur:  s?.dataset.curseur || '',
    endpoint: s?.dataset.endpoint || '',
    fiche:    s?.dataset.fiche || '',
    bienvenue: s?.dataset.bienvenue || 'Bonjour ! Une question sur nos horaires, notre carte ou pour réserver ?',
  };

  let fiche = null;
  let historique = [];
  let ouvert = false;
  let occupe = false;

  // ---- styles ---------------------------------------------------------------
  const css = `
  /* Beaucoup de nos sites masquent le curseur natif (cursor:none) pour dessiner
     le leur, en z-index 10000. Le widget passe au-dessus, donc leur curseur se
     retrouve caché derrière le panneau et il ne reste plus rien de visible.
     On rétablit donc un vrai curseur à l'intérieur du chat, quoi qu'en dise
     la page hôte. Le !important est nécessaire : la règle du site vise
     body, a, button et label directement. */
  .nsdc-bulle,.nsdc-panneau,.nsdc-panneau *{cursor:default!important}
  .nsdc-bulle,.nsdc-puce,.nsdc-envoi,.nsdc-panneau a{cursor:pointer!important}
  .nsdc-bas input{cursor:text!important}
  .nsdc-fil,.nsdc-msg{cursor:auto!important}

  .nsdc-bulle{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border:0;border-radius:50%;
    background:var(--nsdc-accent);color:var(--nsdc-encre);cursor:pointer;z-index:2147483000;display:grid;place-items:center;
    box-shadow:0 10px 30px -8px color-mix(in srgb,var(--nsdc-accent) 65%,transparent),0 2px 8px rgba(0,0,0,.18);
    transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;animation:nsdc-pop .5s .8s backwards}
  .nsdc-bulle:hover{transform:scale(1.08)}
  .nsdc-bulle:active{transform:scale(.96)}
  .nsdc-bulle svg{width:27px;height:27px;transition:transform .3s,opacity .2s}
  .nsdc-bulle .nsdc-x{position:absolute;opacity:0;transform:rotate(-45deg) scale(.6)}
  .nsdc-open .nsdc-bulle .nsdc-chat{opacity:0;transform:rotate(45deg) scale(.6)}
  .nsdc-open .nsdc-bulle .nsdc-x{opacity:1;transform:none}
  @keyframes nsdc-pop{from{transform:scale(0) translateY(20px);opacity:0}}
  .nsdc-pastille{position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;
    background:#ff4757;border:2.5px solid #fff;animation:nsdc-ping 2s ease-out infinite}
  @keyframes nsdc-ping{0%{box-shadow:0 0 0 0 rgba(255,71,87,.7)}70%{box-shadow:0 0 0 9px rgba(255,71,87,0)}100%{box-shadow:0 0 0 0 rgba(255,71,87,0)}}
  .nsdc-open .nsdc-pastille{display:none}

  .nsdc-panneau{position:fixed;right:20px;bottom:92px;width:376px;max-width:calc(100vw - 32px);
    height:min(560px,calc(100vh - 130px));background:#fff;border-radius:18px;z-index:2147483000;display:flex;
    flex-direction:column;overflow:hidden;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#17161b;
    box-shadow:0 24px 60px -12px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.06);
    opacity:0;transform:translateY(14px) scale(.97);pointer-events:none;
    transition:opacity .26s,transform .26s cubic-bezier(.34,1.4,.64,1)}
  .nsdc-open .nsdc-panneau{opacity:1;transform:none;pointer-events:auto}

  .nsdc-tete{padding:15px 17px;background:var(--nsdc-accent);color:var(--nsdc-encre);display:flex;align-items:center;
    gap:11px;flex:none;border-bottom:1px solid rgba(0,0,0,.09)}
  .nsdc-avatar{width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--nsdc-encre) 18%,transparent);display:grid;place-items:center;
    font-weight:700;font-size:15px;flex:none}
  .nsdc-tete b{display:block;font-size:14.5px;line-height:1.25}
  .nsdc-tete span{font-size:11.5px;opacity:.85;display:flex;align-items:center;gap:5px}
  .nsdc-vert{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.8);animation:nsdc-ping2 2.4s infinite}
  @keyframes nsdc-ping2{70%{box-shadow:0 0 0 6px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}

  .nsdc-fil{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f7f6f3;
    overscroll-behavior:contain}
  .nsdc-msg{max-width:82%;padding:10px 14px;border-radius:16px;white-space:pre-wrap;word-break:break-word;
    animation:nsdc-monte .32s cubic-bezier(.22,1,.36,1) backwards}
  @keyframes nsdc-monte{from{opacity:0;transform:translateY(9px)}}
  .nsdc-bot{align-self:flex-start;background:#fff;border-bottom-left-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.07)}
  /* La bordure se dessine à partir de l'encre : sur un accent clair (encre sombre)
     elle détache la bulle du fond du fil ; sur un accent foncé (encre blanche)
     elle disparaît d'elle-même. Aucun réglage à faire par client. */
  .nsdc-moi{align-self:flex-end;background:var(--nsdc-accent);color:var(--nsdc-encre);border-bottom-right-radius:5px;
    border:1px solid color-mix(in srgb,var(--nsdc-encre) 13%,transparent);box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .nsdc-points{display:flex;gap:4px;padding:13px 15px}
  .nsdc-points i{width:7px;height:7px;border-radius:50%;background:#b9b5ad;animation:nsdc-saute 1.3s infinite}
  .nsdc-points i:nth-child(2){animation-delay:.18s}.nsdc-points i:nth-child(3){animation-delay:.36s}
  @keyframes nsdc-saute{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

  .nsdc-puces{display:flex;flex-wrap:wrap;gap:7px;padding:0 16px 12px;background:#f7f6f3}
  .nsdc-puce{font:inherit;font-size:12.5px;padding:7px 13px;border-radius:20px;border:1px solid #ddd8cf;
    background:#fff;color:#403e48;cursor:pointer;transition:all .2s}
  .nsdc-puce:hover{border-color:var(--nsdc-accent);color:var(--nsdc-accent);transform:translateY(-1px)}

  .nsdc-bas{display:flex;gap:9px;padding:12px;border-top:1px solid #eae7e0;background:#fff;flex:none}
  .nsdc-bas input{flex:1;font:inherit;font-size:14.5px;padding:11px 15px;border:1px solid #e2ddd2;border-radius:22px;
    outline:0;background:#faf9f7;transition:border-color .2s,background .2s}
  .nsdc-bas input:focus{border-color:var(--nsdc-accent);background:#fff}
  .nsdc-envoi{width:42px;height:42px;flex:none;border:0;border-radius:50%;background:var(--nsdc-accent);color:var(--nsdc-encre);
    cursor:pointer;display:grid;place-items:center;transition:transform .2s,opacity .2s}
  .nsdc-envoi:hover:not(:disabled){transform:scale(1.07)}
  .nsdc-envoi:disabled{opacity:.4;cursor:default}
  .nsdc-pied{text-align:center;font-size:10.5px;color:#9a958c;padding:0 0 9px;background:#fff;letter-spacing:.02em}
  .nsdc-pied a{color:inherit}

  @media(max-width:520px){
    .nsdc-panneau{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0}
    .nsdc-bulle{right:16px;bottom:16px}
    .nsdc-open .nsdc-bulle{opacity:0;pointer-events:none}
  }
  @media(prefers-reduced-motion:reduce){.nsdc-bulle,.nsdc-panneau,.nsdc-msg,.nsdc-pastille,.nsdc-vert{animation:none!important;transition:none!important}}
  `;

  // ---- construction ---------------------------------------------------------
  const style = document.createElement('style');
  // Flèche dessinée à la couleur demandée, avec un liseré blanc pour rester
  // lisible sur un fond sombre. Le point actif est la pointe, en (5,2).
  const fleche = c => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">`
      + `<path d="M5 2l14 11-6 1 3.5 6.5-2.6 1.4L10.4 15 5 19z" fill="${c}" stroke="#fff" `
      + `stroke-width="1.3" stroke-linejoin="round"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 5 2, default`;
  };
  // On vise les zones non cliquables seulement : les boutons et le champ de
  // saisie gardent la main et le curseur texte, sinon on perd l'indication
  // « c'est cliquable » en échange d'une couleur.
  const curseurCss = CFG.curseur
    ? `.nsdc-panneau,.nsdc-fil,.nsdc-msg,.nsdc-tete,.nsdc-tete *,.nsdc-puces,.nsdc-bas,.nsdc-pied`
      + `{cursor:${fleche(CFG.curseur)}!important}`
    : '';
  style.textContent = `:root{--nsdc-accent:${CFG.accent};--nsdc-encre:${CFG.encre}}` + css + curseurCss;
  document.head.appendChild(style);

  const racine = document.createElement('div');
  racine.innerHTML = `
    <button class="nsdc-bulle" aria-label="Ouvrir la discussion" aria-expanded="false">
      <span class="nsdc-pastille"></span>
      <svg class="nsdc-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      <svg class="nsdc-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="nsdc-panneau" role="dialog" aria-label="Discussion avec ${CFG.nom}" aria-modal="false">
      <div class="nsdc-tete">
        <div class="nsdc-avatar">${CFG.nom.trim().charAt(0).toUpperCase()}</div>
        <div><b>${CFG.nom}</b><span><i class="nsdc-vert"></i> Réponse immédiate</span></div>
      </div>
      <div class="nsdc-fil" role="log" aria-live="polite"></div>
      <div class="nsdc-puces"></div>
      <form class="nsdc-bas">
        <input type="text" placeholder="Écrivez votre question…" autocomplete="off" aria-label="Votre message">
        <button class="nsdc-envoi" type="submit" aria-label="Envoyer">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </form>
      <div class="nsdc-pied">Assistant propulsé par <a href="https://nsdevelopment.lu" target="_blank" rel="noopener">NS Development</a></div>
    </div>`;
  document.body.appendChild(racine);

  const bulle   = racine.querySelector('.nsdc-bulle');
  const fil     = racine.querySelector('.nsdc-fil');
  const puces   = racine.querySelector('.nsdc-puces');
  const form    = racine.querySelector('.nsdc-bas');
  const champ   = form.querySelector('input');
  const envoi   = form.querySelector('.nsdc-envoi');

  // ---- affichage ------------------------------------------------------------
  function ajoute(texte, qui) {
    const d = document.createElement('div');
    d.className = 'nsdc-msg ' + (qui === 'moi' ? 'nsdc-moi' : 'nsdc-bot');
    d.textContent = texte;
    fil.appendChild(d);
    fil.scrollTop = fil.scrollHeight;
    return d;
  }
  function pointsSuspension() {
    const d = document.createElement('div');
    d.className = 'nsdc-msg nsdc-bot nsdc-points';
    d.innerHTML = '<i></i><i></i><i></i>';
    fil.appendChild(d);
    fil.scrollTop = fil.scrollHeight;
    return d;
  }
  const dejaPosees = new Set();
  // Comparaison insensible à la casse et aux accents : « Vous êtes ouverts le lundi ? »
  // tapé à la main ne doit pas reproposer la puce déjà cliquée.
  const cle = q => q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  function enBas() { fil.scrollTop = fil.scrollHeight; }
  function proposePuces(liste) {
    puces.innerHTML = '';
    // On ne repropose jamais une question déjà posée : la reproposer donne
    // l'impression que le bot n'a pas suivi la conversation.
    liste.filter(q => !dejaPosees.has(cle(q))).slice(0, 3).forEach(q => {
      const b = document.createElement('button');
      b.className = 'nsdc-puce'; b.type = 'button'; b.textContent = q;
      b.onclick = () => { puces.innerHTML = ''; envoyer(q); };
      puces.appendChild(b);
    });
    // Les puces poussent le fil vers le haut : on redescend une fois le
    // layout recalculé, sinon la fin de la réponse reste cachée dessous.
    requestAnimationFrame(enBas);
  }

  function basculer() {
    ouvert = !ouvert;
    document.documentElement.classList.toggle('nsdc-open', ouvert);
    bulle.setAttribute('aria-expanded', String(ouvert));
    bulle.setAttribute('aria-label', ouvert ? 'Fermer la discussion' : 'Ouvrir la discussion');
    if (ouvert) {
      if (!fil.children.length) {
        ajoute(CFG.bienvenue, 'bot');
        proposePuces(fiche?.suggestions || ['Vos horaires ?', 'Où êtes-vous ?', 'Comment réserver ?']);
      }
      if (window.innerWidth > 520) setTimeout(() => champ.focus(), 300);
    }
  }
  bulle.onclick = basculer;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ouvert) basculer(); });

  // ---- envoi ----------------------------------------------------------------
  form.onsubmit = e => { e.preventDefault(); soumettre(); };
  // Entrée envoie, explicitement. On ne compte pas sur la soumission implicite
  // du navigateur : sur un site client dont un <form> mal fermé englobe le body,
  // notre formulaire se retrouve imbriqué et elle ne se déclenche jamais.
  champ.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); soumettre(); }
  });
  function soumettre() { const t = champ.value.trim(); if (t) envoyer(t); }

  async function envoyer(texte) {
    if (occupe) return;
    occupe = true; envoi.disabled = true; champ.value = ''; puces.innerHTML = '';
    dejaPosees.add(cle(texte));
    ajoute(texte, 'moi');
    historique.push({ role: 'user', content: texte });
    const attente = pointsSuspension();

    try {
      if (CFG.endpoint) await viaIA(attente);
      else await viaFiche(texte, attente);
    } catch (err) {
      console.error('[nsd-chat]', err);
      attente.remove();
      ajoute(`Désolé, je n'arrive pas à répondre pour le moment. Vous pouvez nous joindre au ${fiche?.telephone || 'téléphone'}.`, 'bot');
    } finally {
      occupe = false; envoi.disabled = false;
      if (window.innerWidth > 520) champ.focus();
    }
  }

  /** Vraies réponses : la fonction Supabase, qui parle à Claude. */
  async function viaIA(attente) {
    const rep = await fetch(CFG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: CFG.site, messages: historique }),
    });
    if (!rep.ok || !rep.body) throw new Error('HTTP ' + rep.status);

    attente.remove();
    const bulleRep = ajoute('', 'bot');
    const lecteur = rep.body.getReader();
    const dec = new TextDecoder();
    let tampon = '', complet = '';

    while (true) {
      const { done, value } = await lecteur.read();
      if (done) break;
      tampon += dec.decode(value, { stream: true });
      const lignes = tampon.split('\n\n'); tampon = lignes.pop() || '';
      for (const l of lignes) {
        if (!l.startsWith('data: ')) continue;
        const charge = l.slice(6);
        if (charge === '[FIN]') continue;
        const o = JSON.parse(charge);
        if (o.erreur) throw new Error('flux interrompu');
        complet += o.t;
        bulleRep.textContent = complet;
        fil.scrollTop = fil.scrollHeight;
      }
    }
    historique.push({ role: 'assistant', content: complet });
  }

  /** Mode démo : pas d'IA, on répond depuis la fiche par mots-clés. */
  async function viaFiche(texte, attente) {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
    attente.remove();
    const t = texte.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // « coûte » et « coute » se valent
    const f = fiche || {};

    // La fiche peut déclarer ses propres règles, dans l'ordre de priorité :
    //   "demo_regles": [ { "mots": ["prix","combien"], "cle": "offres_texte" }, ... ]
    // Sans elles, on retombe sur les règles d'un commerce classique. C'est ce qui
    // permet au même widget de servir un restaurant, un salon ou une agence.
    const regles = Array.isArray(f.demo_regles) && f.demo_regles.length ? f.demo_regles : [
      { mots: ['horaire','ouvert','ferme','dimanche','lundi','quand'], cle: 'horaires_texte' },
      { mots: ['adresse','ou etes','venir','parking','situe','trouver'], cle: 'adresse' },
      { mots: ['carte','menu','plat','manger','specialite','vege','vegan','gluten'], cle: 'carte_texte' },
      { mots: ['reserv','table','book'], cle: 'reservation_texte' },
      { mots: ['tel','telephone','numero','appeler','contact'], cle: 'telephone' },
      { mots: ['prix','tarif','cout','combien'], cle: 'prix_texte' },
    ];

    let r = null;
    for (const regle of regles) {
      if (!regle.mots.some(m => t.includes(m))) continue;
      const v = f[regle.cle];
      if (!v || v === 'à compléter') continue;   // une valeur non renseignée ne répond pas
      r = regle.cle === 'adresse' ? `Nous sommes au ${v}. ${f.acces || ''}`.trim()
        : regle.cle === 'telephone' ? `Vous pouvez nous appeler au ${v}.`
        : v;
      break;
    }

    if (!r) {
      r = f.contact_texte
        || `Bonne question, et je préfère ne pas vous répondre à côté. Le mieux est de nous appeler au ${f.telephone && f.telephone !== 'à compléter' ? f.telephone : 'numéro affiché sur le site'}, on vous répond tout de suite.`;
    }
    ajoute(r, 'bot');
    historique.push({ role: 'assistant', content: r });
    if (f.suggestions) proposePuces(f.suggestions);
  }

  // ---- fiche (mode démo, et suggestions en mode IA) --------------------------
  if (CFG.fiche) {
    fetch(CFG.fiche).then(r => r.json()).then(f => { fiche = f; }).catch(() => {});
  }
})();
