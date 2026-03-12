-- ZENITH NOTIFICATION & HABIT SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Create user_streaks summary table
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id           UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    current_streak    INT DEFAULT 0,
    longest_streak    INT DEFAULT 0,
    last_session_date DATE,
    total_sessions    INT DEFAULT 0,
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_streaks
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own streaks') THEN
        CREATE POLICY "Users can read own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own streaks') THEN
        CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own streaks') THEN
        CREATE POLICY "Users can insert own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Update notification_settings for multi-channel and smart reminders
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'in-app' CHECK (preferred_channel IN ('in-app', 'whatsapp', 'telegram')),
ADD COLUMN IF NOT EXISTS channel_id TEXT, -- Phone number or Telegram ID
ADD COLUMN IF NOT EXISTS smart_reminders_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS streak_notifications_enabled BOOLEAN DEFAULT TRUE;

-- 3. Create notification_logs for analytics
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'reminder', 'streak', 'recovery', 'motivation'
    channel           TEXT NOT NULL, -- 'in-app', 'whatsapp', 'telegram'
    message           TEXT,
    sent_at           TIMESTAMPTZ DEFAULT NOW(),
    opened_at         TIMESTAMPTZ,
    converted_at      TIMESTAMPTZ  -- When they complete a session after this
);

-- Enable RLS for notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own logs') THEN
        CREATE POLICY "Users can read own logs" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Initial sync: Populate user_streaks from user_profiles if needed
INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_session_date, total_sessions)
SELECT id, current_streak, longest_streak, last_session_date, total_sessions
FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;
