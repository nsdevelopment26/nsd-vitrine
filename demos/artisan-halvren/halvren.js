/* =========================================================
   HALVREN — comportements communs aux 5 pages
   Chaque bloc ne s'active que si son élément est dans la page.
   ========================================================= */
(function(){
  "use strict";
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var sansAccent=function(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z]/g,"")};

  /* ---------- menu mobile ---------- */
  var nav=$("nav.top"),burger=$(".burger");
  if(nav&&burger){
    var ferme=function(){nav.classList.remove("ouvert");burger.setAttribute("aria-expanded","false");document.body.style.overflow=""};
    burger.addEventListener("click",function(){
      var o=!nav.classList.contains("ouvert");
      nav.classList.toggle("ouvert",o);burger.setAttribute("aria-expanded",o?"true":"false");
      document.body.style.overflow=o?"hidden":"";
    });
    $$(".menu a").forEach(function(a){a.addEventListener("click",ferme)});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")ferme()});
  }

  /* ---------- boutons d'appel (démo) ---------- */
  var toast=$("#toast"),tt;
  function dire(t){
    if(!toast)return;
    toast.textContent=t;toast.classList.add("on");clearTimeout(tt);
    tt=setTimeout(function(){toast.classList.remove("on")},3400);
  }
  $$("[data-appel]").forEach(function(a){a.addEventListener("click",function(e){
    e.preventDefault();
    dire("Site de démonstration : sur le vrai site, ce bouton appelle directement l’artisan.");
  })});

  /* ---------- statut en direct (heure du Luxembourg, 7 h-22 h) ---------- */
  function heureLux(){
    try{
      var p=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Luxembourg",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(new Date());
      var h=0,m=0;p.forEach(function(x){if(x.type==="hour")h=+x.value;if(x.type==="minute")m=+x.value});
      return h+m/60;
    }catch(e){var d=new Date();return d.getHours()+d.getMinutes()/60}
  }
  function statut(){
    var h=heureLux(),ouvert=h>=7&&h<22;
    $$("[data-statut]").forEach(function(el){
      el.classList.toggle("ferme",!ouvert);
      $(".etat",el).textContent=ouvert?"Ouvert maintenant":"Fermé, rouvre à 7 h";
      $(".detail",el).textContent=ouvert?"un technicien peut partir":"laissez votre demande de devis";
    });
  }
  if($("[data-statut]")){statut();setInterval(statut,60000)}

  /* ---------- avant / après ---------- */
  $$(".compare").forEach(function(cmp){
    var rg=$("input",cmp);
    var pos=function(){cmp.style.setProperty("--pos",rg.value+"%")};
    rg.addEventListener("input",pos);pos();
  });

  /* ---------- accueil : quel est votre problème ---------- */
  var rep=$("#reponse");
  if(rep){
    var PB={
      fuite:{t:"Fuite d’eau",p:"plomberie.html",a:["Coupez l’arrivée d’eau générale (souvent sous l’évier ou près du compteur).","Coupez l’électricité si l’eau approche d’une prise.","Prenez une photo, elle nous aide à venir avec la bonne pièce."]},
      courant:{t:"Panne de courant",p:"electricite.html",a:["Regardez si c’est tout le quartier ou seulement chez vous.","Relevez le disjoncteur général une seule fois. S’il retombe, ne forcez pas.","Odeur de brûlé ou chaleur au tableau : ne touchez à rien et appelez."]},
      porte:{t:"Porte claquée",p:"serrurerie.html",a:["Ne forcez pas la serrure, ça coûte plus cher après.","Restez joignable au téléphone, on vous rappelle à l’approche.","Préparez une pièce d’identité à votre adresse."]},
      chauffage:{t:"Plus de chauffage",p:"chauffage.html",a:["Vérifiez la pression de la chaudière (entre 1 et 2 bars en général).","Notez le code d’erreur affiché, s’il y en a un.","Prenez une photo de l’écran et de la plaque de la chaudière."]}
    };
    var montre=function(k){
      var p=PB[k];
      rep.innerHTML="<h3>"+p.t+" : en attendant</h3><ol>"+p.a.map(function(x){return "<li>"+x+"</li>"}).join("")+"</ol><a class=\"plus ns-link\" href=\""+p.p+"\">Tout savoir sur ce problème →</a>";
      $$(".puce[data-pb]").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.pb===k?"true":"false")});
    };
    $$(".puce[data-pb]").forEach(function(b){b.addEventListener("click",function(){montre(b.dataset.pb)})});
    montre("fuite");
  }

  /* ---------- accueil : galerie de chantiers filtrable ---------- */
  var gal=$("#galerie");
  if(gal){
    var grand=$("#grand"),leg=$("#grand-legende"),vigs=$$(".vig",gal);
    var choisir=function(v){
      vigs.forEach(function(x){x.setAttribute("aria-pressed",x===v?"true":"false")});
      grand.className="compare "+v.dataset.sc;
      leg.textContent=v.dataset.legende;
      var rg=$("input",grand);rg.value=50;grand.style.setProperty("--pos","50%");
    };
    vigs.forEach(function(v){v.addEventListener("click",function(){choisir(v)})});
    $$(".filtre").forEach(function(f){f.addEventListener("click",function(){
      $$(".filtre").forEach(function(x){x.setAttribute("aria-pressed",x===f?"true":"false")});
      var m=f.dataset.m,premier=null;
      vigs.forEach(function(v){var ok=m==="tous"||v.dataset.m===m;v.hidden=!ok;if(ok&&!premier)premier=v});
      if(premier)choisir(premier);
    })});
  }

  /* ---------- accueil : on vient chez vous ? ---------- */
  var vf=$("#verif");
  if(vf){
    var ZONE=["Esch-sur-Alzette","Differdange","Dudelange","Pétange","Bettembourg","Luxembourg","Strassen","Bertrange","Mamer","Hesperange","Mersch","Sanem","Schifflange","Kayl","Rumelange","Mondercange","Käerjeng","Leudelange","Roeser","Walferdange","Steinsel","Sandweiler","Niederanven","Kopstal","Kehlen","Garnich","Dippach","Reckange-sur-Mess","Frisange","Weiler-la-Tour","Contern","Schuttrange","Lorentzweiler","Lintgen","Steinfort","Habscht","Bissen","Mondorf-les-Bains","Bascharage","Belvaux","Soleuvre","Rodange","Howald","Cessange","Kirchberg","Limpertsberg","Bonnevoie","Gasperich","Capellen","Lallange"];
    var dl=$("#communes");
    ZONE.slice().sort(function(a,b){return a.localeCompare(b,"fr")}).forEach(function(c){var o=document.createElement("option");o.value=c;dl.appendChild(o)});
    var idx={};ZONE.forEach(function(c){idx[sansAccent(c)]=c});
    vf.addEventListener("submit",function(e){
      e.preventDefault();
      var v=$("input",vf).value.trim(),out=$("#verdict");
      if(!v){out.className="verdict";out.textContent="Tapez le nom de votre commune.";return}
      var c=idx[sansAccent(v)];
      if(c){out.className="verdict oui";out.textContent="Oui, on intervient à "+c+". Appelez, on vous dit au téléphone quand on peut être là."}
      else{out.className="verdict non";out.textContent="« "+v+" » n’est pas dans notre zone habituelle. Appelez quand même : si on ne peut pas venir, on vous le dit tout de suite."}
    });
  }

  /* ---------- devis en 4 étapes ---------- */
  var form=$("#form");
  if(form){
    var e=1,suiv=$("#suiv"),prec=$("#prec"),pas=$$(".pas span",form),apercu=$("#apercu");
    // ?type=Chauffage arrive depuis les pages métiers
    var q=new URLSearchParams(location.search).get("type");
    if(q){var r=$("input[name=type][value=\""+q+"\"]",form);if(r)r.checked=true}
    $("#photos",form).addEventListener("change",function(){
      apercu.innerHTML="";
      Array.prototype.slice.call(this.files,0,4).forEach(function(f){
        if(!/^image\//.test(f.type))return;
        var im=document.createElement("img");im.alt="Photo jointe : "+f.name;im.src=URL.createObjectURL(f);apercu.appendChild(im);
      });
      $(".photo span",form).textContent=this.files.length?this.files.length+" photo(s) jointe(s), touchez pour changer":"Ajouter une ou plusieurs photos";
    });
    var erreur=function(ch,msg){
      var l=ch.closest(".champ");l.classList.toggle("err",!!msg);
      var m=$(".msg",l);if(!m){m=document.createElement("span");m.className="msg";l.appendChild(m)}
      m.textContent=msg||"";return !msg;
    };
    var valide=function(){
      if(e===2){var d=$("#desc",form);return erreur(d,d.value.trim().length<8?"Une phrase suffit, mais il nous faut un peu plus de détails.":"")}
      if(e===3){
        var n=$("#nom",form),t=$("#tel",form),c=$("#commune",form);
        var a=erreur(n,n.value.trim()?"":"Comment vous appelez-vous ?");
        var b=erreur(t,t.value.replace(/\D/g,"").length>=8?"":"Un numéro où vous rappeler, au moins 8 chiffres.");
        var d2=erreur(c,c.value.trim()?"":"Dans quelle commune ?");
        return a&&b&&d2;
      }
      return true;
    };
    var recap=function(){
      var type=$("input[name=type]:checked",form).value,urg=$("input[name=quand]:checked",form).value;
      var ph=$("#photos",form).files.length;
      $("#recap",form).innerHTML=[["Métier",type],["Quand",urg],["Photos",ph?ph+" jointe(s)":"aucune"],["Nom",$("#nom",form).value.trim()],["Téléphone",$("#tel",form).value.trim()],["Commune",$("#commune",form).value.trim()]]
        .map(function(x){var li=document.createElement("li");li.innerHTML="<span></span><b></b>";li.firstChild.textContent=x[0];li.lastChild.textContent=x[1];return li.outerHTML}).join("");
    };
    var maj=function(){
      $$(".etape-f",form).forEach(function(x){x.classList.toggle("on",+x.dataset.e===e)});
      pas.forEach(function(s,i){s.classList.toggle("on",i<Math.min(e,4))});
      prec.hidden=(e===1||e===5);suiv.hidden=(e===5);
      suiv.textContent=e===4?"Envoyer la demande":"Continuer";
      if(e===4)recap();
    };
    suiv.addEventListener("click",function(){
      if(!valide())return;
      if(e<5){e++;maj();form.scrollIntoView({behavior:"smooth",block:"start"})}
    });
    prec.addEventListener("click",function(){if(e>1){e--;maj()}});
    maj();
  }

  /* =========================================================
     OUTILS DES PAGES MÉTIERS
     ========================================================= */

  /* ---------- plomberie : couper l'eau, pas à pas ---------- */
  var plo=$("#plomberie-outil");
  if(plo){
    var LIEUX={
      appart:["Repérez la vanne de votre logement : sous l’évier de la cuisine, dans le placard technique ou près du compteur d’eau.","Tournez-la dans le sens des aiguilles d’une montre jusqu’au bout, sans forcer.","Ouvrez un robinet : s’il ne coule plus, l’eau est coupée.","Prévenez le voisin du dessous si l’eau a traversé.","Prenez une photo de la fuite et de la vanne."],
      maison:["Descendez à la cave ou au local technique : la vanne est juste après le compteur d’eau.","Tournez-la dans le sens des aiguilles d’une montre jusqu’au bout, sans forcer.","Ouvrez un robinet à l’étage : s’il ne coule plus, l’eau est coupée.","Si l’eau touche une prise ou un appareil, coupez aussi le disjoncteur général.","Prenez une photo de la fuite et de la vanne."]
    };
    var liste=$("#coche"),jauge=$("#jauge i"),fin=$("#plomberie-fin");
    var compte=function(){
      var cs=$$("input",liste),n=cs.filter(function(c){return c.checked}).length;
      jauge.style.transform="scaleX("+(n/cs.length)+")";
      fin.hidden=n<cs.length;
    };
    var remplir=function(k){
      $$(".seg button",plo).forEach(function(b){b.setAttribute("aria-pressed",b.dataset.l===k?"true":"false")});
      liste.innerHTML=LIEUX[k].map(function(t,i){return "<li><label><input type=\"checkbox\" id=\"c"+i+"\"><span>"+t+"</span></label></li>"}).join("");
      $$("input",liste).forEach(function(c){c.addEventListener("change",compte)});
      compte();
    };
    $$(".seg button",plo).forEach(function(b){b.addEventListener("click",function(){remplir(b.dataset.l)})});
    remplir("appart");
  }

  /* ---------- chauffage : le manomètre ---------- */
  var man=$("#mano-curseur");
  if(man){
    var aig=$("#aiguille"),val=$("#mano-val"),cons=$("#chauffage-conseil");
    var lire=function(){
      var b=man.value/10;
      aig.style.transform="rotate("+(-90+b*45)+"deg)";
      val.innerHTML=b.toFixed(1).replace(".",",")+" <small>bar</small>";
      man.setAttribute("aria-valuetext",b.toFixed(1).replace(".",",")+" bar");
      var h;
      if(b<1)h="<span class=\"niveau rouge\">Trop basse</span><h3>La pression est <em>trop basse</em></h3><p>C’est la première cause d’une chaudière qui se met en sécurité.</p><ol><li>Chaudière froide, ouvrez doucement le robinet de remplissage (souvent sous la chaudière, voir votre notice).</li><li>Refermez vers 1,5 bar.</li><li>Relancez la chaudière.</li></ol><p>Si la pression redescend dans la semaine, il y a une fuite sur le circuit : appelez.</p>";
      else if(b<=2.5)h="<span class=\"niveau vert\">Normale</span><h3>La pression est <em>bonne</em></h3><p>Entre 1 et 2 bars à froid, un peu plus quand la chaudière chauffe : c’est la zone habituelle. Le problème est ailleurs : notez le code affiché à l’écran et prenez-le en photo.</p><ol><li>Vérifiez que le thermostat demande bien de la chaleur.</li><li>Coupez et rallumez la chaudière une seule fois.</li><li>Toujours rien ? Appelez avec le code et la marque de la chaudière.</li></ol>";
      else h="<span class=\"niveau rouge\">Trop haute</span><h3>La pression est <em>trop haute</em></h3><p>Au-delà de 2,5 bars, la soupape de sécurité peut s’ouvrir et laisser couler de l’eau.</p><ol><li>Ne touchez pas au robinet de remplissage.</li><li>Éteignez la chaudière.</li><li>Appelez : c’est souvent le vase d’expansion ou le robinet de remplissage qui fuit.</li></ol>";
      cons.innerHTML=h;
    };
    man.addEventListener("input",lire);lire();
  }

  /* ---------- serrurerie : la situation ---------- */
  var ser=$("#serrurerie-outil");
  if(ser){
    var SIT={
      claquee:{n:"Ouverture sans casse, le plus souvent",c:"vert",t:"Porte <em>claquée</em>",p:"La porte est fermée mais pas verrouillée à clé : c’est le cas le plus simple.",a:["On ouvre sans percer ni abîmer la serrure dans la grande majorité des cas.","Gardez votre téléphone allumé, on vous rappelle à l’approche.","Préparez de quoi prouver que vous habitez là : pièce d’identité, courrier, bail."]},
      cle:{n:"Ça dépend de la serrure",c:"",t:"Fermée <em>à clé</em>",p:"Clé perdue ou restée à l’intérieur, porte verrouillée.",a:["On tente d’abord l’ouverture sans casse. Sur une serrure de sûreté, il faut parfois changer le cylindre.","Si un cylindre doit être changé, le prix vous est annoncé avant.","Pensez à la clé de secours : voisin, famille, agence."]},
      cassee:{n:"Sans casse, le plus souvent",c:"vert",t:"Clé <em>cassée</em> dedans",p:"Un morceau de clé est resté dans la serrure.",a:["Ne tentez pas de l’extraire avec une pince ou un trombone : vous l’enfoncez.","On extrait le morceau et on vous refait une clé si le reste est intact.","Gardez le morceau que vous avez en main, il sert de modèle."]},
      bloquee:{n:"À voir sur place",c:"",t:"Serrure <em>bloquée</em>",p:"La clé tourne dans le vide, ou ne tourne plus du tout.",a:["Ne forcez pas : une clé tordue dans la serrure complique tout.","Une pièce cassée à l’intérieur se remplace en général dans la journée.","Envoyez une photo de la serrure côté extérieur par le formulaire de devis."]}
    };
    var cs2=$("#serrurerie-conseil");
    var voir=function(k){
      var s=SIT[k];
      $$(".puce",ser).forEach(function(b){b.setAttribute("aria-pressed",b.dataset.s===k?"true":"false")});
      cs2.innerHTML="<span class=\"niveau "+s.c+"\">"+s.n+"</span><h3>"+s.t+"</h3><p>"+s.p+"</p><ul>"+s.a.map(function(x){return "<li>"+x+"</li>"}).join("")+"</ul><a class=\"btn\" href=\"#appel\" data-appel>Appeler maintenant</a>";
      $("[data-appel]",cs2).addEventListener("click",function(ev){ev.preventDefault();dire("Site de démonstration : sur le vrai site, ce bouton appelle directement l’artisan.")});
    };
    $$(".puce",ser).forEach(function(b){b.addEventListener("click",function(){voir(b.dataset.s)})});
    voir("claquee");
  }

  /* ---------- électricité : le tableau ---------- */
  var tab=$("#tableau");
  if(tab){
    var ce=$("#electricite-conseil");
    var DIAG={
      diff:"<span class=\"niveau rouge\">Différentiel</span><h3>C’est le <em>différentiel</em> qui a sauté</h3><p>Il protège les personnes : il coupe quand un appareil laisse fuir du courant, souvent un lave-linge, un four ou une prise extérieure humide.</p><ol><li>Débranchez les gros appareils de la maison.</li><li>Relevez le différentiel.</li><li>Rebranchez les appareils un par un : celui qui le refait sauter est le coupable. Laissez-le débranché.</li></ol><p>S’il saute même avec tout débranché, appelez : le défaut est dans l’installation.</p>",
      circuit:function(n){return "<span class=\"niveau\">Un seul circuit</span><h3>Le circuit <em>"+n+"</em> est coupé</h3><p>Un disjoncteur divisionnaire coupe quand le circuit est surchargé ou en court-circuit.</p><ol><li>Débranchez ce qui tourne sur ce circuit.</li><li>Relevez le disjoncteur une seule fois.</li><li>S’il retombe aussitôt, laissez-le baissé et appelez. Ne le bloquez jamais en position haute.</li></ol>"},
      rien:"<h3>Touchez la manette <em>qui est tombée</em></h3><p>Ouvrez votre tableau électrique, repérez la manette baissée et touchez la même sur ce tableau. On vous dit quoi faire.</p><p>Odeur de brûlé, manette chaude ou bruit de grésillement : ne touchez à rien et appelez.</p>"
    };
    ce.innerHTML=DIAG.rien;
    $$(".disj",tab).forEach(function(d){d.addEventListener("click",function(){
      var deja=d.getAttribute("aria-pressed")==="true";
      $$(".disj",tab).forEach(function(x){x.setAttribute("aria-pressed","false")});
      if(deja){ce.innerHTML=DIAG.rien;return}
      d.setAttribute("aria-pressed","true");
      ce.innerHTML=d.classList.contains("diff")?DIAG.diff:DIAG.circuit(d.dataset.nom);
    })});
  }
})();
