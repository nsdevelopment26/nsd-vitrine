/* ============================================================================
   NS Development — Espace du professionnel
   Module de réservation en ligne. Version 1.0
   ----------------------------------------------------------------------------
   Une seule installation sert TOUS les clients : le professionnel se connecte,
   et son établissement se déduit de son compte. Il n'y a rien à configurer
   par client, et rien à redéployer quand un client s'ajoute.

   Deux sources de données, choisies au démarrage :

     supabase  la production. Le professionnel voit son agenda réel. La
               séparation entre clients est garantie par la base (RLS), pas
               par cette page : trafiquer le JavaScript ne donne accès à rien.

     démo      ?demo=1 dans l'adresse. Jeu de données fabriqué, en mémoire.
               Sert à montrer le back-office pendant un rendez-vous
               commercial, et à vérifier l'interface sans toucher au réel.
   ============================================================================ */

/* ==========================================================================
   Raccordement au projet NS Development
   La clé ci-dessous est la clé PUBLIQUE : elle est faite pour vivre dans une
   page web. La sécurité vient des règles de rôle en base, pas de son secret.
   ========================================================================== */
const SUPABASE_URL = 'https://atgykykesntvporvbvuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CERC6vjpnV91Fh_2mA4VTQ_I0jcJ05F';

const PARAMS = new URLSearchParams(location.search);
const MODE_VITRINE = PARAMS.get('vitrine');
const MODE_DEMO = PARAMS.has('demo') || !!MODE_VITRINE;


/* ==========================================================================
   Aides
   ========================================================================== */
const JOURS   = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS    = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0];   // la semaine commence le lundi

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const pad  = n => String(n).padStart(2, '0');
const cle  = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const depuisCle = k => new Date(k + 'T00:00:00');
const ajoute = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const lundiDe = d => { const x = new Date(d); x.setHours(0,0,0,0); const j = x.getDay(); return ajoute(x, j === 0 ? -6 : 1 - j); };
const joli = d => `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
// « vendredi 7 août » → « Vendredi 7 août ». On majuscule en JavaScript et
// non en CSS : `text-transform: capitalize` majusculerait aussi « Août ».
const Joli = d => { const s = joli(d); return s[0].toUpperCase() + s.slice(1); };
const hhmm = t => String(t || '').slice(0, 5);

// Tout ce qui vient de la base ou d'un formulaire passe par ici.
const txt = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function toast(message) {
  const t = $('[data-toast]');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 3200);
}


/* ==========================================================================
   SOURCE « DÉMO »
   Un cabinet crédible, entièrement en mémoire. Rien n'est envoyé nulle part.
   ========================================================================== */
function SourceDemo() {
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  // Mêmes références que la vraie base : alphabet sans caractères qui se
  // confondent à l'oral (pas de 0/O, pas de 1/I/L).
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const ref = () => 'KS-' + Array.from({ length: 5 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

  const etab = {
    id: 'demo', slug: 'demo-cabinet', nom: 'Cabinet de démonstration',
    adresse: '2, Maison — L-6835 Boudler', telephone: '+352 27 74 83 64',
    email_pro: 'demo@nsdevelopment.lu', mode_validation: 'auto',
    pas_minutes: 30, delai_mini_heures: 4, horizon_jours: 42
  };

  const prestations = [
    { id: 'p1', code: 'bilan',    nom: 'Premier bilan',            description: 'Bilan complet et plan de traitement.', duree_minutes: 45, battement_minutes: 0, prix_indicatif: null, ordre: 1, actif: true },
    { id: 'p2', code: 'seance',   nom: 'Séance de suivi',          description: 'Rééducation dans un traitement en cours.', duree_minutes: 30, battement_minutes: 0, prix_indicatif: null, ordre: 2, actif: true },
    { id: 'p3', code: 'sport',    nom: 'Kinésithérapie du sport',  description: 'Blessure, reprise, prévention, taping.', duree_minutes: 45, battement_minutes: 0, prix_indicatif: null, ordre: 3, actif: true },
    { id: 'p4', code: 'drainage', nom: 'Drainage lymphatique',     description: 'Drainage manuel, suites de chirurgie.', duree_minutes: 60, battement_minutes: 0, prix_indicatif: null, ordre: 4, actif: true },
    { id: 'p5', code: 'respi',    nom: 'Rééducation respiratoire', description: 'Adultes et enfants.', duree_minutes: 30, battement_minutes: 0, prix_indicatif: null, ordre: 5, actif: true },
    { id: 'p6', code: 'domicile', nom: 'Visite à domicile',        description: 'Sur prescription.', duree_minutes: 45, battement_minutes: 0, prix_indicatif: null, ordre: 6, actif: false }
  ];

  let sq = 0;
  const ouvertures = [];
  [[1,'08:00','12:00'],[1,'13:30','18:30'],[2,'08:00','12:00'],[2,'13:30','18:30'],
   [3,'08:00','12:00'],[3,'13:30','18:30'],[4,'08:00','12:00'],[4,'13:30','19:00'],
   [5,'08:00','12:00'],[5,'13:30','17:00'],[6,'09:00','12:00']]
    .forEach(([j, d, f]) => ouvertures.push({ id: 'o' + (++sq), jour_semaine: j, debut: d, fin: f }));

  const fermetures = [
    { id: 'f1', du: '2026-08-15', au: '2026-08-15', heure_debut: null, heure_fin: null, motif: 'Assomption' },
    { id: 'f2', du: '2026-08-24', au: '2026-09-04', heure_debut: null, heure_fin: null, motif: 'Congé annuel' }
  ];

  // Une quinzaine de rendez-vous répartis autour d'aujourd'hui.
  const rdv = [];
  const graine = [
    [-2, '09:00', 'p2', 'Marc',    'Weber',    'honore'],
    [-2, '10:30', 'p1', 'Anne',    'Klein',    'honore'],
    [-1, '08:30', 'p2', 'Julie',   'Hoffmann', 'honore'],
    [-1, '14:00', 'p3', 'Tom',     'Reuter',   'absent'],
    [ 0, '08:00', 'p2', 'Léa',     'Thill',    'confirme'],
    [ 0, '09:30', 'p4', 'Sophie',  'Braun',    'confirme'],
    [ 0, '11:00', 'p1', 'Paul',    'Faber',    'confirme'],
    [ 0, '14:00', 'p2', 'Nico',    'Wagner',   'confirme'],
    [ 0, '16:30', 'p5', 'Emma',    'Muller',   'confirme'],
    [ 1, '08:30', 'p2', 'Jean',    'Schmit',   'confirme'],
    [ 1, '10:00', 'p3', 'Lucas',   'Origer',   'en_attente'],
    [ 1, '15:00', 'p4', 'Carine',  'Weis',     'confirme'],
    [ 2, '09:00', 'p1', 'Pierre',  'Kremer',   'confirme'],
    [ 2, '13:30', 'p2', 'Manon',   'Diederich','annule'],
    [ 3, '11:30', 'p2', 'Yves',    'Steffen',  'confirme'],
    [ 4, '09:30', 'p3', 'Sarah',   'Bintz',    'confirme']
  ];
  const notes = {
    'p4': 'Suites d\'une opération, bras droit.',
    'p5': 'Enfant de 7 ans, accompagné de sa mère.',
    'p1': 'Douleur lombaire depuis trois semaines.'
  };
  graine.forEach(([dans, debut, pid, prenom, nom, statut], i) => {
    const p = prestations.find(x => x.id === pid);
    const d = ajoute(auj, dans);
    const [h, m] = debut.split(':').map(Number);
    const fin = pad(Math.floor((h * 60 + m + p.duree_minutes) / 60)) + ':' + pad((h * 60 + m + p.duree_minutes) % 60);
    rdv.push({
      id: 'r' + i, reference: ref(), etablissement_id: 'demo', prestation_id: pid,
      jour: cle(d), debut, fin, fin_visible: fin,
      prestation_nom: p.nom, duree_minutes: p.duree_minutes, statut,
      prenom, nom, telephone: '+352 621 ' + (100000 + i * 7331).toString().slice(0, 6),
      email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@exemple.lu`,
      note: i % 4 === 0 ? (notes[pid] || null) : null,
      premiere_visite: pid === 'p1',
      source: i % 5 === 0 ? 'telephone' : 'site'
    });
  });

  const copie = o => JSON.parse(JSON.stringify(o));
  const ok = v => Promise.resolve(copie(v));

  return {
    demo: true,
    sessionActive: () => Promise.resolve({ email: 'demonstration@nsdevelopment.lu' }),
    connexion: () => Promise.resolve({}),
    deconnexion: () => Promise.resolve(),
    etablissements: () => ok([etab]),

    rendezVous: (_e, du, au) => ok(
      rdv.filter(r => r.jour >= du && r.jour <= au)
         .sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut))),

    majStatut: (id, statut) => {
      const r = rdv.find(x => x.id === id);
      if (r) { r.statut = statut; if (statut === 'annule') r.annule_par = 'pro'; }
      return Promise.resolve();
    },

    creerRdv: (d) => {
      const p = prestations.find(x => x.id === d.prestation_id);
      const [h, m] = d.debut.split(':').map(Number);
      const t = h * 60 + m, f = t + p.duree_minutes;
      const conflit = rdv.some(r => r.jour === d.jour &&
        ['confirme', 'en_attente'].includes(r.statut) &&
        t < (+r.fin.slice(0,2) * 60 + +r.fin.slice(3)) &&
        f > (+r.debut.slice(0,2) * 60 + +r.debut.slice(3)));
      if (conflit) return Promise.reject(new Error('creneau_pris'));
      rdv.push({
        ...d, id: 'r' + Date.now(), reference: ref(), etablissement_id: 'demo',
        fin: pad(Math.floor(f / 60)) + ':' + pad(f % 60),
        fin_visible: pad(Math.floor(f / 60)) + ':' + pad(f % 60),
        prestation_nom: p.nom, duree_minutes: p.duree_minutes,
        statut: 'confirme', source: 'telephone'
      });
      return Promise.resolve();
    },

    prestations: () => ok(prestations.sort((a, b) => a.ordre - b.ordre)),
    enregistrerPrestation: (p) => {
      if (p.id) Object.assign(prestations.find(x => x.id === p.id), p);
      else prestations.push({ ...p, id: 'p' + Date.now(), actif: true, battement_minutes: 0, ordre: prestations.length + 1 });
      return Promise.resolve();
    },
    basculerPrestation: (id, actif) => {
      prestations.find(x => x.id === id).actif = actif;
      return Promise.resolve();
    },

    ouvertures: () => ok(ouvertures),
    ajouterPlage: (o) => { ouvertures.push({ ...o, id: 'o' + (++sq) }); return Promise.resolve(); },
    supprimerPlage: (id) => {
      const i = ouvertures.findIndex(x => x.id === id);
      if (i >= 0) ouvertures.splice(i, 1);
      return Promise.resolve();
    },

    fermetures: () => ok(fermetures.sort((a, b) => a.du.localeCompare(b.du))),
    ajouterFermeture: (f) => { fermetures.push({ ...f, id: 'f' + Date.now() }); return Promise.resolve(); },
    supprimerFermeture: (id) => {
      const i = fermetures.findIndex(x => x.id === id);
      if (i >= 0) fermetures.splice(i, 1);
      return Promise.resolve();
    }
  };
}


/* ==========================================================================
   SOURCE « VITRINE »
   ?vitrine=<démo> dans l'adresse. L'espace pro se branche sur une démo de
   site publiée à côté de lui, et partage son stockage de navigateur : une
   table réservée sur le site apparaît ici, une annulation faite ici libère
   la table sur le site. C'est le même agenda vu des deux côtés, comme en
   production, sans rien envoyer nulle part.

   Les établissements viennent du fichier de la démo elle-même
   (../demos/<démo>/reservation/etablissements.js) : une seule source.
   ========================================================================== */
// Même calcul que refDemo() dans le moteur du site : les deux côtés
// doivent donner la même référence à la même table de démonstration.
function refDemo(prefixe, i) {
  const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let x = (i + 1) * 7919, s = '';
  for (let k = 0; k < 5; k++) { s += A[x % A.length]; x = Math.floor(x / A.length) + (k + 3) * 131; }
  return (prefixe || 'RDV') + '-' + s;
}

function SourceVitrine(nom) {
  const cleRdv = slug => `nsr.${slug}.v1`;
  const cleReglages = slug => `nsr.${slug}.reglages`;
  const lire = (k, defaut) => { try { return JSON.parse(localStorage.getItem(k)) ?? defaut; } catch { return defaut; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage bloqué */ } };
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const min = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

  let configs = [];
  const cfgDe = id => configs.find(c => c.slug === id);

  function charger() {
    if (!/^[a-z0-9-]{3,60}$/.test(nom)) return Promise.reject(new Error('Démo inconnue.'));
    return new Promise((ok, ko) => {
      const el = document.createElement('script');
      el.src = `../demos/${nom}/reservation/etablissements.js`;
      el.onload = () => { configs = window.NSR_ETABLISSEMENTS || []; configs.forEach(amorcer); ok(); };
      el.onerror = () => ko(new Error('Démo introuvable.'));
      document.head.appendChild(el);
    });
  }

  /* Même amorçage que le moteur du site : quel que soit le côté ouvert en
     premier, les deux voient les mêmes tables déjà réservées. */
  function amorcer(c) {
    if (localStorage.getItem(cleRdv(c.slug) + '.amorce')) return;
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const liste = lire(cleRdv(c.slug), []);
    (c.demoRendezVous || []).forEach((f, i) => {
      const d = ajoute(base, f.dans);
      if (!(c.ouvertures[d.getDay()] || []).length) return;
      const p = c.prestations.find(x => x.code === f.prestation);
      if (!p) return;
      liste.push({
        reference: refDemo(c.prefixeReference, i), jour: cle(d), debut: f.debut, fin: hm(min(f.debut) + p.duree),
        prestation: p.code, prestationNom: p.nom, duree: p.duree,
        nom: f.nom, telephone: f.telephone || '', note: f.note || '',
        statut: f.statut || 'confirme', source: f.source || 'site', demo: true
      });
    });
    ecrire(cleRdv(c.slug), liste);
    try { localStorage.setItem(cleRdv(c.slug) + '.amorce', '1'); } catch { /* rien */ }
  }

  /* Réglages du patron : initialisés depuis la configuration du site, puis
     modifiés ici. Le site les relit à chaque ouverture. */
  function reglages(slug) {
    const r = lire(cleReglages(slug), null);
    if (r) return r;
    const c = cfgDe(slug);
    let n = 0;
    const neuf = {
      ouvertures: Object.entries(c.ouvertures).flatMap(([j, plages]) =>
        plages.map(([debut, fin]) => ({ id: 'o' + (++n), jour_semaine: +j, debut, fin }))),
      fermetures: [],
      prestations: c.prestations.map((p, i) => ({
        id: p.code, code: p.code, nom: p.nom, description: p.description || null,
        duree_minutes: p.duree, couverts: p.couverts || null, prix_indicatif: null,
        battement_minutes: 0, ordre: i + 1, actif: true
      }))
    };
    ecrire(cleReglages(slug), neuf);
    return neuf;
  }
  const majReglages = (slug, fn) => { const r = reglages(slug); fn(r); ecrire(cleReglages(slug), r); };

  // Le format du moteur du site, traduit dans celui de la base.
  function versPro(slug, r) {
    const p = reglages(slug).prestations.find(x => x.code === r.prestation);
    const [prenom, ...reste] = String(r.prenom ? r.prenom : r.nom || '').split(' ');
    return {
      id: r.reference, reference: r.reference, etablissement_id: slug,
      prestation_id: r.prestation, jour: r.jour, debut: r.debut, fin: r.fin, fin_visible: r.fin,
      prestation_nom: r.prestationNom, duree_minutes: r.duree,
      couverts: p ? p.couverts : null, statut: r.statut,
      prenom: r.prenom ? r.prenom : prenom, nom: r.prenom ? (r.nomFamille || '') : reste.join(' '),
      telephone: r.telephone || '', email: r.email || '', note: r.note || null,
      premiere_visite: !!r.premiere, source: r.source || 'site'
    };
  }

  const copie = o => JSON.parse(JSON.stringify(o));

  return {
    demo: true,
    vitrine: true,
    charger,
    ecouter(fn) {
      window.addEventListener('storage', e => {
        if (e.key && configs.some(c => e.key === cleRdv(c.slug))) fn(e.key);
      });
    },
    // Un vrai écran de connexion, pré-rempli : on montre comment il entre.
    sessionActive: () => Promise.resolve(sessionStorage.getItem('nsr.vitrine.session') ? {} : null),
    connexion: () => { try { sessionStorage.setItem('nsr.vitrine.session', '1'); } catch { /* rien */ } return Promise.resolve(); },
    deconnexion: () => { try { sessionStorage.removeItem('nsr.vitrine.session'); } catch { /* rien */ } return Promise.resolve(); },
    identifiantDemo: 'patron@maison-vaurenne.lu',

    etablissements: () => Promise.resolve(configs.map(c => ({
      id: c.slug, slug: c.slug, nom: c.etablissement.nom, ville: c.etablissement.ville,
      metier: c.etablissement.metier, adresse: c.etablissement.adresse,
      telephone: c.etablissement.telephone,
      mode_validation: c.etablissement.modeValidation === 'manuel' ? 'manuel' : 'auto',
      places: c.etablissement.placesParCreneau || 1
    }))),

    rendezVous: (slug, du, au) => Promise.resolve(
      lire(cleRdv(slug), [])
        .filter(r => r.jour >= du && r.jour <= au)
        .map(r => versPro(slug, r))
        .sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut))),

    majStatut: (ref, statut) => {
      configs.forEach(c => {
        const liste = lire(cleRdv(c.slug), []);
        const r = liste.find(x => x.reference === ref);
        if (r) { r.statut = statut; if (statut === 'annule') r.annulePar = 'pro'; ecrire(cleRdv(c.slug), liste); }
      });
      return Promise.resolve();
    },

    creerRdv: (d) => {
      const slug = d.etablissement_id;
      const places = cfgDe(slug).etablissement.placesParCreneau || 1;
      const p = reglages(slug).prestations.find(x => x.id === d.prestation_id);
      const t = min(d.debut), f = t + p.duree_minutes;
      const liste = lire(cleRdv(slug), []);
      const pris = liste.filter(r => r.jour === d.jour &&
        ['confirme', 'en_attente'].includes(r.statut) &&
        t < min(r.fin) && f > min(r.debut)).length;
      if (pris >= places) return Promise.reject(new Error('creneau_pris'));
      liste.push({
        reference: cfgDe(slug).prefixeReference + '-' +
          Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join(''),
        jour: d.jour, debut: d.debut, fin: hm(f),
        prestation: p.code, prestationNom: p.nom, duree: p.duree_minutes,
        nom: d.prenom + ' ' + d.nom, prenom: d.prenom, nomFamille: d.nom,
        telephone: d.telephone, email: d.email === 'sans-email@invalid' ? '' : d.email,
        note: d.note || '', statut: 'confirme', source: 'telephone', cree: new Date().toISOString()
      });
      ecrire(cleRdv(slug), liste);
      return Promise.resolve();
    },

    prestations: slug => Promise.resolve(copie(reglages(slug).prestations.sort((a, b) => a.ordre - b.ordre))),
    enregistrerPrestation: (p) => {
      const slug = p.etablissement_id || etat.etab.id;
      majReglages(slug, r => {
        const x = p.id && r.prestations.find(y => y.id === p.id);
        if (x) Object.assign(x, p);
        else r.prestations.push({ ...p, id: p.code, actif: true, battement_minutes: 0 });
      });
      return Promise.resolve();
    },
    basculerPrestation: (id, actif) => {
      majReglages(etat.etab.id, r => { r.prestations.find(x => x.id === id).actif = actif; });
      return Promise.resolve();
    },

    ouvertures: slug => Promise.resolve(copie(reglages(slug).ouvertures)),
    ajouterPlage: (o) => {
      majReglages(o.etablissement_id, r => r.ouvertures.push({ ...o, id: 'o' + Date.now() }));
      return Promise.resolve();
    },
    supprimerPlage: (id) => {
      majReglages(etat.etab.id, r => { r.ouvertures = r.ouvertures.filter(x => x.id !== id); });
      return Promise.resolve();
    },

    fermetures: slug => Promise.resolve(copie(reglages(slug).fermetures.sort((a, b) => a.du.localeCompare(b.du)))),
    ajouterFermeture: (f) => {
      majReglages(f.etablissement_id, r => r.fermetures.push({ ...f, id: 'f' + Date.now() }));
      return Promise.resolve();
    },
    supprimerFermeture: (id) => {
      majReglages(etat.etab.id, r => { r.fermetures = r.fermetures.filter(x => x.id !== id); });
      return Promise.resolve();
    }
  };
}


/* ==========================================================================
   SOURCE « SUPABASE »
   Les tables sont interrogées directement, mais la base ne renvoie que
   l'établissement du professionnel connecté. Ce n'est pas cette page qui
   filtre : c'est le serveur.
   ========================================================================== */
async function SourceSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Une contrainte de la base qui saute doit devenir une phrase lisible.
  const verifie = ({ data, error }) => {
    if (!error) return data;
    if (error.code === '23P01') throw new Error('creneau_pris');
    throw new Error(error.message);
  };

  return {
    demo: false,

    async sessionActive() {
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    },
    async connexion(email, motDePasse) {
      const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
      if (error) throw new Error(
        error.message.includes('Invalid login')
          ? 'Adresse e-mail ou mot de passe incorrect.'
          : error.message);
    },
    deconnexion: () => sb.auth.signOut(),

    etablissements: () => sb.rpc('nsr_mes_etablissements').then(verifie),

    rendezVous: (etabId, du, au) => sb.from('nsr_rendez_vous')
      .select('*').eq('etablissement_id', etabId)
      .gte('jour', du).lte('jour', au)
      .order('jour').order('debut').then(verifie),

    majStatut: (id, statut) => sb.from('nsr_rendez_vous')
      .update(statut === 'annule'
        ? { statut, annule_le: new Date().toISOString(), annule_par: 'pro' }
        : { statut })
      .eq('id', id).then(verifie),

    // Les champs manquants (référence, ressource, durée, heure de fin) sont
    // remplis par la base. Voir nsr_completer_rdv dans le schéma.
    creerRdv: (d) => sb.from('nsr_rendez_vous').insert({ ...d, source: 'telephone' }).then(verifie),

    prestations: (etabId) => sb.from('nsr_prestations')
      .select('*').eq('etablissement_id', etabId).order('ordre').then(verifie),
    enregistrerPrestation: (p) => (p.id
      ? sb.from('nsr_prestations').update(p).eq('id', p.id)
      : sb.from('nsr_prestations').insert(p)).then(verifie),
    basculerPrestation: (id, actif) => sb.from('nsr_prestations')
      .update({ actif }).eq('id', id).then(verifie),

    ouvertures: (etabId) => sb.from('nsr_ouvertures')
      .select('*').eq('etablissement_id', etabId)
      .order('jour_semaine').order('debut').then(verifie),
    ajouterPlage: (o) => sb.from('nsr_ouvertures').insert(o).then(verifie),
    supprimerPlage: (id) => sb.from('nsr_ouvertures').delete().eq('id', id).then(verifie),

    fermetures: (etabId) => sb.from('nsr_fermetures')
      .select('*').eq('etablissement_id', etabId).order('du').then(verifie),
    ajouterFermeture: (f) => sb.from('nsr_fermetures').insert(f).then(verifie),
    supprimerFermeture: (id) => sb.from('nsr_fermetures').delete().eq('id', id).then(verifie)
  };
}


/* ==========================================================================
   L'application
   ========================================================================== */
const etat = {
  source: null,
  etablissements: [],
  etab: null,
  onglet: 'agenda',
  mode: 'jour',          // jour | semaine
  ancre: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  prestations: []
};

const ETIQUETTES = {
  en_attente: ['attente', 'À valider'],
  annule:     ['annule',  'Annulé'],
  honore:     ['honore',  'Honoré'],
  absent:     ['absent',  'Absent']
};


/* ==========================================================================
   Vocabulaire du métier
   Un kiné reçoit des patients en rendez-vous, un restaurant des clients qui
   réservent une table. Même écran, mots du métier. Choisi par établissement
   (colonne `metier`, 'soin' par défaut).
   ========================================================================== */
const VOCABULAIRES = {
  soin: {
    portail: 'Connectez-vous pour voir vos rendez-vous.',
    etab: 'Établissement', Prestations: 'Prestations', mesPrestations: 'Mes prestations',
    notePrestations: 'Ce que le patient choisit en première étape. La durée détermine les créneaux proposés : une prestation d\'une heure ne s\'affiche pas dans un trou de trente minutes.',
    nouveauRdv: '+ Rendez-vous', nouvellePrestation: '+ Prestation',
    client: 'patient', clients: 'patients',
    aucun: 'Aucun rendez-vous', rdvJour: 'rendez-vous ce jour', rdvSemaine: 'rendez-vous cette semaine',
    nbRdv: n => `${n} rendez-vous`, annules: n => n > 1 ? 'annulés' : 'annulé',
    honore: 'Honoré', absent: 'Absent', premiere: '1ʳᵉ visite',
    qHonore: 'Marquer ce rendez-vous comme honoré ?',
    qAbsent: 'Marquer ce patient comme absent ?',
    qAnnule: 'Annuler ce rendez-vous ? Le créneau redeviendra libre sur le site et le patient sera prévenu.',
    qConfirme: 'Valider cette demande ? Le patient recevra sa confirmation.',
    okAnnule: 'Rendez-vous annulé, créneau libéré.',
    okConfirme: 'Demande validée.',
    detail: r => `${txt(r.prestation_nom)} · ${r.duree_minutes} min`,
    prestation: 'prestation', auMoins: 'une prestation', Prestation: 'Prestation', nouvelle: 'Nouvelle prestation', modifier: 'Modifier la prestation',
    aucunePrestation: 'Aucune prestation', masquee: 'Prestation masquée du site.', reaffichee: 'Prestation réaffichée sur le site.',
    enregistree: 'Prestation enregistrée.', exemplePrestation: 'Séance de suivi',
    telTitre: 'Rendez-vous pris au téléphone', telOk: 'Rendez-vous ajouté à votre agenda.',
    telNote: 'Ce que le patient vous a dit au téléphone.', chevauche: 'Ce créneau chevauche un rendez-vous déjà pris.',
    nouveau: 'Nouveau rendez-vous', annuleSite: 'Rendez-vous annulé'
  },
  restaurant: {
    portail: 'Connectez-vous pour voir vos réservations.',
    etab: 'Restaurant', Prestations: 'Tables', mesPrestations: 'Mes tables',
    notePrestations: 'Ce que le client choisit en premier : la taille de sa table. La durée, c\'est le temps pendant lequel la table est occupée : elle fixe le nombre de tables encore libres à chaque heure.',
    nouveauRdv: '+ Réservation', nouvellePrestation: '+ Type de table',
    client: 'client', clients: 'clients',
    aucun: 'Aucune réservation', rdvJour: 'tables ce jour', rdvSemaine: 'tables cette semaine',
    nbRdv: n => `${n} table${n > 1 ? 's' : ''}`, annules: n => n > 1 ? 'annulées' : 'annulée',
    honore: 'Venu', absent: 'Pas venu', premiere: '1ʳᵉ venue',
    qHonore: 'Ce client est bien venu ?',
    qAbsent: 'Ce client n\'est pas venu ?',
    qAnnule: 'Annuler cette réservation ? La table redevient libre sur le site et le client est prévenu par e-mail.',
    qConfirme: 'Confirmer cette table ? Le client reçoit sa confirmation par e-mail.',
    okAnnule: 'Réservation annulée, table libérée sur le site.',
    okConfirme: 'Table confirmée, le client est prévenu.',
    detail: r => `${txt(r.prestation_nom)}${r.couverts ? ' · ' + r.couverts + ' couverts' : ''}`,
    prestation: 'type de table', auMoins: 'un type de table', Prestation: 'Type de table', nouvelle: 'Nouveau type de table', modifier: 'Modifier la table',
    aucunePrestation: 'Aucun type de table', masquee: 'Table masquée du site.', reaffichee: 'Table réaffichée sur le site.',
    enregistree: 'Table enregistrée.', exemplePrestation: 'Table de deux',
    telTitre: 'Réservation prise au téléphone', telOk: 'Réservation ajoutée, la table est bloquée sur le site.',
    telNote: 'Allergies, occasion, table souhaitée…', chevauche: 'Complet à cette heure : toutes les tables sont prises.',
    nouveau: 'Nouvelle réservation', annuleSite: 'Réservation annulée par le client'
  }
};
let V = VOCABULAIRES.soin;

function appliqueVocabulaire() {
  V = VOCABULAIRES[etat.etab && etat.etab.metier] || VOCABULAIRES.soin;
  $$('[data-voc]').forEach(el => { if (typeof V[el.dataset.voc] === 'string') el.textContent = V[el.dataset.voc]; });
  $$('[data-voc-aria]').forEach(el => el.setAttribute('aria-label', V[el.dataset.vocAria]));
  ETIQUETTES.honore[1] = V.honore;
  ETIQUETTES.absent[1] = V.absent;
}


/* ---------- Connexion ---------------------------------------------------- */
async function demarrer() {
  etat.source = MODE_VITRINE ? SourceVitrine(MODE_VITRINE)
              : MODE_DEMO ? SourceDemo() : await SourceSupabase();

  if (MODE_DEMO) {
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-demo';
    bandeau.textContent = MODE_VITRINE
      ? 'Démonstration : les réservations faites sur le site de démonstration arrivent ici, sur ce téléphone seulement.'
      : 'Démonstration — données fabriquées, aucune modification n\'est enregistrée.';
    document.body.prepend(bandeau);
  }

  if (etat.source.charger) {
    await etat.source.charger();
    // Démo : le patron est déjà rattaché au restaurant, on parle sa langue dès l'accueil.
    const [premier] = await etat.source.etablissements();
    if (premier) { etat.etab = premier; appliqueVocabulaire(); }
  }

  const utilisateur = await etat.source.sessionActive();
  if (utilisateur) return ouvrirApp();

  $('[data-vue="connexion"]').hidden = false;
  if (etat.source.identifiantDemo) {
    const f = $('[data-form-connexion]');
    f.email.value = etat.source.identifiantDemo;
    f.mdp.value = 'demonstration';
  }
  $('[data-form-connexion]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bouton = $('[data-bouton-connexion]');
    const alerte = $('[data-alerte-connexion]');
    alerte.hidden = true;
    bouton.disabled = true;
    bouton.textContent = 'Connexion…';
    try {
      await etat.source.connexion(e.target.email.value.trim(), e.target.mdp.value);
      await ouvrirApp();
    } catch (err) {
      alerte.textContent = err.message;
      alerte.hidden = false;
    } finally {
      bouton.disabled = false;
      bouton.textContent = 'Se connecter';
    }
  });
}

async function ouvrirApp() {
  const liste = await etat.source.etablissements();
  if (!liste.length) {
    $('[data-vue="connexion"]').hidden = false;
    const a = $('[data-alerte-connexion]');
    a.textContent = 'Ce compte n\'est rattaché à aucun agenda. Contactez NS Development.';
    a.hidden = false;
    return;
  }

  etat.etablissements = liste;
  etat.etab = liste[0];

  $('[data-vue="connexion"]').hidden = true;
  $('[data-vue="app"]').hidden = false;

  // Plusieurs établissements (deux restaurants du même patron, ou un
  // administrateur NS Development) : il choisit en haut de l'écran.
  if (liste.length > 1) {
    const sel = $('[data-choix-etab]');
    sel.innerHTML = liste.map(e => `<option value="${txt(e.id)}">${txt(e.nom)}</option>`).join('');
    sel.addEventListener('change', () => {
      etat.etab = liste.find(e => String(e.id) === sel.value);
      sel.blur();
      majEntete();
      rafraichir();
    });
    $('[data-selecteur-etab]').hidden = false;
  }

  majEntete();
  brancherInterface();
  await rafraichir();

  // Démo vitrine : une réservation faite sur le site (autre onglet) arrive ici.
  if (etat.source.ecouter) {
    let avant = null;
    etat.source.ecouter(async () => {
      const liste = await etat.source.rendezVous(etat.etab.id, '0000-01-01', '9999-12-31');
      const signature = liste.map(r => r.id + r.statut).join('|');
      if (avant !== null && signature !== avant) toast('L\'agenda vient d\'être mis à jour depuis le site.');
      avant = signature;
      if (etat.onglet === 'agenda') dessineAgenda();
    });
  }
}

function majEntete() {
  appliqueVocabulaire();
  $('[data-nom-etablissement]').textContent = etat.etab.nom;
  $('[data-sous-etablissement]').textContent =
    (etat.etab.ville ? etat.etab.ville + ' · ' : '') +
    (etat.etab.mode_validation === 'manuel'
      ? 'vous validez chaque demande'
      : 'réservation confirmée automatiquement');
}


/* ---------- Branchements ------------------------------------------------- */
function brancherInterface() {
  $$('[data-onglet]').forEach(b => b.addEventListener('click', () => {
    etat.onglet = b.dataset.onglet;
    $$('[data-onglet]').forEach(x => x.classList.toggle('is-actif', x === b));
    $$('[data-panneau]').forEach(p => p.classList.toggle('is-actif', p.dataset.panneau === etat.onglet));
    rafraichir();
  }));

  $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
    etat.mode = b.dataset.mode;
    $$('[data-mode]').forEach(x => x.classList.toggle('is-actif', x === b));
    dessineAgenda();
  }));

  $('[data-jour-prec]').addEventListener('click', () => { deplacer(-1); });
  $('[data-jour-suiv]').addEventListener('click', () => { deplacer(1); });
  $('[data-aujourdhui]').addEventListener('click', () => {
    etat.ancre = new Date(); etat.ancre.setHours(0,0,0,0); dessineAgenda();
  });

  $('[data-nouveau-rdv]').addEventListener('click', formulaireRdv);
  $('[data-nouveau-conge]').addEventListener('click', formulaireConge);
  $('[data-nouvelle-prestation]').addEventListener('click', () => formulairePrestation(null));

  $('[data-deconnexion]').addEventListener('click', async () => {
    await etat.source.deconnexion();
    location.reload();
  });

  $$('[data-fermer-modale]').forEach(b => b.addEventListener('click', fermerModale));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermerModale(); });
}

function deplacer(sens) {
  etat.ancre = ajoute(etat.ancre, etat.mode === 'jour' ? sens : sens * 7);
  dessineAgenda();
}

async function rafraichir() {
  if (etat.onglet === 'agenda')      return dessineAgenda();
  if (etat.onglet === 'horaires')    return dessineHoraires();
  if (etat.onglet === 'conges')      return dessineConges();
  if (etat.onglet === 'prestations') return dessinePrestations();
}


/* ==========================================================================
   AGENDA
   ========================================================================== */
function bornes() {
  if (etat.mode === 'jour') return { du: cle(etat.ancre), au: cle(etat.ancre) };
  const l = lundiDe(etat.ancre);
  return { du: cle(l), au: cle(ajoute(l, 6)) };
}

async function dessineAgenda() {
  const boite = $('[data-liste-agenda]');
  const { du, au } = bornes();

  if (etat.mode === 'jour') {
    $('[data-titre-periode]').textContent = Joli(etat.ancre);
  } else {
    // « 3 — 9 août 2026 », et « 31 août — 6 septembre 2026 » à cheval sur deux mois.
    const a = depuisCle(du), b = depuisCle(au);
    const moisA = a.getMonth() === b.getMonth() ? '' : ' ' + MOIS[a.getMonth()];
    $('[data-titre-periode]').textContent =
      `${a.getDate()}${moisA} — ${b.getDate()} ${MOIS[b.getMonth()]} ${b.getFullYear()}`;
  }

  boite.innerHTML = '<div class="vide">Chargement…</div>';

  let liste;
  try {
    liste = await etat.source.rendezVous(etat.etab.id, du, au);
  } catch (err) {
    boite.innerHTML = `<div class="vide"><b>Agenda indisponible</b>${txt(err.message)}</div>`;
    return;
  }

  dessineStats(liste);

  const actifs = liste.filter(r => r.statut !== 'annule');
  if (!actifs.length && !liste.length) {
    boite.innerHTML = `<div class="vide"><b>${V.aucun}</b>${
      etat.mode === 'jour' ? 'Rien de prévu ce jour-là.' : 'Rien de prévu cette semaine.'}</div>`;
    return;
  }

  // Regroupement par journée
  const parJour = new Map();
  liste.forEach(r => {
    if (!parJour.has(r.jour)) parJour.set(r.jour, []);
    parJour.get(r.jour).push(r);
  });

  const ajd = cle(new Date());
  boite.innerHTML = [...parJour.entries()].map(([jour, rdvs]) => {
    const d = depuisCle(jour);
    const nb = rdvs.filter(r => r.statut !== 'annule').length;
    return `<div class="jour-bloc${jour === ajd ? ' est-aujourdhui' : ''}">
      <div class="jour-bloc__tete">
        <h3>${txt(Joli(d))}${jour === ajd ? ' · aujourd\'hui' : ''}</h3>
        <span>${V.nbRdv(nb)}</span>
      </div>
      ${rdvs.map(carteRdv).join('')}
    </div>`;
  }).join('');

  boite.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', () => actionRdv(b.dataset.id, b.dataset.action));
  });
}

function carteRdv(r) {
  const [classe, libelle] = ETIQUETTES[r.statut] || [];
  const etiquettes =
    (classe ? `<span class="etiquette etiquette--${classe}">${txt(libelle)}</span>` : '') +
    (r.source === 'telephone' ? '<span class="etiquette etiquette--tel">Téléphone</span>' : '') +
    (r.premiere_visite ? `<span class="etiquette etiquette--premiere">${V.premiere}</span>` : '');

  const modifiable = r.statut === 'confirme' || r.statut === 'en_attente';
  const actions = !modifiable ? '' : `
    ${r.statut === 'en_attente'
      ? `<button class="mini mini--ok" data-action="confirme" data-id="${txt(r.id)}">Valider</button>`
      : `<button class="mini mini--ok" data-action="honore" data-id="${txt(r.id)}">${V.honore}</button>
         <button class="mini mini--absent" data-action="absent" data-id="${txt(r.id)}">${V.absent}</button>`}
    <button class="mini mini--sup" data-action="annule" data-id="${txt(r.id)}">Annuler</button>`;

  return `<div class="rdv rdv--${txt(r.statut)}">
    <div class="rdv__heure">${txt(hhmm(r.debut))}<span>${txt(hhmm(r.fin_visible || r.fin))}</span></div>
    <div class="rdv__qui">
      <b>${txt(r.prenom)} ${txt(r.nom)}${etiquettes}</b>
      <div class="rdv__meta">
        ${V.detail(r)}${r.telephone ? ` ·
        <a href="tel:${txt(String(r.telephone).replace(/\s/g, ''))}">${txt(r.telephone)}</a>` : ''}
        · réf. ${txt(r.reference)}
      </div>
      ${r.note ? `<div class="rdv__note">${txt(r.note)}</div>` : ''}
    </div>
    <div class="rdv__actions">${actions}</div>
  </div>`;
}

function dessineStats(liste) {
  const actifs = liste.filter(r => r.statut !== 'annule');
  const minutes = actifs
    .filter(r => r.statut !== 'absent')
    .reduce((s, r) => s + (r.duree_minutes || 0), 0);
  const attente = liste.filter(r => r.statut === 'en_attente').length;

  // On n'affiche que ce qui a une valeur : un compteur d'annulations à zéro
  // n'apprend rien et encombre l'écran.
  const annules = liste.filter(r => r.statut === 'annule').length;
  const cases = [
    [actifs.length, etat.mode === 'jour' ? V.rdvJour : V.rdvSemaine],
    etat.etab.metier === 'restaurant'
      ? [actifs.filter(r => r.statut !== 'absent').reduce((s, r) => s + (r.couverts || 0), 0), 'couverts']
      : [(minutes / 60).toFixed(1).replace('.', ',') + ' h', 'temps de soin']
  ];
  if (attente) cases.push([attente, attente > 1 ? 'demandes à valider' : 'demande à valider']);
  if (annules) cases.push([annules, V.annules(annules)]);

  $('[data-stats]').innerHTML = cases
    .map(([v, l]) => `<div class="stat"><b>${txt(v)}</b><span>${txt(l)}</span></div>`).join('');
}

async function actionRdv(id, action) {
  const phrases = { honore: V.qHonore, absent: V.qAbsent, annule: V.qAnnule, confirme: V.qConfirme };
  if (!confirm(phrases[action])) return;
  try {
    await etat.source.majStatut(id, action);
    toast(action === 'annule' ? V.okAnnule : action === 'confirme' ? V.okConfirme : 'C\'est noté.');
    dessineAgenda();
  } catch (err) {
    toast('Échec : ' + err.message);
  }
}


/* ==========================================================================
   HORAIRES
   ========================================================================== */
async function dessineHoraires() {
  const boite = $('[data-liste-horaires]');
  boite.innerHTML = '<div class="vide">Chargement…</div>';
  const plages = await etat.source.ouvertures(etat.etab.id);

  boite.innerHTML = ORDRE_JOURS.map(j => {
    const duJour = plages.filter(p => p.jour_semaine === j)
      .sort((a, b) => a.debut.localeCompare(b.debut));
    return `<div class="fiche${duJour.length ? '' : ' fiche--eteinte'}">
      <div class="fiche__titre">${JOURS[j]}</div>
      <div class="fiche__corps"><div class="plages">
        ${duJour.length
          ? duJour.map(p => `<span class="plage">${txt(hhmm(p.debut))} – ${txt(hhmm(p.fin))}
              <button data-sup-plage="${txt(p.id)}" aria-label="Retirer cette plage" title="Retirer">×</button></span>`).join('')
          : '<span class="plage plage--ferme">Fermé</span>'}
      </div></div>
      <div class="fiche__actions">
        <button class="mini" data-ajout-plage="${j}">+ Ajouter une plage</button>
      </div>
    </div>`;
  }).join('');

  boite.querySelectorAll('[data-ajout-plage]').forEach(b =>
    b.addEventListener('click', () => formulairePlage(+b.dataset.ajoutPlage)));
  boite.querySelectorAll('[data-sup-plage]').forEach(b =>
    b.addEventListener('click', async () => {
      if (!confirm('Retirer cette plage horaire ? Les créneaux correspondants disparaîtront du site.')) return;
      await etat.source.supprimerPlage(b.dataset.supPlage);
      toast('Horaire mis à jour.');
      dessineHoraires();
    }));
}

function formulairePlage(jour) {
  ouvrirModale(`Ajouter une plage — ${JOURS[jour]}`, `
    <div class="duo">
      <div class="champ"><label for="m-debut">De</label>
        <input id="m-debut" name="debut" type="time" value="09:00" step="900" required></div>
      <div class="champ"><label for="m-fin">À</label>
        <input id="m-fin" name="fin" type="time" value="12:00" step="900" required></div>
    </div>
    <p class="champ__aide">Pour une journée avec coupure du midi, ajoutez deux plages sur le même jour.</p>`,
  async (f) => {
    if (f.fin.value <= f.debut.value) throw new Error('L\'heure de fin doit être après l\'heure de début.');
    await etat.source.ajouterPlage({
      etablissement_id: etat.etab.id, jour_semaine: jour,
      debut: f.debut.value, fin: f.fin.value
    });
    toast('Horaire ajouté.');
    dessineHoraires();
  });
}


/* ==========================================================================
   CONGÉS
   ========================================================================== */
async function dessineConges() {
  const boite = $('[data-liste-conges]');
  boite.innerHTML = '<div class="vide">Chargement…</div>';
  const liste = await etat.source.fermetures(etat.etab.id);

  const ajd = cle(new Date());
  if (!liste.length) {
    boite.innerHTML = '<div class="vide"><b>Aucune fermeture prévue</b>Ajoutez vos congés pour que les ' + V.clients + ' ne réservent pas ces jours-là.</div>';
    return;
  }

  boite.innerHTML = liste.map(c => {
    const passe = c.au < ajd;
    const meme = c.du === c.au;
    const periode = meme ? joli(depuisCle(c.du))
                         : `du ${joli(depuisCle(c.du))} au ${joli(depuisCle(c.au))}`;
    const heures = c.heure_debut
      ? `${hhmm(c.heure_debut)} – ${hhmm(c.heure_fin)}`
      : 'journée entière';
    return `<div class="fiche${passe ? ' fiche--eteinte' : ''}">
      <div class="fiche__corps">
        <b style="color:var(--encre)">${txt(c.motif || 'Fermeture')}</b>
        <div class="rdv__meta">${txt(periode)} · ${txt(heures)}${passe ? ' · passée' : ''}</div>
      </div>
      <div class="fiche__actions">
        <button class="mini mini--sup" data-sup-conge="${txt(c.id)}">Supprimer</button>
      </div>
    </div>`;
  }).join('');

  boite.querySelectorAll('[data-sup-conge]').forEach(b =>
    b.addEventListener('click', async () => {
      if (!confirm('Supprimer cette fermeture ? Les créneaux redeviendront réservables.')) return;
      await etat.source.supprimerFermeture(b.dataset.supConge);
      toast('Fermeture supprimée.');
      dessineConges();
    }));
}

function formulaireConge() {
  const demain = cle(ajoute(new Date(), 1));
  ouvrirModale('Nouvelle fermeture', `
    <div class="champ"><label for="m-motif">Motif</label>
      <input id="m-motif" name="motif" type="text" placeholder="Congé annuel, formation, jour férié…"></div>
    <div class="duo">
      <div class="champ"><label for="m-du">Du</label>
        <input id="m-du" name="du" type="date" value="${demain}" required></div>
      <div class="champ"><label for="m-au">Au</label>
        <input id="m-au" name="au" type="date" value="${demain}" required></div>
    </div>
    <div class="champ">
      <label class="champ" style="flex-direction:row;align-items:center;gap:.55rem;margin:0">
        <input type="checkbox" name="partielle" style="width:auto">
        <span style="font-weight:500;color:var(--encre-doux)">Fermeture partielle seulement</span>
      </label>
    </div>
    <div class="duo" data-heures hidden>
      <div class="champ"><label for="m-hd">De</label>
        <input id="m-hd" name="heure_debut" type="time" value="12:00" step="900"></div>
      <div class="champ"><label for="m-hf">À</label>
        <input id="m-hf" name="heure_fin" type="time" value="14:00" step="900"></div>
    </div>`,
  async (f) => {
    if (f.au.value < f.du.value) throw new Error('La date de fin est avant la date de début.');
    const partielle = f.partielle.checked;
    if (partielle && f.heure_fin.value <= f.heure_debut.value)
      throw new Error('L\'heure de fin doit être après l\'heure de début.');
    await etat.source.ajouterFermeture({
      etablissement_id: etat.etab.id,
      du: f.du.value, au: f.au.value,
      heure_debut: partielle ? f.heure_debut.value : null,
      heure_fin:   partielle ? f.heure_fin.value   : null,
      motif: f.motif.value.trim() || null
    });
    toast('Fermeture enregistrée.');
    dessineConges();
  });

  const boite = $('[data-modale-corps]');
  boite.querySelector('[name="partielle"]').addEventListener('change', e => {
    boite.querySelector('[data-heures]').hidden = !e.target.checked;
  });
  // Une date de début modifiée entraîne la date de fin, comme partout ailleurs.
  boite.querySelector('[name="du"]').addEventListener('change', e => {
    const au = boite.querySelector('[name="au"]');
    if (au.value < e.target.value) au.value = e.target.value;
  });
}


/* ==========================================================================
   PRESTATIONS
   ========================================================================== */
async function dessinePrestations() {
  const boite = $('[data-liste-prestations]');
  boite.innerHTML = '<div class="vide">Chargement…</div>';
  const liste = await etat.source.prestations(etat.etab.id);
  etat.prestations = liste;

  if (!liste.length) {
    boite.innerHTML = `<div class="vide"><b>${V.aucunePrestation}</b>Ajoutez au moins ${V.auMoins} pour que vos ${V.clients} puissent réserver.</div>`;
    return;
  }

  boite.innerHTML = liste.map(p => `
    <div class="fiche${p.actif ? '' : ' fiche--eteinte'}">
      <div class="fiche__corps">
        <b style="color:var(--encre)">${txt(p.nom)}</b>
        <div class="rdv__meta">${p.couverts ? p.couverts + ' couverts · table occupée ' : ''}${p.duree_minutes} min${
          p.prix_indicatif != null ? ' · ' + Number(p.prix_indicatif).toFixed(2).replace('.', ',') + ' €' : ''
        }${p.actif ? '' : ' · masquée du site'}</div>
        ${p.description ? `<div class="rdv__meta">${txt(p.description)}</div>` : ''}
      </div>
      <div class="fiche__actions">
        <button class="mini" data-modif="${txt(p.id)}">Modifier</button>
        <button class="mini${p.actif ? ' mini--sup' : ' mini--ok'}" data-bascule="${txt(p.id)}" data-actif="${p.actif}">
          ${p.actif ? 'Masquer' : 'Réafficher'}
        </button>
      </div>
    </div>`).join('');

  boite.querySelectorAll('[data-modif]').forEach(b =>
    b.addEventListener('click', () => formulairePrestation(liste.find(p => String(p.id) === b.dataset.modif))));
  boite.querySelectorAll('[data-bascule]').forEach(b =>
    b.addEventListener('click', async () => {
      const actif = b.dataset.actif !== 'true';
      await etat.source.basculerPrestation(b.dataset.bascule, actif);
      toast(actif ? V.reaffichee : V.masquee);
      dessinePrestations();
    }));
}

function formulairePrestation(p) {
  ouvrirModale(p ? V.modifier : V.nouvelle, `
    <div class="champ"><label for="m-nom">Nom</label>
      <input id="m-nom" name="nom" type="text" value="${txt(p?.nom || '')}"
             placeholder="${V.exemplePrestation}" required></div>
    <div class="champ"><label for="m-desc">Description</label>
      <textarea id="m-desc" name="description" placeholder="Ce que le ${V.client} lit sous le nom.">${txt(p?.description || '')}</textarea></div>
    <div class="duo">
      <div class="champ"><label for="m-duree">Durée (minutes)</label>
        <input id="m-duree" name="duree" type="number" min="5" max="480" step="5"
               value="${p?.duree_minutes || 30}" required></div>
      <div class="champ"><label for="m-prix">Prix affiché (€)</label>
        <input id="m-prix" name="prix" type="number" min="0" step="0.01"
               value="${p?.prix_indicatif ?? ''}" placeholder="laisser vide"></div>
    </div>
    <p class="champ__aide">La durée détermine les créneaux proposés. Laissez le prix vide pour ne rien afficher.</p>`,
  async (f) => {
    const donnees = {
      nom: f.nom.value.trim(),
      description: f.description.value.trim() || null,
      duree_minutes: +f.duree.value,
      prix_indicatif: f.prix.value === '' ? null : +f.prix.value
    };
    if (!donnees.nom) throw new Error('Le nom est obligatoire.');
    if (!Number.isFinite(donnees.duree_minutes) ||
        donnees.duree_minutes < 5 || donnees.duree_minutes > 480)
      throw new Error('La durée doit être comprise entre 5 et 480 minutes.');
    if (p) donnees.id = p.id;
    else {
      donnees.etablissement_id = etat.etab.id;
      // Code technique stable, dérivé du nom, utilisé par les liens directs.
      donnees.code = donnees.nom.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
        || ('prestation-' + Date.now().toString(36));
      donnees.ordre = etat.prestations.length + 1;
    }
    await etat.source.enregistrerPrestation(donnees);
    toast(V.enregistree);
    dessinePrestations();
  });
}


/* ==========================================================================
   RENDEZ-VOUS PRIS AU TÉLÉPHONE
   ========================================================================== */
async function formulaireRdv() {
  const prestations = (await etat.source.prestations(etat.etab.id)).filter(p => p.actif);
  if (!prestations.length) {
    toast(`Ajoutez d'abord : ${V.Prestation.toLowerCase()}.`);
    return;
  }

  ouvrirModale(V.telTitre, `
    <div class="champ"><label for="m-prest">${V.Prestation}</label>
      <select id="m-prest" name="prestation" required>
        ${prestations.map(p => `<option value="${txt(p.id)}">${txt(p.nom)} — ${p.couverts ? p.couverts + ' couverts' : p.duree_minutes + ' min'}</option>`).join('')}
      </select></div>
    <div class="duo">
      <div class="champ"><label for="m-jour">Date</label>
        <input id="m-jour" name="jour" type="date" value="${cle(etat.ancre)}" required></div>
      <div class="champ"><label for="m-heure">Heure</label>
        <input id="m-heure" name="debut" type="time" value="${etat.etab.metier === 'restaurant' ? '20:00' : '09:00'}" step="900" required></div>
    </div>
    <div class="duo">
      <div class="champ"><label for="m-prenom">Prénom</label>
        <input id="m-prenom" name="prenom" type="text" required></div>
      <div class="champ"><label for="m-nom2">Nom</label>
        <input id="m-nom2" name="nom" type="text" required></div>
    </div>
    <div class="duo">
      <div class="champ"><label for="m-tel">Téléphone</label>
        <input id="m-tel" name="telephone" type="tel" placeholder="+352 621 00 00 00" required></div>
      <div class="champ"><label for="m-mail">E-mail</label>
        <input id="m-mail" name="email" type="email" placeholder="facultatif"></div>
    </div>
    <div class="champ"><label for="m-note">Note</label>
      <textarea id="m-note" name="note" placeholder="${V.telNote}"></textarea></div>
    <p class="champ__aide">Sans e-mail, le ${V.client} ne recevra ni confirmation ni rappel&nbsp;: la réservation est
       simplement posée dans votre agenda et la place devient indisponible sur le site.</p>`,
  async (f) => {
    if (!f.prenom.value.trim() || !f.nom.value.trim())
      throw new Error('Le prénom et le nom sont obligatoires.');
    if (!f.telephone.value.trim())
      throw new Error(`Un numéro de téléphone est nécessaire pour joindre le ${V.client}.`);
    try {
      await etat.source.creerRdv({
        etablissement_id: etat.etab.id,
        prestation_id: f.prestation.value,
        jour: f.jour.value,
        debut: f.debut.value,
        prenom: f.prenom.value.trim(),
        nom: f.nom.value.trim(),
        telephone: f.telephone.value.trim(),
        // La base exige une adresse : sans e-mail, on pose une adresse
        // technique invalide plutôt que de refuser le rendez-vous.
        email: f.email.value.trim().toLowerCase() || 'sans-email@invalid',
        note: f.note.value.trim() || null
      });
    } catch (err) {
      throw new Error(err.message === 'creneau_pris'
        ? V.chevauche
        : err.message);
    }
    toast(V.telOk);
    etat.ancre = depuisCle(f.jour.value);
    dessineAgenda();
  });
}


/* ==========================================================================
   Fenêtre modale
   ========================================================================== */
let validationEnCours = null;

function ouvrirModale(titre, corpsHtml, auValider) {
  $('[data-modale-titre]').textContent = titre;
  $('[data-modale-corps]').innerHTML = corpsHtml;
  $('[data-modale-alerte]').hidden = true;
  $('[data-modale]').hidden = false;
  validationEnCours = auValider;
  setTimeout(() => {
    const premier = $('[data-modale-corps]').querySelector('input, select, textarea');
    if (premier) premier.focus();
  }, 60);
}

function fermerModale() {
  $('[data-modale]').hidden = true;
  validationEnCours = null;
}

$('[data-modale-form]').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validationEnCours) return;
  const alerte = $('[data-modale-alerte]');
  const bouton = $('[data-modale-valider]');
  alerte.hidden = true;
  bouton.disabled = true;
  const libelle = bouton.textContent;
  bouton.textContent = 'Enregistrement…';
  try {
    await validationEnCours(e.target.elements);
    fermerModale();
  } catch (err) {
    alerte.textContent = err.message;
    alerte.hidden = false;
  } finally {
    bouton.disabled = false;
    bouton.textContent = libelle;
  }
});


/* ========================================================================== */
demarrer().catch(err => {
  console.error('[NSR praticien]', err);
  const a = $('[data-alerte-connexion]');
  $('[data-vue="connexion"]').hidden = false;
  a.textContent = 'Impossible de joindre le serveur. Réessayez dans un instant.';
  a.hidden = false;
});
