/* ============================================================
   ZENITH PAGE RENDERERS
   ============================================================ */

// Shared state for mood modal
let _selectedMoodScale = 5;

const ZenithPages = {

    // ═══════════════════════════════════════════
    // HOME PAGE
    // ═══════════════════════════════════════════
    home() {
        const user = ZenithData.user;
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';

        const featured = ZenithData.getFeaturedSession();
        const recommended = ZenithData.getRecommendations();

        return `
            <div class="page-home page-enter">
                <!-- Header -->
                <div class="home-header">
                    <div>
                        <div class="home-greeting">${greeting}</div>
                        <div class="home-name">Welcome, ${user.name}</div>
                        <div class="home-subtitle">How's your mood?</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        <div class="home-avatar">${user.avatar}</div>
                        <button onclick="ZenithState.logout()" 
                                style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:2px 8px; cursor:pointer;">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Mood Check-in -->
                <div class="mood-section">
                    ${ZenithComponents.moodSelector()}
                </div>

                <!-- Streak Widget -->
                ${ZenithComponents.streakDisplay()}

                <!-- Privacy Badge -->
                <div style="padding: 0 16px 16px;">
                    ${ZenithComponents.privacyBadge()}
                </div>

                <!-- Resilience Program Card -->
                <div class="resilience-hero-card" onclick="ZenithState.navigateTo('resilience')" style="margin: 0 16px 24px; padding: 24px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 16px; color: white; cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);">
                    <div style="position: absolute; right: -20px; top: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: relative; z-index: 2;">
                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.8); margin-bottom: 8px; text-transform: uppercase;">Premium Program</div>
                        <h2 style="font-size: 1.5rem; font-family: 'Playfair Display', serif; font-weight: 700; margin-bottom: 8px;">21-Day Resilience Journey</h2>
                        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.9); line-height: 1.4; max-width: 80%; margin-bottom: 16px;">
                            Master your nervous system with our neuroscience-backed path for high-stakes professionals.
                        </p>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600;">
                            <span>Day ${ZenithState.resilienceDay} of 21</span>
                            <div style="height: 4px; width: 60px; background: rgba(255,255,255,0.2); border-radius: 2px;">
                                <div style="height: 100%; width: ${(Object.keys(ZenithState.resilienceProgress).length / 21) * 100}%; background: white; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Featured Session -->
                ${featured ? ZenithComponents.featuredCard(featured) : ''}

                <!-- Quick Duration Access -->
                <div class="quick-durations" style="margin-top: 16px;">
                    <div class="quick-durations-label">Quick Access by Duration</div>
                    <div class="quick-durations-row">
                        ${ZenithData.durations.map(d => `
                            <button class="quick-duration-chip" 
                                    onclick="ZenithState.navigateTo('explore', { duration: ${d} })">${d} min</button>
                        `).join('')}
                    </div>
                </div>

                <!-- Recommended Sessions -->
                <div class="section-header">
                    <span class="section-title">Recommended for You</span>
                    <span class="section-see-all" onclick="ZenithState.navigateTo('explore')">See All</span>
                </div>
                <div class="scroll-row stagger-children">
                    ${recommended.map(s => ZenithComponents.sessionCard(s)).join('')}
                </div>

                <!-- Recent Sessions -->
                <div class="section-header">
                    <span class="section-title">Continue Your Journey</span>
                </div>
                <div style="padding: 0 16px 24px; display:flex; flex-direction:column; gap:8px;" class="stagger-children">
                    ${ZenithData.sessions.slice(0, 3).map(s => ZenithComponents.sessionCardMini(s)).join('')}
                </div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // EXPLORE PAGE
    // ═══════════════════════════════════════════
    explore() {
        const { selectedDuration, selectedCategory, searchQuery } = ZenithState;
        let sessions = ZenithData.getFilteredSessions(selectedDuration, selectedCategory);

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
                    <button onclick="ZenithState.logout()" 
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
                               oninput="ZenithState.setFilter('search', this.value)">
                    </div>
                </div>

                <!-- Personal Session Upload -->
                <div style="padding: 0 16px 16px;">
                    <div class="info-card animate-fade-in-up" 
                         style="margin-bottom: 24px; cursor: pointer; border: 2px dashed rgba(20, 184, 166, 0.3); background: rgba(20, 184, 166, 0.05); padding: 24px;"
                         onclick="document.getElementById('audio-upload').click()">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div class="pillar-icon" style="margin-bottom: 0; width: 44px; height: 44px; background: rgba(20, 184, 166, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                    ${ZenithState.customAudioFile ? 'MP3 Loaded: Custom Session' : 'Upload MP3 Narration'}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                    Add real-time binaural beats to your own audio.
                                </div>
                            </div>
                            ${ZenithState.customAudioFile ? `
                                <button class="cta-button" style="padding: 8px 20px; font-size: 0.9rem;"
                                        onclick="event.stopPropagation(); ZenithState.startSession('CUSTOM')">
                                    Play
                                </button>
                            ` : ''}
                        </div>
                        <input type="file" id="audio-upload" hidden accept="audio/*" 
                               onchange="ZenithState.setCustomAudio(this.files[0])">
                    </div>
                </div>

                <!-- Category Tabs -->
                ${ZenithComponents.categoryTabs(selectedCategory)}

                <!-- Duration Pills -->
                ${ZenithComponents.durationPills(selectedDuration)}

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
                    ${sessions.map(s => ZenithComponents.sessionCardGrid(s)).join('')}
                </div>

                <div style="height: 24px;"></div>
            </div>
        `;
    },

    // ═══════════════════════════════════════════
    // SESSION DETAIL PAGE
    // ═══════════════════════════════════════════
    detail() {
        const session = ZenithData.getSessionById(ZenithState.selectedSessionId);
        if (!session) return '<div style="padding:40px;text-align:center;">Session not found</div>';

        const therapist = ZenithData.getTherapistById(session.therapist);

        return `
            <div class="page-session-detail page-enter">
                <!-- Hero -->
                <div class="detail-hero">
                    <div class="detail-hero-bg ${session.thumbGradient}">
                        <div class="thumb-inner-icon" style="font-size:120px;">${session.thumbIcon}</div>
                    </div>
                    <div class="detail-hero-overlay"></div>
                    <button class="detail-hero-back" onclick="ZenithState.goBack()">
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
                        ${ZenithComponents.privacyBadge()}
                    </div>

                    <!-- CTA -->
                    <div class="detail-cta">
                        <button class="cta-button" onclick="ZenithPages.openMoodCheckIn('${session.id}')">
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
        const session = ZenithData.getSessionById(ZenithState.activeSessionId);
        if (!session) return '';
        return ZenithComponents.audioPlayer(session);
    },

    // ═══════════════════════════════════════════
    // INSIGHTS PAGE
    // ═══════════════════════════════════════════
    insights() {
        const user = ZenithData.user;
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
                        ${ZenithComponents.privacyBadge()}
                    </div>
                </div>

                <!-- Stats Row -->
                <div class="insights-stats stagger-children">
                    ${ZenithComponents.statCard(user.totalMinutesPracticed.toLocaleString() + ' min', 'Total Practice', 8)}
                    ${ZenithComponents.statCard(user.currentStreak + ' 🔥', 'Day Streak', 15)}
                    ${ZenithComponents.statCard(user.totalSessions, 'Sessions', null)}
                    ${ZenithComponents.statCard('+' + avgImprovement, 'Avg Mood Lift', null)}
                </div>

                <div class="insights-body">

                    <!-- AI Insight Card -->
                    ${ZenithComponents.aiInsightCard()}

                    <!-- Pre/Post Mood Chart -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Mood Trend (Pre vs Post)</span>
                            <span class="mood-chart-period">Last 7 Sessions</span>
                        </div>
                        ${ZenithPages._dualMoodChart(preMoods, postMoods)}
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
                            ${ZenithPages._emotionTagCloud(user.moodHistory)}
                        </div>
                    </div>

                    <!-- Burnout Risk -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Burnout Risk Assessment</span>
                            <span class="mood-chart-period">AI Analysis</span>
                        </div>
                        <div style="padding: 16px 0;">
                            ${ZenithComponents.burnoutMeter(user.burnoutScore)}
                        </div>
                    </div>

                    <!-- AI Resilience Summary -->
                    <div class="resilience-card animate-fade-in-up">
                        <h3>🤖 Weekly Resilience Summary</h3>
                        <p>${ZenithData.getResilienceSummary()}</p>
                    </div>

                    <!-- Sleep Quality -->
                    <div class="mood-chart-container">
                        <div class="mood-chart-header">
                            <span class="mood-chart-title">Sleep Quality</span>
                            <span class="mood-chart-period">Last 7 Nights</span>
                        </div>
                        ${ZenithPages._miniBarChart(user.sleepHistory)}
                    </div>

                    <!-- Achievements -->
                    <div class="section-header" style="padding-left:0;padding-right:0;">
                        <span class="section-title">Achievements</span>
                    </div>
                    ${ZenithComponents.achievementGrid(ZenithData.achievements)}
                </div>

                <div style="padding: 0 16px;">
                    ${ZenithComponents.narratorSettings()}
                </div>

                <div style="height: 24px;"></div>
                
                <div style="padding: 0 16px 40px; text-align: center;">
                    <button class="nav-cta" style="width: 100%; height: 50px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444;"
                            onclick="ZenithState.logout()">
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
        const data = ZenithData.analytics;

        return `
            <div class="page-analytics page-enter">
                <div class="analytics-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="analytics-title-block">
                        <div class="analytics-label">PREMIUM INSIGHT</div>
                        <div class="analytics-title">Zenith Analytics</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                        ${ZenithComponents.privacyBadge()}
                        <button onclick="ZenithState.logout()" 
                                style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:4px 10px; cursor:pointer;">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Top Stats -->
                <div class="analytics-stats stagger-children">
                    <div class="analytics-stat-card animate-fade-in-up">
                        <div class="analytics-stat-value">${data.totalOrgSessions.toLocaleString()}</div>
                        <div class="analytics-stat-label">Total Sessions</div>
                        <div class="analytics-stat-trend trend-up">↑ ${data.weeklyGrowth}% this week</div>
                    </div>
                    <div class="analytics-stat-card animate-fade-in-up">
                        <div class="analytics-stat-value">${data.dailyActive}</div>
                        <div class="analytics-stat-label">Daily Active</div>
                        <div class="analytics-stat-trend trend-up">↑ 5% vs last week</div>
                    </div>
                </div>

                <div class="analytics-body">
                    <!-- Focus Breakdown -->
                    <div class="analytics-chart-card">
                        <div class="analytics-chart-title">Focus Breakdown</div>
                        ${ZenithComponents.donutChart(data.focusBreakdown, data.wellbeingScore + '%', 'Wellbeing')}
                    </div>

                    <!-- Workforce Wellbeing -->
                    <div class="resilience-card">
                        <h3>📊 Workforce Wellbeing Index</h3>
                        <div style="display:flex;align-items:center;gap:16px;margin-top:12px;">
                            <div style="font-size:2rem;font-weight:700;color:var(--accent);">${data.wellbeingScore}/100</div>
                            <div style="font-size:13px;color:var(--text-secondary);">
                                Anonymous aggregated score across all users. 
                                <span class="trend-up" style="font-size:13px;">↑ Improving</span>
                            </div>
                        </div>
                        <div style="margin-top:12px;font-size:13px;color:var(--text-muted);">
                            <strong>ROI Indicators:</strong> 15% reduction in sick leave · 22% lower burnout reports · 18% improved focus scores (self-reported)
                        </div>
                    </div>

                    <!-- Recent Org Sessions -->
                    <div class="analytics-chart-card">
                        <div class="analytics-chart-title">Recent Sessions</div>
                        <div class="recent-sessions-list stagger-children">
                            ${data.recentOrgSessions.map(s => `
                                <div class="session-card-mini animate-fade-in-up" style="cursor:default;">
                                    <div class="session-card-mini-thumb thumb-gradient-${Math.floor(Math.random() * 7) + 1}" style="position:relative;width:48px;height:48px;">
                                    </div>
                                    <div class="session-card-mini-info">
                                        <div class="session-card-mini-title">${s.title}</div>
                                        <div class="session-card-mini-sub">${s.time} · ${s.participants} participants</div>
                                    </div>
                                    <span class="session-card-duration">${s.duration}m</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Enterprise Compliance -->
                    <div class="info-card">
                        <div class="info-card-title">🔒 Enterprise Compliance</div>
                        <div class="info-card-text">
                            All data shown is anonymized and aggregated. No individual employee data is accessible to administrators. 
                            HIPAA-aligned encryption standards. Zero-knowledge architecture ensures complete user privacy.
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
        const user = ZenithData.user;
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
                ${ZenithComponents.streakDisplay()}

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
                    <div class="profile-section-title">Zenith Premium Program</div>
                    <div class="program-progress-bar-wrap" style="cursor: pointer; position: relative; border: 1px solid rgba(20, 184, 166, 0.3); background: rgba(20, 184, 166, 0.05);" onclick="ZenithState.navigateTo('resilience')">
                        <div class="program-progress-info">
                            <span style="font-weight: 600; color: var(--text-primary);">21-Day Mental Resilience</span>
                            <span style="color: var(--accent); font-weight: 700;">Day ${ZenithState.resilienceDay}/21</span>
                        </div>
                        <div class="program-progress-bar">
                            <div class="program-progress-fill" style="width: ${(Object.keys(ZenithState.resilienceProgress).length / 21) * 100}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${Object.keys(ZenithState.resilienceProgress).length} days completed</span>
                            <span style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">Continue →</span>
                        </div>
                    </div>
                </div>

                <!-- Settings -->
                <div class="profile-section">
                    <div class="profile-section-title">Settings</div>
                    <div style="margin-bottom:24px;">
                        <div class="form-label" style="margin-bottom:12px;">Notification Preferences</div>
                        ${ZenithComponents.notificationSettings()}
                    </div>
                    
                    <div class="form-label" style="margin-bottom:12px;">Edit Profile</div>
                    ${ZenithComponents.profileForm()}
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
                    <button class="detail-hero-back" onclick="ZenithState.goBack()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:white; cursor:pointer; margin: 16px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                </div>
                ${ZenithComponents.resilienceJourney()}
                <div style="height:60px;"></div>
            </div>
        `;
    },

    // ── Modal Helpers ──
    openMoodCheckIn(sessionId) {
        _selectedMoodScale = 5;
        ZenithState.selectedSessionId = sessionId;
        ZenithState.showMoodCheckIn = true;
        ZenithState.showMoodCheckOut = false;
        ZenithState.notify();
    },

    setSelectedMoodScale(val) {
        _selectedMoodScale = val;
        document.querySelectorAll('.scale-item').forEach((el, i) => {
            el.classList.toggle('active', i + 1 === val);
        });
    },

    submitMoodCheckIn() {
        const tags = [...document.querySelectorAll('#check-in-tags .tag-option.active')].map(el => el.textContent.trim());
        ZenithState.checkInMood(_selectedMoodScale, tags);
        ZenithState.startSession(ZenithState.selectedSessionId);
    },

    submitMoodCheckOut() {
        const tags = [...document.querySelectorAll('#check-out-tags .tag-option.active')].map(el => el.textContent.trim());
        ZenithState.checkOutMood(_selectedMoodScale, tags);
        ZenithState.navigateTo('insights');
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
        const experienceLevel = expEl ? expEl.dataset.value : ZenithData.user.experienceLevel;
        const programType = progEl ? parseInt(progEl.dataset.value) : ZenithData.user.programType;

        ZenithState.updateProfile({ name, email, age, gender, wellnessGoal, preferredSessionTime, experienceLevel, programType });
        alert('✦ Profile saved!');
    }
};
