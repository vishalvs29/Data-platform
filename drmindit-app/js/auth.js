/* ============================================================
   DRMINDIT AUTH SERVICE
   Full Supabase authentication: signup, login, logout,
   password reset, session persistence, and profile sync.
   ============================================================ */

const DrMinditAuth = {

    // ── Current session (cached) ──
    session: null,
    user: null,

    // ─────────────────────────────────────────────
    // INITIALISE — call on every page load
    // Checks for an existing Supabase session and
    // populates DrMinditData.user from the DB profile.
    // ─────────────────────────────────────────────
    async init() {
        // ── Testing Bypass ──
        if (localStorage.getItem('drmindit_test_mode') === 'true') {
            console.log('✦ DrMindit Auth: Test Mode Active. Injecting mock session.');
            this.session = { user: { id: 'test-user-123', email: 'test@drmindit.com' } };
            this.user = this.session.user;
            DrMinditData.user.id = this.user.id;
            DrMinditData.user.name = 'Test User';
            return this.session;
        }

        if (!window.DrMinditSupabase) {
            console.error('✦ DrMindit Auth: Supabase client not found.');
            return null;
        }

        // Restore session from localStorage (Supabase handles this automatically)
        const { data: { session }, error } = await window.DrMinditSupabase.auth.getSession();

        if (error) {
            console.error('✦ DrMindit Auth: getSession error:', error.message);
            return null;
        }

        if (session) {
            this.session = session;
            this.user = session.user;
            console.log('✦ DrMindit Auth: Session restored for', session.user.email);
            await this._loadProfile(session.user.id);

            // ── Recover interrupted session ──
            this._recoverInterruptedSession();

            if (window.DrMinditNotifications) {
                await DrMinditNotifications.init();
            }
            DrMinditAnalytics.track('session_restored', { user_id: session.user.id });
        }

        // Listen for auth state changes (login, logout, token refresh)
        window.DrMinditSupabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session ? session.user : null;
            console.log('✦ DrMindit Auth State:', event);

            if (event === 'SIGNED_IN') {
                // After Google OAuth callback, redirect to dashboard if on login page
                if (window.location.pathname.includes('login.html') || window.location.protocol === 'file:') {
                    const redirectUrl = (new URLSearchParams(window.location.search)).get('redirect') || 'dashboard.html';
                    window.location.href = redirectUrl;
                }
            }
            if (event === 'SIGNED_OUT') {
                window.location.href = 'landing.html';
            }
            if (event === 'TOKEN_REFRESHED') {
                console.log('✦ DrMindit Auth: Token refreshed silently.');
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

        const { data, error } = await window.DrMinditSupabase.auth.signUp({
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
            console.error('✦ DrMindit Auth: Signup error:', error.message);
            DrMinditAnalytics.track('signup_failed', { email, reason: error.message });
            return { success: false, error };
        }

        // Create the user profile record
        if (data.user) {
            await this._createProfile(data.user, profileData);
            DrMinditAnalytics.track('signup_success', { user_id: data.user.id, email });
        }

        console.log('✦ DrMindit Auth: Signup successful for', email);
        this._showSuccess('Account created! Check your email to verify before signing in.');
        return { success: true, data };
    },

    // ─────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────
    async login(email, password, redirectUrl = 'dashboard.html') {
        this._showLoader();
        this._clearError();

        const { data, error } = await window.DrMinditSupabase.auth.signInWithPassword({
            email,
            password
        });

        this._hideLoader();

        if (error) {
            this._showError(this._friendlyError(error.message));
            console.error('✦ DrMindit Auth: Login error:', error.message);
            DrMinditAnalytics.track('login_failed', { email, reason: error.message });
            return { success: false, error };
        }

        this.session = data.session;
        this.user = data.user;

        // Record last login timestamp
        await this._updateLastLogin(data.user.id);
        DrMinditAnalytics.track('login_success', { user_id: data.user.id, email });

        console.log('✦ DrMindit Auth: Login successful for', email);
        window.location.href = redirectUrl;
        return { success: true, data };
    },

    // ─────────────────────────────────────────────
    // GOOGLE LOGIN
    // ─────────────────────────────────────────────
    async signInWithGoogle() {
        console.log('✦ DrMindit Auth: Initiating Google OAuth...');
        this._showLoader();
        this._clearError();
        try {
            // Build a safe redirect URL: file:// protocol can't be used as OAuth redirect,
            // so we point to the Supabase callback URL and rely on auth state change.
            const isLocalFile = window.location.protocol === 'file:';
            const redirectTo = isLocalFile
                ? undefined  // Let Supabase use its default callback
                : (window.location.origin + '/dashboard.html');

            const options = {
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account'
                    }
                }
            };
            if (redirectTo) options.options.redirectTo = redirectTo;

            const { data, error } = await window.DrMinditSupabase.auth.signInWithOAuth(options);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('✦ DrMindit Auth: Google Login error:', error.message);
            this._hideLoader();
            this._showError('Google Sign-In failed: ' + error.message);
            return { success: false, error };
        }
    },

    // ─────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────
    async logout() {
        const userId = this.user?.id;
        DrMinditAnalytics.track('logout', { user_id: userId });

        const { error } = await window.DrMinditSupabase.auth.signOut();

        if (error) {
            console.error('✦ DrMindit Auth: Logout error:', error.message);
        }

        this.session = null;
        this.user = null;

        // Reset memory state to defaults
        if (window.DrMinditData) {
            DrMinditData.user = {
                id: null, name: 'User', email: '', avatar: 'U',
                totalSessions: 0, totalMinutesPracticed: 0, currentStreak: 0,
                moodHistory: [], sleepHistory: [0, 0, 0, 0, 0, 0, 0],
                sessionHistory: [0, 0, 0, 0, 0, 0, 0], completedSessions: []
            };
        }

        // Clear all local state
        if (window.DrMinditState) {
            clearInterval(DrMinditState.playerTimer);
            clearInterval(DrMinditState._calmInterval);
        }

        console.log('✦ DrMindit Auth: Logged out successfully.');
        window.location.href = 'landing.html';
    },

    // ─────────────────────────────────────────────
    // PASSWORD RESET — Step 1: send reset email
    // ─────────────────────────────────────────────
    async sendPasswordReset(email) {
        this._showLoader();
        this._clearError();

        const { error } = await window.DrMinditSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/drmindit-app/login.html?mode=reset'
        });

        this._hideLoader();

        if (error) {
            this._showError(error.message);
            DrMinditAnalytics.track('password_reset_failed', { email, reason: error.message });
            return { success: false, error };
        }

        DrMinditAnalytics.track('password_reset_requested', { email });
        this._showSuccess('Reset link sent! Check your email. Link expires in 1 hour.');
        return { success: true };
    },

    // ─────────────────────────────────────────────
    // PASSWORD RESET — Step 2: update new password
    // Called after user clicks the email link and
    // is redirected back with a valid session.
    // ─────────────────────────────────────────────
    async updatePassword(newPassword, redirectUrl = 'dashboard.html') {
        this._showLoader();
        this._clearError();

        const { data, error } = await window.DrMinditSupabase.auth.updateUser({
            password: newPassword
        });

        this._hideLoader();

        if (error) {
            this._showError(error.message);
            DrMinditAnalytics.track('password_update_failed', { reason: error.message });
            return { success: false, error };
        }

        DrMinditAnalytics.track('password_updated', { user_id: data.user.id });
        this._showSuccess('Password updated successfully. Redirecting to app...');
        setTimeout(() => window.location.href = redirectUrl, 2000);
        return { success: true };
    },

    // ─────────────────────────────────────────────
    // SESSION GUARD — call at top of index.html
    // Redirects to login if no active session.
    // ─────────────────────────────────────────────
    async requireAuth() {
        const { data: { session } } = await window.DrMinditSupabase.auth.getSession();

        if (!session) {
            console.warn('✦ DrMindit Auth: No active session — redirecting to login.');
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

        const { error } = await window.DrMinditSupabase
            .from('user_profiles')
            .insert(profile);

        if (error) console.error('✦ DrMindit Auth: Error creating profile:', error.message);
        else console.log('✦ DrMindit Auth: Profile created for', authUser.email);
    },

    async _loadProfile(userId) {
        // 1. Load basic profile and stats
        const { data: profile, error: pError } = await window.DrMinditSupabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (pError) {
            console.warn('✦ DrMindit Auth: Could not load profile:', pError.message);
            return;
        }

        // 2. Load recent mood history (last 7 days/entries)
        const { data: moods } = await window.DrMinditSupabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(10);

        // 3. Load recently completed sessions for history dots
        const { data: sessions } = await window.DrMinditSupabase
            .from('user_sessions')
            .select('session_id, completion_status, started_at')
            .eq('user_id', userId)
            .eq('completion_status', true)
            .order('started_at', { ascending: false })
            .limit(50);

        if (profile && window.DrMinditData) {
            const u = DrMinditData.user;

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

            console.log('✦ DrMindit Auth: Production profile loaded for', u.name);
        }
    },

    async saveProfile(profileData) {
        if (!this.user) return { success: false, error: 'Not authenticated' };

        const { error } = await window.DrMinditSupabase
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
            console.error('✦ DrMindit Auth: Profile save error:', error.message);
            return { success: false, error };
        }

        DrMinditAnalytics.track('profile_updated', { user_id: this.user.id });
        console.log('✦ DrMindit Auth: Profile saved to DB.');
        return { success: true };
    },

    async _updateLastLogin(userId) {
        await window.DrMinditSupabase
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
    },

    async _recoverInterruptedSession() {
        const savedSync = localStorage.getItem('drmindit_active_sync');
        if (!savedSync) return;

        try {
            const { id, elapsed, ts } = JSON.parse(savedSync);
            // If less than 1 hour old, we can potentially sync it one last time if it was never marked completed
            if (Date.now() - ts < 3600000) {
                console.log('✦ DrMindit Auth: Found interrupted session to sync:', id);
                await window.DrMinditSupabase
                    .from('user_sessions')
                    .update({ completed_seconds: Math.floor(elapsed) })
                    .eq('id', id)
                    .eq('completion_status', false);
            }
        } catch (e) {
            console.error('✦ DrMindit Auth: Recovery failed:', e);
        } finally {
            localStorage.removeItem('drmindit_active_sync');
        }
    }
};
