-- SQL Schema for OnSpace & DrMindit Apps (Supabase)

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, -- Removed FK to auth.users for demo flexibility
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    birthdate DATE,
    gender TEXT,
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    health_goal TEXT,
    activity_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.1 Insert Demo User (Alex)
INSERT INTO public.user_profiles (id, email, full_name)
VALUES ('22222222-2222-2222-2222-222222222222', 'alex.demo@onspace.ai', 'Alex (Demo)')
ON CONFLICT (id) DO NOTHING;

-- 2. Mood Entries Table
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Removed FK to auth.users for demo flexibility
    mood TEXT NOT NULL, 
    note TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sleep Sessions Table
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Removed FK to auth.users for demo flexibility
    date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL,
    quality TEXT NOT NULL, 
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 4. Focus Sessions Table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Removed FK to auth.users for demo flexibility
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    activity TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allowed for all users for testing/demo)
CREATE POLICY "Enable all for demo user" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "Enable all for demo user" ON public.mood_entries FOR ALL USING (true);
CREATE POLICY "Enable all for demo user" ON public.sleep_sessions FOR ALL USING (true);
CREATE POLICY "Enable all for demo user" ON public.focus_sessions FOR ALL USING (true);
