/* ============================================================
   ZENITH ANALYTICS SERVICE
   Tracks all key events to Supabase analytics_events table.
   Batches writes and falls back gracefully if offline.
   ============================================================ */

const ZenithAnalytics = {

    _queue: [],
    _flushing: false,

    // ─────────────────────────────────────────────
    // TRACK — log an event to Supabase
    // ─────────────────────────────────────────────
    track(eventName, properties = {}) {
        const event = {
            event_name: eventName,
            user_id: this._getUserId(),
            properties: properties,
            session_id: this._getSessionId(),
            url: window.location.href,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        };

        this._queue.push(event);
        console.log(`✦ Zenith Analytics: [${eventName}]`, properties);

        // Flush immediately (debounced)
        this._scheduleFlush();
    },

    // ─────────────────────────────────────────────
    // FLUSH — write queued events to Supabase
    // ─────────────────────────────────────────────
    async flush() {
        if (this._flushing || this._queue.length === 0) return;
        if (!window.ZenithSupabase) return;

        this._flushing = true;
        const batch = [...this._queue];
        this._queue = [];

        const { error } = await window.ZenithSupabase
            .from('analytics_events')
            .insert(batch);

        if (error) {
            console.warn('✦ Zenith Analytics: Flush error:', error.message);
            // Re-queue failed events
            this._queue = [...batch, ...this._queue];
        }

        this._flushing = false;
    },

    _scheduleFlush() {
        clearTimeout(this._flushTimer);
        this._flushTimer = setTimeout(() => this.flush(), 2000);
    },

    // ─────────────────────────────────────────────
    // RETRIEVE ANALYTICS — for the Analytics page
    // ─────────────────────────────────────────────
    async getUserStats(userId) {
        if (!window.ZenithSupabase || !userId) return null;

        const [sessionsRes, moodRes, streakRes] = await Promise.all([
            window.ZenithSupabase
                .from('session_records')
                .select('duration_minutes, completed, category, completed_at')
                .eq('user_id', userId)
                .eq('completed', true),

            window.ZenithSupabase
                .from('mood_entries')
                .select('pre_rating, post_rating, timestamp')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(30),

            window.ZenithSupabase
                .from('user_profiles')
                .select('current_streak, longest_streak, total_sessions, total_minutes')
                .eq('id', userId)
                .single()
        ]);

        return {
            sessions: sessionsRes.data || [],
            moods: moodRes.data || [],
            streaks: streakRes.data || {}
        };
    },

    async updateUserStats(userId, sessionData) {
        if (!window.ZenithSupabase || !userId) return;

        // Increment stats in user_profiles
        const { data: profile } = await window.ZenithSupabase
            .from('user_profiles')
            .select('total_sessions, total_minutes, current_streak, longest_streak, last_session_date')
            .eq('id', userId)
            .single();

        if (!profile) return;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = profile.last_session_date;

        let newStreak = profile.current_streak;
        if (lastDate === today) {
            // Same day — no streak change
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            newStreak = lastDate === yesterdayStr ? profile.current_streak + 1 : 1;
        }

        const updates = {
            total_sessions: (profile.total_sessions || 0) + 1,
            total_minutes: (profile.total_minutes || 0) + (sessionData.duration || 0),
            current_streak: newStreak,
            longest_streak: Math.max(profile.longest_streak || 0, newStreak),
            last_session_date: today,
            updated_at: new Date().toISOString()
        };

        const { error } = await window.ZenithSupabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId);

        if (!error) {
            // Update in-memory state
            if (window.ZenithData) {
                ZenithData.user.totalSessions = updates.total_sessions;
                ZenithData.user.totalMinutesPracticed = updates.total_minutes;
                ZenithData.user.currentStreak = updates.current_streak;
                ZenithData.user.longestStreak = updates.longest_streak;
            }
            console.log('✦ Zenith Analytics: User stats updated in DB.');
        }
    },

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    _getUserId() {
        if (window.ZenithAuth && ZenithAuth.user) return ZenithAuth.user.id;
        if (window.ZenithData) return ZenithData.user.id;
        return null;
    },

    _getSessionId() {
        if (!sessionStorage.getItem('zenith_sid')) {
            sessionStorage.setItem('zenith_sid', crypto.randomUUID());
        }
        return sessionStorage.getItem('zenith_sid');
    }
};

// Auto-flush on page unload
window.addEventListener('beforeunload', () => ZenithAnalytics.flush());
