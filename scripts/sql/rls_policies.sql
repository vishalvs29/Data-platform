-- ============================================================
-- DrMindit — Production Row Level Security (RLS) Policies
-- ============================================================
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- This replaces the permissive demo policies with proper
-- per-user isolation and role-based admin access.
-- ============================================================

-- ── STEP 1: Add user_type to profiles ────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'student'
    CHECK (user_type IN ('student', 'employee', 'officer', 'government_employee', 'admin')),
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ── STEP 2: Add a chats table for the AI Edge Function ──────
CREATE TABLE IF NOT EXISTS public.chats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id   TEXT,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 3: Add user_sessions table (unified session log) ───
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id       TEXT NOT NULL,           -- DrMindit session key (e.g. 's3-1')
  title            TEXT,
  duration_seconds INTEGER,
  completed        BOOLEAN DEFAULT false,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ
);

-- Enable RLS on all sensitive tables
ALTER TABLE public.user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions    ENABLE ROW LEVEL SECURITY;

-- ── STEP 4: Drop old permissive demo policies ────────────────
DROP POLICY IF EXISTS "Enable all for demo user" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all for demo user" ON public.mood_entries;
DROP POLICY IF EXISTS "Enable all for demo user" ON public.sleep_logs;
DROP POLICY IF EXISTS "Enable all for demo user" ON public.focus_sessions;

-- ============================================================
-- USER_PROFILES
-- Each user: read and update ONLY their own row.
-- Admins: read de-identified aggregates via a VIEW (see below).
-- ============================================================
CREATE POLICY "users_own_profile_select" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_own_profile_update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_profile_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- MOOD_ENTRIES
-- ============================================================
CREATE POLICY "mood_select_own" ON public.mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mood_insert_own" ON public.mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_update_own" ON public.mood_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_delete_own" ON public.mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SLEEP_SESSIONS
-- ============================================================
CREATE POLICY "sleep_select_own" ON public.sleep_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sleep_insert_own" ON public.sleep_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_update_own" ON public.sleep_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_delete_own" ON public.sleep_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FOCUS_SESSIONS
-- ============================================================
CREATE POLICY "focus_select_own" ON public.focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "focus_insert_own" ON public.focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_update_own" ON public.focus_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_delete_own" ON public.focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER_SESSIONS (meditation/audio sessions)
-- ============================================================
CREATE POLICY "usersessions_select_own" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usersessions_insert_own" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usersessions_update_own" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CHATS — users see only their own chat history
-- ============================================================
CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ADMIN HELPER: a secure VIEW for org-level admins
-- Returns ONLY aggregated, anonymised counts — never individual rows.
-- Admins query this view through a service-role Edge Function,
-- never directly from the client.
-- ============================================================
CREATE OR REPLACE VIEW public.admin_aggregated_stats AS
SELECT
  p.organisation_id,
  p.user_type,
  COUNT(DISTINCT p.id)                     AS total_users,
  COUNT(DISTINCT m.id)                     AS total_mood_entries,
  ROUND(AVG(f.duration_minutes), 1)        AS avg_focus_minutes,
  ROUND(AVG(s.hours), 2)                   AS avg_sleep_hours,
  DATE_TRUNC('week', NOW())                AS reporting_week
FROM public.user_profiles p
LEFT JOIN public.mood_entries  m ON m.user_id = p.id
LEFT JOIN public.focus_sessions f ON f.user_id = p.id
LEFT JOIN public.sleep_logs s ON s.user_id = p.id
GROUP BY p.organisation_id, p.user_type;

-- Revoke direct table access from the view for added safety
REVOKE SELECT ON public.admin_aggregated_stats FROM anon, authenticated;
-- Only your Supabase service role (Edge Functions) can query this
GRANT SELECT ON public.admin_aggregated_stats TO service_role;

-- ============================================================
-- INDEXES for performance at scale
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id       ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id     ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id     ON public.sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id      ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id              ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_session_id           ON public.chats(session_id);
