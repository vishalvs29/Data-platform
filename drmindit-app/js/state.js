/* ============================================================
   DRMINDIT STATE MANAGEMENT
   Simple reactive state store
   ============================================================ */

const DrMinditState = {
    currentPage: 'home',
    previousPage: null,
    selectedSessionId: null,
    activeSessionId: null,
    selectedMood: null,
    selectedDuration: null,
    selectedCategory: 'all',
    calmNowActive: false,
    showMoodCheckIn: false,
    showMoodCheckOut: false,
    showExitConfirmation: false, // New flag for the confirmation modal
    playerControlsVisible: true, // New flag for auto-hide controls
    calmNowTimer: null,
    playerTimer: null,
    playerElapsed: 0,
    playerPlaying: false,
    playerCaption: '',
    searchQuery: '',
    moodCheckIn: null, // Stores { preMood, preTags, timestamp }
    resilienceDay: 1, // Current active day of the 21-day program
    resilienceProgress: {}, // Map of day number to completion status: { 1: true, 2: false, ... }
    currentPlatform: null, // null = Gateway, 'schools', 'corporate', 'government', 'defense'
    narrationError: null, // Error message if audio fails
    playbackRate: 1.0, // Default playback rate

    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    notify() {
        this.listeners.forEach(fn => fn(this));
        this._renderMiniPlayer();
    },

    _renderMiniPlayer() {
        const container = document.getElementById('mini-player-container');
        if (!container) return;

        const shouldShow = this.activeSessionId && this.currentPage !== 'active' && !this.calmNowActive;

        if (shouldShow) {
            container.innerHTML = DrMinditComponents.miniPlayer();
            container.classList.remove('hidden');
        } else {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
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

        console.log(`✦ DrMindit Platform: Switched to ${platformId || 'Gateway'}`);
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
        DrMinditData.user.currentMood = mood;

        const userId = window.DrMinditAuth?.user?.id || DrMinditData.user.id;
        const entry = {
            date: new Date().toISOString().split('T')[0],
            pre: mood,
            timestamp: new Date().toISOString()
        };

        // Update local memory so charts update immediately
        DrMinditData.user.moodHistory.push(entry);

        // Save to Supabase
        if (window.DrMinditSupabase && userId) {
            window.DrMinditSupabase
                .from('mood_entries')
                .insert({
                    user_id: userId,
                    pre_rating: mood,
                    timestamp: entry.timestamp
                })
                .then(({ error }) => {
                    if (error) console.error('✦ DrMindit: Error saving mood:', error.message);
                    else console.log('✦ DrMindit: Mood persisted to database');
                });
        }

        this.notify();
    },

    async startSession(sessionId, forceRestart = false) {
        const session = DrMinditData.getSessionById(sessionId);
        let startAtSeconds = 0;

        // 1. Auto-Resume Logic
        if (!forceRestart && window.DrMinditSupabase) {
            const userId = window.DrMinditAuth?.user?.id || DrMinditData.user.id;
            try {
                // Check for most recent unfinished session
                const { data, error } = await window.DrMinditSupabase
                    .from('user_sessions')
                    .select('completed_seconds')
                    .eq('user_id', userId)
                    .eq('session_id', sessionId)
                    .eq('completion_status', false)
                    .order('started_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data && data.completed_seconds > 10) {
                    // Logic: If user has > 10s progress, ask or just resume
                    // For "immersive/minimal" we resume automatically but show a toast eventually?
                    // Let's resume automatically for now as requested.
                    startAtSeconds = data.completed_seconds;
                    console.log(`✦ DrMindit: Auto-resuming from ${startAtSeconds}s`);
                }
            } catch (err) {
                console.warn('✦ DrMindit: Auto-resume check failed:', err);
            }
        }

        this.activeSessionId = sessionId;
        this.playerElapsed = startAtSeconds;
        this.playerPlaying = true;
        this.playerCaption = '';
        this.narrationError = null;
        this.currentPage = 'active';
        this.dbSessionId = null;

        let totalSeconds = session.duration * 60;

        // 2. Create session record in database
        if (window.DrMinditSupabase) {
            const userId = window.DrMinditAuth?.user?.id || DrMinditData.user.id;
            try {
                const { data, error } = await window.DrMinditSupabase
                    .from('user_sessions')
                    .insert({
                        user_id: userId,
                        session_id: sessionId,
                        session_title: session.title,
                        session_duration: session.duration,
                        completed_seconds: startAtSeconds,
                        completion_status: false,
                        started_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (data) {
                    this.dbSessionId = data.id;
                    console.log('✦ DrMindit: Session record created:', this.dbSessionId);
                }
            } catch (err) { }
        }

        // Initialize audio engine
        DrMinditAudioEngine.onCaptionUpdate = (caption) => {
            this.playerCaption = caption;
            this._updateSessionCaption(caption);
        };

        DrMinditAudioEngine.onNarrationError = (errorMsg) => {
            this.narrationError = errorMsg;
            this.playerPlaying = false;
            this.notify();
        };

        DrMinditAudioEngine.onTimeUpdate = (current, duration) => {
            if (duration && !isNaN(duration)) {
                totalSeconds = Math.floor(duration);
            }
            this.playerElapsed = Math.floor(current);

            if (this.playerElapsed >= totalSeconds && totalSeconds > 0) {
                this.stopSession();
            } else {
                this._updateSessionPlayerUI(totalSeconds);
            }
        };

        DrMinditAudioEngine.start(sessionId, startAtSeconds);

        // Local UI timer (fallback)
        clearInterval(this.playerTimer);
        this.playerTimer = setInterval(() => {
            if (this.playerPlaying && !DrMinditAudioEngine.narrationPlayer) {
                this.playerElapsed++;
                if (this.playerElapsed >= totalSeconds) {
                    this.stopSession();
                } else {
                    this._updateSessionPlayerUI(totalSeconds);
                }
            }
        }, 1000);

        // Periodic Database Sync
        clearInterval(this._sessionSyncInterval);
        this._sessionSyncInterval = setInterval(() => {
            if (this.playerPlaying && this.dbSessionId) {
                this._syncActiveSessionProgress();
            }
        }, 15000);

        this.notify();
    },

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        DrMinditAudioEngine.setPlaybackRate(rate);

        // Update direct UI label if exists
        const speedLabel = document.getElementById('player-speed-label');
        if (speedLabel) speedLabel.textContent = `${rate}x`;
    },

    togglePlayer() {
        this.playerPlaying = !this.playerPlaying;
        if (this.playerPlaying) {
            DrMinditAudioEngine.resume();
            document.querySelectorAll('.breathing-orb-minimal, .player-orb-glow').forEach(el => el.classList.add('active', 'breathe'));
            document.querySelectorAll('.waveform-bar').forEach(el => el.classList.add('playing'));
        } else {
            DrMinditAudioEngine.pause();
            document.querySelectorAll('.breathing-orb-minimal, .player-orb-glow').forEach(el => el.classList.remove('active', 'breathe'));
            document.querySelectorAll('.waveform-bar').forEach(el => el.classList.remove('playing'));
        }
        // Update play/pause button icon directly
        const mainBtn = document.querySelector('.ctrl-btn-main');
        if (mainBtn) {
            mainBtn.classList.toggle('playing', this.playerPlaying);
            const iconWrap = mainBtn.querySelector('.icon-wrap');
            if (iconWrap) {
                iconWrap.innerHTML = this.playerPlaying
                    ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            }
        }
    },

    _updateSessionPlayerUI(totalSeconds) {
        const timeEl = document.getElementById('player-time-current');
        const ringEl = document.getElementById('player-ring-fill');
        const sliderEl = document.getElementById('player-scrubber-slider');
        const fillEl = document.getElementById('player-scrubber-fill');
        const orbLabelEl = document.getElementById('orb-breath-label');
        const playerContainer = document.querySelector('.audio-player-container');

        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        };

        if (timeEl) timeEl.textContent = formatTime(this.playerElapsed);

        const progress = totalSeconds > 0 ? this.playerElapsed / totalSeconds : 0;

        // 1. Update Premium Progress Ring
        if (ringEl) {
            const radius = 120; // Matches components.js
            const circumference = 2 * Math.PI * radius;
            ringEl.style.strokeDashoffset = circumference - progress * circumference;
        }

        // 2. Update Premium Scrubber
        if (sliderEl) sliderEl.value = this.playerElapsed;
        if (fillEl) fillEl.style.width = `${progress * 100}%`;

        // 3. Update Breathing labels and Phase classes
        if (this.playerPlaying) {
            const cyclePos = this.playerElapsed % 14;
            let label = 'Inhale';
            let phase = 'phase-inhale';

            if (cyclePos >= 4 && cyclePos < 8) {
                label = 'Hold';
                phase = 'phase-hold';
            } else if (cyclePos >= 8) {
                label = 'Exhale';
                phase = 'phase-exhale';
            }

            if (orbLabelEl) orbLabelEl.textContent = label;

            if (playerContainer) {
                playerContainer.classList.remove('phase-inhale', 'phase-hold', 'phase-exhale');
                playerContainer.classList.add(phase);
            }
        }

        // Update Mini Player if visible
        const miniProgress = document.querySelector('.mini-player-progress');
        if (miniProgress) {
            miniProgress.style.width = `${progress * 100}%`;
        }
    },

    _updateSessionCaption(text) {
        const captionEl = document.getElementById('player-caption-text');
        if (captionEl) {
            captionEl.style.opacity = 0;
            setTimeout(() => {
                captionEl.textContent = text || 'Centering your focus...';
                captionEl.style.opacity = 1;
            }, 300);
        }
    },

    seekTo(seconds) {
        this.playerElapsed = parseInt(seconds, 10);
        DrMinditAudioEngine.seek(this.playerElapsed);
        // Update UI directly — no full re-render needed
        const session = this.activeSessionId ? DrMinditData.getSessionById(this.activeSessionId) : null;
        if (session) this._updateSessionPlayerUI(session.duration * 60);
    },

    skipForward() {
        const nextTime = Math.min(this.playerElapsed + 15, this.getSessionDuration() * 60);
        this.seekTo(nextTime);
    },

    skipBackward() {
        const prevTime = Math.max(this.playerElapsed - 15, 0);
        this.seekTo(prevTime);
    },

    async stopSession() {
        clearInterval(this._sessionSyncInterval);

        if (this.activeSessionId) {
            const session = DrMinditData.getSessionById(this.activeSessionId);
            const duration = Math.floor(this.playerElapsed / 60);
            const completed = this.playerElapsed >= (session.duration * 60 * 0.9); // 90% = completed

            // 1. Final Update to Database
            if (window.DrMinditSupabase && this.dbSessionId) {
                try {
                    await window.DrMinditSupabase
                        .from('user_sessions')
                        .update({
                            completed_seconds: Math.floor(this.playerElapsed),
                            completion_status: completed,
                            completed_at: completed ? new Date().toISOString() : null
                        })
                        .eq('id', this.dbSessionId);
                } catch (err) {
                    console.error('✦ DrMindit: Final session sync failed:', err);
                }
            }

            // 2. Track analytics event
            if (window.DrMinditAnalytics) {
                DrMinditAnalytics.track('session_ended', {
                    session_id: this.activeSessionId,
                    session_title: session.title,
                    category: session.category,
                    duration_played: duration,
                    completed
                });
            }

            // 3. Update stats and progress
            if (completed) {
                if (!DrMinditData.user.completedSessions.includes(this.activeSessionId)) {
                    DrMinditData.user.completedSessions.push(this.activeSessionId);
                }
                await this.updatePracticeStats(duration || 1);

                // Resilience Program logic
                if (this.activeSessionId.startsWith('res-d')) {
                    const dayNum = parseInt(this.activeSessionId.replace('res-d', ''));
                    this.completeResilienceDay(dayNum);
                }
            }

            // Show post-session mood check if applicable
            if (this.moodCheckIn) {
                this.showMoodCheckOut = true;
            }

            if (completed && window.DrMinditNotifications) {
                DrMinditNotifications.triggerStreakMotivation(DrMinditData.user.currentStreak);
            }
        }

        DrMinditAudioEngine.stop();
        this.activeSessionId = null;
        this.playerPlaying = false;
        this.playerCaption = '';
        clearInterval(this.playerTimer);
        this.dbSessionId = null;

        if (!this.showMoodCheckOut) {
            this.currentPage = this.previousPage || 'home';
        }
        this.notify();
    },

    async _syncActiveSessionProgress() {
        if (!this.dbSessionId || !window.DrMinditSupabase) return;

        try {
            await window.DrMinditSupabase
                .from('user_sessions')
                .update({
                    completed_seconds: Math.floor(this.playerElapsed)
                })
                .eq('id', this.dbSessionId);

            // LocalStorage fallback for safety
            localStorage.setItem('drmindit_active_sync', JSON.stringify({
                id: this.dbSessionId,
                elapsed: this.playerElapsed,
                ts: Date.now()
            }));
        } catch (err) {
            console.error('✦ DrMindit: Background session sync failed:', err);
        }
    },

    getSessionDuration() {
        if (!this.activeSessionId) return 0;
        const session = DrMinditData.getSessionById(this.activeSessionId);
        return session ? session.duration : 0;
    },

    startCalmNow() {
        this.calmNowActive = true;
        this.calmNowTimer = 5 * 60; // 5 minutes
        clearInterval(this._calmInterval);

        // Soft start audio if engine is available
        if (window.DrMinditAudioEngine) {
            DrMinditAudioEngine.init();
            DrMinditAudioEngine.masterGain.gain.setValueAtTime(0, DrMinditAudioEngine.audioCtx.currentTime);
            DrMinditAudioEngine._startBinauralBeats(); // Reliable oscillator-based audio
            DrMinditAudioEngine.masterGain.gain.linearRampToValueAtTime(1, DrMinditAudioEngine.audioCtx.currentTime + 3);
        }

        this._calmInterval = setInterval(() => {
            if (this.calmNowTimer > 0) {
                this.calmNowTimer--;
                this._updateCalmNowUI();
            } else {
                this.closeCalmNow();
            }
        }, 1000);
        this.notify();
    },

    _updateCalmNowUI() {
        const timerEl = document.getElementById('calm-timer-display');
        const instructionEl = document.getElementById('calm-instruction-text');
        const ringEl = document.getElementById('calm-progress-ring-fill');

        if (timerEl) {
            const minutes = Math.floor(this.calmNowTimer / 60);
            const seconds = this.calmNowTimer % 60;
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        if (instructionEl) {
            // New 14s cycle: 4 in, 4 hold, 6 out
            const cyclePos = (300 - this.calmNowTimer) % 14;
            let text = 'Breathe in...';
            if (cyclePos >= 4 && cyclePos < 8) text = 'Hold...';
            else if (cyclePos >= 8) text = 'Breathe out...';

            if (instructionEl.textContent !== text) {
                instructionEl.style.opacity = 0;
                setTimeout(() => {
                    instructionEl.textContent = text;
                    instructionEl.style.opacity = 1;
                }, 300);
            }
        }

        if (ringEl) {
            const progress = (300 - this.calmNowTimer) / 300;
            const circumference = 2 * Math.PI * 135;
            ringEl.style.strokeDashoffset = circumference - (progress * circumference);
        }
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

    // ── Profile Management ──
    updateProfile(data) {
        Object.assign(DrMinditData.user, data);
        // Persist to Supabase via auth service
        if (window.DrMinditAuth && DrMinditAuth.user) {
            DrMinditAuth.saveProfile(data);
        }
        if (window.DrMinditAnalytics) {
            DrMinditAnalytics.track('profile_updated', { fields: Object.keys(data) });
        }
        console.log('✦ DrMindit: Profile updated and saved.');
        this.notify();
    },

    // ── Logout via real auth ──
    logout() {
        if (window.DrMinditAuth) {
            DrMinditAuth.logout(); // Calls supabase.auth.signOut() and redirects
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
        console.log('✦ DrMindit: Pre-session mood recorded', this.moodCheckIn);
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

        DrMinditData.user.moodHistory.push(entry);
        this.moodCheckIn = null;
        this.showMoodCheckOut = false;

        // Save to Supabase (Extended)
        if (window.DrMinditSupabase) {
            window.DrMinditSupabase
                .from('mood_entries')
                .insert({
                    user_id: DrMinditData.user.id,
                    pre_rating: entry.pre,
                    post_rating: entry.post,
                    tags: entry.tags,
                    timestamp: entry.timestamp
                })
                .then(({ error }) => {
                    if (error) console.error('✦ DrMindit: Error saving extended mood:', error.message);
                });
        }

        console.log('✦ DrMindit: Mood cycle complete', entry);
        this.notify();
    },

    // ── Stats & Achievements ──
    async updatePracticeStats(minutes) {
        const user = DrMinditData.user;
        const userId = window.DrMinditAuth?.user?.id || user.id;
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch current streak data from Supabase if available, otherwise use local
        let currentStreak = user.currentStreak || 0;
        let longestStreak = user.longestStreak || 0;
        let lastSessionDate = user.lastSessionDate;
        let totalSessions = user.totalSessions || 0;

        if (window.DrMinditSupabase) {
            const { data, error } = await window.DrMinditSupabase
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
        if (window.DrMinditSupabase) {
            await window.DrMinditSupabase
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
            await window.DrMinditSupabase
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
        console.log(`✦ DrMindit Streak: ${currentStreak} days. Total: ${totalSessions}`);
    },

    getMoodInsights() {
        const history = DrMinditData.user.moodHistory;
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
        if (window.DrMinditSupabase) {
            const userId = window.DrMinditAuth?.user?.id || DrMinditData.user.id;
            window.DrMinditSupabase
                .from('user_profiles')
                .update({
                    resilience_day: this.resilienceDay,
                    resilience_progress: this.resilienceProgress
                })
                .eq('id', userId)
                .then(({ error }) => {
                    if (error) console.error('✦ DrMindit: Error updating resilience progress:', error.message);
                    else console.log('✦ DrMindit: Resilience progress saved.');
                });
        }
        this.notify();
    }
};
