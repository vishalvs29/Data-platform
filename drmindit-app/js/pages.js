/* ============================================================
   DRMINDIT PAGE RENDERERS
   ============================================================ */

// Shared state for mood modal
let _selectedMoodScale = 5;

const DrMinditPages = {

    // ═══════════════════════════════════════════
    // GATEWAY PAGE
    // ═══════════════════════════════════════════
    // ── GATEWAY PAGE ──
    gateway() {
        const platformsToShow = ['schools', 'corporate'];
        const platforms = Object.values(DrMinditData.platforms).filter(p => platformsToShow.includes(p.id));

        return `
            <div class="page-gateway animate-fade-in">
                <header class="gateway-header-premium">
                    <div class="logo-premium animate-fade-down">✦ DrMindit</div>
                    <h1 class="gateway-headline animate-fade-up">Select Your Platform</h1>
                    <p class="gateway-subtext animate-fade-up" style="animation-delay: 0.1s;">
                        Choose the specialized mental performance experience designed for your role.
                    </p>
                </header>

                <div class="gateway-grid-refined">
                    ${platforms.map(p => DrMinditComponents.gatewayCard(p)).join('')}
                </div>
                
                <footer class="gateway-footer-refined animate-fade-in" style="animation-delay: 0.5s;">
                    <div class="footer-divider"></div>
                    <div class="footer-note">
                        DrMindit Performance Ecosystem · E2E Encrypted · Professional Grade
                    </div>
                </footer>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // HOME PAGE
    // ═══════════════════════════════════════════
    home() {
        const user = DrMinditData.user;
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';

        const featured = DrMinditData.getFeaturedSession();
        const recommended = DrMinditData.getRecommendations().filter(s => s.platforms && s.platforms.includes(DrMinditState.currentPlatform));

        return `
            <div class="page-home page-enter">
                <!-- Header -->
                <div class="home-header">
                    <div>
                        <div class="home-greeting">${greeting} · ${DrMinditData.platforms[DrMinditState.currentPlatform]?.title || 'DrMindit'}</div>
                        <div class="home-name">Welcome, ${user.name}</div>
                        <div class="home-subtitle">Select a session to begin your practice.</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        <div class="home-avatar">${user.avatar}</div>
                        <button onclick="DrMinditState.logout()" 
                                style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:2px 8px; cursor:pointer;">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Mood Check-in -->
                <div class="mood-section">
                    ${DrMinditComponents.moodSelector()}
                </div>

                <!-- Streak Widget -->
                ${DrMinditComponents.streakDisplay()}

                <!-- Privacy Badge -->
                <div style="padding: 0 16px 16px;">
                    ${DrMinditComponents.privacyBadge()}
                </div>

                <!-- Resilience Program Card -->
                <div class="resilience-hero-card" onclick="DrMinditState.navigateTo('resilience')" style="margin: 0 16px 24px; padding: 24px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 16px; color: white; cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);">
                    <div style="position: absolute; right: -20px; top: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: relative; z-index: 2;">
                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.8); margin-bottom: 8px; text-transform: uppercase;">Premium Program</div>
                        <h2 style="font-size: 1.5rem; font-family: 'Playfair Display', serif; font-weight: 700; margin-bottom: 8px;">21-Day Resilience Journey</h2>
                        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.9); line-height: 1.4; max-width: 80%; margin-bottom: 16px;">
                            Master your nervous system with our neuroscience-backed path for high-stakes professionals.
                        </p>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600;">
                            <span>Day ${DrMinditState.resilienceDay} of 21</span>
                            <div style="height: 4px; width: 60px; background: rgba(255,255,255,0.2); border-radius: 2px;">
                                <div style="height: 100%; width: ${(Object.keys(DrMinditState.resilienceProgress).length / 21) * 100}%; background: white; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Featured Session -->
                ${featured ? DrMinditComponents.featuredCard(featured) : ''}

                <!-- Quick Duration Access -->
                <div class="quick-durations" style="margin-top: 16px;">
                    <div class="quick-durations-label">Quick Access by Duration</div>
                    <div class="quick-durations-row">
                        ${DrMinditData.durations.map(d => `
                            <button class="quick-duration-chip" 
                                    onclick="DrMinditState.navigateTo('explore', { duration: ${d} })">${d} min</button>
                        `).join('')}
                    </div>
                </div>

                <!-- Recommended Sessions -->
                <div class="section-header">
                    <span class="section-title">Recommended for You</span>
                    <span class="section-see-all" onclick="DrMinditState.navigateTo('explore')">See All</span>
                </div>
                <div class="scroll-row stagger-children">
                    ${recommended.map(s => DrMinditComponents.sessionCard(s)).join('')}
                </div>

                <!-- Recent Sessions -->
                <div class="section-header">
                    <span class="section-title">Continue Your Journey</span>
                </div>
                <div style="padding: 0 16px 24px; display:flex; flex-direction:column; gap:8px;" class="stagger-children">
                    ${DrMinditData.sessions.slice(0, 3).map(s => DrMinditComponents.sessionCardMini(s)).join('')}
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // EXPLORE PAGE
    // ═══════════════════════════════════════════
    explore() {
        const { selectedDuration, selectedCategory, searchQuery } = DrMinditState;
        let sessions = DrMinditData.getFilteredSessions(selectedDuration, selectedCategory)
            .filter(s => s.platforms && s.platforms.includes(DrMinditState.currentPlatform));

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            sessions = sessions.filter(s =>
                s.title.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q)
            );
        }

        return `
            <div class="page-explore page-enter">
                <div class="explore-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="explore-title">Explore Sessions</div>
                    <button onclick="DrMinditState.logout()" 
                            style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px 10px; cursor:pointer;">
                        Logout
                    </button>
                </div>
                    <!-- Search -->
                    <div class="search-bar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input type="text" placeholder="Search meditations, sessions..." 
                               value="${searchQuery}" 
                               oninput="DrMinditState.setFilter('search', this.value)">
                    </div>
                </div>

                <!-- Category Tabs -->

                <!-- Category Tabs -->
                ${DrMinditComponents.categoryTabs(selectedCategory, DrMinditData.platforms[DrMinditState.currentPlatform]?.categories)}

                <!-- Duration Pills -->
                ${DrMinditComponents.durationPills(selectedDuration)}

                <!-- Level Tabs -->
                <div style="padding: 4px 16px;">
                    <div class="level-tabs">
                        <span class="level-tab active">All Levels</span>
                        <span class="level-tab">Beginner</span>
                        <span class="level-tab">Intermediate</span>
                        <span class="level-tab">Advanced</span>
                    </div>
                </div>

                <!-- Results Count -->
                <div style="padding: 8px 16px; color: var(--text-muted); font-size: 13px;">
                    ${sessions.length} session${sessions.length !== 1 ? 's' : ''} found
                </div>

                <!-- Session Grid -->
                <div class="session-grid stagger-children">
                    ${sessions.map(s => DrMinditComponents.sessionCardGrid(s)).join('')}
                </div>

                <div style="height: 24px;"></div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // SESSION DETAIL PAGE
    // ═══════════════════════════════════════════
    detail() {
        const session = DrMinditData.getSessionById(DrMinditState.selectedSessionId);
        if (!session) return '<div style="padding:40px;text-align:center;">Session not found</div>';

        const therapist = DrMinditData.getTherapistById(session.therapist);

        return `
            <div class="page-session-detail page-enter">
                <!-- Hero -->
                <div class="detail-hero">
                    <div class="detail-hero-bg ${session.thumbGradient}">
                        <div class="thumb-inner-icon" style="font-size:120px;">${session.thumbIcon}</div>
                    </div>
                    <div class="detail-hero-overlay"></div>
                    <button class="detail-hero-back" onclick="DrMinditState.goBack()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="detail-content">
                    <!-- Level Tags -->
                    <div class="detail-level-tags">
                        <div class="level-tabs">
                            <span class="level-tab active">${session.duration} min</span>
                            <span class="level-tab">${session.level}</span>
                            <span class="level-tab">${session.category.charAt(0).toUpperCase() + session.category.slice(1)}</span>
                        </div>
                    </div>

                    <h1 class="detail-title">${session.title}</h1>
                    <div class="detail-therapist">
                        with ${therapist ? therapist.name : 'Unknown'} · ${therapist ? therapist.specialty : ''}
                    </div>

                    <p class="detail-description">${session.description}</p>

                    <!-- Meta Info -->
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <span class="detail-meta-label">Duration</span>
                            <span class="detail-meta-value">${session.duration} minutes</span>
                        </div>
                        <div class="detail-meta-item">
                            <span class="detail-meta-label">Pace</span>
                            <span class="detail-meta-value">${session.voiceTone.split('.')[0]}</span>
                        </div>
                        <div class="detail-meta-item">
                            <span class="detail-meta-label">Audio</span>
                            <span class="detail-meta-value">${session.backgroundAudio.split('—')[0].trim().substring(0, 20)}</span>
                        </div>
                    </div>

                    <!-- Scientific Basis -->
                    <div class="detail-section">
                        <div class="detail-section-title">🧠 Psychological Goal</div>
                        <div class="info-card">
                            <div class="info-card-text">${session.psychologicalGoal}</div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">🔬 Neuroscience Basis</div>
                        <div class="info-card">
                            <div class="info-card-text">${session.neuroscienceBasis}</div>
                        </div>
                    </div>

                    <!-- Techniques -->
                    <div class="detail-section">
                        <div class="detail-section-title">Techniques Used</div>
                        <div class="technique-tags">
                            ${session.techniques.map(t => `<span class="technique-tag">${t}</span>`).join('')}
                        </div>
                    </div>

                    <!-- Tags -->
                    <div class="detail-section">
                        <div class="detail-section-title">Best For</div>
                        <div class="technique-tags">
                            ${session.tags.map(t => `<span class="technique-tag">${t}</span>`).join('')}
                        </div>
                    </div>

                    <!-- Voice & Audio Design -->
                    <div class="detail-section">
                        <div class="detail-section-title">🎙️ Voice & Audio Design</div>
                        <div class="info-card">
                            <div class="info-card-text">
                                <strong>Voice:</strong> ${session.voiceTone}<br><br>
                                <strong>Background:</strong> ${session.backgroundAudio}
                            </div>
                        </div>
                    </div>

                    <!-- Privacy Indicator -->
                    <div style="margin-top: 8px;">
                        ${DrMinditComponents.privacyBadge()}
                    </div>

                    <!-- CTA -->
                    <div class="detail-cta">
                        <button class="cta-button" onclick="DrMinditPages.openMoodCheckIn('${session.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Start Session
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // ACTIVE SESSION PAGE (Audio Player)
    // ═══════════════════════════════════════════
    active() {
        const session = DrMinditData.getSessionById(DrMinditState.activeSessionId);
        if (!session) return '';
        return DrMinditComponents.audioPlayer(session);
    },

    // ═══════════════════════════════════════════
    // INSIGHTS PAGE
    // ═══════════════════════════════════════════
    insights() {
        const user = DrMinditData.user;
        const preMoods = user.moodHistory.map(h => h.pre);
        const postMoods = user.moodHistory.map(h => h.post);
        const avgImprovement = (user.moodHistory.reduce((a, b) => a + (b.post - b.pre), 0) / user.moodHistory.length).toFixed(1);

        return `
            <div class="page-insights page-enter">
                <div class="insights-header">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <div style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">GROWTH VIEW</div>
                            <div class="insights-title">Progress Insights</div>
                        </div>
                        ${DrMinditComponents.privacyBadge()}
                    </div>
                </div>

                <!-- Stats Row -->
                <div class="insights-stats stagger-children">
                    ${DrMinditComponents.statCard(user.totalMinutesPracticed.toLocaleString() + ' min', 'Total Practice', 8)}
                    ${DrMinditComponents.statCard(user.currentStreak + ' 🔥', 'Day Streak', 15)}
                    ${DrMinditComponents.statCard(user.totalSessions, 'Sessions', null)}
                    ${DrMinditComponents.statCard('+' + avgImprovement, 'Avg Mood Lift', null)}
                </div>

                <div class="insights-body">

                    <!-- AI Insight Card -->
                    ${DrMinditComponents.aiInsightCard()}

                    <!-- Pre/Post Mood Chart -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Mood Trend (Pre vs Post)</span>
                            <span class="mood-chart-period">Last 7 Sessions</span>
                        </div>
                        ${DrMinditPages._dualMoodChart(preMoods, postMoods)}
                        <div style="display:flex;gap:16px;padding:0 8px 8px;">
                            <div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:10px;border-radius:50%;background:#64748b;"></div><span style="font-size:11px;color:var(--text-muted);">Before Session</span></div>
                            <div style="display:flex;align-items:center;gap:6px;"><div style="width:10px;height:10px;border-radius:50%;background:#14b8a6;"></div><span style="font-size:11px;color:var(--text-muted);">After Session</span></div>
                        </div>
                    </div>

                    <!-- Emotion Tags Summary -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Emotion Patterns</span>
                            <span class="mood-chart-period">This Week</span>
                        </div>
                        <div class="emotion-tag-cloud">
                            ${DrMinditPages._emotionTagCloud(user.moodHistory)}
                        </div>
                    </div>

                    <!-- Burnout Risk -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Burnout Risk Assessment</span>
                            <span class="mood-chart-period">AI Analysis</span>
                        </div>
                        <div style="padding: 16px 0;">
                            ${DrMinditComponents.burnoutMeter(user.burnoutScore)}
                        </div>
                    </div>

                    <!-- AI Resilience Summary -->
                    <div class="resilience-card animate-fade-in-up">
                        <h3>🤖 Weekly Resilience Summary</h3>
                        <p>${DrMinditData.getResilienceSummary()}</p>
                    </div>

                    <!-- Sleep Quality -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Sleep Quality</span>
                            <span class="mood-chart-period">Last 7 Nights</span>
                        </div>
                        ${DrMinditPages._miniBarChart(user.sleepHistory)}
                    </div>

                    <!-- Achievements -->
                    <div class="section-header" style="padding-left:0;padding-right:0;">
                        <span class="section-title">Achievements</span>
                    </div>
                    ${DrMinditComponents.achievementGrid(DrMinditData.achievements)}
                </div>

                <div style="padding: 0 16px;">
                    ${DrMinditComponents.narratorSettings()}
                </div>

                <div style="height: 24px;"></div>
                
                <div style="padding: 0 16px 40px; text-align: center;">
                    <button class="nav-cta" style="width: 100%; height: 50px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444;"
                            onclick="DrMinditState.logout()">
                        Sign Out
                    </button>
                    <div style="margin-top: 16px; font-size: 11px; color: var(--text-muted);">
                        Secure Session · AES-256 Encrypted
                    </div>
                </div>
            </div>
        `;
    },

    // Helper: Mini bar chart
    _miniBarChart(data) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return `
            <div style="display:flex;align-items:flex-end;justify-content:space-between;padding:16px 8px 4px;height:100px;">
                ${data.map((v, i) => {
            const h = (v / 10) * 70;
            const color = v >= 6 ? '#14b8a6' : v >= 4 ? '#f59e0b' : '#ef4444';
            return `
                        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
                            <div style="width:20px;height:${h}px;background:${color};border-radius:4px 4px 0 0;opacity:0.8;transition:height 0.5s;"></div>
                            <span style="font-size:10px;color:#64748b;">${days[i]}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    // Helper: Dual line mood chart (pre vs post)
    _dualMoodChart(pre, post) {
        const width = 320, height = 130, padding = 30, maxVal = 10;
        const chartW = width - padding * 2;
        const chartH = height - padding;
        const stepX = chartW / (pre.length - 1);

        const toPoints = (arr) => arr.map((v, i) => {
            const x = padding + i * stepX;
            const y = padding + chartH - (v / maxVal) * chartH;
            return `${x},${y}`;
        }).join(' ');

        const prePoints = toPoints(pre);
        const postPoints = toPoints(post);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return `
            <svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="overflow:visible;">
                <polyline points="${prePoints}" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3" stroke-linecap="round"/>
                <polyline points="${postPoints}" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                ${post.map((v, i) => {
            const x = padding + i * stepX;
            const y = padding + chartH - (v / maxVal) * chartH;
            return `<circle cx="${x}" cy="${y}" r="4" fill="#14b8a6" stroke="#0a0e17" stroke-width="2"/>`;
        }).join('')}
                ${days.map((d, i) => `<text x="${padding + i * stepX}" y="${height - 2}" text-anchor="middle" fill="#64748b" font-size="10" font-family="Inter">${d}</text>`).join('')}
            </svg>
        `;
    },

    // Helper: Emotion tag cloud
    _emotionTagCloud(history) {
        const counts = {};
        history.forEach(h => h.tags && h.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => `<span class="emotion-cloud-tag" style="font-size:${11 + count * 2}px;opacity:${0.5 + count * 0.1}">${tag} <sup>${count}</sup></span>`)
            .join(' ');
    },

    // ═══════════════════════════════════════════
    // ANALYTICS PAGE (Enterprise Dashboard)
    // ═══════════════════════════════════════════
    analytics() {
        const user = DrMinditData.user;
        const mockData = DrMinditData.analytics;

        // Calculate real stats from user history
        const moodPoints = user.moodHistory.map(m => m.post || m.pre || 5);
        const avgMood = moodPoints.length ? (moodPoints.reduce((a, b) => a + b, 0) / moodPoints.length).toFixed(1) : 0;
        const wellbeingScore = Math.min(100, Math.round(avgMood * 10));

        // Format focus breakdown based on completed sessions
        const categories = {};
        user.completedSessions.forEach(id => {
            const s = DrMinditData.getSessionById(id);
            if (s) categories[s.category] = (categories[s.category] || 0) + 1;
        });
        const focusBreakdown = Object.keys(categories).length ? categories : mockData.focusBreakdown;

        return `
            <div class="page-analytics page-enter">
                <div class="analytics-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="analytics-title-block">
                        <div class="analytics-label">PREMIUM INSIGHT</div>
                        <div class="analytics-title">DrMindit Analytics</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        ${DrMinditComponents.privacyBadge()}
                        <button onclick="DrMinditState.logout()"
                                style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px 10px; cursor:pointer;">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Top Stats -->
                <div class="analytics-stats stagger-children">
                    <div class="analytics-stat-card animate-fade-in-up">
                        <div class="analytics-stat-value">${(user.totalSessions || 0).toLocaleString()}</div>
                        <div class="analytics-stat-label">Total Sessions</div>
                        <div class="analytics-stat-trend trend-up">↑ Active now</div>
                    </div>
                    <div class="analytics-stat-card animate-fade-in-up">
                        <div class="analytics-stat-value">${user.currentStreak || 0}</div>
                        <div class="analytics-stat-label">Day Streak</div>
                        <div class="analytics-stat-trend trend-up">↑ Improving</div>
                    </div>
                </div>

                <div class="analytics-body">
                    <!-- Weekly Mood Chart -->
                    <div class="analytics-chart-card">
                        ${DrMinditComponents.moodChart(moodPoints.slice(-7), 340, 160)}
                    </div>

                    <!-- Focus Breakdown -->
                    <div class="analytics-chart-card">
                        <div class="analytics-chart-title">Focus Breakdown</div>
                        ${DrMinditComponents.donutChart(focusBreakdown, wellbeingScore + '%', 'Wellbeing')}
                    </div>

                    <!-- Workforce Wellbeing -->
                    <div class="resilience-card">
                        <h3>📊 Your Wellbeing Index</h3>
                        <div style="display:flex;align-items:center;gap:16px;margin-top:12px;">
                            <div style="font-size:2rem;font-weight:700;color:var(--accent);">${wellbeingScore}/100</div>
                            <div style="font-size:13px;color:var(--text-secondary);">
                                Calculated from your recent mood check-ins.
                                <span class="trend-up" style="font-size:13px;">${wellbeingScore > 50 ? '↑ Positive' : '↓ Low'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Sessions -->
                    <div class="analytics-chart-card">
                        <div class="analytics-chart-title">Your Recent Practice</div>
                        <div class="recent-sessions-list stagger-children">
                            ${user.completedSessions.slice(-4).reverse().map(id => {
            const s = DrMinditData.getSessionById(id);
            if (!s) return '';
            return `
                                    <div class="session-card-mini animate-fade-in-up" onclick="DrMinditState.navigateTo('detail', { sessionId: '${s.id}' })">
                                        <div class="session-card-mini-thumb ${s.thumbGradient}" style="position:relative;width:48px;height:48px;">
                                            <div class="thumb-inner-icon" style="font-size:20px;">${s.thumbIcon}</div>
                                        </div>
                                        <div class="session-card-mini-info">
                                            <div class="session-card-mini-title">${s.title}</div>
                                            <div class="session-card-mini-sub">${s.duration}m · Completed</div>
                                        </div>
                                        <span class="session-card-duration">✓</span>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>

                    <!-- Enterprise Compliance -->
                    <div class="info-card">
                        <div class="info-card-title">🔒 Privacy & Compliance</div>
                        <div class="info-card-text">
                            Your individual data is private and encrypted. No individual data is accessible to administrators. 
                            DrMindit follows strict HIPAA-aligned security protocols.
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // PROFILE PAGE
    // ═══════════════════════════════════════════
    profile() {
        const user = DrMinditData.user;
        const goalLabels = { stress: 'Stress Relief', confidence: 'Confidence', sleep: 'Better Sleep', focus: 'Peak Focus', healing: 'Emotional Healing' };
        const programProgress = Math.round((user.totalSessions / (user.programType * 1)) * 100);

        return `
            <div class="page-profile page-enter">
                <!-- Header -->
                <div class="profile-hero">
                    <div class="profile-avatar-large">${user.avatar}</div>
                    <div class="profile-hero-name">${user.name}</div>
                    <div class="profile-hero-goal">${goalLabels[user.wellnessGoal] || user.wellnessGoal} · ${user.experienceLevel}</div>
                    <div class="profile-program-badge">${user.programType}-Day Program</div>
                </div>

                <!-- Streak Widget -->
                ${DrMinditComponents.streakDisplay()}

                <!-- Stats Row -->
                <div class="profile-stats-row">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${user.currentStreak} 🔥</div>
                        <div class="profile-stat-label">Current Streak</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${user.totalSessions}</div>
                        <div class="profile-stat-label">Sessions</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${user.totalMinutesPracticed}</div>
                        <div class="profile-stat-label">Minutes</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${user.longestStreak}</div>
                        <div class="profile-stat-label">Best Streak</div>
                    </div>
                </div>

                <!-- Program Progress -->
                <div class="profile-section">
                    <div class="profile-section-title">Program Progress</div>
                    <div class="program-progress-bar-wrap">
                        <div class="program-progress-info">
                            <span>${user.programType}-Day Harmonic Flow</span>
                            <span style="color:var(--accent);">${Math.min(programProgress, 100)}%</span>
                        </div>
                        <div class="program-progress-bar">
                            <div class="program-progress-fill" style="width:${Math.min(programProgress, 100)}%"></div>
                        </div>
                        <div class="program-progress-days">
                            Day ${Math.min(user.totalSessions, user.programType)} of ${user.programType}
                        </div>
                    </div>
                </div>

                <!-- Active Programs -->
                <div class="profile-section">
                    <div class="profile-section-title">DrMindit Premium Program</div>
                    <div class="program-progress-bar-wrap" style="cursor: pointer; position: relative; border: 1px solid rgba(20, 184, 166, 0.3); background: rgba(20, 184, 166, 0.05);" onclick="DrMinditState.navigateTo('resilience')">
                        <div class="program-progress-info">
                            <span style="font-weight: 600; color: var(--text-primary);">21-Day Mental Resilience</span>
                            <span style="color: var(--accent); font-weight: 700;">Day ${DrMinditState.resilienceDay}/21</span>
                        </div>
                        <div class="program-progress-bar">
                            <div class="program-progress-fill" style="width: ${(Object.keys(DrMinditState.resilienceProgress).length / 21) * 100}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${Object.keys(DrMinditState.resilienceProgress).length} days completed</span>
                            <span style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">Continue →</span>
                        </div>
                    </div>
                </div>

                <!-- Settings -->
                <div class="profile-section">
                    <div class="profile-section-title">Settings</div>
                    <div style="margin-bottom:24px;">
                        <div class="form-label" style="margin-bottom:12px;">Notification Preferences</div>
                        ${DrMinditComponents.notificationSettings()}
                    </div>
                    
                    <div class="form-label" style="margin-bottom:12px;">Edit Profile</div>
                    ${DrMinditComponents.profileForm()}
                </div>

                <div style="height:40px;"></div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // RESILIENCE PROGRAM PAGE
    // ═══════════════════════════════════════════
    resilience() {
        return `
            <div class="page-resilience page-enter">
                <div class="resilience-header">
                    <button class="detail-hero-back" onclick="DrMinditState.goBack()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:white; cursor:pointer; margin: 16px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                </div>
                ${DrMinditComponents.resilienceJourney()}
                <div style="height:60px;"></div>
            </div>
        `;
    },

    // ── Modal Helpers ──
    openMoodCheckIn(sessionId) {
        _selectedMoodScale = 5;
        DrMinditState.selectedSessionId = sessionId;
        DrMinditState.showMoodCheckIn = true;
        DrMinditState.showMoodCheckOut = false;
        DrMinditState.notify();
    },

    setSelectedMoodScale(val) {
        _selectedMoodScale = val;
        document.querySelectorAll('.scale-item').forEach((el, i) => {
            el.classList.toggle('active', i + 1 === val);
        });
    },

    submitMoodCheckIn() {
        const tags = [...document.querySelectorAll('#check-in-tags .tag-option.active')].map(el => el.textContent.trim());
        DrMinditState.checkInMood(_selectedMoodScale, tags);
        DrMinditState.startSession(DrMinditState.selectedSessionId);
    },

    submitMoodCheckOut() {
        const tags = [...document.querySelectorAll('#check-out-tags .tag-option.active')].map(el => el.textContent.trim());
        DrMinditState.checkOutMood(_selectedMoodScale, tags);
        DrMinditState.navigateTo('insights');
    },

    handleProfileSave() {
        const name = document.getElementById('prof-name').value;
        const email = document.getElementById('prof-email').value;
        const age = parseInt(document.getElementById('prof-age').value);
        const gender = document.getElementById('prof-gender').value;
        const wellnessGoal = document.getElementById('prof-goal').value;
        const preferredSessionTime = document.getElementById('prof-time').value;
        const expEl = document.querySelector('.level-pill.active');
        const progEl = document.querySelector('.program-pill.active');
        const experienceLevel = expEl ? expEl.dataset.value : DrMinditData.user.experienceLevel;
        const programType = progEl ? parseInt(progEl.dataset.value) : DrMinditData.user.programType;

        DrMinditState.updateProfile({ name, email, age, gender, wellnessGoal, preferredSessionTime, experienceLevel, programType });
        alert('✦ Profile saved!');
    }
};
