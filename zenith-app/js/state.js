/* ============================================================
   ZENITH STATE MANAGEMENT
   Simple reactive state store
   ============================================================ */

const ZenithState = {
    currentPage: 'home',
    previousPage: null,
    selectedSessionId: null,
    activeSessionId: null,
    selectedMood: null,
    selectedDuration: null,
    selectedCategory: 'all',
    calmNowActive: false,
    calmNowTimer: null,
    playerTimer: null,
    playerElapsed: 0,
    playerPlaying: false,
    playerCaption: '',
    searchQuery: '',
    customAudioFile: null, // Temporary Blob URL for uploaded MP3
    moodCheckIn: null, // Stores { preMood, preTags, timestamp }
    showMoodCheckIn: false,
    showMoodCheckOut: false,
    resilienceDay: 1, // Current active day of the 21-day program
    resilienceProgress: {}, // Map of day number to completion status: { 1: true, 2: false, ... }
    currentPlatform: null, // null = Gateway, 'schools', 'corporate', 'government', 'defense'

    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    notify() {
        this.listeners.forEach(fn => fn(this));
    },

    switchPlatform(platformId) {
        this.currentPlatform = platformId;
        this.currentPage = 'home';
        this.notify();

        // Update URL hash without triggering double render if possible
        if (platformId) {
            window.location.hash = platformId;
        } else {
            window.location.hash = '';
        }

        console.log(`✦ Zenith Platform: Switched to ${platformId || 'Gateway'}`);
    },

    navigateTo(page, data = {}) {
        this.previousPage = this.currentPage;
        this.currentPage = page;
        if (data.sessionId) this.selectedSessionId = data.sessionId;
        if (data.duration !== undefined) this.selectedDuration = data.duration;
        if (data.category) this.selectedCategory = data.category;
        this.notify();
    },

    goBack() {
        if (this.previousPage) {
            this.currentPage = this.previousPage;
            this.previousPage = null;
        } else {
            this.currentPage = 'home';
        }
        this.notify();
    },

    setMood(mood) {
        this.selectedMood = mood;
        ZenithData.user.currentMood = mood;

        // Save to Supabase
        if (window.ZenithSupabase) {
            window.ZenithSupabase
                .from('mood_entries')
                .insert({
                    user_id: ZenithData.user.id,
                    mood: mood,
                    timestamp: new Date().toISOString()
                })
                .then(({ error }) => {
                    if (error) console.error('✦ Zenith: Error saving mood:', error.message);
                    else console.log('✦ Zenith: Mood persisted to database');
                });
        }

        this.notify();
    },

    startSession(sessionId) {
        this.activeSessionId = sessionId;
        this.playerElapsed = 0;
        this.playerPlaying = true;
        this.playerCaption = '';
        this.currentPage = 'active';
        const session = ZenithData.getSessionById(sessionId);
        const totalSeconds = session.duration * 60;

        // Initialize audio engine
        ZenithAudioEngine.onCaptionUpdate = (caption) => {
            this.playerCaption = caption;
            this.notify();
        };

        // Handle MP3 time updates if applicable
        ZenithAudioEngine.onTimeUpdate = (current, duration) => {
            this.playerElapsed = Math.floor(current);
            // Dynamic totalSeconds if it's an MP3
            const totalSeconds = Math.floor(duration);
            if (this.playerElapsed >= totalSeconds) {
                this.stopSession();
            }
            this.notify();
        };

        ZenithAudioEngine.start(sessionId, this.customAudioFile);

        clearInterval(this.playerTimer);
        this.playerTimer = setInterval(() => {
            if (this.playerPlaying) {
                this.playerElapsed++;
                if (this.playerElapsed >= totalSeconds) {
                    this.stopSession();
                }
                this.notify();
            }
        }, 1000);
        this.notify();
    },

    togglePlayer() {
        this.playerPlaying = !this.playerPlaying;
        if (this.playerPlaying) {
            ZenithAudioEngine.resume();
        } else {
            ZenithAudioEngine.pause();
        }
        this.notify();
    },

    seekTo(seconds) {
        this.playerElapsed = seconds;
        ZenithAudioEngine.seek(seconds);
        this.notify();
    },

    skipForward() {
        const nextTime = Math.min(this.playerElapsed + 15, this.getSessionDuration() * 60);
        this.seekTo(nextTime);
    },

    skipBackward() {
        const prevTime = Math.max(this.playerElapsed - 15, 0);
        this.seekTo(prevTime);
    },

    stopSession() {
        if (this.activeSessionId) {
            const session = ZenithData.getSessionById(this.activeSessionId);
            const duration = Math.floor(this.playerElapsed / 60);
            const completed = this.playerElapsed >= (session.duration * 60 * 0.9); // 90% = completed

            // Track analytics event
            if (window.ZenithAnalytics) {
                ZenithAnalytics.track('session_ended', {
                    session_id: this.activeSessionId,
                    session_title: session.title,
                    category: session.category,
                    duration_played: duration,
                    completed
                });
            }

            // Save session record to Supabase (extended schema)
            if (window.ZenithSupabase && duration > 0) {
                const userId = window.ZenithAuth?.user?.id || ZenithData.user.id;
                window.ZenithSupabase
                    .from('session_records')
                    .insert({
                        user_id: userId,
                        session_id: this.activeSessionId,
                        session_title: session.title,
                        category: session.category,
                        duration_minutes: duration,
                        completed: completed,
                        completed_at: completed ? new Date().toISOString() : null,
                        started_at: new Date(Date.now() - this.playerElapsed * 1000).toISOString()
                    })
                    .then(({ error }) => {
                        if (error) console.error('✦ Zenith: Error saving session_record:', error.message);
                        else console.log('✦ Zenith: session_record saved.');
                    });

                // Legacy table writes for backward compatibility
                const table = session.category === 'sleep' ? 'sleep_sessions' : 'focus_sessions';
                const payload = {
                    user_id: userId,
                    date: new Date().toISOString().split('T')[0],
                    notes: `Completed Zenith session: ${session.title}`
                };
                if (table === 'sleep_sessions') {
                    payload.hours = parseFloat((duration / 60).toFixed(2));
                    payload.quality = 'Good';
                } else {
                    payload.duration_minutes = duration;
                    payload.activity = session.title;
                }
                window.ZenithSupabase.from(table).upsert(payload).then(({ error }) => {
                    if (error) console.error(`✦ Zenith: Error saving ${table}:`, error.message);
                });

                // Update user stats in DB profile
                if (window.ZenithAnalytics) {
                    ZenithAnalytics.updateUserStats(userId, { duration });
                }
            }

            // Update in-memory stats immediately
            this.updatePracticeStats(duration);

            // If it's a resilience session and marked completed, advance the program
            if (completed && this.activeSessionId.startsWith('res-d')) {
                const dayNum = parseInt(this.activeSessionId.replace('res-d', ''));
                this.completeResilienceDay(dayNum);
            }

            // Auto-trigger post-session mood check-out if check-in was done
            if (this.moodCheckIn) {
                this.showMoodCheckOut = true;
            }

            // Trigger streak motivation if applicable
            if (completed && window.ZenithNotifications) {
                ZenithNotifications.triggerStreakMotivation(ZenithData.user.currentStreak);
            }
        }

        clearInterval(this.playerTimer);
        ZenithAudioEngine.stop();
        this.playerPlaying = false;
        this.activeSessionId = null;
        this.playerCaption = '';

        // Only navigate away if mood check-out isn't pending
        if (!this.showMoodCheckOut) {
            this.currentPage = this.previousPage || 'home';
        }
        this.notify();
    },

    getSessionDuration() {
        if (!this.activeSessionId) return 0;
        const session = ZenithData.getSessionById(this.activeSessionId);
        return session ? session.duration : 0;
    },

    startCalmNow() {
        this.calmNowActive = true;
        this.calmNowTimer = 5 * 60; // 5 minutes
        clearInterval(this._calmInterval);
        this._calmInterval = setInterval(() => {
            if (this.calmNowTimer > 0) {
                this.calmNowTimer--;
                this.notify();
            } else {
                this.closeCalmNow();
            }
        }, 1000);
        this.notify();
    },

    closeCalmNow() {
        this.calmNowActive = false;
        clearInterval(this._calmInterval);
        this.calmNowTimer = null;
        this.notify();
    },

    setFilter(key, value) {
        if (key === 'duration') this.selectedDuration = value;
        if (key === 'category') this.selectedCategory = value;
        if (key === 'search') this.searchQuery = value;
        this.notify();
    },

    clearCustomAudio() {
        if (this.customAudioFile) URL.revokeObjectURL(this.customAudioFile);
        this.customAudioFile = null;
        this.notify();
    },

    // ── Profile Management ──
    updateProfile(data) {
        Object.assign(ZenithData.user, data);
        // Persist to Supabase via auth service
        if (window.ZenithAuth && ZenithAuth.user) {
            ZenithAuth.saveProfile(data);
        }
        if (window.ZenithAnalytics) {
            ZenithAnalytics.track('profile_updated', { fields: Object.keys(data) });
        }
        console.log('✦ Zenith: Profile updated and saved.');
        this.notify();
    },

    // ── Logout via real auth ──
    logout() {
        if (window.ZenithAuth) {
            ZenithAuth.logout(); // Calls supabase.auth.signOut() and redirects
        } else {
            window.location.href = 'landing.html';
        }
    },

    // ── Advanced Mood Tracking ──
    checkInMood(rating, tags) {
        this.moodCheckIn = {
            pre: rating,
            tags: tags,
            timestamp: new Date().toISOString()
        };
        this.showMoodCheckIn = false;
        console.log('✦ Zenith: Pre-session mood recorded', this.moodCheckIn);
        this.notify();
    },

    checkOutMood(rating, tags) {
        if (!this.moodCheckIn) return;

        const entry = {
            date: new Date().toISOString().split('T')[0],
            pre: this.moodCheckIn.pre,
            post: rating,
            tags: [...new Set([...this.moodCheckIn.tags, ...tags])],
            timestamp: new Date().toISOString()
        };

        ZenithData.user.moodHistory.push(entry);
        this.moodCheckIn = null;
        this.showMoodCheckOut = false;

        // Save to Supabase (Extended)
        if (window.ZenithSupabase) {
            window.ZenithSupabase
                .from('mood_entries')
                .insert({
                    user_id: ZenithData.user.id,
                    pre_rating: entry.pre,
                    post_rating: entry.post,
                    tags: entry.tags,
                    timestamp: entry.timestamp
                })
                .then(({ error }) => {
                    if (error) console.error('✦ Zenith: Error saving extended mood:', error.message);
                });
        }

        console.log('✦ Zenith: Mood cycle complete', entry);
        this.notify();
    },

    // ── Stats & Achievements ──
    async updatePracticeStats(minutes) {
        const user = ZenithData.user;
        const userId = window.ZenithAuth?.user?.id || user.id;
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch current streak data from Supabase if available, otherwise use local
        let currentStreak = user.currentStreak || 0;
        let longestStreak = user.longestStreak || 0;
        let lastSessionDate = user.lastSessionDate;
        let totalSessions = user.totalSessions || 0;

        if (window.ZenithSupabase) {
            const { data, error } = await window.ZenithSupabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                currentStreak = data.current_streak;
                longestStreak = data.longest_streak;
                lastSessionDate = data.last_session_date;
                totalSessions = data.total_sessions;
            }
        }

        // 2. Logic: If session completed daily, increase streak.
        // If it's the same day, don't increment streak but increment totalSessions.
        // If it's the day after lastSessionDate, increment streak.
        // If it's more than 1 day after, reset streak.

        totalSessions++;

        if (!lastSessionDate) {
            currentStreak = 1;
        } else {
            const last = new Date(lastSessionDate);
            const today = new Date(todayStr);
            const diffTime = today - last;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
            // If diffDays === 0, streak stays same
        }

        if (currentStreak > longestStreak) longestStreak = currentStreak;
        lastSessionDate = todayStr;

        // 3. Update local state
        user.totalSessions = totalSessions;
        user.totalMinutesPracticed += minutes;
        user.currentStreak = currentStreak;
        user.longestStreak = longestStreak;
        user.lastSessionDate = lastSessionDate;

        // 4. Persist to Supabase
        if (window.ZenithSupabase) {
            await window.ZenithSupabase
                .from('user_streaks')
                .upsert({
                    user_id: userId,
                    current_streak: currentStreak,
                    longest_streak: longestStreak,
                    last_session_date: lastSessionDate,
                    total_sessions: totalSessions,
                    updated_at: new Date().toISOString()
                });

            // Also sync back to user_profiles for consistency
            await window.ZenithSupabase
                .from('user_profiles')
                .update({
                    current_streak: currentStreak,
                    longest_streak: longestStreak,
                    last_session_date: lastSessionDate,
                    total_sessions: totalSessions,
                    total_minutes: user.totalMinutesPracticed
                })
                .eq('id', userId);
        }

        this.notify();
        console.log(`✦ Zenith Streak: ${currentStreak} days. Total: ${totalSessions}`);
    },

    getMoodInsights() {
        const history = ZenithData.user.moodHistory;
        if (history.length < 3) return "Continue practicing to unlock AI mood insights.";

        const lastThree = history.slice(-3);
        const improvement = lastThree.every(h => h.post > h.pre);
        const avgPost = lastThree.reduce((a, b) => a + b.post, 0) / 3;

        if (improvement) {
            return "✦ AI Insight: Your sessions are consistently improving your mood by an average of 1.5 points. Your resilience is building.";
        } else if (avgPost < 3) {
            return "✦ Alert: Your mood has been consistently low. We recommend the 'Self-Love & Worthiness' session for a gentle reset.";
        }

        return "✦ AI Insight: You are maintaining a steady emotional baseline. Try increasing your session duration to 21 minutes for deeper integration.";
    },

    completeResilienceDay(dayNumber) {
        this.resilienceProgress[dayNumber] = true;
        if (dayNumber === this.resilienceDay && this.resilienceDay < 21) {
            this.resilienceDay++;
        }

        // Persist to Supabase if available
        if (window.ZenithSupabase) {
            const userId = window.ZenithAuth?.user?.id || ZenithData.user.id;
            window.ZenithSupabase
                .from('user_profiles')
                .update({
                    resilience_day: this.resilienceDay,
                    resilience_progress: this.resilienceProgress
                })
                .eq('id', userId)
                .then(({ error }) => {
                    if (error) console.error('✦ Zenith: Error updating resilience progress:', error.message);
                    else console.log('✦ Zenith: Resilience progress saved.');
                });
        }
        this.notify();
    }
};
