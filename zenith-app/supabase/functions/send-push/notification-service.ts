/* ============================================================
   ZENITH NOTIFICATION SERVICE (Backend)
   Designed to run as a Supabase Edge Function or CRON task.
   ============================================================ */

export const NotificationService = {
    // ── SMART REMINDER ENGINE ──
    async processSmartReminders(supabase: any) {
        console.log('✦ NotificationService: Starting smart reminder processing...');

        // 1. Get all active users with smart reminders enabled
        const { data: users, error } = await supabase
            .from('notification_settings')
            .select(`
                user_id,
                reminder_time,
                timezone,
                preferred_channel,
                channel_id,
                smart_reminders_enabled,
                user_profiles:user_id (name, last_session_date, current_streak)
            `)
            .eq('smart_reminders_enabled', true)
            .eq('notifications_enabled', true);

        if (error) throw error;

        for (const user of users) {
            await this.calculateAndSendReminder(supabase, user);
        }
    },

    async calculateAndSendReminder(supabase: any, user: any) {
        const lastSessionDate = user.user_profiles?.last_session_date;
        const name = user.user_profiles?.name || 'there';
        const today = new Date().toISOString().split('T')[0];

        // 1. Missed Session Recovery Logic
        if (lastSessionDate && lastSessionDate !== today) {
            const last = new Date(lastSessionDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 1) {
                let message = "";
                if (diffDays === 1) {
                    message = `Hi ${name}, yesterday was busy. Let's restart today with a fresh breath.`;
                } else if (diffDays === 2) {
                    message = `It's never too late to continue your journey, ${name}.`;
                } else if (diffDays >= 3) {
                    message = `${name}, your meditation journey is always here for you. Start again today.`;
                }

                if (message) {
                    await this.send(user.preferred_channel, user.channel_id || user.user_id, message);
                    await this.logNotification(supabase, user.user_id, 'recovery', user.preferred_channel, message);
                    return; // Don't send a regular reminder if we sent a recovery one
                }
            }
        }

        // 2. Behavior-Based Logic: Smart Timing
        const hour = new Date().getHours();
        const preferredHour = parseInt(user.reminder_time.split(':')[0]);

        if (hour === preferredHour) {
            const templates = [
                "Your calm moment is waiting today.",
                "Take a few minutes to reconnect with your breath.",
                "Your mind deserves a reset today."
            ];
            const message = templates[Math.floor(Math.random() * templates.length)];
            await this.send(user.preferred_channel, user.channel_id || user.user_id, message);
            await this.logNotification(supabase, user.user_id, 'reminder', user.preferred_channel, message);
        }
    },

    // ── STREAK SYSTEM ──
    async updateStreak(supabase: any, userId: string) {
        // This is usually handled on completion in frontend, but could be sync task here.
    },

    // ── MULTI-CHANNEL DELIVERY ──
    async send(channel: string, recipient: string, message: string) {
        switch (channel) {
            case 'whatsapp':
                return await this.sendWhatsApp(recipient, message);
            case 'telegram':
                return await this.sendTelegram(recipient, message);
            case 'in-app':
            default:
                return await this.sendPush(recipient, message);
        }
    },

    async sendWhatsApp(phone: string, message: string) {
        console.log(`✦ WhatsApp -> ${phone}: ${message}`);
        // Integration with Twilio / WhatsApp API
    },

    async sendTelegram(chatId: string, message: string) {
        console.log(`✦ Telegram -> ${chatId}: ${message}`);
        // Integration with Telegram Bot API
    },

    async sendPush(userId: string, message: string) {
        console.log(`✦ In-App -> ${userId}: ${message}`);
    },

    async logNotification(supabase: any, userId: string, type: string, channel: string, message: string) {
        await supabase.from('notification_logs').insert({
            user_id: userId,
            notification_type: type,
            channel: channel,
            message: message
        });
    }
};
