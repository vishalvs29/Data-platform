-- ============================================================
-- DRMINDIT: USER_SESSIONS TABLE MIGRATION
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Step 1: Create user_sessions table ──
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id        TEXT NOT NULL,
    session_title     TEXT,
    session_duration  INTEGER,           -- Total session duration in minutes
    completed_seconds INTEGER DEFAULT 0, -- How many seconds the user has listened
    completion_status BOOLEAN DEFAULT FALSE,
    started_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);

-- ── Step 2: Index for fast per-user lookups ──
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions (started_at DESC);

-- ── Step 3: Enable Row Level Security ──
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- ── Step 4: RLS Policies ──
DO $$
BEGIN
    -- SELECT: users can read only their own sessions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_sessions'
          AND policyname = 'Users can read own sessions'
    ) THEN
        CREATE POLICY "Users can read own sessions"
            ON public.user_sessions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- INSERT: users can insert only rows with their own user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_sessions'
          AND policyname = 'Users can insert own sessions'
    ) THEN
        CREATE POLICY "Users can insert own sessions"
            ON public.user_sessions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- UPDATE: users can update only their own session rows
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_sessions'
          AND policyname = 'Users can update own sessions'
    ) THEN
        CREATE POLICY "Users can update own sessions"
            ON public.user_sessions
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ── Step 5: Google OAuth Setup Instructions ──
-- To enable Google Sign-In, follow these steps in the Supabase Dashboard:
--
-- 1. Go to: Authentication → Providers → Google
-- 2. Toggle "Enable" to ON
-- 3. Enter your Google Client ID and Google Client Secret
--    (Get these from: console.cloud.google.com → APIs & Services → Credentials)
-- 4. Copy the "Callback URL" shown in Supabase:
--    https://hxrzlgvyvfzobtzxccxa.supabase.co/auth/v1/callback
-- 5. In Google Cloud Console → OAuth 2.0 Client:
--    - Add the callback URL above as an "Authorized redirect URI"
--    - Add your app domains to "Authorized JavaScript origins"
-- 6. Save both and test login.

SELECT 'user_sessions table created successfully ✓' AS status;
