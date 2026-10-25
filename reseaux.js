/* =============================================================
   NS Development — section « Nos réseaux » (#reseaux)
   Carrousel des derniers reels Instagram, compte NSD et compte de Sam.

   Mettre à jour les reels : ajouter le code du reel en tête de liste
   (le bout d'URL après /reel/), puis récupérer sa couverture :
     ./assets/reels/maj-couvertures.sh CODE1 CODE2 …
   Les couvertures sont servies par le site lui-même : Instagram signe
   ses liens d'images et les fait expirer, on ne les appelle jamais en direct.
   Vérifié le 25/10/2026 : les quatre comptes existent et répondent.
   ============================================================= */
(function(){
  const COMPTES = {
    nsd: {
      nom: 'NS Development', handle: 'nsdevelopment.lu',
      photo: 'assets/logo-ns-tuile.png',
      insta: 'https://www.instagram.com/nsdevelopment.lu/',
      tiktok: 'https://www.tiktok.com/@nsdevelopment.lu',
      phrase: 'Nos réalisations, nos méthodes, et ce que coûte vraiment un site.',
      reels: ['De6lxStN7tn','De392F_tiqI','De1cgHdNnPH','Dey4GW2N6vc','DewP76QtoN5','Deocn1_t8R8',
              'Del32cRtgJA','DeeMACDtMGc','Dd9d1phNNOL','Dd4UupXNcpx','DdmUne4tcvo']
    },
    sam: {
      nom: 'Sam', handle: 'samnsdevelopment',
      photo: 'assets/sam.webp?v=2',
      insta: 'https://www.instagram.com/samnsdevelopment/',
      tiktok: 'https://www.tiktok.com/@samnsdevelopment',
      phrase: 'Les appels du jour, les refus, les oui. La vie d\'une agence qui démarre.',
      reels: ['De4UX1vIGJA','De1xLHGo4ls','DezL6RJoAYL','DewkpFEol_o','Det-BXCo2cP','DerfmFso3Kg',
              'Deo3Oc7MHri','DemRgL0IE2q','Dejst3ws-K_','DehH__lIJV3','DeejQSuoL59']
    }
  };

  const sec = document.getElementById('reseaux');
  if(!sec) return;
  const piste = sec.querySelector('.rl-piste');
  const barre = sec.querySelector('.rl-barre i');
  const onglets = sec.querySelectorAll('.rl-tab');
  const suivre = sec.querySelector('.rl-suivre');
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actif = 'nsd';

  const IG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.6" cy="6.4" r="1.1" class="pl"/></svg>';
  const TT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl" d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.1-2.8V9a6.4 6.4 0 1 0 5.5 6.3V8.6a7.9 7.9 0 0 0 4.6 1.5V6.7a4.6 4.6 0 0 1-4.6-4.7z"/></svg>';

  function rendre(cle){
    const c = COMPTES[cle];
    actif = cle;
    onglets.forEach(o => o.setAttribute('aria-selected', o.dataset.compte === cle ? 'true' : 'false'));
    sec.dataset.compte = cle;
    piste.innerHTML = c.reels.map((code, i) =>
      '<a class="rl-carte" style="--i:'+i+'" href="https://www.instagram.com/reel/'+code+'/" target="_blank" rel="noopener" aria-label="Voir le reel '+(i+1)+' de @'+c.handle+' sur Instagram">'
      + '<img src="assets/reels/'+code+'.jpg" width="540" height="960" alt="" loading="'+(i<5?'eager':'lazy')+'" decoding="async">'
      + '<span class="rl-voile"></span>'
      + '<span class="rl-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>'
      + '<span class="rl-pied">'+IG+'<span>Voir le reel</span></span>'
      + '</a>').join('')
      + '<a class="rl-carte rl-fin" href="'+c.insta+'reels/" target="_blank" rel="noopener">'
      + '<img src="'+c.photo+'" alt="" class="rl-fin-photo">'
      + '<strong>Tous les reels</strong><span>@'+c.handle+'</span>'
      + '<span class="rl-fin-fl" aria-hidden="true">→</span></a>';
    suivre.innerHTML =
      '<p class="rl-phrase">'+c.phrase+'</p>'
      + '<div class="rl-liens">'
      + '<a class="rl-lien" href="'+c.insta+'" target="_blank" rel="noopener">'+IG+'<span>Instagram</span><em>@'+c.handle+'</em></a>'
      + '<a class="rl-lien" href="'+c.tiktok+'" target="_blank" rel="noopener">'+TT+'<span>TikTok</span><em>@'+c.handle+'</em></a>'
      + '</div>';
    piste.scrollLeft = 0;
    piste.classList.remove('rl-in'); void piste.offsetWidth; piste.classList.add('rl-in');
    profondeur();
  }

  /* Profondeur : la carte au centre est pleine, les autres reculent un peu.
     Uniquement des transformations CSS, calculées à chaque image de défilement. */
  let rafP = 0;
  function profondeur(){
    cancelAnimationFrame(rafP);
    rafP = requestAnimationFrame(() => {
      const r = piste.getBoundingClientRect(), mid = r.left + r.width / 2;
      piste.querySelectorAll('.rl-carte').forEach(k => {
        const b = k.getBoundingClientRect();
        const d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / (r.width / 2));
        k.style.setProperty('--d', d.toFixed(3));
      });
      const max = piste.scrollWidth - piste.clientWidth;
      barre.style.transform = 'scaleX(' + (max > 0 ? Math.max(.08, piste.scrollLeft / max) : 1) + ')';
    });
  }
  piste.addEventListener('scroll', profondeur, {passive:true});
  addEventListener('resize', profondeur);

  function pas(){ const k = piste.querySelector('.rl-carte'); return k ? k.offsetWidth + 18 : 260; }
  sec.querySelector('.rl-prev').addEventListener('click', () => { touche = true; arret(); piste.scrollBy({left:-pas()*2, behavior:'smooth'}); });
  sec.querySelector('.rl-next').addEventListener('click', () => { touche = true; arret(); piste.scrollBy({left: pas()*2, behavior:'smooth'}); });
  onglets.forEach(o => o.addEventListener('click', () => { if(o.dataset.compte !== actif){ arret(); rendre(o.dataset.compte); } }));

  /* Glisser à la souris (le tactile défile déjà nativement) */
  let tire = null, aBouge = false;
  piste.addEventListener('pointerdown', e => {
    if(e.pointerType !== 'mouse') return;
    tire = {x:e.clientX, s:piste.scrollLeft};
    aBouge = false;
  });
  addEventListener('pointermove', e => {
    if(!tire) return;
    const dx = e.clientX - tire.x;
    if(Math.abs(dx) > 5){ aBouge = true; piste.classList.add('rl-tire'); }
    if(aBouge) piste.scrollLeft = tire.s - dx;
  });
  addEventListener('pointerup', () => { tire = null; piste.classList.remove('rl-tire'); });
  piste.addEventListener('click', e => { if(aBouge){ e.preventDefault(); aBouge = false; } }, true);
  piste.addEventListener('dragstart', e => e.preventDefault());

  /* Défilement automatique lent, coupé dès que le visiteur touche au carrousel */
  let auto = null, touche = false;
  function arret(){ clearInterval(auto); auto = null; }
  function lance(){
    if(reduit || touche || auto) return;
    auto = setInterval(() => {
      const max = piste.scrollWidth - piste.clientWidth;
      if(piste.scrollLeft >= max - 4) piste.scrollTo({left:0, behavior:'smooth'});
      else piste.scrollBy({left:pas(), behavior:'smooth'});
    }, 3200);
  }
  ['pointerdown','wheel','touchstart','keydown'].forEach(ev => piste.addEventListener(ev, () => { touche = true; arret(); }, {passive:true}));
  piste.addEventListener('mouseenter', arret);
  piste.addEventListener('mouseleave', lance);
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? lance() : arret()), {threshold:.35}).observe(piste);

  rendre('nsd');
})();
