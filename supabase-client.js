// ============================================================================
// Connexion Supabase — Espace client NS Development
// ----------------------------------------------------------------------------
// La clé ci-dessous est la clé PUBLIQUE (publishable) : elle est faite pour
// vivre dans le code du site, aucun risque. La sécurité vient des règles de
// rôle en base de données (Row Level Security), pas du secret de cette clé.
// NE JAMAIS mettre ici la clé "service_role" (secrète).
// ============================================================================
// La bibliothèque est hébergée sur le site (assets/vendor/), chargée juste avant
// ce fichier : aucun appel à un CDN tiers, donc aucune adresse IP transmise.
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://atgykykesntvporvbvuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CERC6vjpnV91Fh_2mA4VTQ_I0jcJ05F';

// --- Renouvellement de session sous contrôle (13/11/2026) -----------------
// Le jeton de renouvellement Supabase ne sert qu'UNE fois. Le 13/11, l'espace
// client l'a renvoyé en boucle après usage (400 « refresh_token_already_used »,
// puis 429 qui bloque toute l'adresse IP, donc aussi les autres espaces).
// Cause : quand le renouvellement échoue alors que le jeton d'accès vit encore,
// supabase-js garde la session avec le jeton brûlé, et sa pause de 60 s ne vit
// qu'en mémoire : chaque onglet et chaque rechargement (espace client -> admin)
// retente le même jeton. Désormais, au niveau réseau :
//   1. un seul renouvellement à la fois, partagé par tous les chargements de la
//      page, et sérialisé entre onglets (verrou du navigateur) ;
//   2. si un autre onglet a déjà renouvelé, on reprend sa session sans appel
//      (la rotation est notée sous le verrou, avant que l'onglet suivant passe) ;
//   3. un jeton refusé est noté « mort » (localStorage) : plus jamais renvoyé,
//      ni par cet onglet ni après rechargement ;
//   4. un refus renvoie proprement à l'écran de connexion, sans réessayer.
// Le minuteur automatique de supabase-js est coupé : il tournait dans chaque
// onglet ouvert. La session est renouvelée à la demande, juste avant un appel.
const CLE_SESSION = 'sb-' + new URL(SUPABASE_URL).hostname.split('.')[0] + '-auth-token';
const CLE_MORTS = 'ns-jetons-morts';
const CLE_ROTATION = 'ns-derniere-rotation';
const fetchNatif = window.fetch.bind(window);
let renouvellementEnCours = null;   // { jeton, promesse }
let sessionPerdueSignalee = false;

const lire = (cle) => { try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; } };
const jetonsMorts = () => { const l = lire(CLE_MORTS); return Array.isArray(l) ? l : []; };
function noterMort(jeton) {
  try { localStorage.setItem(CLE_MORTS, JSON.stringify([jeton].concat(jetonsMorts().filter(j => j !== jeton)).slice(0, 10))); } catch (e) {}
}
const reponse = (statut, corps) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
const refus = () => reponse(400, { code: 'refresh_token_already_used', error_code: 'refresh_token_already_used', msg: 'Session expirée, reconnectez-vous.' });

// Session perdue : on efface la session locale et on revient à la connexion,
// une seule fois. Sans session stockée, plus rien ne tente de renouveler :
// aucune boucle possible.
function sessionPerdue() {
  if (sessionPerdueSignalee) return;
  sessionPerdueSignalee = true;
  try { localStorage.removeItem(CLE_SESSION); localStorage.removeItem(CLE_SESSION + '-user'); localStorage.removeItem(CLE_ROTATION); } catch (e) {}
  try { sessionStorage.setItem('ns-session-expiree', '1'); } catch (e) {}
  console.warn('[NS] Session expirée : retour à la connexion.');
  setTimeout(() => {
    sessionPerdueSignalee = false;   // une prochaine connexion pourra de nouveau expirer
    if (typeof window.nsSessionPerdue === 'function') window.nsSessionPerdue();
    else window.location.replace('espace-client.html');
  }, 0);
}

async function renouveler(url, opts, jeton) {
  if (jetonsMorts().includes(jeton)) { sessionPerdue(); return refus(); }
  // Un autre onglet a déjà renouvelé : sa session est dans le stockage partagé.
  const stockee = lire(CLE_SESSION);
  if (stockee && stockee.refresh_token && stockee.refresh_token !== jeton && stockee.expires_at * 1000 > Date.now() + 60000) {
    return reponse(200, Object.assign({}, stockee, { expires_in: stockee.expires_at - Math.floor(Date.now() / 1000) }));
  }
  // Même cas, mais l'autre onglet n'a pas encore fini d'enregistrer sa session :
  // la rotation qu'il a notée sous le verrou suffit.
  const rotation = lire(CLE_ROTATION);
  if (rotation && rotation.ancien === jeton && rotation.session && rotation.session.expires_at * 1000 > Date.now() + 60000) {
    return reponse(200, Object.assign({}, rotation.session, { expires_in: rotation.session.expires_at - Math.floor(Date.now() / 1000) }));
  }
  const r = await fetchNatif(url, opts);
  if (!r.ok) { noterMort(jeton); sessionPerdue(); return r; }
  // Noter la rotation AVANT de rendre le verrou : l'onglet suivant la verra.
  try {
    const s = await r.clone().json();
    if (s && s.refresh_token) {
      if (!s.expires_at && s.expires_in) s.expires_at = Math.floor(Date.now() / 1000) + s.expires_in;
      localStorage.setItem(CLE_ROTATION, JSON.stringify({ ancien: jeton, session: s }));
    }
  } catch (e) {}
  return r;
}

function fetchSurveille(entree, opts) {
  const url = typeof entree === 'string' ? entree : (entree && entree.url) || String(entree);
  if (!url.includes('/auth/v1/token') || !url.includes('grant_type=refresh_token')) return fetchNatif(entree, opts);
  let jeton = '';
  try { jeton = JSON.parse(opts && opts.body || '{}').refresh_token || ''; } catch (e) {}
  if (renouvellementEnCours && renouvellementEnCours.jeton === jeton) {
    return renouvellementEnCours.promesse.then(r => r.clone());
  }
  const travail = () => renouveler(url, opts, jeton);
  const promesse = (navigator.locks && navigator.locks.request)
    ? navigator.locks.request('ns-renouvellement-session', travail)
    : travail();
  renouvellementEnCours = { jeton, promesse };
  const fin = () => { if (renouvellementEnCours && renouvellementEnCours.promesse === promesse) renouvellementEnCours = null; };
  promesse.then(fin, fin);
  return promesse.then(r => r.clone());
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: true, detectSessionInUrl: true },
  global: { fetch: fetchSurveille },
});
// Exposé globalement pour que espace-client.js puisse l'utiliser
window.nsSupabase = supabase;

// --- Test de connexion au chargement (visible dans la console) --------------
(async () => {
  try {
    const { error: authErr } = await supabase.auth.getSession();
    if (authErr) { console.warn('[NS] Supabase auth:', authErr.message); }
    else { console.log('[NS] Supabase: connexion établie ✓'); }

    // Vérifie si le schéma (table clients) est présent
    const { error: tblErr } = await supabase.from('clients').select('id').limit(1);
    if (tblErr) {
      console.warn('[NS] Tables pas encore créées —', tblErr.message, '— exécuter backend/schema.sql');
      window.nsSchemaPret = false;
    } else {
      console.log('[NS] Schéma détecté ✓ (table clients accessible)');
      window.nsSchemaPret = true;
    }
  } catch (e) {
    console.error('[NS] Supabase: échec de connexion', e);
  }
})();
