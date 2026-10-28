/* NS Development : maquettes sur écran + prise de rendez-vous. Ajouté le 28/10/2026. */
(function(){
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Maquettes : la page défile dans l'écran quand on défile la page ===== */
  var mq = document.querySelector('[data-mq]');
  if (mq) {
    var pc = mq.querySelector('.mq-pc'), tel = mq.querySelector('.mq-tel');
    var ecranPc = mq.querySelector('.mq-screen'), ecranTel = mq.querySelector('.mq-pscreen');
    var stage = mq.querySelector('.mq-stage'), cap = mq.querySelector('.mq-cap-nom'), lien = mq.querySelector('.mq-cap-lien');
    var onglets = [].slice.call(mq.querySelectorAll('.mq-tab'));
    var cur = {a:0, b:0}, cible = 0, enCours = false;

    function course(img, ecran){ return Math.max(0, img.offsetHeight - ecran.offsetHeight); }
    function mesure(){
      var r = stage.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height);
      cible = Math.min(1, Math.max(0, (p - .12) / .66));
    }
    function dessine(){
      cur.a += (cible - cur.a) * .12;
      cur.b += (Math.min(1, cible * 1.08) - cur.b) * .12;
      pc.style.transform = 'translate3d(0,' + (-cur.a * course(pc, ecranPc)).toFixed(1) + 'px,0)';
      tel.style.transform = 'translate3d(0,' + (-cur.b * course(tel, ecranTel)).toFixed(1) + 'px,0)';
      if (Math.abs(cible - cur.a) > .001 || Math.abs(cible - cur.b) > .01) requestAnimationFrame(dessine); else enCours = false;
    }
    function lance(){ mesure(); if (reduit) return; if (!enCours) { enCours = true; requestAnimationFrame(dessine); } }
    window.addEventListener('scroll', lance, {passive:true});
    window.addEventListener('resize', lance);

    function choisis(btn, focus){
      onglets.forEach(function(b){ b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); b.tabIndex = b === btn ? 0 : -1; });
      var k = btn.getAttribute('data-k');
      pc.src = 'assets/maquettes/' + k + '-pc.jpg';
      tel.src = 'assets/maquettes/' + k + '-tel.jpg';
      cap.textContent = btn.textContent;
      lien.href = btn.getAttribute('data-href');
      cur.a = cur.b = 0; lance();
      if (focus) btn.focus();
    }
    onglets.forEach(function(b, i){
      b.addEventListener('click', function(){ choisis(b); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); choisis(onglets[(i + d + onglets.length) % onglets.length], true); }
      });
    });
    pc.addEventListener('load', lance); tel.addEventListener('load', lance);
    lance();
  }

  /* ===== Rendez-vous : on propose un créneau, la demande part par e-mail ===== */
  var dlg = document.getElementById('rdv');
  if (!dlg || !dlg.showModal) return;
  var MAIL = 'nsdevelopment26@gmail.com';
  var HEURES = ['09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00','16:30','17:00','17:30'];
  var jours = dlg.querySelector('[data-rdv-jours]'), heures = dlg.querySelector('[data-rdv-heures]');
  var ok = dlg.querySelector('.rdv-ok'), fin = dlg.querySelector('.rdv-done');
  var etat = {jour:null, heure:null};

  function prochainsJours(n){
    var out = [], d = new Date();
    d.setHours(12,0,0,0);
    while (out.length < n) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) out.push(new Date(d)); }
    return out;
  }
  function bouton(html, pressed, cls){
    var b = document.createElement('button'); b.type = 'button'; b.className = 'rdv-chip' + (cls ? ' ' + cls : '');
    b.innerHTML = html; b.setAttribute('aria-pressed', 'false'); return b;
  }
  function une(liste, b){ [].forEach.call(liste.children, function(c){ c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); }); }
  function maj(){ ok.disabled = !(etat.jour && etat.heure && dlg.querySelector('[name=nom]').value.trim() && dlg.querySelector('[name=tel]').value.trim()); }

  prochainsJours(6).forEach(function(d){
    var court = d.toLocaleDateString('fr-FR', {weekday:'short'}).replace('.', '');
    var b = bouton('<span>' + court + '</span><small>' + d.getDate() + ' ' + d.toLocaleDateString('fr-FR', {month:'short'}).replace('.', '') + '</small>', false, 'rdv-day');
    b.addEventListener('click', function(){ etat.jour = d; une(jours, b); maj(); });
    jours.appendChild(b);
  });
  HEURES.forEach(function(h){
    var b = bouton(h.replace(':', ' h '), false);
    b.addEventListener('click', function(){ etat.heure = h; une(heures, b); maj(); });
    heures.appendChild(b);
  });
  dlg.addEventListener('input', maj);

  [].forEach.call(document.querySelectorAll('[data-rdv-open]'), function(el){
    el.addEventListener('click', function(e){ e.preventDefault(); fin.style.display = 'none'; dlg.showModal(); });
  });
  dlg.querySelector('.rdv-x').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });

  ok.addEventListener('click', function(){
    var nom = dlg.querySelector('[name=nom]').value.trim(), tel = dlg.querySelector('[name=tel]').value.trim();
    var mail = dlg.querySelector('[name=email]').value.trim();
    var quand = etat.jour.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'}) + ' à ' + etat.heure.replace(':', ' h ');
    var s = encodeURIComponent('Rendez-vous téléphonique : ' + quand + ' : ' + nom);
    var b = encodeURIComponent('Je souhaite un appel de 15 minutes.\n\nCréneau proposé : ' + quand + '\nNom : ' + nom + '\nTéléphone : ' + tel + '\nEmail : ' + (mail || 'non renseigné') + '\n');
    window.location.href = 'mailto:' + MAIL + '?subject=' + s + '&body=' + b;
    fin.textContent = 'Votre messagerie s’ouvre avec la demande pré-remplie. Envoyez-la : on vous confirme le créneau par message.';
    fin.style.display = 'block';
  });
})();
