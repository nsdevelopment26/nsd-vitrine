/* =================================================================
   NS FX — moteur d'effets avancés NS Development
   100 % maison, aucune dépendance, aucun téléchargement externe.
   Canvas natif + rAF. Rien à auditer côté sécurité.

   Respecte « réduire les animations » et le tactile.
   ================================================================= */
(function(){
  "use strict";
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fine   = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const lerp = (a,b,t)=>a+(b-a)*t;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  /* ---------------- 1. Écran d'ouverture ----------------
     Piloté par le temps et non par requestAnimationFrame : rAF est
     gelé quand l'onglet est en arrière-plan, ce qui bloquerait l'écran.
     Ici, l'écran se retire toujours, au plus tard après 2,2 s. */
  function preload(){
    const el = document.getElementById('fxPreload');
    const done = ()=>{
      document.body.classList.remove('fx-lock');
      if(el && !el.classList.contains('done')){
        el.classList.add('done');
        el.addEventListener('transitionend',()=>el.remove(),{once:true});
        setTimeout(()=>el.remove(),1400); // au cas où transitionend ne se déclenche pas
      }
    };
    if(!el || reduce){ document.body.classList.remove('fx-lock'); if(el) el.remove(); return; }

    const bar = el.querySelector('.pl-bar i'), num = el.querySelector('.pl-num');
    const t0 = performance.now(), DUR = 1500;
    let raf;
    const tick = ()=>{
      const p = clamp((performance.now()-t0)/DUR,0,1)*100;
      bar.style.width = p+'%';
      if(num) num.textContent = String(Math.round(p)).padStart(3,'0');
      if(p<100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Retrait garanti par une horloge indépendante de rAF
    setTimeout(()=>{ cancelAnimationFrame(raf); if(bar) bar.style.width='100%'; if(num) num.textContent='100'; done(); }, 1600);
    setTimeout(done, 2200); // filet ultime
  }

  /* ---------------- 2. Curseur sur-mesure ---------------- */
  function cursor(){
    if(!fine || reduce) return;
    const dot = document.createElement('div'); dot.className='fx-cursor';
    const ring= document.createElement('div'); ring.className='fx-cursor-ring';
    ring.innerHTML='<span class="lbl">VOIR</span>';
    document.body.append(dot,ring);
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,shown=false;
    addEventListener('mousemove',e=>{
      if(!shown){shown=true;document.body.classList.add('fx-cursor-on');}
      mx=e.clientX;my=e.clientY;
      dot.style.transform=`translate(${mx}px,${my}px)`;},{passive:true});
    (function loop(){
      rx=lerp(rx,mx,0.18); ry=lerp(ry,my,0.18);
      ring.style.transform=`translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    const hoverLink='a,button,label,input,select,textarea,.sim-o,.lang-b';
    document.addEventListener('mouseover',e=>{
      const t=e.target.closest(hoverLink);
      const view=e.target.closest('[data-cursor="view"]');
      ring.classList.toggle('is-link',!!t && !view);
      ring.classList.toggle('is-view',!!view);
    });
    addEventListener('mouseleave',()=>{dot.style.opacity=ring.style.opacity=0;});
    addEventListener('mouseenter',()=>{dot.style.opacity=ring.style.opacity=1;});
  }

  /* ---------------- 3. Fond aurore : léger parallax souris ---------------- */
  function aurora(){
    if(reduce || !fine) return;
    document.querySelectorAll('.fx-aurora').forEach(a=>{
      const blobs=[...a.children];
      a.closest('section,header')?.addEventListener('mousemove',e=>{
        const r=a.getBoundingClientRect();
        const dx=(e.clientX-r.left)/r.width-0.5, dy=(e.clientY-r.top)/r.height-0.5;
        blobs.forEach((b,i)=>{const f=(i+1)*8; b.style.marginLeft=(dx*f)+'px'; b.style.marginTop=(dy*f)+'px';});
      },{passive:true});
    });
  }

  /* ---------------- 4. Mot qui défile dans le titre ---------------- */
  function cycle(){
    const host=document.querySelector('[data-cycle]');
    if(!host) return;
    let words;
    try{ words=JSON.parse(host.getAttribute('data-cycle')); }catch(e){ return; }
    if(!Array.isArray(words)||!words.length) return;
    const slot=document.createElement('span'); slot.className='cy-word';
    const car=document.createElement('span'); car.className='cy-cursor';
    host.append(slot,car);
    let i=0;
    // Traduit le mot si i18n.js est chargé, sinon garde le français
    const tr=w=>(window.nsT?window.nsT(w):w);
    const put=(w,cls)=>{slot.textContent=tr(w);slot.className='cy-word '+cls;};
    put(words[0],'in');
    // Permet à i18n de retraduire le mot courant lors d'un changement de langue
    host._nsRetr=()=>{ slot.textContent=tr(words[i]); };
    if(reduce) return; // un mot fixe suffit si animations réduites
    setInterval(()=>{
      slot.className='cy-word out';
      setTimeout(()=>{ i=(i+1)%words.length; put(words[i],'in'); },430);
    },2600);
  }

  /* ---------------- 5. Halo qui suit la souris sur les cartes ---------------- */
  function spotlight(){
    if(!fine) return;
    document.querySelectorAll('.fx-spot').forEach(c=>{
      c.addEventListener('mousemove',e=>{
        const r=c.getBoundingClientRect();
        c.style.setProperty('--mx',(e.clientX-r.left)+'px');
        c.style.setProperty('--my',(e.clientY-r.top)+'px');
      },{passive:true});
    });
  }

  /* ---------------- 6. Rail horizontal piloté au scroll ---------------- */
  function rail(){
    if(reduce) return;
    document.querySelectorAll('.fx-rail').forEach(sec=>{
      const track=sec.querySelector('.fx-rail-track');
      const sticky=sec.querySelector('.fx-rail-sticky');
      if(!track||!sticky) return;
      if(getComputedStyle(sticky).position!=='sticky') return; // mobile : scroll natif
      const set=()=>{
        const dist=track.scrollWidth-sticky.clientWidth;
        sec.style.height=(sticky.clientHeight+dist)+'px';
        const r=sec.getBoundingClientRect();
        const prog=clamp(-r.top/(sec.offsetHeight-sticky.clientHeight),0,1);
        track.style.transform=`translateX(${-dist*prog}px)`;
      };
      let raf;
      const onScroll=()=>{ if(raf)return; raf=requestAnimationFrame(()=>{set();raf=0;}); };
      addEventListener('scroll',onScroll,{passive:true});
      addEventListener('resize',()=>{track.style.transform='';sec.style.height='';requestAnimationFrame(set);});
      set();
    });
  }

  /* ---------------- 7. Masque révélé au scroll ---------------- */
  function masks(){
    const els=document.querySelectorAll('[data-mask]');
    if(!els.length) return;
    if(reduce){els.forEach(e=>e.classList.add('ns-in'));return;}
    const io=new IntersectionObserver(es=>{
      es.forEach(x=>{ if(x.isIntersecting){x.target.classList.add('ns-in');io.unobserve(x.target);} });
    },{threshold:.35});
    els.forEach(e=>io.observe(e));
  }

  /* ---------------- 8. Index de section flottant ---------------- */
  function dots(){
    const nav=document.getElementById('fxDots');
    if(!nav) return;
    const links=[...nav.querySelectorAll('a')];
    const secs=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if(!secs.length){nav.remove();return;}
    const io=new IntersectionObserver(es=>{
      es.forEach(x=>{ if(x.isIntersecting){
        const id='#'+x.target.id;
        links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')===id));
      }});
    },{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(s=>io.observe(s));
    links.forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:reduce?'auto':'smooth'});
    }));
  }

  /* ---------------- 9. GLOBE hébergement luxembourgeois ---------------- */
  function globe(){
    const cv=document.getElementById('fxGlobe');
    if(!cv) return;
    const ctx=cv.getContext('2d');
    const style=getComputedStyle(document.documentElement);
    const col=n=>style.getPropertyValue(n).trim()||'#3b78ff';
    let W=0,H=0,R,cx,cy,dpr;
    function size(){
      dpr=Math.min(devicePixelRatio||1,2);
      const box=cv.getBoundingClientRect();
      if(!box.width||!box.height) return; // pas encore mis en page
      W=box.width;H=box.height;
      cv.width=W*dpr;cv.height=H*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      R=Math.min(W,H)*0.42;cx=W/2;cy=H/2;
    }
    size();
    addEventListener('resize',size);
    // Recalcule dès que la taille réelle du canvas change (fin du préchargeur, mise en page)
    if(window.ResizeObserver) new ResizeObserver(size).observe(cv);

    // Le Luxembourg, mis en avant. Points ≈ grandes villes reliées au datacenter LU.
    const LUX={lat:49.61,lon:6.13};
    const cities=[
      {lat:48.85,lon:2.35},{lat:50.85,lon:4.35},{lat:52.52,lon:13.40},{lat:51.51,lon:-0.13},
      {lat:41.90,lon:12.50},{lat:40.42,lon:-3.70},{lat:47.37,lon:8.54},{lat:52.37,lon:4.90},
      {lat:38.72,lon:-9.14},{lat:45.46,lon:9.19},{lat:59.33,lon:18.06},{lat:48.21,lon:16.37}
    ];
    // Contours des terres émergées (assets/terres.js, Natural Earth, domaine public).
    // Si le fichier n'est pas là, on retombe sur une grille de points : le globe
    // tourne quand même, il est juste moins beau.
    const TERRES = window.NS_TERRES || null;
    const dotsG=[];
    if(!TERRES){ for(let la=-80;la<=80;la+=8) for(let lo=-180;lo<180;lo+=8) dotsG.push({lat:la,lon:lo}); }

    const RAD=Math.PI/180;
    function project(lat,lon,rot){
      const p=lat*RAD, t=(lon+rot)*RAD;
      const x=Math.cos(p)*Math.sin(t), y=Math.sin(p), z=Math.cos(p)*Math.cos(t);
      return {x:cx+x*R,y:cy-y*R,z};
    }
    /* Dessine les terres d'une face. Un point du mauvais côté est rabattu sur
       le bord du globe : la découpe suit alors le limbe au lieu de couper à
       la corde, et les continents se referment proprement sur le contour. */
    function terres(rot, avant, alpha, couleur){
      if(!TERRES) return;
      ctx.globalAlpha=alpha; ctx.fillStyle=couleur;
      for(let k=0;k<TERRES.length;k++){
        const ring=TERRES[k], n=ring.length, pts=new Array(n);
        let vus=0;
        for(let i=0;i<n;i++){
          const q=project(ring[i][1], ring[i][0], rot);
          if(avant ? q.z>=0 : q.z<0){ vus++; pts[i]=q; }
          else{
            const dx=q.x-cx, dy=q.y-cy, d=Math.sqrt(dx*dx+dy*dy)||1;
            pts[i]={x:cx+dx/d*R, y:cy+dy/d*R};
          }
        }
        if(vus<3) continue;                     // anneau entièrement de l'autre côté
        ctx.beginPath();
        ctx.moveTo(pts[0].x,pts[0].y);
        for(let i=1;i<n;i++) ctx.lineTo(pts[i].x,pts[i].y);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    let rot=0,last=performance.now();
    // Visible = le canvas croise la fenêtre. Test direct, fiable en toute situation.
    const visible=()=>{ const r=cv.getBoundingClientRect(); return r.bottom>0 && r.top<innerHeight; };

    function frame(now){
      // Boucle toujours vivante : on saute simplement le dessin hors écran.
      requestAnimationFrame(frame);
      const dt=Math.min(now-last,60);last=now;
      if(!visible()) return;
      if(!W||!H){ size(); if(!W||!H) return; }
      if(!reduce) rot=(rot+dt*0.012)%360;
      ctx.clearRect(0,0,W,H);

      // halo
      const g=ctx.createRadialGradient(cx,cy,R*0.2,cx,cy,R*1.35);
      g.addColorStop(0,col('--glow')); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,R*1.35,0,7); ctx.fill();

      const ink=col('--soft'), acc=col('--acc2'), accd=col('--acc');

      if(TERRES){
        /* La sphère reste vide : c'est ce qui permet de voir à travers.
           On pose d'abord la face cachée, très en retrait, puis le contour
           du globe, puis la face tournée vers nous. */
        terres(rot, false, 0.19, ink);
        ctx.globalAlpha=0.5; ctx.strokeStyle=col('--line2'); ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke(); ctx.globalAlpha=1;
        terres(rot, true, 0.82, ink);
      } else {
        dotsG.forEach(d=>{
          const q=project(d.lat,d.lon,rot);
          if(q.z<0) return;
          ctx.globalAlpha=0.15+q.z*0.5; ctx.fillStyle=ink;
          ctx.beginPath(); ctx.arc(q.x,q.y,0.9+q.z*0.9,0,7); ctx.fill();
        });
        ctx.globalAlpha=1;
      }

      // arcs depuis le Luxembourg
      const lu=project(LUX.lat,LUX.lon,rot);
      cities.forEach((c,i)=>{
        const q=project(c.lat,c.lon,rot);
        const mid={x:(lu.x+q.x)/2,y:(lu.y+q.y)/2};
        const lift=(0.6+((lu.z+q.z)/2))*R*0.28;
        const cxp=mid.x,cyp=mid.y-lift;
        const front=(lu.z+q.z)/2>-0.1;
        ctx.globalAlpha=front?0.34:0.08;   // les continents sont le sujet, les arcs le décor
        ctx.strokeStyle=accd; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(lu.x,lu.y); ctx.quadraticCurveTo(cxp,cyp,q.x,q.y); ctx.stroke();
        // impulsion lumineuse qui court le long de l'arc
        if(!reduce && front){
          const tt=((now*0.0004)+i*0.16)%1;
          const bx=(1-tt)*(1-tt)*lu.x+2*(1-tt)*tt*cxp+tt*tt*q.x;
          const by=(1-tt)*(1-tt)*lu.y+2*(1-tt)*tt*cyp+tt*tt*q.y;
          ctx.globalAlpha=0.9; ctx.fillStyle=acc;
          ctx.beginPath(); ctx.arc(bx,by,1.8,0,7); ctx.fill();
        }
        if(q.z>0){ ctx.globalAlpha=0.85; ctx.fillStyle=accd;
          ctx.beginPath(); ctx.arc(q.x,q.y,1.6,0,7); ctx.fill(); }
      });
      ctx.globalAlpha=1;

      // le Luxembourg : point pulsé mis en valeur
      if(lu.z>-0.2){
        const pulse=reduce?3:3+Math.sin(now*0.004)*1.6;
        ctx.fillStyle=acc; ctx.shadowColor=acc; ctx.shadowBlur=16;
        ctx.beginPath(); ctx.arc(lu.x,lu.y,pulse,0,7); ctx.fill();
        ctx.shadowBlur=0;
        ctx.strokeStyle=acc; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.arc(lu.x,lu.y,pulse+5,0,7); ctx.stroke();
        ctx.globalAlpha=1;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- Vérificateur de nom de domaine ----------------
     Aucun backend, aucune clé : on interroge le DNS public de Google
     (DNS-over-HTTPS, CORS autorisé). Un domaine qui répond NXDOMAIN
     est très probablement libre ; un domaine avec des enregistrements
     NS est pris. C'est une indication fiable, confirmée à la réservation. */
  function domain(){
    const form=document.getElementById('domForm');
    if(!form) return;
    const input=document.getElementById('domInput');
    const out=document.getElementById('domResults');
    const cta=document.getElementById('domCta');
    const EXTS=['lu','com','be','fr','eu'];
    const T=s=>(window.nsT?window.nsT(s):s);

    const clean=v=>v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,63);

    async function check(fqdn){
      // renvoie 'free' | 'taken' | 'error'
      const url='https://dns.google/resolve?name='+encodeURIComponent(fqdn)+'&type=NS';
      const ctrl=new AbortController();
      const to=setTimeout(()=>ctrl.abort(),6000);
      try{
        const r=await fetch(url,{signal:ctrl.signal});
        clearTimeout(to);
        if(!r.ok) return 'error';
        const j=await r.json();
        if(j.Status===3) return 'free';                 // NXDOMAIN → libre
        if(j.Status===0 && Array.isArray(j.Answer) && j.Answer.length) return 'taken';
        if(j.Status===0) return 'free';                 // pas de délégation → probablement libre
        return 'error';
      }catch(e){ clearTimeout(to); return 'error'; }
    }

    const labels={
      free:'Disponible', taken:'Déjà pris', checking:'Vérification…', error:'À confirmer'
    };

    form.addEventListener('submit',async ev=>{
      ev.preventDefault();
      const base=clean(input.value);
      if(!base){ input.focus(); return; }
      input.value=base;
      cta.classList.remove('on');
      // Prépare une carte par extension, en état "vérification"
      out.innerHTML='';
      const cards={};
      EXTS.forEach((ext,i)=>{
        const el=document.createElement('div');
        el.className='dom-res checking';
        el.style.animationDelay=(i*60)+'ms';
        el.innerHTML='<span class="dn"><em>'+base+'</em>.'+ext+'</span>'
          +'<span class="ds">'+T(labels.checking)+'</span>';
        out.appendChild(el);
        cards[ext]=el;
      });
      // Lance les vérifications en parallèle
      let libre=0;
      await Promise.all(EXTS.map(async ext=>{
        const state=await check(base+'.'+ext);
        const el=cards[ext];
        el.className='dom-res '+state;
        el.querySelector('.ds').textContent=T(labels[state]);
        if(state==='free') libre++;
      }));
      if(libre>0) cta.classList.add('on');
    });
  }

  /* ---------------- Carte photo 3D (Samir) ----------------
     Deux mouvements combinés :
     - la souris incline la carte en direct (présence, profondeur) ;
     - le défilement la fait basculer doucement, « comme s'il y était ». */
  function photo3d(){
    const wrap=document.getElementById('samCard');
    if(!wrap) return;
    const card=wrap.querySelector('.tm3d-card');
    const shine=wrap.querySelector('.tm3d-shine');
    const MAXX=12, MAXY=9; // amplitude d'inclinaison souris (deg)

    if(fine && !reduce){
      wrap.addEventListener('mousemove',e=>{
        const r=wrap.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        card.style.setProperty('--rx',((px-0.5)*2*MAXX).toFixed(2)+'deg');
        card.style.setProperty('--ry',(-(py-0.5)*2*MAXY).toFixed(2)+'deg');
        if(shine){ shine.style.setProperty('--mx',(px*100).toFixed(1)+'%'); shine.style.setProperty('--my',(py*100).toFixed(1)+'%'); }
        card.classList.add('dragging');
      },{passive:true});
      wrap.addEventListener('mouseleave',()=>{
        card.classList.remove('dragging');
        card.style.setProperty('--rx','0deg');
        card.style.setProperty('--ry','0deg');
      });
    }

    if(!reduce){
      // Bascule liée au défilement : la carte penche selon sa position dans l'écran
      let raf;
      const onScroll=()=>{
        if(raf) return;
        raf=requestAnimationFrame(()=>{
          const r=wrap.getBoundingClientRect();
          const centre=r.top+r.height/2;
          const p=clamp((centre/innerHeight-0.5)*-2,-1,1); // -1 (haut) .. 1 (bas)
          card.style.setProperty('--st',(p*6).toFixed(2)+'deg');
          raf=0;
        });
      };
      addEventListener('scroll',onScroll,{passive:true});
      onScroll();
    }
  }

  /* ---------------- init ---------------- */
  function init(){
    domain(); photo3d();
    // dots() retiré : l'index de sections s'affichait au centre de l'écran (les « petits traits »).
    preload(); cursor(); aurora(); cycle(); spotlight();
    masks(); rail(); globe();
  }
  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
