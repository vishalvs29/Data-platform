/* ============================================================
   ZENITH AUTH SERVICE
   Full Supabase authentication: signup, login, logout,
   password reset, session persistence, and profile sync.
   ============================================================ */

const ZenithAuth = {

    // ── Current session (cached) ──
    session: null,
    user: null,

    // ─────────────────────────────────────────────
    // INITIALISE — call on every page load
    // Checks for an existing Supabase session and
    // populates ZenithData.user from the DB profile.
    // ─────────────────────────────────────────────
    async init() {
        if (!window.ZenithSupabase) {
            console.error('✦ Zenith Auth: Supabase client not found.');
            return null;
        }

        // Restore session from localStorage (Supabase handles this automatically)
        const { data: { session }, error } = await window.ZenithSupabase.auth.getSession();

        if (error) {
            console.error('✦ Zenith Auth: getSession error:', error.message);
            return null;
        }

        if (session) {
            this.session = session;
            this.user = session.user;
            console.log('✦ Zenith Auth: Session restored for', session.user.email);
            await this._loadProfile(session.user.id);
            if (window.ZenithNotifications) {
                await ZenithNotifications.init();
            }
            ZenithAnalytics.track('session_restored', { user_id: session.user.id });
        }

        // Listen for auth state changes (login, logout, token refresh)
        window.ZenithSupabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session ? session.user : null;
            console.log('✦ Zenith Auth State:', event);

            if (event === 'SIGNED_OUT') {
                window.location.href = 'landing.html';
            }
            if (event === 'TOKEN_REFRESHED') {
                console.log('✦ Zenith Auth: Token refreshed silently.');
            }
        });

        return session;
    },

    // ─────────────────────────────────────────────
    // SIGN UP
    // ─────────────────────────────────────────────
    async signUp(email, password, profileData = {}) {
        this._showLoader();
        this._clearError();

        const { data, error } = await window.ZenithSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: profileData.name || email.split('@')[0],
                    role: profileData.role || 'member'
                }
            }
        });

        this._hideLoader();

        if (error) {
            this._showError(error.message);
            console.error('✦ Zenith Auth: Signup error:', error.message);
            ZenithAnalytics.track('signup_failed', { email, reason: error.message });
            return { success: false, error };
        }

        // Create the user profile record
        if (data.user) {
            await this._createProfile(data.user, profileData);
            ZenithAnalytics.track('signup_success', { user_id: data.user.id, email });
        }

        console.log('✦ Zenith Auth: Signup successful for', email);
        this._showSuccess('Account created! Check your email to verify before signing in.');
        return { success: true, data };
    },

    // ─────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────
    async login(email, password) {
        this._showLoader();
        this._clearError();

        const { data, error } = await window.ZenithSupabase.auth.signInWithPassword({
            email,
            password
        });

        this._hideLoader();

        if (error) {
            this._showError(this._friendlyError(error.message));
            console.error('✦ Zenith Auth: Login error:', error.message);
            ZenithAnalytics.track('login_failed', { email, reason: error.message });
            return { success: false, error };
        }

        this.session = data.session;
        this.user = data.user;

        // Record last login timestamp
        await this._updateLastLogin(data.user.id);
        ZenithAnalytics.track('login_success', { user_id: data.user.id, email });

        console.log('✦ Zenith Auth: Login successful for', email);
        window.location.href = 'index.html';
        return { success: true, data };
    },

    // ─────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────
    async logout() {
        const userId = this.user?.id;
        ZenithAnalytics.track('logout', { user_id: userId });

        const { error } = await window.ZenithSupabase.auth.signOut();

        if (error) {
            console.error('✦ Zenith Auth: Logout error:', error.message);
        }

        this.session = null;
        this.user = null;

        // Reset memory state to defaults
        if (window.ZenithData) {
            ZenithData.user = {
                id: null, name: 'User', email: '', avatar: 'U',
                totalSessions: 0, totalMinutesPracticed: 0, currentStreak: 0,
                moodHistory: [], sleepHistory: [0, 0, 0, 0, 0, 0, 0],
                sessionHistory: [0, 0, 0, 0, 0, 0, 0], completedSessions: []
            };
        }

        // Clear all local state
        if (window.ZenithState) {
            clearInterval(ZenithState.playerTimer);
            clearInterval(ZenithState._calmInterval);
        }

        console.log('✦ Zenith Auth: Logged out successfully.');
        window.location.href = 'landing.html';
    },

    // ─────────────────────────────────────────────
    // PASSWORD RESET — Step 1: send reset email
    // ─────────────────────────────────────────────
    async sendPasswordReset(email) {
        this._showLoader();
        this._clearError();

        const { error } = await window.ZenithSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/zenith-app/login.html?mode=reset'
        });

        this._hideLoader();

        if (error) {
            this._showError(error.message);
            ZenithAnalytics.track('password_reset_failed', { email, reason: error.message });
            return { success: false, error };
        }

        ZenithAnalytics.track('password_reset_requested', { email });
        this._showSuccess('Reset link sent! Check your email. Link expires in 1 hour.');
        return { success: true };
    },

    // ─────────────────────────────────────────────
    // PASSWORD RESET — Step 2: update new password
    // Called after user clicks the email link and
    // is redirected back with a valid session.
    // ─────────────────────────────────────────────
    async updatePassword(newPassword) {
        this._showLoader();
        this._clearError();

        const { data, error } = await window.ZenithSupabase.auth.updateUser({
            password: newPassword
        });

        this._hideLoader();

        if (error) {
            this._showError(error.message);
            ZenithAnalytics.track('password_update_failed', { reason: error.message });
            return { success: false, error };
        }

        ZenithAnalytics.track('password_updated', { user_id: data.user.id });
        this._showSuccess('Password updated successfully. Redirecting to app...');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return { success: true };
    },

    // ─────────────────────────────────────────────
    // SESSION GUARD — call at top of index.html
    // Redirects to login if no active session.
    // ─────────────────────────────────────────────
    async requireAuth() {
        const { data: { session } } = await window.ZenithSupabase.auth.getSession();

        if (!session) {
            console.warn('✦ Zenith Auth: No active session — redirecting to login.');
            window.location.href = 'login.html';
            return false;
        }

        this.session = session;
        this.user = session.user;
        return true;
    },

    // ─────────────────────────────────────────────
    // PROFILE MANAGEMENT
    // ─────────────────────────────────────────────
    async _createProfile(authUser, extraData = {}) {
        const profile = {
            id: authUser.id,
            email: authUser.email,
            name: extraData.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
            role: extraData.role || 'member',
            wellness_goal: extraData.wellnessGoal || 'stress',
            experience_level: extraData.experienceLevel || 'Beginner',
            program_type: extraData.programType || 7,
            organization: extraData.organization || null,
            subscription_status: 'trial',
            created_at: new Date().toISOString(),
            last_login_at: new Date().toISOString()
        };

        const { error } = await window.ZenithSupabase
            .from('user_profiles')
            .insert(profile);

        if (error) console.error('✦ Zenith Auth: Error creating profile:', error.message);
        else console.log('✦ Zenith Auth: Profile created for', authUser.email);
    },

    async _loadProfile(userId) {
        // 1. Load basic profile and stats
        const { data: profile, error: pError } = await window.ZenithSupabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (pError) {
            console.warn('✦ Zenith Auth: Could not load profile:', pError.message);
            return;
        }

        // 2. Load recent mood history (last 7 days/entries)
        const { data: moods } = await window.ZenithSupabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(10);

        // 3. Load recently completed sessions for history dots
        const { data: sessions } = await window.ZenithSupabase
            .from('session_records')
            .select('session_id, completed, started_at')
            .eq('user_id', userId)
            .eq('completed', true)
            .order('started_at', { ascending: false })
            .limit(50);

        if (profile && window.ZenithData) {
            const u = ZenithData.user;

            // Basic Info
            u.id = profile.id;
            u.name = profile.name || u.name;
            u.email = profile.email || u.email;
            u.avatar = (profile.name || 'U')[0].toUpperCase();

            // Stats from DB
            u.totalSessions = profile.total_sessions || 0;
            u.totalMinutesPracticed = profile.total_minutes || 0;
            u.currentStreak = profile.current_streak || 0;
            u.longestStreak = profile.longest_streak || 0;

            // Preferences
            u.wellnessGoal = profile.wellness_goal || 'stress';
            u.experienceLevel = profile.experience_level || 'Beginner';
            u.programType = profile.program_type || 7;
            u.organization = profile.organization || null;

            // Map Moods
            if (moods) {
                u.moodHistory = moods.map(m => ({
                    date: m.timestamp.split('T')[0],
                    pre: m.pre_rating,
                    post: m.post_rating,
                    tags: m.tags || []
                })).reverse();
            }

            // Map Completed Sessions
            if (sessions) {
                u.completedSessions = [...new Set(sessions.map(s => s.session_id))];

                // Aggregate for the 7-day sparkline
                const history = [0, 0, 0, 0, 0, 0, 0];
                const now = new Date();
                sessions.forEach(s => {
                    const daysAgo = Math.floor((now - new Date(s.started_at)) / (1000 * 60 * 60 * 24));
                    if (daysAgo >= 0 && daysAgo < 7) {
                        history[6 - daysAgo]++;
                    }
                });
                u.sessionHistory = history;
            }

            console.log('✦ Zenith Auth: Production profile loaded for', u.name);
        }
    },

    async saveProfile(profileData) {
        if (!this.user) return { success: false, error: 'Not authenticated' };

        const { error } = await window.ZenithSupabase
            .from('user_profiles')
            .update({
                name: profileData.name,
                wellness_goal: profileData.wellnessGoal,
                experience_level: profileData.experienceLevel,
                program_type: profileData.programType,
                organization: profileData.organization,
                updated_at: new Date().toISOString()
            })
            .eq('id', this.user.id);

        if (error) {
            console.error('✦ Zenith Auth: Profile save error:', error.message);
            return { success: false, error };
        }

        ZenithAnalytics.track('profile_updated', { user_id: this.user.id });
        console.log('✦ Zenith Auth: Profile saved to DB.');
        return { success: true };
    },

    async _updateLastLogin(userId) {
        await window.ZenithSupabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userId);
    },

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    _friendlyError(msg) {
        if (msg.includes('Invalid login')) return 'Invalid email or password. Please try again.';
        if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.';
        if (msg.includes('User already registered')) return 'An account with this email already exists.';
        if (msg.includes('Password should be')) return 'Password must be at least 6 characters.';
        return msg;
    },

    _showLoader() {
        const btn = document.getElementById('auth-submit-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Please wait...'; }
    },

    _hideLoader() {
        const btn = document.getElementById('auth-submit-btn');
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit'; }
    },

    _showError(msg) {
        const el = document.getElementById('auth-error');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    },

    _showSuccess(msg) {
        const el = document.getElementById('auth-success');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    },

    _clearError() {
        const el = document.getElementById('auth-error');
        if (el) el.style.display = 'none';
        const s = document.getElementById('auth-success');
        if (s) s.style.display = 'none';
    }
};
