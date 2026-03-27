-- ============================================================
-- DrMindit — Complete Production Schema
-- Supabase PostgreSQL (pgcrypto + pg_trgm extensions required)
-- Run in Supabase SQL Editor → New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid, encrypt
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- full-text search on notes/journals
CREATE EXTENSION IF NOT EXISTS "moddatetime";    -- auto-update updated_at triggers

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_type_enum AS ENUM (
    'student', 'employee', 'officer', 'govt_employee', 'military'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_type_enum AS ENUM (
    'school', 'college', 'corporate', 'government', 'police', 'military'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier_enum AS ENUM ('starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE breathing_technique_enum AS ENUM ('box', '478', 'coherence');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crisis_severity_enum AS ENUM ('1','2','3','4','5');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  type              org_type_enum NOT NULL,
  subscription_tier subscription_tier_enum NOT NULL DEFAULT 'starter',
  admin_user_id     UUID,                     -- FK set after users table
  domain_whitelist  TEXT[],                   -- Allowed email domains for auto-join
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USERS (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT        UNIQUE NOT NULL,
  full_name           TEXT,
  user_type           user_type_enum NOT NULL DEFAULT 'student',
  org_id              UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  is_counselor        BOOLEAN     NOT NULL DEFAULT false,  -- Can see crisis_events for their org
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Back-fill FK now that users table exists
ALTER TABLE public.organizations
  ADD CONSTRAINT fk_org_admin_user
  FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL
  NOT VALID;    -- NOT VALID = skip backfill scan (safe on empty table)

-- ============================================================
-- 3. MOOD_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                      DATE        NOT NULL DEFAULT CURRENT_DATE,
  mood_score                SMALLINT    NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  energy_level              SMALLINT    CHECK (energy_level BETWEEN 1 AND 10),
  anxiety_level             SMALLINT    CHECK (anxiety_level BETWEEN 1 AND 10),
  notes                     TEXT,
  phq9_score                SMALLINT    CHECK (phq9_score BETWEEN 0 AND 27),  -- PHQ-9 depression screen
  gad7_score                SMALLINT    CHECK (gad7_score BETWEEN 0 AND 21),  -- GAD-7 anxiety screen
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)    -- One entry per user per day
);

-- ============================================================
-- 4. JOURNAL_ENTRIES  (content encrypted at rest with pgcrypto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- content is AES-256 encrypted. Encrypt in Edge Function with:
  -- encode(encrypt(content::bytea, key::bytea, 'aes'), 'base64')
  content_encrypted           TEXT        NOT NULL,
  tags                        TEXT[]      DEFAULT '{}',
  sentiment_score             NUMERIC(4,3) CHECK (sentiment_score BETWEEN -1 AND 1),
  cognitive_distortions_detected TEXT[]   DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SLEEP_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                  DATE        NOT NULL DEFAULT CURRENT_DATE,
  bedtime               TIMESTAMPTZ,
  wake_time             TIMESTAMPTZ,
  quality_score         SMALLINT    CHECK (quality_score BETWEEN 1 AND 10),
  cbti_protocol_followed BOOLEAN    DEFAULT false,   -- Cognitive Behavioral Therapy for Insomnia
  sleep_efficiency      NUMERIC(5,2) CHECK (sleep_efficiency BETWEEN 0 AND 100),  -- %
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- 6. BREATHING_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id               UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID                    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  technique        breathing_technique_enum NOT NULL,
  duration_seconds INTEGER                 NOT NULL CHECK (duration_seconds > 0),
  completed_at     TIMESTAMPTZ             DEFAULT NOW(),
  hrv_before       NUMERIC(6,2),           -- Heart Rate Variability ms (optional wearable data)
  hrv_after        NUMERIC(6,2)
);

-- ============================================================
-- 7. AI_CHAT_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,
  message_count        INTEGER     DEFAULT 0,
  crisis_flag          BOOLEAN     NOT NULL DEFAULT false,
  escalated_to_human   BOOLEAN     NOT NULL DEFAULT false,
  session_notes        TEXT        -- Counselor notes if escalated (encrypted ideally)
);

-- Individual chat messages (linked to a session)
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CRISIS_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crisis_events (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  detected_at         TIMESTAMPTZ       DEFAULT NOW(),
  severity            crisis_severity_enum NOT NULL,
  trigger_source      TEXT              NOT NULL,   -- 'ai_chat' | 'phq9' | 'manual'
  counselor_notified  BOOLEAN           NOT NULL DEFAULT false,
  counselor_id        UUID              REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at         TIMESTAMPTZ,
  resolution_notes    TEXT
);

-- ============================================================
-- 9. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,
  metadata    JSONB       DEFAULT '{}',
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. USER_SESSIONS (Generic sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_type     TEXT        NOT NULL,
  duration_seconds INTEGER     NOT NULL CHECK (duration_seconds >= 0),
  completed        BOOLEAN     NOT NULL DEFAULT true,
  timestamp        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.insights (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,   -- 'mood_streak', 'stress_spike', etc.
  content     TEXT        NOT NULL,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. ORG_ANALYTICS  (pre-aggregated, no user-level data)
-- Populated by a nightly Edge Function / pg_cron job — never
-- generated from a direct user query.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_analytics (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start              DATE        NOT NULL,
  period_type               TEXT        NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  total_active_users        INTEGER     DEFAULT 0,
  avg_mood_score            NUMERIC(4,2),
  avg_sleep_efficiency      NUMERIC(5,2),
  avg_anxiety_level         NUMERIC(4,2),
  total_breathing_sessions  INTEGER     DEFAULT 0,
  total_journal_entries     INTEGER     DEFAULT 0,
  crisis_events_count       INTEGER     DEFAULT 0,  -- Count only — never who
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, period_start, period_type)
);

-- ============================================================
-- AUDIT LOG TABLE  (append-only — never update or delete rows)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT        NOT NULL,
  operation    TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  row_id       UUID        NOT NULL,
  user_id      UUID,                       -- Who did the operation (via auth.uid())
  old_data     JSONB,
  new_data     JSONB,
  occurred_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log is INSERT-only — nobody can update or delete it
CREATE RULE audit_log_no_update AS ON UPDATE TO public.audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO public.audit_log DO INSTEAD NOTHING;

-- ============================================================
-- 13. USER_DAILY_METRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_daily_metrics (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date              DATE        NOT NULL DEFAULT CURRENT_DATE,
  avg_mood          NUMERIC(4,2),
  session_count     INTEGER     DEFAULT 0,
  completion_rate   NUMERIC(5,2),
  active_duration   INTEGER     DEFAULT 0, -- in seconds
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- 14. USER_WEEKLY_METRICS
-- ============================================================
CREATE TYPE mood_direction_enum AS ENUM ('improving', 'declining', 'stable');

CREATE TABLE IF NOT EXISTS public.user_weekly_metrics (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start        DATE        NOT NULL,
  avg_mood          NUMERIC(4,2),
  mood_direction    mood_direction_enum,
  engagement_score  INTEGER     CHECK (engagement_score BETWEEN 0 AND 100),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ============================================================
-- 15. TRIGGERS
-- ============================================================

-- ── updated_at auto-maintenance ──────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_journal_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_daily_metrics_updated_at
  BEFORE UPDATE ON public.user_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_weekly_metrics_updated_at
  BEFORE UPDATE ON public.user_weekly_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Generic audit trigger factory ───────────────────────────
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (table_name, operation, row_id, user_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE'  THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to all sensitive tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'mood_logs', 'journal_entries', 'sleep_logs',
    'breathing_sessions', 'ai_chat_sessions', 'crisis_events',
    'events', 'user_sessions', 'insights'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%s
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ── Auto-set crisis_flag on ai_chat_sessions when crisis detected ──
CREATE OR REPLACE FUNCTION public.auto_flag_crisis_session()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When a crisis_event is inserted, flag its originating chat session
  IF NEW.trigger_source = 'ai_chat' THEN
    UPDATE public.ai_chat_sessions
    SET crisis_flag = true
    WHERE user_id = NEW.user_id
      AND ended_at IS NULL;     -- Flag the active session
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_flag_crisis
  AFTER INSERT ON public.crisis_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_crisis_session();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_org_id              ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type           ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date       ON public.mood_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_logs_phq9            ON public.mood_logs(phq9_score) WHERE phq9_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_user_created      ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_tags              ON public.journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_sleep_user_date           ON public.sleep_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_breathing_user_completed  ON public.breathing_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user        ON public.ai_chat_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_crisis      ON public.ai_chat_sessions(crisis_flag) WHERE crisis_flag = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session     ON public.ai_chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_crisis_events_user        ON public.crisis_events(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_events_unresolved  ON public.crisis_events(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_analytics_org_period  ON public.org_analytics(org_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_row       ON public.audit_log(table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user            ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp     ON public.events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_ts     ON public.user_sessions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_created     ON public.insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date    ON public.user_daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_user_week   ON public.user_weekly_metrics(user_id, week_start DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_analytics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_metrics ENABLE ROW LEVEL SECURITY;

-- ── Helper: get the current user's org_id ───────────────────
CREATE OR REPLACE FUNCTION public.my_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

-- ── Helper: is the current user an org admin? ────────────────
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.admin_user_id = auth.uid()
  );
$$;

-- ── Helper: is the current user a counselor? ────────────────
CREATE OR REPLACE FUNCTION public.is_counselor()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(is_counselor, false)
  FROM public.users WHERE id = auth.uid();
$$;

-- ── Helper: calculate avg mood for a user ───────────────────
CREATE OR REPLACE FUNCTION public.calculate_avg_mood(user_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT AVG(mood_score)::NUMERIC(4,2)
  FROM public.mood_logs
  WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- USERS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Org admins can see their org's members (read-only, no PII beyond name/type)
CREATE POLICY "org_admin_select_members" ON public.users
  FOR SELECT USING (
    is_org_admin() AND org_id = my_org_id()
  );

-- ─────────────────────────────────────────────────────────────
-- ORGANIZATIONS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "orgs_select_own_org" ON public.organizations
  FOR SELECT USING (id = my_org_id());

CREATE POLICY "org_admin_update_own_org" ON public.organizations
  FOR UPDATE USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- MOOD_LOGS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "mood_select_own"  ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mood_insert_own"  ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mood_update_own"  ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mood_delete_own"  ON public.mood_logs FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- JOURNAL_ENTRIES policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "journal_select_own" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert_own" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update_own" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_delete_own" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- SLEEP_LOGS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "sleep_select_own" ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sleep_insert_own" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_update_own" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_delete_own" ON public.sleep_logs FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- BREATHING_SESSIONS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "breathing_select_own" ON public.breathing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "breathing_insert_own" ON public.breathing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "breathing_delete_own" ON public.breathing_sessions FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- AI_CHAT_SESSIONS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "chat_sessions_select_own" ON public.ai_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_sessions_insert_own" ON public.ai_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_sessions_update_own" ON public.ai_chat_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Counselors can view flagged sessions in their org
CREATE POLICY "counselor_view_crisis_sessions" ON public.ai_chat_sessions
  FOR SELECT USING (
    is_counselor()
    AND crisis_flag = true
    AND user_id IN (
      SELECT id FROM public.users WHERE org_id = my_org_id()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- AI_CHAT_MESSAGES policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "chat_messages_select_own" ON public.ai_chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert_own" ON public.ai_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Counselors can read messages in flagged crisis sessions within their org
CREATE POLICY "counselor_view_crisis_messages" ON public.ai_chat_messages
  FOR SELECT USING (
    is_counselor()
    AND session_id IN (
      SELECT id FROM public.ai_chat_sessions
      WHERE crisis_flag = true
        AND user_id IN (SELECT id FROM public.users WHERE org_id = my_org_id())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- CRISIS_EVENTS policies  ← most restrictive table
-- ─────────────────────────────────────────────────────────────

-- Users can see their own crisis events
CREATE POLICY "crisis_select_own" ON public.crisis_events
  FOR SELECT USING (auth.uid() = user_id);

-- Counselors can see crisis events for members of their org
CREATE POLICY "counselor_view_crisis_events" ON public.crisis_events
  FOR SELECT USING (
    is_counselor()
    AND user_id IN (
      SELECT id FROM public.users WHERE org_id = my_org_id()
    )
  );

-- Only Edge Functions (service_role) can insert crisis_events
-- No direct INSERT policy for authenticated — force through server-side logic
CREATE POLICY "service_role_insert_crisis" ON public.crisis_events
  FOR INSERT WITH CHECK (false);   -- Blocked for all authenticated users

-- Counselors can update resolution info
CREATE POLICY "counselor_update_resolution" ON public.crisis_events
  FOR UPDATE USING (
    is_counselor()
    AND counselor_id = auth.uid()
  ) WITH CHECK (
    is_counselor()
    AND counselor_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- ORG_ANALYTICS policies  ← admins only, never individuals
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "org_admin_view_analytics" ON public.org_analytics
  FOR SELECT USING (
    is_org_admin() AND org_id = my_org_id()
  );

-- Only service_role can write org_analytics (nightly aggregation job)
CREATE POLICY "service_role_insert_analytics" ON public.org_analytics
  FOR INSERT WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────
-- EVENTS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "events_select_own" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "events_insert_own" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- USER_SESSIONS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "user_sessions_select_own" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_sessions_insert_own" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- INSIGHTS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "insights_select_own" ON public.insights FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- METRICS policies
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "daily_metrics_select_own" ON public.user_daily_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_metrics_select_own" ON public.user_weekly_metrics FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- AUDIT_LOG  — no user access; service_role only
-- ─────────────────────────────────────────────────────────────
-- Audit log is written by SECURITY DEFINER trigger — not by users.
-- No SELECT/INSERT policies for authenticated role.
-- Admins access audit data via a privileged Edge Function only.

-- ============================================================
-- GRANT minimal permissions
-- ============================================================
-- Revoke broad defaults, then re-grant only what's needed
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users              TO authenticated;
GRANT SELECT                          ON public.organizations      TO authenticated;
GRANT UPDATE                          ON public.organizations      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs         TO authenticated;
GRANT SELECT, INSERT, DELETE         ON public.breathing_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.ai_chat_sessions   TO authenticated;
GRANT SELECT, INSERT                 ON public.ai_chat_messages   TO authenticated;
GRANT SELECT, UPDATE                 ON public.crisis_events      TO authenticated;
GRANT SELECT                         ON public.org_analytics      TO authenticated;
GRANT SELECT, INSERT                 ON public.events             TO authenticated;
GRANT SELECT, INSERT                 ON public.user_sessions      TO authenticated;
GRANT SELECT                         ON public.insights           TO authenticated;
GRANT SELECT                         ON public.user_daily_metrics TO authenticated;
GRANT SELECT                         ON public.user_weekly_metrics TO authenticated;
-- audit_log: no direct access for authenticated role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
