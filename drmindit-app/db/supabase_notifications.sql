-- DRMINDIT MULTI-CHANNEL NOTIFICATION SCHEMA
-- Handles user notification preferences for In-app, WhatsApp, and Telegram

-- Create Notification Settings Table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_number TEXT,
    telegram_user_id TEXT,
    preferred_channel TEXT DEFAULT 'in-app', -- 'in-app', 'whatsapp', 'telegram'
    reminder_time TIME DEFAULT '08:00:00',
    timezone TEXT DEFAULT 'UTC',
    streak_motivation_enabled BOOLEAN DEFAULT TRUE,
    last_notification_sent DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp', 'telegram', 'in-app'
    status TEXT NOT NULL,  -- 'sent', 'failed', 'retry'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Settings
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for Logs
CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs FOR SELECT 
USING (auth.uid() = user_id);

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
