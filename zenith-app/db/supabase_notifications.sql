-- ZENITH NOTIFICATION SETTINGS SCHEMA
-- Handles user notification preferences for daily reminders

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '08:00:00',
    timezone TEXT DEFAULT 'UTC',
    streak_motivation_enabled BOOLEAN DEFAULT TRUE,
    last_notification_sent DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
