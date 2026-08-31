/* ============================================================================
   NS Development — Module de réservation en ligne
   Moteur générique, identique chez tous les clients. Version 1.2
   ----------------------------------------------------------------------------
   Ce fichier ne contient AUCUNE information propre à un client : pas de nom,
   pas d'horaire, pas de prestation, pas de couleur. Tout cela vit dans
   `reservation-config.js`, un fichier par site.

   Règle de maintenance : on ne modifie jamais ce fichier pour un client.
   Si un client a besoin de quelque chose que le moteur ne sait pas faire,
   on ajoute un réglage dans la config, et tous les autres en profitent.

   Deux modes de fonctionnement, réglés par `backend` dans la config :

     'local'     Les rendez-vous vivent dans le navigateur du visiteur.
                 C'est le mode des maquettes de prospection : le prospect
                 voit un agenda qui réagit, sans qu'on ait rien installé.

     'supabase'  Les rendez-vous vivent dans la base NS Development. C'est
                 le mode production. Le site ne lit jamais les tables
                 directement : il appelle six fonctions qui ne lui répondent
                 que ce qu'un visiteur a le droit de savoir.

   Passer d'un mode à l'autre = changer un mot dans la config. Le jour où un
   prospect signe, sa maquette devient son site sans qu'on touche au code.

   Calendrier (1.2) : une fois le rendez-vous confirmé, le visiteur l'ajoute à
   son propre agenda en un clic (Google, Apple, Outlook, Microsoft 365, .ics).
   Tout se fabrique dans la page : aucun service tiers n'est appelé. Voir la
   section 5 bis.

   Multilingue (1.1) : le module parle la langue de la page (<html lang>) et
   suit l'évènement `ns:langue` émis par la bascule de langue du site. Son
   propre vocabulaire (jours, mois, boutons, erreurs) voyage avec lui dans le
   bloc LANGUES ; celui du client se traduit dans `traductions` de sa config.

   Dépendances : aucune.
   ============================================================================ */
(function (window, document) {
  'use strict';

  /* =========================================================================
     0. Réglages par défaut
     Tout est surchargeable par la config du client. Ce qui est ici est ce
     qui s'applique quand le client n'a rien demandé de particulier.
     ========================================================================= */
  var DEFAUTS = {
    backend: 'local',
    slug: null,
    supabase: null,
    prefixeReference: 'RDV',

    etablissement: {
      nom: '', adresse: '', telephone: '',

      // Fuseau horaire dans lequel l'établissement lit ses horaires. Il ne
      // sert qu'au calendrier du visiteur : « 14 h » doit rester 14 h chez
      // lui, qu'il réserve depuis Luxembourg, Lisbonne ou son hôtel.
      fuseau: 'Europe/Luxembourg',

      modeValidation: 'auto',
      pasMinutes: 30,
      delaiMiniHeures: 4,
      horizonJours: 42,
      annulationMiniHeures: 24,
      // Combien de rendez-vous peuvent se chevaucher sur un même créneau.
      // 1 chez un praticien : il n'a qu'une paire de mains. Davantage chez un
      // restaurant, qui a plusieurs tables et sert plusieurs couverts à 20 h.
      // Le mode 'supabase' ne connaît pas encore ce réglage : la contrainte
      // d'unicité y interdit toujours le doublon (voir le README).
      placesParCreneau: 1
    },

    prestations: [],
    ouvertures: {},
    fermetures: [],

    // Habillage : c'est ici que le client « adapte à son goût ».
    textes: {
      etapes: ['Prestation', 'Créneau', 'Coordonnées', 'Confirmation'],
      choixTitre: 'Que souhaitez-vous réserver ?',
      choixAide: 'La durée du rendez-vous dépend de la prestation choisie.',
      choixSuivant: 'Choisir un créneau',
      creneauTitre: 'Choisissez votre créneau',
      creneauAide: 'Les horaires barrés sont déjà pris.',
      coordonneesTitre: 'Vos coordonnées',
      coordonneesAide: 'Elles servent uniquement à confirmer votre rendez-vous.',
      valider: 'Confirmer le rendez-vous',
      confirmeTitre: 'C\'est réservé',
      confirmeAide: 'Votre créneau est bloqué. Il n\'apparaît plus pour les autres.',
      attenteTitre: 'Demande envoyée',
      attenteAide: 'Votre demande a bien été transmise. Vous recevrez une confirmation dès qu\'elle sera validée.',
      apresConfirmation: '',
      rgpd: 'J\'accepte que mes coordonnées soient utilisées pour la gestion de ce rendez-vous. Elles ne sont ni revendues ni utilisées à d\'autres fins.',
      premiereVisite: 'C\'est ma première venue',
      noteLabel: 'Précisions',
      notePlaceholder: '',
      recommencer: 'Prendre un autre rendez-vous',
      lieuDomicile: 'À votre domicile'
    },

    // Langue de départ. `null` = celle de la page (<html lang>), ce qui
    // permet à une bascule de langue du site de piloter le module sans
    // que le client ait quoi que ce soit à régler ici.
    langue: null,

    // Traductions du vocabulaire du client, par code de langue :
    //   traductions: { lb: { textes: {…}, prestations: { code: {nom, description} } } }
    // Le vocabulaire du moteur (« Retour », « Fermé », les mois…) est déjà
    // fourni plus bas : le client n'a à traduire que ce qui lui appartient.
    traductions: {},

    // Prestations qui se déroulent chez le client et non sur place.
    // Le récapitulatif affiche alors « À votre domicile » au lieu de l'adresse.
    prestationsADomicile: [],

    // Champs du formulaire à ne pas demander. Ex. ['note', 'premiere'].
    champsMasques: [],

    // Le bouton « Ajouter à mon calendrier » de l'écran de confirmation.
    //   actif          false le retire.
    //   titre          titre de l'évènement. {prestation} et {etablissement}
    //                  y sont remplacés. Vide = « Prestation — Établissement ».
    //   rappelMinutes  rappel inscrit dans le fichier .ics (Apple, Outlook
    //                  installé, Thunderbird…). 0 = aucun. Google et
    //                  Outlook en ligne posent le rappel par défaut du
    //                  visiteur et n'écoutent pas ce réglage : c'est leur
    //                  limite, pas la nôtre.
    calendrier: {
      actif: true,
      titre: '',
      rappelMinutes: 120
    },

    // Mode démonstration : bandeau d'avertissement et faux rendez-vous
    // préchargés pour que la grille ne soit pas vide devant un prospect.
    demo: false,
    demoRendezVous: []
  };

  /* =========================================================================
     1. Le vocabulaire du moteur, langue par langue
     Ce sont les mots que le module écrit lui-même : les jours, les mois, les
     boutons de navigation, les messages d'erreur. Le client n'a pas à les
     traduire, ils voyagent avec le moteur. Ajouter une langue au module =
     ajouter un bloc ici. Une langue inconnue retombe sur le français.
     ========================================================================= */
  var LANGUES = {

    fr: {
      jours:  ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      joursC: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      mois:   ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
               'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
      aHeure: ' à ',

      retour: 'Retour',
      continuer: 'Continuer',
      semainePrec: 'Semaine précédente',
      semaineSuiv: 'Semaine suivante',
      legendeLibre: 'Libre',
      legendePris: 'Déjà pris',
      legendeChoix: 'Votre choix',
      chargement: 'Chargement de l\'agenda…',
      ferme: 'Fermé',
      plusDeCreneau: 'Plus de créneau',
      passe: 'Passé',
      complet: 'Complet',
      aucunePrestation: 'Aucune prestation n\'est proposée à la réservation pour le moment.',

      prenom: 'Prénom',
      nom: 'Nom',
      telephone: 'Téléphone',
      email: 'E-mail',
      exempleEmail: 'prenom@exemple.lu',
      facultatif: '(facultatif)',
      champRequis: 'Merci de renseigner ce champ.',
      caseRequise: 'Merci de cocher cette case pour continuer.',
      champsRouges: 'Merci de compléter les champs en rouge.',
      envoi: 'Envoi en cours…',

      recapPrestation: 'Prestation',
      recapDate: 'Date',
      recapHeure: 'Heure',
      recapDuree: 'Durée',
      recapLieu: 'Lieu',
      recapReference: 'Référence',
      recapAuNom: 'Au nom de',
      minutes: 'minutes',
      minCourt: 'min',

      aucunRdv: 'Aucun rendez-vous à venir pour le moment.',
      annuler: 'Annuler',
      refCourt: 'réf.',
      nousContacter: 'nous contacter',

      calAjouter: 'Ajouter à mon calendrier',
      calAide: 'Choisissez votre calendrier, le rendez-vous s\'y inscrit tout seul.',
      calGoogle: 'Google Agenda',
      calApple: 'Apple — iPhone, iPad, Mac',
      calOutlook: 'Outlook.com',
      calOffice: 'Microsoft 365',
      calAutre: 'Autre calendrier (.ics)',

      erreurs: {
        creneau_pris: 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Merci d\'en choisir un autre.',
        trop_tard: 'Ce créneau est trop proche pour être réservé en ligne. Merci d\'appeler directement.',
        trop_loin: 'Ce créneau est trop éloigné pour être réservé aujourd\'hui.',
        hors_ouverture: 'Cet horaire ne fait pas partie des heures d\'ouverture.',
        ferme: 'L\'établissement est fermé à cette date.',
        prestation_inconnue: 'Cette prestation n\'est plus proposée. Merci d\'en choisir une autre.',
        etablissement_inconnu: 'La réservation en ligne est momentanément indisponible.',
        coordonnees_invalides: 'Merci de vérifier vos coordonnées.',
        reessayer: 'Une erreur est survenue. Merci de réessayer.',
        reseau: 'La connexion au serveur a échoué. Vérifiez votre connexion et réessayez.'
      }
    },

    lb: {
      jours:  ['Sonndeg', 'Méindeg', 'Dënschdeg', 'Mëttwoch', 'Donneschdeg', 'Freideg', 'Samschdeg'],
      joursC: ['So', 'Mé', 'Dë', 'Më', 'Do', 'Fr', 'Sa'],
      mois:   ['Januar', 'Februar', 'Mäerz', 'Abrëll', 'Mee', 'Juni',
               'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      aHeure: ' um ',

      retour: 'Zréck',
      continuer: 'Weider',
      semainePrec: 'Woch virdrun',
      semaineSuiv: 'Nächst Woch',
      legendeLibre: 'Fräi',
      legendePris: 'Schonn ergraff',
      legendeChoix: 'Är Wiel',
      chargement: 'Agenda gëtt gelueden…',
      ferme: 'Zou',
      plusDeCreneau: 'Kee Termin méi',
      passe: 'Vergaangen',
      complet: 'Ausgebucht',
      aucunePrestation: 'Am Moment gëtt näischt online ugebueden.',

      prenom: 'Virnumm',
      nom: 'Numm',
      telephone: 'Telefon',
      email: 'E-Mail',
      exempleEmail: 'virnumm@beispill.lu',
      facultatif: '(fakultativ)',
      champRequis: 'Fëllt dëst Feld w.e.g. aus.',
      caseRequise: 'Kräizt dës Këscht w.e.g. un fir weiderzefueren.',
      champsRouges: 'Fëllt w.e.g. déi roud Felder aus.',
      envoi: 'Gëtt geschéckt…',

      recapPrestation: 'Leeschtung',
      recapDate: 'Datum',
      recapHeure: 'Auer',
      recapDuree: 'Dauer',
      recapLieu: 'Plaz',
      recapReference: 'Referenz',
      recapAuNom: 'Am Numm vun',
      minutes: 'Minutten',
      minCourt: 'Min.',

      aucunRdv: 'Am Moment kee Rendez-vous virgesinn.',
      annuler: 'Annuléieren',
      refCourt: 'Réf.',
      nousContacter: 'eis kontaktéieren',

      calAjouter: 'An mäi Kalenner setzen',
      calAide: 'Wielt Äre Kalenner, de Rendez-vous schreift sech alleng an.',
      calGoogle: 'Google Kalenner',
      calApple: 'Apple — iPhone, iPad, Mac',
      calOutlook: 'Outlook.com',
      calOffice: 'Microsoft 365',
      calAutre: 'Anere Kalenner (.ics)',

      erreurs: {
        creneau_pris: 'Dësen Termin ass grad vun engem aneren ergraff ginn. Wielt w.e.g. en aneren.',
        trop_tard: 'Dësen Termin ass ze no fir online reservéiert ze ginn. Rufft w.e.g. direkt un.',
        trop_loin: 'Dësen Termin ass ze wäit ewech fir haut reservéiert ze ginn.',
        hors_ouverture: 'Dës Auerzäit läit net an den Ëffnungszäiten.',
        ferme: 'De Cabinet ass op dësem Datum zou.',
        prestation_inconnue: 'Dës Leeschtung gëtt net méi ugebueden. Wielt w.e.g. eng aner.',
        etablissement_inconnu: 'D\'Online-Reservatioun ass am Moment net verfügbar.',
        coordonnees_invalides: 'Iwwerpréift w.e.g. Är Kontaktdaten.',
        reessayer: 'Et ass e Feeler geschitt. Probéiert w.e.g. nach eng Kéier.',
        reseau: 'D\'Verbindung mam Server ass feelgeschloen. Iwwerpréift Är Verbindung a probéiert nach eng Kéier.'
      }
    }
  };

  // Vocabulaire actif du moteur. Réglé au démarrage et à chaque bascule.
  var L = LANGUES.fr;

  function langueConnue(code) {
    code = String(code || '').toLowerCase().slice(0, 2);
    return LANGUES[code] ? code : 'fr';
  }

  /* =========================================================================
     1 bis. Petites aides
     ========================================================================= */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function cle(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function min2str(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function str2min(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1]); }
  function ajoute(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function lundiDe(d) {
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    var j = x.getDay(); return ajoute(x, j === 0 ? -6 : 1 - j);
  }
  function joli(d) { return L.jours[d.getDay()] + ' ' + d.getDate() + ' ' + L.mois[d.getMonth()]; }
  function dateDepuisCle(k) { return new Date(k + 'T00:00:00'); }

  // Toute donnée qui vient du serveur ou du visiteur passe par ici avant
  // d'être écrite dans la page.
  function txt(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fusionne(base, sur) {
    var r = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) r[k] = base[k];
    for (k in sur)  if (Object.prototype.hasOwnProperty.call(sur, k)) {
      if (sur[k] && typeof sur[k] === 'object' && !Array.isArray(sur[k]) &&
          base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        r[k] = fusionne(base[k], sur[k]);
      } else if (sur[k] !== undefined) {
        r[k] = sur[k];
      }
    }
    return r;
  }

  /* =========================================================================
     2. Adaptateur LOCAL — le navigateur fait office de serveur
     Sert aux maquettes de prospection. Aucun rendez-vous ne quitte le poste
     du visiteur, et c'est dit noir sur blanc dans le bandeau de démonstration.
     ========================================================================= */
  function AdaptateurLocal(cfg) {
    var CLE = 'nsr.' + (cfg.slug || 'demo') + '.v1';

    function lire() {
      try { return JSON.parse(localStorage.getItem(CLE)) || []; }
      catch (e) { return []; }
    }
    function ecrire(l) {
      try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('nsr:maj'));
    }

    // Un onglet réserve, les autres se mettent à jour tout seuls.
    window.addEventListener('storage', function (e) {
      if (e.key === CLE) document.dispatchEvent(new CustomEvent('nsr:maj'));
    });

    // Quelques rendez-vous déjà pris, pour qu'une démonstration ne montre
    // pas un agenda désespérément vide.
    function amorcer() {
      if (!cfg.demo || !cfg.demoRendezVous.length) return;
      if (localStorage.getItem(CLE + '.amorce')) return;
      var base = new Date(); base.setHours(0, 0, 0, 0);
      var liste = lire();
      cfg.demoRendezVous.forEach(function (f, i) {
        var d = ajoute(base, f.dans);
        if (!(cfg.ouvertures[d.getDay()] || []).length) return;
        var p = prestationParCode(cfg, f.prestation);
        if (!p) return;
        liste.push({
          reference: 'DEMO-' + i, jour: cle(d), debut: f.debut,
          fin: min2str(str2min(f.debut) + p.duree),
          prestation: p.code, prestationNom: p.nom, duree: p.duree,
          nom: f.nom, statut: 'confirme', demo: true
        });
      });
      ecrire(liste);
      try { localStorage.setItem(CLE + '.amorce', '1'); } catch (e) {}
    }

    return {
      local: true,
      charger: function () { amorcer(); return Promise.resolve(null); },

      occupes: function (du, au) {
        return Promise.resolve(lire()
          .filter(function (r) {
            return r.statut !== 'annule' && r.jour >= du && r.jour <= au;
          })
          .map(function (r) { return { jour: r.jour, debut: r.debut, fin: r.fin }; }));
      },

      joursFermes: function () { return Promise.resolve(cfg.fermetures.slice()); },

      reserver: function (d) {
        var liste = lire();
        var deb = str2min(d.debut), fin = deb + d.prestationObj.duree;
        var places = cfg.etablissement.placesParCreneau || 1;
        var pris = 0;
        liste.forEach(function (r) {
          if (r.statut !== 'annule' && r.jour === d.jour &&
              deb < str2min(r.fin) && fin > str2min(r.debut)) pris++;
        });
        if (pris >= places) return Promise.resolve({ ok: false, erreur: 'creneau_pris' });

        var ref = (cfg.prefixeReference || 'RDV') + '-' +
                  Math.random().toString(36).slice(2, 7).toUpperCase();
        liste.push({
          reference: ref, jour: d.jour, debut: d.debut, fin: min2str(fin),
          prestation: d.prestation, prestationNom: d.prestationObj.nom,
          duree: d.prestationObj.duree,
          nom: d.prenom + ' ' + d.nom, telephone: d.telephone, email: d.email,
          note: d.note, statut: 'confirme', cree: new Date().toISOString()
        });
        ecrire(liste);
        return Promise.resolve({
          ok: true, reference: ref, statut: 'confirme',
          jour: d.jour, debut: d.debut, fin: min2str(fin),
          prestation: d.prestationObj.nom, duree: d.prestationObj.duree
        });
      },

      // Utilisé seulement par le panneau « côté professionnel » des maquettes.
      agendaPro: function () {
        var maintenant = new Date();
        return Promise.resolve(lire()
          .filter(function (r) {
            return r.statut !== 'annule' && new Date(r.jour + 'T' + r.debut) >= maintenant;
          })
          .sort(function (a, b) { return (a.jour + a.debut).localeCompare(b.jour + b.debut); }));
      },
      supprimer: function (ref) {
        ecrire(lire().filter(function (r) { return r.reference !== ref; }));
        return Promise.resolve();
      }
    };
  }

  /* =========================================================================
     3. Adaptateur SUPABASE — la production
     On n'appelle que des fonctions, jamais les tables. Les tables sont
     fermées : même en bricolant la clé publique, un visiteur ne peut pas
     lire le nom, le téléphone ni le motif d'un autre patient.
     ========================================================================= */
  function AdaptateurSupabase(cfg) {
    var base = String(cfg.supabase.url).replace(/\/+$/, '');
    var cleAnon = cfg.supabase.cle;

    function rpc(nom, params) {
      return fetch(base + '/rest/v1/rpc/' + nom, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cleAnon,
          'Authorization': 'Bearer ' + cleAnon
        },
        body: JSON.stringify(params || {})
      }).then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            throw new Error('Réponse ' + r.status + ' : ' + t.slice(0, 200));
          });
        }
        return r.json();
      });
    }

    return {
      local: false,

      // Le site ne connaît PAS les horaires du client : il les demande.
      // Conséquence directe : quand le professionnel change ses horaires
      // depuis son espace, le site suit sans qu'on republie quoi que ce soit.
      charger: function () {
        return rpc('nsr_config_publique', { p_slug: cfg.slug }).then(function (c) {
          if (!c) throw new Error('Établissement « ' + cfg.slug + ' » inconnu ou inactif.');
          var ouv = {};
          (c.ouvertures || []).forEach(function (o) {
            (ouv[o.jour] = ouv[o.jour] || []).push([o.debut, o.fin]);
          });
          return {
            etablissement: {
              nom: c.nom, adresse: c.adresse, telephone: c.telephone,
              modeValidation: c.modeValidation,
              pasMinutes: c.pasMinutes,
              delaiMiniHeures: c.delaiMiniHeures,
              horizonJours: c.horizonJours,
              annulationMiniHeures: c.annulationMiniHeures
            },
            prestations: (c.prestations || []).map(function (p) {
              return {
                code: p.code, nom: p.nom, description: p.description,
                duree: p.duree, prix: p.prix
              };
            }),
            ouvertures: ouv
          };
        });
      },

      occupes: function (du, au) {
        return rpc('nsr_creneaux_occupes', { p_slug: cfg.slug, p_du: du, p_au: au });
      },

      joursFermes: function (du, au) {
        return rpc('nsr_jours_fermes', { p_slug: cfg.slug, p_du: du, p_au: au })
          .then(function (l) { return (l || []).map(function (x) { return x.jour || x; }); });
      },

      reserver: function (d) {
        return rpc('nsr_reserver', {
          p_slug: cfg.slug, p_prestation: d.prestation,
          p_jour: d.jour, p_debut: d.debut,
          p_prenom: d.prenom, p_nom: d.nom,
          p_telephone: d.telephone, p_email: d.email,
          p_note: d.note || null, p_premiere: !!d.premiere
        });
      },

      agendaPro: function () { return Promise.resolve([]); },
      supprimer: function () { return Promise.resolve(); }
    };
  }

  /* =========================================================================
     4. Calcul des créneaux réellement proposables
     ========================================================================= */
  function prestationParCode(cfg, code) {
    var t = cfg.prestations.filter(function (p) { return p.code === code; });
    return t[0] || null;
  }

  /* Config vue dans une langue donnée : le vocabulaire du client (textes
     d'habillage, noms et descriptions des prestations) passe par le bloc
     `traductions`. Ce qui n'est pas traduit reste dans la langue d'origine
     du site plutôt que de disparaître. */
  function configTraduite(cfg, code) {
    var t = cfg.traductions && cfg.traductions[code];
    if (!t) return cfg;

    var out = fusionne(cfg, {});
    out.textes = fusionne(cfg.textes, t.textes || {});

    var pres = t.prestations || {};
    out.prestations = cfg.prestations.map(function (p) {
      return pres[p.code] ? fusionne(p, pres[p.code]) : p;
    });
    return out;
  }

  function creneauxDuJour(cfg, etat, date, prestation) {
    var plages = cfg.ouvertures[date.getDay()] || [];
    var k = cle(date);

    if (etat.joursFermes.indexOf(k) !== -1) return { ferme: true, liste: [] };
    if (!plages.length) return { ferme: true, liste: [] };

    var occupes = etat.occupes.filter(function (o) { return o.jour === k; });
    var places = cfg.etablissement.placesParCreneau || 1;
    var limite = new Date(Date.now() + cfg.etablissement.delaiMiniHeures * 3600e3);
    var maxi = ajoute(new Date(), cfg.etablissement.horizonJours);
    var liste = [];

    if (date > maxi) return { ferme: false, horsHorizon: true, liste: [] };

    plages.forEach(function (p) {
      var deb = str2min(p[0]), fin = str2min(p[1]);
      for (var t = deb; t + prestation.duree <= fin; t += cfg.etablissement.pasMinutes) {
        var quand = new Date(date);
        quand.setHours(Math.floor(t / 60), t % 60, 0, 0);

        var passe = quand < limite;
        var pris = 0;
        occupes.forEach(function (o) {
          if (t < str2min(o.fin) && (t + prestation.duree) > str2min(o.debut)) pris++;
        });
        var chevauche = pris >= places;

        liste.push({
          jour: k,
          heure: min2str(t),
          libre: !passe && !chevauche,
          passe: passe
        });
      }
    });

    // On ne montre pas les heures déjà passées : un lundi consulté à 16h
    // commence à 16h, il n'affiche pas huit créneaux barrés du matin.
    return { ferme: false, liste: liste.filter(function (c) { return !c.passe; }) };
  }

  /* =========================================================================
     5. Messages d'erreur
     Le serveur renvoie un code, jamais une phrase. Les phrases vivent dans
     le bloc LANGUES ci-dessus : elles suivent donc la langue de la page,
     sans que la base ait à savoir en quelle langue parle le visiteur.
     ========================================================================= */
  function messageErreur(code) { return L.erreurs[code] || L.erreurs.reessayer; }

  /* =========================================================================
     5 bis. Le calendrier du visiteur
     Le créneau est pris, mais il n'est encore noté nulle part : un rendez-vous
     qu'on ne retrouve pas dans son téléphone est un rendez-vous oublié, et un
     oubli coûte au professionnel un créneau vide qu'il ne peut plus revendre.
     On met donc le rendez-vous dans SON agenda, en un clic.

     Deux chemins, parce qu'aucun ne marche partout :
       - Google, Outlook.com et Microsoft 365 s'ouvrent par une simple adresse
         web, l'évènement arrive pré-rempli, le visiteur n'a qu'à enregistrer.
       - Apple (iPhone, iPad, Mac) et tous les autres lisent le format .ics,
         un fichier que l'on fabrique ici, dans le navigateur.

     Rien ne sort du poste du visiteur : aucun service tiers n'est appelé, et
     le lien de gestion du rendez-vous (qui porte un jeton) reste dans son
     e-mail plutôt que dans un évènement qu'il pourrait partager.
     ========================================================================= */

  /* Décalage, en millisecondes, entre le fuseau demandé et UTC à cet instant.
     Sans lui, un rendez-vous de 14 h atterrirait à 14 h dans le fuseau du
     téléphone : juste pour le voisin, faux pour qui réserve en voyage. */
  function decalageFuseau(ms, fuseau) {
    try {
      var f = new Intl.DateTimeFormat('en-US', {
        timeZone: fuseau, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      var p = {};
      f.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      var h = p.hour === '24' ? 0 : +p.hour;   // minuit s'écrit 24 chez certains
      return Date.UTC(+p.year, +p.month - 1, +p.day, h, +p.minute, +p.second) - ms;
    } catch (e) {
      return NaN;   // navigateur trop ancien, ou fuseau inconnu de lui
    }
  }

  /* Une date et une heure de pendule ('2026-09-21', '12:00') lues dans le
     fuseau de l'établissement, rendues en instant réel. */
  function instant(jour, heure, fuseau) {
    var d = String(jour).split('-'), t = String(heure).split(':');
    var brut = Date.UTC(+d[0], +d[1] - 1, +d[2], +t[0], +t[1], 0);
    var off = decalageFuseau(brut, fuseau);
    // Repli : le navigateur ne sait pas convertir, on prend son heure à lui.
    if (isNaN(off)) return new Date(+d[0], +d[1] - 1, +d[2], +t[0], +t[1], 0);
    // Deuxième passe : la première suffit sauf le week-end du changement
    // d'heure, où l'écart se mesure du mauvais côté de la bascule.
    off = decalageFuseau(brut - off, fuseau);
    return new Date(brut - off);
  }

  function horodate(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
           pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  /* Ce que les deux chemins ont à savoir du rendez-vous. `r` est la réponse
     de la réservation, `code` le code de la prestation choisie.

     `r` peut porter lui-même le nom, l'adresse et le téléphone de
     l'établissement : c'est le cas quand le rendez-vous vient d'être relu
     dans la base, depuis la page « mon rendez-vous ». Ce que dit la base
     l'emporte sur ce que le site embarque, qui peut dater. */
  function evenement(cfg, r, code) {
    var e = cfg.etablissement;
    var nomEtab  = r.etablissement || e.nom || '';
    var adresse  = r.adresse !== undefined && r.adresse !== null ? r.adresse : (e.adresse || '');
    var telEtab  = r.telephone || e.telephone || '';
    var fuseau = e.fuseau || 'Europe/Luxembourg';
    var debut = instant(r.jour, r.debut, fuseau);
    var fin = r.fin
      ? instant(r.jour, r.fin, fuseau)
      : new Date(debut.getTime() + (r.duree || 60) * 60000);

    var titre = cfg.calendrier.titre
      ? String(cfg.calendrier.titre)
          .replace(/\{prestation\}/g, r.prestation || '')
          .replace(/\{etablissement\}/g, nomEtab)
      : [r.prestation, nomEtab].filter(Boolean).join(' — ');

    // À domicile, l'adresse de l'établissement serait un contresens, et
    // celle du visiteur, on ne l'a pas : on laisse le lieu vide.
    var aDomicile = cfg.prestationsADomicile.indexOf(code) !== -1;

    var lignes = [];
    if (r.reference) lignes.push(L.recapReference + ' : ' + r.reference);
    if (telEtab) lignes.push(L.telephone + ' : ' + telEtab);

    return {
      titre: titre,
      debut: debut,
      fin: fin,
      lieu: aDomicile ? '' : adresse,
      details: lignes.join('\n'),
      reference: r.reference || '',
      slug: cfg.slug || 'nsr'
    };
  }

  /* --- le fichier .ics ---------------------------------------------------- */
  function echapIcs(s) {
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  // Le format impose des lignes courtes : au-delà, on coupe et on reprend
  // avec une espace en tête. Apple est le plus strict là-dessus.
  function plie(ligne) {
    if (ligne.length <= 72) return ligne;
    var out = ligne.slice(0, 72), reste = ligne.slice(72);
    while (reste.length) { out += '\r\n ' + reste.slice(0, 71); reste = reste.slice(71); }
    return out;
  }

  function fichierIcs(ev, rappelMinutes) {
    var l = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NS Development//Module de reservation//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + (ev.reference || horodate(ev.debut)) + '@' + ev.slug + '.nsr',
      'DTSTAMP:' + horodate(new Date()),
      'DTSTART:' + horodate(ev.debut),
      'DTEND:' + horodate(ev.fin),
      'SUMMARY:' + echapIcs(ev.titre),
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE'
    ];
    if (ev.lieu) l.push('LOCATION:' + echapIcs(ev.lieu));
    if (ev.details) l.push('DESCRIPTION:' + echapIcs(ev.details));
    if (rappelMinutes > 0) {
      l.push('BEGIN:VALARM', 'ACTION:DISPLAY',
             'DESCRIPTION:' + echapIcs(ev.titre),
             'TRIGGER:-PT' + Math.round(rappelMinutes) + 'M', 'END:VALARM');
    }
    l.push('END:VEVENT', 'END:VCALENDAR');
    return l.map(plie).join('\r\n') + '\r\n';
  }

  function telechargeIcs(texte, nom) {
    var a = document.createElement('a');
    // Navigateur sans téléchargement programmé : on ouvre le fichier, le
    // système le remet à l'application calendrier.
    if (!('download' in a) || typeof Blob === 'undefined') {
      window.location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(texte);
      return;
    }
    var url = URL.createObjectURL(new Blob([texte], { type: 'text/calendar;charset=utf-8' }));
    a.href = url;
    a.download = nom;
    a.rel = 'noopener';
    document.body.appendChild(a);
    // Le clic ne doit surtout pas remonter : beaucoup de sites (les nôtres
    // compris) écoutent les clics sur les liens au niveau du document pour
    // enchaîner un fondu de page. Ce lien-là n'est pas une navigation, c'est
    // un fichier. Un clic qui ne bouillonne pas ne réveille personne.
    a.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  /* --- les calendriers qui s'ouvrent dans un onglet ------------------------ */
  function urlCalendrier(cible, ev) {
    var q = function (o) {
      var t = [];
      for (var k in o) if (o[k]) t.push(k + '=' + encodeURIComponent(o[k]));
      return t.join('&');
    };

    if (cible === 'google') {
      return 'https://calendar.google.com/calendar/render?' + q({
        action: 'TEMPLATE',
        text: ev.titre,
        dates: horodate(ev.debut) + '/' + horodate(ev.fin),
        details: ev.details,
        location: ev.lieu
      });
    }

    // Outlook.com et Microsoft 365 : même formulaire, deux domaines.
    var base = cible === 'office'
      ? 'https://outlook.office.com/calendar/0/deeplink/compose?'
      : 'https://outlook.live.com/calendar/0/deeplink/compose?';
    return base + q({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: ev.titre,
      body: ev.details,
      location: ev.lieu,
      startdt: ev.debut.toISOString(),
      enddt: ev.fin.toISOString(),
      allday: 'false'
    });
  }

  /* --- le bouton et son menu ----------------------------------------------
     Écrit une fois, posé à deux endroits : l'écran de confirmation du module,
     et la page « mon rendez-vous » au bout du lien de l'e-mail. Le patient y
     retrouve le même bouton au même endroit, ce qui est exactement ce qu'on
     veut : deux boutons différents pour la même action, c'est déjà une
     hésitation de trop.

     `hote` est l'élément à remplir. On rend de quoi le piloter :
       montre(ev)   affiche le bouton pour cet évènement ; null le cache
       detruire()   reprend les écouteurs posés sur le document
     ------------------------------------------------------------------------ */
  function ComposantCalendrier(hote, options) {
    options = options || {};

    var choix = [
      ['google',  L.calGoogle],
      ['apple',   L.calApple],
      ['outlook', L.calOutlook],
      ['office',  L.calOffice],
      ['ics',     L.calAutre]
    ];

    hote.innerHTML =
      '<div class="nsr__cal" data-cal hidden>' +
        '<button type="button" class="nsr-btn nsr-btn--cal" data-cal-ouvre ' +
          'aria-expanded="false" aria-haspopup="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>' +
            '<path d="m9 15 2 2 4-4"/></svg>' +
          txt(L.calAjouter) +
        '</button>' +
        '<div class="nsr__calmenu" data-cal-menu hidden role="menu">' +
          '<p class="nsr__calaide">' + txt(L.calAide) + '</p>' +
          choix.map(function (c) {
            return '<button type="button" role="menuitem" class="nsr__calitem" ' +
                   'data-cal-choix="' + c[0] + '">' + txt(c[1]) +
                   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
                     'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                     '<path d="m9 6 6 6-6 6"/></svg></button>';
          }).join('') +
        '</div>' +
      '</div>';

    var bloc  = hote.querySelector('[data-cal]');
    var ouvre = hote.querySelector('[data-cal-ouvre]');
    var menu  = hote.querySelector('[data-cal-menu]');
    var ev    = null;

    function ferme() {
      menu.hidden = true;
      ouvre.setAttribute('aria-expanded', 'false');
    }

    ouvre.addEventListener('click', function () {
      var ouvert = menu.hidden;
      menu.hidden = !ouvert;
      ouvre.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      if (ouvert) {
        var premier = menu.querySelector('.nsr__calitem');
        if (premier) premier.focus();
      }
    });

    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cal-choix]');
      if (!b || !ev) return;
      var cible = b.getAttribute('data-cal-choix');

      if (cible === 'apple' || cible === 'ics') {
        telechargeIcs(fichierIcs(ev, options.rappelMinutes),
                      'rendez-vous-' + (ev.reference || ev.slug) + '.ics');
      } else {
        window.open(urlCalendrier(cible, ev), '_blank', 'noopener');
      }
      ferme();
      ouvre.focus();
      document.dispatchEvent(new CustomEvent('nsr:calendrier', { detail: { cible: cible } }));
    });

    // Un menu ouvert se ferme comme partout ailleurs : Échap, ou un clic à
    // côté. Sans ça, il resterait ouvert derrière le doigt du visiteur.
    function surTouche(e) {
      if (e.key === 'Escape' && !menu.hidden) { ferme(); ouvre.focus(); }
    }
    function surClic(e) {
      if (!menu.hidden && !bloc.contains(e.target)) ferme();
    }
    document.addEventListener('keydown', surTouche);
    document.addEventListener('click', surClic);

    return {
      montre: function (n) { ev = n || null; bloc.hidden = !ev; ferme(); },
      detruire: function () {
        document.removeEventListener('keydown', surTouche);
        document.removeEventListener('click', surClic);
      }
    };
  }

  /* =========================================================================
     6. L'interface
     ========================================================================= */
  function Reservation(racine, cfg, adaptateur) {
    var etat = {
      etape: 1,
      prestation: null,
      creneau: null,
      semaine: lundiDe(new Date()),
      occupes: [],
      joursFermes: [],
      chargement: false,
      resultat: null
    };

    var T = cfg.textes;
    var $ = function (s) { return racine.querySelector(s); };

    // Quels jours de la semaine faut-il afficher ? On le déduit des horaires
    // du client : un cabinet fermé le dimanche n'a pas de colonne dimanche.
    var joursAffiches = (function () {
      var ordre = [1, 2, 3, 4, 5, 6, 0], out = [];
      ordre.forEach(function (j) {
        if ((cfg.ouvertures[j] || []).length) out.push(j);
      });
      return out.length ? out : [1, 2, 3, 4, 5, 6];
    })();

    /* --- squelette ------------------------------------------------------- */
    racine.innerHTML =
      '<div class="nsr__steps">' +
        T.etapes.map(function (e, i) {
          return '<div class="nsr__step' + (i === 0 ? ' is-active' : '') + '">' +
                 '<em>' + (i + 1) + '</em>' + txt(e) + '</div>';
        }).join('') +
      '</div>' +
      '<div class="nsr__body">' +

        /* étape 1 */
        '<div class="nsr__panel is-on">' +
          '<h3>' + txt(T.choixTitre) + '</h3>' +
          '<p class="nsr__hint">' + txt(T.choixAide) + '</p>' +
          '<div class="nsr__choices" data-choices></div>' +
          '<div class="nsr__actions nsr__actions--end">' +
            '<button type="button" class="nsr-btn nsr-btn--go" data-goto="2" data-next1 disabled>' +
              txt(T.choixSuivant) + '</button>' +
          '</div>' +
        '</div>' +

        /* étape 2 */
        '<div class="nsr__panel">' +
          '<h3>' + txt(T.creneauTitre) + '</h3>' +
          '<p class="nsr__hint">' + txt(T.creneauAide) + '</p>' +
          '<div class="nsr__weeknav">' +
            '<button type="button" data-prev aria-label="' + txt(L.semainePrec) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>' +
            '</button>' +
            '<span class="nsr__weeklabel" data-weeklabel></span>' +
            '<button type="button" data-next aria-label="' + txt(L.semaineSuiv) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="nsr__week" data-week aria-live="polite"></div>' +
          '<div class="nsr__legend">' +
            '<span><i class="is-free"></i>' + txt(L.legendeLibre) + '</span>' +
            '<span><i class="is-taken"></i>' + txt(L.legendePris) + '</span>' +
            '<span><i class="is-mine"></i>' + txt(L.legendeChoix) + '</span>' +
          '</div>' +
          '<div class="nsr__actions">' +
            '<button type="button" class="nsr-btn nsr-btn--back" data-goto="1">' + txt(L.retour) + '</button>' +
            '<button type="button" class="nsr-btn nsr-btn--go" data-goto="3" data-next2 disabled>' +
              txt(L.continuer) + '</button>' +
          '</div>' +
        '</div>' +

        /* étape 3 */
        '<div class="nsr__panel">' +
          '<h3>' + txt(T.coordonneesTitre) + '</h3>' +
          '<p class="nsr__hint">' + txt(T.coordonneesAide) + '</p>' +
          '<div class="nsr__recap" data-recap></div>' +
          '<div class="nsr__alert" data-alert hidden role="alert"></div>' +
          '<form data-form novalidate>' + champsHtml() + '</form>' +
        '</div>' +

        /* étape 4 */
        '<div class="nsr__panel">' +
          '<div class="nsr__done">' +
            '<div class="nsr__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
            '<h3 data-done-titre></h3>' +
            '<p class="nsr__hint" data-done-aide></p>' +
            '<div class="nsr__recap" data-done-recap></div>' +
            '<div data-cal-hote></div>' +
            '<p class="nsr__after" data-after></p>' +
            '<div class="nsr__actions nsr__actions--center">' +
              '<button type="button" class="nsr-btn nsr-btn--back" data-restart>' + txt(T.recommencer) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>';

    function masque(nom) { return cfg.champsMasques.indexOf(nom) !== -1; }

    function champsHtml() {
      var h = '<div class="nsr__grid">' +
        champ('prenom', L.prenom, 'text', 'given-name', true) +
        champ('nom', L.nom, 'text', 'family-name', true) +
        champ('telephone', L.telephone, 'tel', 'tel', true, '+352 621 00 00 00') +
        champ('email', L.email, 'email', 'email', true, L.exempleEmail);

      if (!masque('note')) {
        h += '<div class="nsr__field nsr__field--full">' +
             '<label for="nsr-note">' + txt(T.noteLabel) +
             ' <span class="nsr__opt">' + txt(L.facultatif) + '</span></label>' +
             '<textarea id="nsr-note" name="note" placeholder="' + txt(T.notePlaceholder) + '"></textarea>' +
             '</div>';
      }
      if (!masque('premiere')) {
        h += '<div class="nsr__field nsr__field--full">' +
             '<label class="nsr__check"><input type="checkbox" name="premiere">' +
             '<span>' + txt(T.premiereVisite) + '</span></label></div>';
      }
      h += '<div class="nsr__field nsr__field--full">' +
           '<label class="nsr__check"><input type="checkbox" name="rgpd" required>' +
           '<span>' + txt(T.rgpd) + '</span></label>' +
           '<span class="nsr__err">' + txt(L.caseRequise) + '</span></div>';

      return h + '</div>' +
        '<div class="nsr__actions">' +
          '<button type="button" class="nsr-btn nsr-btn--back" data-goto="2">' + txt(L.retour) + '</button>' +
          '<button type="submit" class="nsr-btn nsr-btn--go" data-submit>' + txt(T.valider) + '</button>' +
        '</div>';
    }

    function champ(nom, label, type, autocomplete, requis, placeholder) {
      return '<div class="nsr__field">' +
        '<label for="nsr-' + nom + '">' + txt(label) + '</label>' +
        '<input id="nsr-' + nom + '" name="' + nom + '" type="' + type + '"' +
        ' autocomplete="' + autocomplete + '"' +
        (placeholder ? ' placeholder="' + txt(placeholder) + '"' : '') +
        (requis ? ' required' : '') + '>' +
        '<span class="nsr__err">' + txt(L.champRequis) + '</span>' +
      '</div>';
    }

    var etapesEls = racine.querySelectorAll('.nsr__step');
    var panneaux  = racine.querySelectorAll('.nsr__panel');

    /* --- étape 1 : les prestations --------------------------------------- */
    function dessineChoix() {
      var boite = $('[data-choices]');
      if (!cfg.prestations.length) {
        boite.innerHTML = '<p class="nsr__hint">' + txt(L.aucunePrestation) + '</p>';
        return;
      }
      boite.innerHTML = cfg.prestations.map(function (p) {
        return '<button type="button" class="nsr__choice" data-choice="' + txt(p.code) + '">' +
          '<b>' + txt(p.nom) + '</b>' +
          (p.description ? '<span>' + txt(p.description) + '</span>' : '') +
          '<span class="nsr__dur">' + p.duree + ' ' + txt(L.minCourt) +
          (p.prix != null ? ' · ' + Number(p.prix).toFixed(2).replace('.', ',') + ' €' : '') +
          '</span></button>';
      }).join('');
    }

    racine.addEventListener('click', function (e) {
      var b = e.target.closest('[data-choice]');
      if (!b) return;
      racine.querySelectorAll('.nsr__choice').forEach(function (x) { x.classList.remove('is-sel'); });
      b.classList.add('is-sel');
      etat.prestation = prestationParCode(cfg, b.dataset.choice);
      etat.creneau = null;
      $('[data-next1]').disabled = !etat.prestation;
    });

    /* --- étape 2 : la semaine -------------------------------------------- */
    function bornesSemaine() {
      var fins = joursAffiches.map(function (j) { return j === 0 ? 6 : j - 1; });
      var dernier = Math.max.apply(null, fins);
      return { du: cle(etat.semaine), au: cle(ajoute(etat.semaine, dernier)) };
    }

    /* Y a-t-il encore une place à prendre dans la semaine affichée ? */
    function semaineADesPlaces() {
      return joursAffiches.some(function (j) {
        var res = creneauxDuJour(cfg, etat,
          ajoute(etat.semaine, j === 0 ? 6 : j - 1), etat.prestation);
        return !res.ferme && !res.horsHorizon &&
               res.liste.some(function (c) { return c.libre; });
      });
    }

    /* `sauts` n'est passé qu'à la première ouverture de l'étape 2. La semaine
       en cours est souvent déjà passée ou complète — un vendredi soir, un
       samedi — et le visiteur tomberait sur une grille vide alors que le
       cabinet a de la place lundi. On avance alors jusqu'à la première
       semaine disponible. La navigation manuelle, elle, ne saute jamais. */
    function chargeSemaine(sauts) {
      var b = bornesSemaine();
      etat.chargement = true;
      dessineSemaine();
      return Promise.all([
        adaptateur.occupes(b.du, b.au),
        adaptateur.joursFermes(b.du, b.au)
      ]).then(function (r) {
        etat.occupes = r[0] || [];
        etat.joursFermes = r[1] || [];
        etat.chargement = false;
        dessineSemaine();

        if (sauts > 0 && !semaineADesPlaces()) {
          var maxSemaine = lundiDe(ajoute(new Date(), cfg.etablissement.horizonJours));
          if (etat.semaine < maxSemaine) {
            etat.semaine = ajoute(etat.semaine, 7);
            return chargeSemaine(sauts - 1);
          }
        }
      }).catch(function (err) {
        etat.chargement = false;
        etat.erreurReseau = true;
        dessineSemaine();
        if (window.console) console.error('[NSR]', err);
      });
    }

    function dessineSemaine() {
      var grille = $('[data-week]');
      grille.style.setProperty('--nsr-cols', joursAffiches.length);

      var fin = ajoute(etat.semaine, Math.max.apply(null,
        joursAffiches.map(function (j) { return j === 0 ? 6 : j - 1; })));
      $('[data-weeklabel]').textContent =
        etat.semaine.getDate() + ' ' + L.mois[etat.semaine.getMonth()] +
        ' — ' + fin.getDate() + ' ' + L.mois[fin.getMonth()] + ' ' + fin.getFullYear();

      $('[data-prev]').disabled = etat.semaine <= lundiDe(new Date());
      var maxSemaine = lundiDe(ajoute(new Date(), cfg.etablissement.horizonJours));
      $('[data-next]').disabled = etat.semaine >= maxSemaine;

      if (etat.erreurReseau) {
        grille.innerHTML = '<p class="nsr__void">' + txt(L.erreurs.reseau) + '</p>';
        return;
      }
      if (etat.chargement) {
        grille.innerHTML = '<p class="nsr__void nsr__void--load">' + txt(L.chargement) + '</p>';
        return;
      }

      var aujourdhui = cle(new Date());
      var html = '';

      joursAffiches.forEach(function (j) {
        var decal = (j === 0 ? 6 : j - 1);
        var d = ajoute(etat.semaine, decal);
        /* La grille ouvre sur le lundi de la semaine en cours : en milieu de
           semaine, les premières colonnes sont derrière nous. Elles disaient
           « Plus de créneau », ce qui se lit « c'est complet » — l'inverse du
           message à faire passer. Un jour passé est passé, il le dit. */
        var estPasse = cle(d) < aujourdhui;
        var res = creneauxDuJour(cfg, etat, d, etat.prestation);

        html += '<div class="nsr__day' + (cle(d) === aujourdhui ? ' is-today' : '') +
          (estPasse ? ' is-past' : '') + '">' +
          '<div class="nsr__dayhead"><span class="nsr__dow">' + L.joursC[d.getDay()] + '</span>' +
          '<span class="nsr__daynum">' + d.getDate() + '</span></div>';

        if (estPasse) {
          html += '<p class="nsr__none">' + txt(L.passe) + '</p>';
        } else if (res.ferme) {
          html += '<p class="nsr__none">' + txt(L.ferme) + '</p>';
        } else if (res.horsHorizon) {
          html += '<p class="nsr__none">—</p>';
        } else if (!res.liste.length) {
          html += '<p class="nsr__none">' + txt(L.plusDeCreneau) + '</p>';
        } else if (!res.liste.some(function (c) { return c.libre; })) {
          html += '<p class="nsr__none">' + txt(L.complet) + '</p>';
        } else {
          html += '<div class="nsr__slots">';
          res.liste.forEach(function (c) {
            if (c.libre) {
              var sel = etat.creneau && etat.creneau.jour === c.jour && etat.creneau.heure === c.heure;
              html += '<button type="button" class="nsr__slot' + (sel ? ' is-sel' : '') + '"' +
                ' data-slot="' + c.jour + '|' + c.heure + '"' +
                ' aria-label="' + txt(joli(d) + L.aHeure + c.heure) + '">' + c.heure + '</button>';
            } else {
              html += '<span class="nsr__slot is-taken" aria-hidden="true">' + c.heure + '</span>';
            }
          });
          html += '</div>';
        }
        html += '</div>';
      });

      grille.innerHTML = html;
      $('[data-next2]').disabled = !etat.creneau;
    }

    racine.addEventListener('click', function (e) {
      var b = e.target.closest('[data-slot]');
      if (!b) return;
      var p = b.dataset.slot.split('|');
      etat.creneau = { jour: p[0], heure: p[1] };
      dessineSemaine();
    });

    $('[data-prev]').addEventListener('click', function () {
      etat.semaine = ajoute(etat.semaine, -7); chargeSemaine();
    });
    $('[data-next]').addEventListener('click', function () {
      etat.semaine = ajoute(etat.semaine, 7); chargeSemaine();
    });

    /* --- étape 3 : récapitulatif ------------------------------------------ */
    function ligne(k, v) {
      return '<div><span>' + txt(k) + '</span><b>' + txt(v) + '</b></div>';
    }

    function dessineRecap() {
      var d = dateDepuisCle(etat.creneau.jour);
      var aDomicile = cfg.prestationsADomicile.indexOf(etat.prestation.code) !== -1;
      var lieu = aDomicile ? T.lieuDomicile : cfg.etablissement.adresse;

      $('[data-recap]').innerHTML =
        ligne(L.recapPrestation, etat.prestation.nom) +
        ligne(L.recapDate, joli(d)) +
        ligne(L.recapHeure, etat.creneau.heure + ' → ' +
              min2str(str2min(etat.creneau.heure) + etat.prestation.duree)) +
        ligne(L.recapDuree, etat.prestation.duree + ' ' + L.minutes) +
        (lieu ? ligne(L.recapLieu, lieu) : '');
    }

    /* --- navigation ------------------------------------------------------- */
    function va(n) {
      etat.etape = n;
      panneaux.forEach(function (p, i) { p.classList.toggle('is-on', i === n - 1); });
      etapesEls.forEach(function (s, i) {
        s.classList.toggle('is-active', i === n - 1);
        s.classList.toggle('is-done', i < n - 1);
      });
      if (n === 2) chargeSemaine(6);
      if (n === 3) dessineRecap();
      var y = racine.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    racine.addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (b) va(+b.dataset.goto);
    });

    /* --- validation ------------------------------------------------------- */
    var form = $('[data-form]');
    var alerte = $('[data-alert]');

    function montreAlerte(msg) {
      alerte.textContent = msg;
      alerte.hidden = false;
    }
    function cacheAlerte() { alerte.hidden = true; }

    form.addEventListener('input', function (e) {
      var c = e.target.closest('.nsr__field');
      if (c) c.classList.remove('is-error');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cacheAlerte();

      var ok = true;
      form.querySelectorAll('[required]').forEach(function (ch) {
        var c = ch.closest('.nsr__field');
        var vide = ch.type === 'checkbox' ? !ch.checked : !ch.value.trim();
        if (ch.type === 'email' && !vide) {
          vide = !/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(ch.value.trim());
        }
        if (c) c.classList.toggle('is-error', vide);
        if (vide) ok = false;
      });
      if (!ok) {
        montreAlerte(L.champsRouges);
        return;
      }

      var bouton = form.querySelector('[data-submit]');
      bouton.disabled = true;
      bouton.classList.add('is-busy');
      var libelle = bouton.textContent;
      bouton.textContent = L.envoi;

      function relache() {
        bouton.disabled = false;
        bouton.classList.remove('is-busy');
        bouton.textContent = libelle;
      }

      adaptateur.reserver({
        prestation: etat.prestation.code,
        prestationObj: etat.prestation,
        jour: etat.creneau.jour,
        debut: etat.creneau.heure,
        prenom: form.prenom.value.trim(),
        nom: form.nom.value.trim(),
        telephone: form.telephone.value.trim(),
        email: form.email.value.trim(),
        note: form.note ? form.note.value.trim() : '',
        premiere: form.premiere ? form.premiere.checked : false
      }).then(function (r) {
        if (!r || !r.ok) {
          relache();
          var code = r && r.erreur;
          montreAlerte(messageErreur(code));
          // Le créneau est parti : on renvoie choisir, agenda rafraîchi.
          if (code === 'creneau_pris' || code === 'trop_tard' || code === 'ferme') {
            etat.creneau = null;
            va(2);
          }
          return;
        }
        relache();
        etat.resultat = r;
        afficheConfirmation(r);
        va(4);
        document.dispatchEvent(new CustomEvent('nsr:reserve', { detail: r }));
      }).catch(function (err) {
        relache();
        montreAlerte(L.erreurs.reseau);
        if (window.console) console.error('[NSR]', err);
      });
    });

    function afficheConfirmation(r) {
      var enAttente = r.statut === 'en_attente';
      var d = dateDepuisCle(r.jour);

      $('[data-done-titre]').textContent = enAttente ? T.attenteTitre : T.confirmeTitre;
      $('[data-done-aide]').textContent  = enAttente ? T.attenteAide  : T.confirmeAide;
      racine.querySelector('.nsr__done').classList.toggle('is-pending', enAttente);

      $('[data-done-recap]').innerHTML =
        ligne(L.recapReference, r.reference) +
        ligne(L.recapPrestation, r.prestation) +
        ligne(L.recapDate, joli(d)) +
        ligne(L.recapHeure, r.debut) +
        ligne(L.recapAuNom, form.prenom.value.trim() + ' ' + form.nom.value.trim());

      // Une demande encore en attente de validation n'a pas sa place dans un
      // agenda : le visiteur y verrait un rendez-vous qu'il n'a pas encore.
      montreCalendrier(enAttente ? null : evenement(cfg, r, etat.prestation && etat.prestation.code));

      var apres = $('[data-after]');
      apres.innerHTML = T.apresConfirmation || '';
      apres.hidden = !T.apresConfirmation;
    }

    /* --- « Ajouter à mon calendrier » -------------------------------------- */
    var cal = cfg.calendrier.actif === false
      ? null
      : ComposantCalendrier($('[data-cal-hote]'), { rappelMinutes: cfg.calendrier.rappelMinutes });

    function montreCalendrier(ev) { if (cal) cal.montre(ev); }

    /* --- recommencer ------------------------------------------------------ */
    $('[data-restart]').addEventListener('click', function () {
      etat.prestation = null; etat.creneau = null; etat.resultat = null;
      montreCalendrier(null);
      racine.querySelectorAll('.nsr__choice').forEach(function (x) { x.classList.remove('is-sel'); });
      $('[data-next1]').disabled = true;
      form.reset(); cacheAlerte(); va(1);
    });

    /* --- un autre onglet a réservé ---------------------------------------- */
    function surMaj() {
      if (etat.etape === 2 && etat.prestation) chargeSemaine(6);
    }
    document.addEventListener('nsr:maj', surMaj);

    dessineChoix();
    return {
      etat: etat,
      rafraichir: chargeSemaine,
      // Appelé avant de reconstruire le module dans une autre langue.
      detruire: function () {
        document.removeEventListener('nsr:maj', surMaj);
        if (cal) cal.detruire();
      }
    };
  }

  /* =========================================================================
     7. Panneau « côté professionnel »
     Uniquement pour les maquettes de démonstration : il sert à montrer au
     prospect que le rendez-vous qu'il vient de prendre arrive quelque part.
     En production, le professionnel a son espace, ce panneau n'existe pas.
     ========================================================================= */
  function panneauPro(el, cfg, adaptateur) {
    if (!adaptateur.local) { el.remove(); return; }

    function dessine() {
      adaptateur.agendaPro().then(function (liste) {
        if (!liste.length) {
          el.innerHTML = '<p class="nsr__hint">' + txt(L.aucunRdv) + '</p>';
          return;
        }
        el.innerHTML = '<ul class="nsr__prolist">' + liste.map(function (r) {
          var d = dateDepuisCle(r.jour);
          // Le nom enregistré avec le rendez-vous est celui de la langue dans
          // laquelle il a été pris. Ici on réaffiche celui de la langue en
          // cours, et on ne retombe sur l'enregistré que si le code a disparu.
          var p = prestationParCode(cfg, r.prestation);
          return '<li><time>' + L.joursC[d.getDay()] + ' ' + d.getDate() + '/' +
            pad(d.getMonth() + 1) + '<span>' + txt(r.debut) + '</span></time>' +
            '<div><b>' + txt(r.nom) + '</b><span>' + txt((p && p.nom) || r.prestationNom) +
            ' · ' + r.duree + ' ' + txt(L.minCourt) + ' · ' + txt(L.refCourt) + ' ' +
            txt(r.reference) + '</span></div>' +
            '<button type="button" data-annule="' + txt(r.reference) + '">' +
            txt(L.annuler) + '</button></li>';
        }).join('') + '</ul>';
      });
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-annule]');
      if (b) adaptateur.supprimer(b.dataset.annule);
    });
    document.addEventListener('nsr:maj', dessine);
    dessine();
    return { detruire: function () { document.removeEventListener('nsr:maj', dessine); } };
  }

  /* =========================================================================
     8. Encarts d'accroche : « prochain créneau libre », « X créneaux libres »
     ========================================================================= */
  function encarts(cfg, adaptateur) {
    // Une même page peut afficher le compteur à plusieurs endroits (bandeau
    // du haut ET encart plus bas) : on les remplit tous, pas seulement le
    // premier trouvé.
    var cibleProchain = document.querySelectorAll('[data-nsr-prochain]');
    var cibleCompte   = document.querySelectorAll('[data-nsr-libres]');
    if (!cibleProchain.length && !cibleCompte.length) return;

    function ecrire(liste, valeur) {
      Array.prototype.forEach.call(liste, function (el) { el.textContent = valeur; });
    }

    var reference = cfg.prestations[0];
    if (!reference) return;

    var base = new Date();
    var du = cle(base), au = cle(ajoute(base, 14));

    Promise.all([adaptateur.occupes(du, au), adaptateur.joursFermes(du, au)])
      .then(function (r) {
        var etat = { occupes: r[0] || [], joursFermes: r[1] || [] };
        var total = 0, prochain = null;

        for (var i = 0; i < 14; i++) {
          var d = ajoute(base, i);
          var res = creneauxDuJour(cfg, etat, d, reference);
          res.liste.forEach(function (c) {
            if (!c.libre) return;
            if (i < 7) total++;
            if (!prochain) prochain = { date: d, heure: c.heure };
          });
        }
        ecrire(cibleCompte, total);
        ecrire(cibleProchain, prochain
          ? joli(prochain.date) + L.aHeure + prochain.heure
          : L.nousContacter);
      })
      .catch(function () {
        ecrire(cibleProchain, L.nousContacter);
        ecrire(cibleCompte, '—');
      });
  }

  /* =========================================================================
     9. Démarrage
     ========================================================================= */
  function demarrer() {
    var brute = window.NSR_CONFIG;
    if (!brute) {
      if (window.console) console.warn('[NSR] Aucune configuration trouvée (window.NSR_CONFIG).');
      return;
    }
    var cfg = fusionne(DEFAUTS, brute);

    // Le vocabulaire du moteur suit la langue de la page dès maintenant :
    // l'API calendrier ci-dessous est utilisable sans qu'un module ait été
    // monté, et elle doit parler la bonne langue.
    L = LANGUES[langueConnue(cfg.langue || document.documentElement.getAttribute('lang'))];

    /* Ce que le moteur sait faire pour les autres pages du site. La page
       « mon rendez-vous » s'en sert pour proposer le même bouton
       « Ajouter à mon calendrier » qu'à la réservation, sans réécrire une
       ligne : un seul endroit à corriger le jour où un format change. */
    window.NSRCalendrier = {
      config: function (b) { return fusionne(DEFAUTS, b || window.NSR_CONFIG || {}); },
      evenement: evenement,          // (config, rendezVous, codePrestation)
      bouton: ComposantCalendrier,   // (élémentHôte, { rappelMinutes }) → { montre, detruire }
      ics: fichierIcs,               // (évènement, rappelMinutes) → texte .ics
      url: urlCalendrier,            // ('google'|'outlook'|'office', évènement)
      telecharge: telechargeIcs
    };

    // Une page sans agenda, sans panneau professionnel et sans encart n'a
    // rien à monter. On s'arrête là plutôt que d'interroger le serveur pour
    // rien : la page « mon rendez-vous » charge ce fichier uniquement pour
    // le calendrier ci-dessus.
    if (!document.querySelector('[data-nsr], [data-nsr-pro], [data-nsr-prochain], [data-nsr-libres]')) return;

    if (cfg.backend === 'supabase' && (!cfg.supabase || !cfg.supabase.url || !cfg.supabase.cle)) {
      if (window.console) console.error('[NSR] backend « supabase » sans url ni clé.');
      return;
    }

    var adaptateur = cfg.backend === 'supabase'
      ? AdaptateurSupabase(cfg)
      : AdaptateurLocal(cfg);

    // En production, les prestations et les horaires viennent du serveur :
    // ce que le site embarque n'est qu'un repli si le serveur ne répond pas.
    adaptateur.charger()
      .then(function (distant) {
        if (distant) {
          cfg.etablissement = fusionne(cfg.etablissement, distant.etablissement);
          if (distant.prestations && distant.prestations.length) cfg.prestations = distant.prestations;
          if (distant.ouvertures && Object.keys(distant.ouvertures).length) cfg.ouvertures = distant.ouvertures;
        }
      })
      .catch(function (err) {
        if (window.console) console.warn('[NSR] Configuration distante indisponible, repli local.', err);
      })
      .then(function () {
        var instance = null, pro = null, langueMontee = null;

        /* Construit (ou reconstruit) le module dans la langue demandée.
           Reconstruire plutôt que retraduire au coup par coup : le module
           est produit d'un bloc, donc le refaire est plus sûr que de courir
           après chaque mot déjà écrit. Le visiteur repart de l'étape 1, ce
           qui est le comportement attendu quand on change de langue. */
        function monte(code) {
          code = langueConnue(code);
          if (code === langueMontee) return;
          langueMontee = code;
          L = LANGUES[code];

          var cfgL = configTraduite(cfg, code);

          var racine = document.querySelector('[data-nsr]');
          if (racine) {
            if (instance && instance.detruire) instance.detruire();
            // Un clone vide reprend les attributs et les classes mais laisse
            // derrière lui les écouteurs de l'ancienne version.
            var neuve = racine.cloneNode(false);
            racine.parentNode.replaceChild(neuve, racine);
            instance = Reservation(neuve, cfgL, adaptateur);
            // Le clone porte les mêmes attributs d'animation, mais c'est un
            // autre nœud : sans ça il resterait invisible (opacité 0).
            if (window.NSMotion && window.NSMotion.observe) window.NSMotion.observe(neuve);
          }

          var elPro = document.querySelector('[data-nsr-pro]');
          if (elPro) {
            if (pro && pro.detruire) pro.detruire();
            var neufPro = elPro.cloneNode(false);
            elPro.parentNode.replaceChild(neufPro, elPro);
            pro = panneauPro(neufPro, cfgL, adaptateur) || null;
            if (window.NSMotion && window.NSMotion.observe) window.NSMotion.observe(neufPro);
          }

          encarts(cfgL, adaptateur);

          window.NSReservation = {
            config: cfgL,
            langue: code,
            adaptateur: adaptateur,
            instance: instance,
            creneauxDuJour: creneauxDuJour
          };
          document.dispatchEvent(new CustomEvent('nsr:pret'));
        }

        monte(cfg.langue || document.documentElement.getAttribute('lang'));

        // Le site a une bascule de langue : le module la suit.
        document.addEventListener('ns:langue', function (e) {
          monte((e.detail && e.detail.langue) ||
                document.documentElement.getAttribute('lang'));
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

})(window, document);
