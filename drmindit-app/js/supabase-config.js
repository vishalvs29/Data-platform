/* ============================================================
   DRMINDIT SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL = 'https://hxrzlgvyvfzobtzxccxa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_djTMvIXOzo2EZvhwlIe3hQ_q-U3fcF9';

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Attach to window for global access
window.DrMinditSupabase = supabaseClient;

console.log('✦ DrMindit Supabase Initialized');
