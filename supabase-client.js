// ============================================================================
// Connexion Supabase — Espace client NS Development
// ----------------------------------------------------------------------------
// La clé ci-dessous est la clé PUBLIQUE (publishable) : elle est faite pour
// vivre dans le code du site, aucun risque. La sécurité vient des règles de
// rôle en base de données (Row Level Security), pas du secret de cette clé.
// NE JAMAIS mettre ici la clé "service_role" (secrète).
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://atgykykesntvporvbvuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CERC6vjpnV91Fh_2mA4VTQ_I0jcJ05F';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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
