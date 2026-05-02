/* ================================================================
   ACEBA: Supabase client
   - Apenas anon key (NUNCA service_role_key)
   - Expõe window.supabaseClient + window.isSupabaseConfigured
   ================================================================ */

const SUPABASE_URL = "https://cgvdzxklsjxudhpmripa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NL6uC5IbumZ1BsuHrxHKyw_lCTbacZK";

// Sentinelas: se a URL/key parecerem placeholder, não inicializa.
const URL_LOOKS_VALID =
  typeof SUPABASE_URL === "string" &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(SUPABASE_URL) &&
  !/COLE_A|YOUR_SUPABASE|EXEMPLO/i.test(SUPABASE_URL);

const KEY_LOOKS_VALID =
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 30 &&
  !/COLE_A|YOUR_SUPABASE|EXEMPLO/i.test(SUPABASE_ANON_KEY);

const supabase =
  window.supabase && URL_LOOKS_VALID && KEY_LOOKS_VALID
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

window.supabaseClient = supabase;
window.isSupabaseConfigured = Boolean(supabase);
