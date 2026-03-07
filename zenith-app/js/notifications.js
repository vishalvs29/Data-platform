/* ============================================================
   ZENITH NOTIFICATION SERVICE
   Handles browser push permissions and local triggers.
   ============================================================ */

const ZenithNotifications = {
    settings: {
        enabled: true,
        reminderTime: '08:00',
        streakMotivation: true,
        lastSent: null
    },

    // ── INITIALISE ──
    async init() {
        console.log('✦ Zenith Notifications: Initializing...');

        // Load settings from Supabase if authenticated
        if (window.ZenithAuth && ZenithAuth.user) {
            await this.loadSettings(ZenithAuth.user.id);
        }

        // Check permission state
        if ('Notification' in window) {
            console.log('✦ Zenith Notifications: Permission status:', Notification.permission);
        }
    },

    // ── PERMISSIONS ──
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('✦ Zenith Notifications: Browser does not support desktop notifications.');
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✦ Zenith Notifications: Permission granted.');
            this.sendLocalNotification('Notifications Enabled', {
                body: 'You will now receive daily reminders for your Zenith journey.'
            });
            return true;
        }
        return false;
    },

    // ── DATA SYNC ──
    async loadSettings(userId) {
        const { data, error } = await window.ZenithSupabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('✦ Zenith Notifications: Error loading settings:', error.message);
            return;
        }

        if (data) {
            this.settings = {
                enabled: data.notifications_enabled,
                reminderTime: data.reminder_time.substring(0, 5),
                streakMotivation: data.streak_motivation_enabled,
                lastSent: data.last_notification_sent
            };
            console.log('✦ Zenith Notifications: Settings loaded.');
        } else {
            // Create default settings if they don't exist
            await this.saveSettings({
                notifications_enabled: true,
                reminder_time: '08:00:00',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }
    },

    async saveSettings(updates) {
        if (!window.ZenithAuth?.user) return;

        const userId = ZenithAuth.user.id;
        const payload = {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { error } = await window.ZenithSupabase
            .from('notification_settings')
            .upsert(payload);

        if (error) {
            console.error('✦ Zenith Notifications: Error saving settings:', error.message);
        } else {
            console.log('✦ Zenith Notifications: Settings saved.');
            // Update local cache
            if (updates.notifications_enabled !== undefined) this.settings.enabled = updates.notifications_enabled;
            if (updates.reminder_time !== undefined) this.settings.reminderTime = updates.reminder_time.substring(0, 5);
            if (updates.streak_motivation_enabled !== undefined) this.settings.streakMotivation = updates.streak_motivation_enabled;
        }
    },

    // ── TRIGGER ──
    sendLocalNotification(title, options = {}) {
        if (!this.settings.enabled || Notification.permission !== 'granted') return;

        const defaultOptions = {
            icon: 'icon-192.png', // Ensure this exists or use a web URL
            badge: 'icon-192.png',
            silent: false
        };

        const n = new Notification(title, { ...defaultOptions, ...options });

        n.onclick = (e) => {
            window.focus();
            e.target.close();
            if (window.ZenithState) {
                ZenithState.navigateTo('resilience');
            }
        };
    },

    // ── TRIGGER ──
    async checkAndNotify() {
        if (!this.settings.enabled || Notification.permission !== 'granted') return;

        // Avoid multiple notifications on the same day
        const today = new Date().toISOString().split('T')[0];
        if (this.settings.lastSent === today) return;

        const currentDay = window.ZenithState ? ZenithState.resilienceDay : 1;
        const progress = window.ZenithState ? ZenithState.resilienceProgress : {};
        const isCompletedToday = progress[currentDay];

        if (!isCompletedToday) {
            const hour = new Date().getHours();
            const reminderTimeHour = parseInt(this.settings.reminderTime.split(':')[0]);

            let title = 'Zenith Journey';
            let message = '';

            // Smart logic: Only notify if we are past the user's preferred time
            if (hour >= reminderTimeHour) {
                if (hour >= 20) { // Late evening catch-up
                    message = "Take a few minutes tonight to complete your Zenith session.";
                } else {
                    const session = window.ResilienceProgramData ? ResilienceProgramData.find(s => s.day === currentDay) : null;
                    const duration = session ? session.duration : 34;

                    const templates = [
                        `Day ${currentDay} of your Zenith journey is ready.`,
                        `Time to breathe and reset. Continue your 21-day Zenith journey.`,
                        `Your Zenith session is ready. Take ${duration} minutes to reset your mind.`
                    ];
                    message = templates[Math.floor(Math.random() * templates.length)];
                }

                this.sendLocalNotification(title, { body: message });

                // Update lastSent to prevent spamming
                this.settings.lastSent = today;
                await this.saveSettings({ last_notification_sent: today });
            }
        }
    },

    triggerStreakMotivation(streak) {
        if (!this.settings.streakMotivation || streak < 2) return;

        const messages = [
            `Amazing! You're on a ${streak}-day Zenith streak.`,
            `Keep it up! ${streak} days of consistency.`,
            `Consistency is key. ${streak} days in a row!`
        ];

        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        this.sendLocalNotification('Streak Milestone!', { body: randomMsg });
    }
};
