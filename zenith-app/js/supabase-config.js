/* ============================================================
   ZENITH SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL = 'https://lraywuxyllmtpuxolray.backend.onspace.ai';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIwODA3MTI2NjksImlhdCI6MTc2NTM1MjY2OSwiaXNzIjoib25zcGFjZSIsInJlZiI6ImxyYXl3dXh5bGxtdHB1eG9scmF5Iiwicm9sZSI6ImFub24ifQ.DIqRoT4pMvUvaKkrA7WNZ8OO1AqZBwUUHIQFkqM5jrs';

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Attach to window for global access
window.ZenithSupabase = supabaseClient;

console.log('✦ Zenith Supabase Initialized');
