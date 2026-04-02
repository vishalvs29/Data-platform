-- Video Library & Session Metadata
CREATE TABLE IF NOT EXISTS public.video_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('meditation', 'breathing', 'educational', 'therapy')),
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User-specific Playback Progress
CREATE TABLE IF NOT EXISTS public.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.video_sessions(id) ON DELETE CASCADE,
    last_position_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, video_id)
);

-- RLS Policies
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are viewable by everyone" ON public.video_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can only view their own progress" ON public.video_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.video_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress - update" ON public.video_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_video_sessions
BEFORE UPDATE ON public.video_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_video_progress
BEFORE UPDATE ON public.video_progress
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sample Data
INSERT INTO public.video_sessions (title, description, url, thumbnail_url, category, duration_seconds)
VALUES 
('Morning Gratitude', 'A 10-minute guided meditation to start your day with positivity.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://picsum.photos/seed/med1/400/225', 'meditation', 600),
('Calm Breathing', 'Learn the 4-7-8 technique for immediate stress relief.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://picsum.photos/seed/breath1/400/225', 'breathing', 300),
('Understanding Burnout', 'Educational insights into the signs and symptoms of workplace burnout.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://picsum.photos/seed/edu1/400/225', 'educational', 900);
