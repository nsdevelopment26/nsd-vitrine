/* NS Development : prise de rendez-vous. Ajouté le 28/10/2026. */
(function(){
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
