/* ============================================================
   DRMINDIT SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Attach to window for global access
window.DrMinditSupabase = supabaseClient;

console.log('✦ DrMindit Supabase Initialized');
