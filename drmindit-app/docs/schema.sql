-- ============================================================
--  DRMINDIT SUPABASE — COMPLETE PRODUCTION SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor
--  All tables use RLS (Row Level Security).
-- ============================================================

-- ── Enable UUID extension (usually already enabled on Supabase) ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  1. USER PROFILES
--  Linked to auth.users — one row per authenticated user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email               TEXT UNIQUE NOT NULL,
    name                TEXT,
    role                TEXT DEFAULT 'member',          -- member, admin, therapist
    organization        TEXT,
    wellness_goal       TEXT DEFAULT 'stress',          -- stress, sleep, focus, healing, confidence
    experience_level    TEXT DEFAULT 'Beginner',        -- Beginner, Intermediate, Advanced
    program_type        INT DEFAULT 7,                  -- 7, 21, 30 days
    subscription_status TEXT DEFAULT 'trial',           -- trial, active, expired
    -- Stats (maintained by analytics service)
    total_sessions      INT DEFAULT 0,
    total_minutes       INT DEFAULT 0,
    current_streak      INT DEFAULT 0,
    longest_streak      INT DEFAULT 0,
    last_session_date   DATE,
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    last_login_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
--  2. SESSION RECORDS
--  Tracks every meditation session start and completion.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_records (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id       TEXT NOT NULL,             -- e.g. 's5-1', 's21-2'
    session_title    TEXT,
    category         TEXT,                      -- stress, sleep, anxiety, focus, burnout, depression
    duration_minutes INT DEFAULT 0,
    completed        BOOLEAN DEFAULT FALSE,
    started_at       TIMESTAMPTZ DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    -- Optional program tracking
    program_week     INT,                       -- null if not in a program
    day_number       INT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_records_user ON public.session_records(user_id);
CREATE INDEX IF NOT EXISTS idx_session_records_date ON public.session_records(started_at);


-- ============================================================
--  3. MOOD ENTRIES
--  Pre and post-session mood ratings with emotion tags.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id      TEXT,                       -- linked session (optional)
    mood            TEXT,                       -- legacy: great, good, okay, low, stressed
    pre_rating      INT CHECK (pre_rating BETWEEN 1 AND 10),
    post_rating     INT CHECK (post_rating BETWEEN 1 AND 10),
    tags            TEXT[],                     -- ['calm', 'focused', 'anxious', ...]
    session_context TEXT,                       -- session title if from check-in flow
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON public.mood_entries(timestamp);


-- ============================================================
--  4. USER PROGRAM PROGRESS
--  Tracks progress through 7/21/30-day programs.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    program_type    INT NOT NULL,               -- 7, 21, or 30
    current_week    INT DEFAULT 1,
    current_day     INT DEFAULT 1,
    days_completed  INT[] DEFAULT '{}',         -- array of unlocked day numbers
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE (user_id, program_type)
);


-- ============================================================
--  5. ANALYTICS EVENTS
--  Append-only event log for all user actions.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    event_name  TEXT NOT NULL,
    properties  JSONB DEFAULT '{}',
    session_id  TEXT,                           -- browser session UUID
    url         TEXT,
    user_agent  TEXT,
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_ts   ON public.analytics_events(timestamp);


-- ============================================================
--  6. STREAKS
--  Separate table for streak history and recovery logic.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streaks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    streak_date     DATE NOT NULL,
    session_count   INT DEFAULT 1,
    UNIQUE (user_id, streak_date)
);


-- ============================================================
--  7. FOCUS / SLEEP SESSIONS (Legacy — backward compat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date             DATE NOT NULL,
    duration_minutes INT,
    activity         TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sleep_sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    hours      NUMERIC(4,2),
    quality    TEXT DEFAULT 'Good',
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);


-- ============================================================
--  8. NOTIFICATION SETTINGS
--  User preferences for daily reminders and push tokens.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id                   UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notifications_enabled     BOOLEAN DEFAULT TRUE,
    reminder_time             TIME DEFAULT '08:00:00',
    timezone                  TEXT DEFAULT 'UTC',
    streak_motivation_enabled BOOLEAN DEFAULT TRUE,
    push_token                TEXT,
    last_notification_sent    TIMESTAMPTZ,
    updated_at                TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  Every table is locked down so users can only access
--  their own rows. Supabase Auth JWT provides user_id.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- ── user_profiles ──
-- ... (existing user_profiles policies)
CREATE POLICY "Users can read own profile"   ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ... (other policies)

-- ── notification_settings ──
CREATE POLICY "Users can read own notification_settings"   ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification_settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification_settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- ── session_records ──
CREATE POLICY "Users own sessions (select)"  ON public.session_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own sessions (insert)"  ON public.session_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sessions (update)"  ON public.session_records FOR UPDATE USING (auth.uid() = user_id);

-- ── mood_entries ──
CREATE POLICY "Users own mood (select)"      ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own mood (insert)"      ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── user_progress ──
CREATE POLICY "Users own progress (select)"  ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own progress (insert)"  ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own progress (update)"  ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- ── analytics_events ──
CREATE POLICY "Users own events (insert)"    ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users own events (select)"    ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);

-- ── streaks ──
CREATE POLICY "Users own streaks (select)"   ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own streaks (upsert)"   ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own streaks (update)"   ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- ── focus / sleep (legacy) ──
CREATE POLICY "Users own focus (select)" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own focus (insert)" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sleep (select)" ON public.sleep_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own sleep (insert)" ON public.sleep_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sleep (update)" ON public.sleep_sessions FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
--  HELPFUL VIEWS (read-only analytics aggregations)
-- ============================================================

-- Per-user stats view
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
    up.id AS user_id,
    up.name,
    up.email,
    up.current_streak,
    up.longest_streak,
    up.total_sessions,
    up.total_minutes,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.completed = TRUE) AS confirmed_completed_sessions,
    AVG(me.post_rating - me.pre_rating)                      AS avg_mood_lift,
    MAX(sr.started_at)                                        AS last_session_at
FROM public.user_profiles up
LEFT JOIN public.session_records sr ON sr.user_id = up.id
LEFT JOIN public.mood_entries me    ON me.user_id = up.id
GROUP BY up.id, up.name, up.email, up.current_streak, up.longest_streak, up.total_sessions, up.total_minutes;

-- ============================================================
--  DONE — Schema is production-ready.
-- ============================================================
