/* ============================================================
   ZENITH REUSABLE COMPONENTS
   ============================================================ */

const ZenithComponents = {

    // ── Mood Selector ──
    moodSelector() {
        const moods = [
            { value: 5, emoji: '😊', label: 'Great' },
            { value: 4, emoji: '🙂', label: 'Good' },
            { value: 3, emoji: '😐', label: 'Okay' },
            { value: 2, emoji: '😟', label: 'Low' },
            { value: 1, emoji: '😰', label: 'Stressed' }
        ];

        return `
            <div class="mood-selector">
                ${moods.map(m => `
                    <div class="mood-option ${ZenithState.selectedMood === m.value ? 'active' : ''}"
                         onclick="ZenithState.setMood(${m.value})">
                        <div class="mood-emoji">${m.emoji}</div>
                        <span class="mood-label">${m.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ── Session Card (Vertical) ──
    sessionCard(session, size = 'normal') {
        const therapist = ZenithData.getTherapistById(session.therapist);
        const width = size === 'large' ? '280px' : '260px';

        return `
            <div class="session-card animate-fade-in-up" 
                 style="width: ${width}"
                 onclick="ZenithState.navigateTo('detail', { sessionId: '${session.id}' })">
                <div class="session-card-image ${session.thumbGradient}">
                    <div class="thumb-inner-icon">${session.thumbIcon}</div>
                    <div class="session-card-gradient"></div>
                </div>
                <div class="session-card-content">
                    <div class="session-card-title">${session.title}</div>
                    <div class="session-card-meta">
                        <span class="session-card-duration">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${session.duration} min
                        </span>
                        <span class="session-card-therapist">${therapist ? therapist.name : ''}</span>
                    </div>
                    <div class="session-card-play">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    },

    // ── Session Card (Grid variant - square) ──
    sessionCardGrid(session) {
        const therapist = ZenithData.getTherapistById(session.therapist);

        return `
            <div class="session-card animate-fade-in-up"
                 onclick="ZenithState.navigateTo('detail', { sessionId: '${session.id}' })">
                <div class="session-card-image ${session.thumbGradient}">
                    <div class="thumb-inner-icon">${session.thumbIcon}</div>
                    <div class="session-card-gradient"></div>
                </div>
                <div class="session-card-content">
                    <div class="session-card-title" style="font-size: 0.9rem;">${session.title}</div>
                    <div class="session-card-meta">
                        <span class="session-card-duration">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${session.duration}m
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    // ── Mini Session Card (horizontal) ──
    sessionCardMini(session) {
        const therapist = ZenithData.getTherapistById(session.therapist);

        return `
            <div class="session-card-mini animate-fade-in-up"
                 onclick="ZenithState.navigateTo('detail', { sessionId: '${session.id}' })">
                <div class="session-card-mini-thumb ${session.thumbGradient}" style="position:relative;">
                    <div class="thumb-inner-icon" style="font-size:24px;">${session.thumbIcon}</div>
                </div>
                <div class="session-card-mini-info">
                    <div class="session-card-mini-title">${session.title}</div>
                    <div class="session-card-mini-sub">${session.duration} min · ${therapist ? therapist.name : ''}</div>
                </div>
                <span class="session-card-duration">${session.duration}m</span>
            </div>
        `;
    },

    // ── Featured Card ──
    featuredCard(session) {
        return `
            <div class="featured-card animate-fade-in-up"
                 onclick="ZenithState.navigateTo('detail', { sessionId: '${session.id}' })">
                <div class="featured-card-bg ${session.thumbGradient}">
                    <div class="thumb-inner-icon" style="font-size:100px;">${session.thumbIcon}</div>
                </div>
                <div class="featured-card-overlay"></div>
                <div class="featured-card-content">
                    <div class="featured-card-label">Featured Practice</div>
                    <div class="featured-card-title">${session.title}</div>
                    <button class="featured-card-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start Practice
                    </button>
                </div>
            </div>
        `;
    },

    // ── Duration Filter Pills ──
    durationPills(selected) {
        return `
            <div class="duration-pills">
                <button class="duration-pill ${selected === null ? 'active' : ''}"
                        onclick="ZenithState.setFilter('duration', null)">All</button>
                ${ZenithData.durations.map(d => `
                    <button class="duration-pill ${selected === d ? 'active' : ''}"
                            onclick="ZenithState.setFilter('duration', ${d})">${d} min</button>
                `).join('')}
            </div>
        `;
    },

    // ── Category Tabs ──
    categoryTabs(selected) {
        return `
            <div class="category-tabs">
                ${ZenithData.categories.map(c => `
                    <button class="category-tab ${selected === c.id ? 'active' : ''}"
                            onclick="ZenithState.setFilter('category', '${c.id}')">${c.icon} ${c.label}</button>
                `).join('')}
            </div>
        `;
    },

    // ── Privacy Badge ──
    privacyBadge() {
        return `
            <div class="privacy-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                E2E Encrypted · No employer access
            </div>
        `;
    },

    // ── Mood Chart (SVG) ──
    moodChart(data, width = 320, height = 120) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const maxVal = 5;
        const padding = 30;
        const chartW = width - padding * 2;
        const chartH = height - padding;
        const stepX = chartW / (data.length - 1);

        const points = data.map((val, i) => {
            const x = padding + i * stepX;
            const y = padding + chartH - (val / maxVal) * chartH;
            return `${x},${y}`;
        }).join(' ');

        const areaPoints = `${padding},${padding + chartH} ${points} ${padding + chartW},${padding + chartH}`;

        return `
            <div class="mood-chart-container">
                <div class="mood-chart-header">
                    <span class="mood-chart-title">Weekly Mood</span>
                    <span class="mood-chart-period">Last 7 Days</span>
                </div>
                <svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="rgba(20,184,166,0.3)"/>
                            <stop offset="100%" stop-color="rgba(20,184,166,0)"/>
                        </linearGradient>
                    </defs>
                    <!-- Grid lines -->
                    ${[0, 1, 2, 3, 4].map(i => {
            const y = padding + chartH - (i + 1) / maxVal * chartH;
            return `<line x1="${padding}" y1="${y}" x2="${padding + chartW}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
        }).join('')}
                    <!-- Area fill -->
                    <polygon points="${areaPoints}" fill="url(#moodGrad)" opacity="0.8"/>
                    <!-- Line -->
                    <polyline points="${points}" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Data points -->
                    ${data.map((val, i) => {
            const x = padding + i * stepX;
            const y = padding + chartH - (val / maxVal) * chartH;
            return `
                            <circle cx="${x}" cy="${y}" r="4" fill="#14b8a6" stroke="#0a0e17" stroke-width="2"/>
                        `;
        }).join('')}
                    <!-- Day labels -->
                    ${days.map((day, i) => {
            const x = padding + i * stepX;
            return `<text x="${x}" y="${height - 2}" text-anchor="middle" fill="#64748b" font-size="10" font-family="Inter">${day}</text>`;
        }).join('')}
                </svg>
            </div>
        `;
    },

    // ── Burnout Meter ──
    burnoutMeter(score) {
        const radius = 56;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        let color = '#22c55e';
        if (score > 30) color = '#f59e0b';
        if (score > 60) color = '#ef4444';

        return `
            <div class="burnout-meter">
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle class="burnout-meter-bg" cx="70" cy="70" r="${radius}"/>
                    <circle class="burnout-meter-fill" cx="70" cy="70" r="${radius}"
                            stroke="${color}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            transform="rotate(-90 70 70)"/>
                </svg>
                <div class="burnout-meter-value">
                    <div class="burnout-meter-percent" style="color: ${color}">${score}%</div>
                    <div class="burnout-meter-label">Burnout Risk</div>
                </div>
            </div>
        `;
    },

    // ── Donut Chart ──
    donutChart(data, centerValue, centerLabel) {
        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        const colors = ['#14b8a6', '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
        const entries = Object.entries(data);
        const total = entries.reduce((sum, [, v]) => sum + v, 0);
        let accumulated = 0;

        const segments = entries.map(([label, value], i) => {
            const pct = value / total;
            const dashLength = pct * circumference;
            const gap = circumference - dashLength;
            const rotation = (accumulated / total) * 360 - 90;
            accumulated += value;

            return `<circle cx="80" cy="80" r="${radius}" fill="none" 
                        stroke="${colors[i % colors.length]}" stroke-width="20"
                        stroke-dasharray="${dashLength} ${gap}"
                        transform="rotate(${rotation} 80 80)"
                        opacity="0.85"/>`;
        });

        const legend = entries.map(([label, value], i) => `
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                <div style="width:10px;height:10px;border-radius:50%;background:${colors[i % colors.length]};flex-shrink:0;"></div>
                <span style="font-size:12px;color:#94a3b8;">${label}</span>
                <span style="font-size:12px;color:#64748b;margin-left:auto;">${value}%</span>
            </div>
        `).join('');

        return `
            <div style="display:flex;align-items:center;gap:24px;">
                <div class="donut-chart" style="width:160px;height:160px;">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        ${segments.join('')}
                    </svg>
                    <div class="donut-chart-center">
                        <div class="donut-chart-value">${centerValue}</div>
                        <div class="donut-chart-label">${centerLabel}</div>
                    </div>
                </div>
                <div style="flex:1;">${legend}</div>
            </div>
        `;
    },

    // ── Audio Player ──
    audioPlayer(session) {
        const totalSeconds = session.duration * 60;
        const elapsed = ZenithState.playerElapsed;
        const progress = elapsed / totalSeconds;
        const therapist = ZenithData.getTherapistById(session.therapist);

        const radius = 110;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - progress * circumference;

        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        };

        // Generate waveform bars - dynamic based on playing state
        const bars = Array.from({ length: 40 }, (_, i) => {
            const delay = (i * 0.05).toFixed(2);
            const active = ZenithState.playerPlaying ? 'playing' : '';
            return `<div class="waveform-bar ${active}" style="animation-delay:${delay}s;"></div>`;
        }).join('');

        return `
            <div class="audio-player-container page-enter">
                <!-- Background Ambient Gradient -->
                <div class="player-bg-gradient ${session.thumbGradient || 'grad-stress'}"></div>
                
                <div class="player-visualizer">
                    <!-- Layered breathing circles -->
                    <div class="breathing-glow"></div>
                    <div class="breathing-circle ${ZenithState.playerPlaying ? 'pulse' : ''}"></div>
                    <div class="breathing-inner"></div>
                </div>

                <button class="player-close" onclick="ZenithState.stopSession()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>

                <div class="player-content">
                    <div class="player-session-label animate-fade-in">${session.category.toUpperCase()} SESSION · ${session.duration} MIN</div>
                    <div class="player-session-title animate-fade-in">${session.title}</div>
                    
                    <div class="progress-ring-container">
                        <svg class="progress-ring" viewBox="0 0 240 240">
                            <circle class="progress-ring-bg" cx="120" cy="120" r="${radius}"/>
                            <circle class="progress-ring-fill" cx="120" cy="120" r="${radius}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${offset}"/>
                        </svg>
                        <div class="progress-ring-time">
                            <div class="time-current">${formatTime(elapsed)}</div>
                            <div class="time-divider">/</div>
                            <div class="time-total">${session.duration}:00</div>
                        </div>
                    </div>

                    <div class="player-caption-container">
                        <p class="player-caption">${ZenithAudioEngine.getCaption() || 'Centering your focus...'}</p>
                    </div>

                    <div class="player-waveform-container">
                        <div class="waveform">${bars}</div>
                    </div>

                    <!-- Progress Bar (Scrubbable) -->
                    <div class="player-scrubber">
                        <input type="range" class="scrubber-range" min="0" max="${totalSeconds}" value="${elapsed}" 
                               oninput="ZenithState.seekTo(this.value)">
                        <div class="scrubber-labels">
                            <span>${formatTime(elapsed)}</span>
                            <span>${session.duration}:00</span>
                        </div>
                    </div>

                    <div class="player-controls">
                        <button class="player-btn" onclick="ZenithState.skipBackward()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                            </svg>
                        </button>
                        
                        <button class="player-btn player-btn-main ${ZenithState.playerPlaying ? 'playing' : ''}" 
                                onclick="ZenithState.togglePlayer()">
                            <div class="play-icon-wrapper">
                                ${ZenithState.playerPlaying
                ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            }
                            </div>
                        </button>

                        <button class="player-btn" onclick="ZenithState.skipForward()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="player-bottom-info">
                    <div class="now-playing-info">
                        <span class="pulse-dot"></span>
                        Premium AI Narration · ${therapist ? therapist.name : 'Marcus'}
                    </div>
                </div>
            </div>
        `;
    },

    // ── Calm Now Overlay ──
    calmNowOverlay() {
        const timer = ZenithState.calmNowTimer || 0;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Breathing phase (6 sec cycle: 4 in, 2 out)
        const phase = timer % 6;
        let instruction = 'Breathe in...';
        if (phase < 2) instruction = 'Breathe out...';
        else if (phase < 4) instruction = 'Breathe in...';
        else instruction = 'Hold...';

        return `
            <div class="calm-now-overlay page-enter">
                <button class="calm-close" onclick="ZenithState.closeCalmNow()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div class="calm-title">Calm Now</div>
                <div class="calm-subtitle">5-minute emergency breathing reset</div>
                <div class="breathing-main-circle">
                    <div class="breathing-text">●</div>
                </div>
                <div class="calm-timer">${timeStr}</div>
                <div class="calm-instruction">${instruction}</div>
            </div>
        `;
    },

    // ── Stat Card ──
    statCard(value, label, trend = null) {
        const trendHtml = trend
            ? `<div class="${trend > 0 ? 'trend-up' : 'trend-down'}">
                    ${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%
               </div>`
            : '';
        return `
            <div class="stat-card animate-fade-in-up">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
                ${trendHtml}
            </div>
        `;
    },

    // ── Achievement Grid ──
    achievementGrid(achievements) {
        return `
            <div class="achievement-grid stagger-children">
                ${achievements.map(a => `
                    <div class="achievement-badge ${a.unlocked ? '' : 'locked'} animate-fade-in-up">
                        <div class="achievement-icon">${a.icon}</div>
                        <div class="achievement-name">${a.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    narratorSettings() {
        const voices = ZenithAudioEngine.getVoices();
        const selected = ZenithAudioEngine.selectedVoice ? ZenithAudioEngine.selectedVoice.name : '';

        const options = voices.map(v => `
            <option value="${v.name}" ${v.name === selected ? 'selected' : ''}>
                ${v.name} (${v.lang})
            </option>
        `).join('');

        return `
            <div class="info-card" style="margin-top: 24px; padding: 24px;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    🎙️ AI Narrator Settings
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px;">
                    Select the professional AI voice that best fits your focus practice.
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <select class="custom-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); border-radius: 8px;"
                            onchange="ZenithAudioEngine.setVoice(this.value)">
                        ${options || '<option disabled>Loading AI voices...</option>'}
                    </select>
                    
                    <button class="cta-button" style="width: 100%; background: rgba(20, 184, 166, 0.1); color: var(--accent); border: 1px solid var(--accent);"
                            onclick="ZenithAudioEngine.testVoice()">
                        Test Voice
                    </button>
                    
                    <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">
                        Standard system voices are used for zero-latency, private narration.
                    </div>
                </div>
            </div>
        `;
    },

    // ── Profile Form ──
    profileForm() {
        const user = ZenithData.user;
        return `
            <div class="profile-form page-enter">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="prof-name" value="${user.name}">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="prof-email" value="${user.email}">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" id="prof-age" value="${user.age}">
                    </div>
                    <div class="form-group">
                        <label>Gender (Optional)</label>
                        <input type="text" id="prof-gender" value="${user.gender}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Wellness Goal</label>
                    <select id="prof-goal">
                        <option value="stress" ${user.wellnessGoal === 'stress' ? 'selected' : ''}>Stress Relief</option>
                        <option value="confidence" ${user.wellnessGoal === 'confidence' ? 'selected' : ''}>Building Confidence</option>
                        <option value="sleep" ${user.wellnessGoal === 'sleep' ? 'selected' : ''}>Better Sleep</option>
                        <option value="focus" ${user.wellnessGoal === 'focus' ? 'selected' : ''}>Peak Focus</option>
                        <option value="healing" ${user.wellnessGoal === 'healing' ? 'selected' : ''}>Emotional Healing</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Experience Level</label>
                    <div class="level-pills">
                        ${['Beginner', 'Intermediate', 'Advanced'].map(l => `
                            <button class="level-pill ${user.experienceLevel === l ? 'active' : ''}" 
                                    onclick="this.parentElement.querySelectorAll('.level-pill').forEach(p => p.classList.remove('active')); this.classList.add('active');" 
                                    data-value="${l}">${l}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>Program Type</label>
                    <div class="program-pills">
                        ${[7, 21, 30].map(p => `
                            <button class="program-pill ${user.programType === p ? 'active' : ''}" 
                                    onclick="this.parentElement.querySelectorAll('.program-pill').forEach(b => b.classList.remove('active')); this.classList.add('active');" 
                                    data-value="${p}">${p} Days</button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>Preferred Session Time</label>
                    <input type="time" id="prof-time" value="${user.preferredSessionTime}">
                </div>
                <button class="cta-button" style="margin-top:20px; width:100%;" onclick="ZenithPages.handleProfileSave()">Save Changes</button>
            </div>
        `;
    },

    // ── Mood Modals ──
    moodCheckInModal() {
        return `
            <div class="modal-overlay page-enter">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Check-in: Pre-Session</div>
                        <div class="modal-subtitle">How are you arriving to your practice?</div>
                    </div>
                    <div class="modal-body">
                        <div class="form-label" style="margin-bottom:12px;">Rate your current mood (1-10)</div>
                        <div class="mood-scale">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                                <div class="scale-item" onclick="ZenithPages.setSelectedMoodScale(${i})">${i}</div>
                            `).join('')}
                        </div>
                        <div class="form-label" style="margin-top:24px; margin-bottom:12px;">Add emotion tags</div>
                        <div class="tag-selector" id="check-in-tags">
                            ${['calm', 'anxious', 'motivated', 'tired', 'grateful', 'focused', 'ready', 'neutral'].map(t => `
                                <div class="tag-option" onclick="this.classList.toggle('active')">${t}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="cta-button" style="width:100%;" onclick="ZenithPages.submitMoodCheckIn()">Start Session</button>
                    </div>
                </div>
            </div>
        `;
    },

    moodCheckOutModal() {
        return `
            <div class="modal-overlay page-enter">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Check-out: Post-Session</div>
                        <div class="modal-subtitle">How do you feel after your practice?</div>
                    </div>
                    <div class="modal-body">
                        <div class="form-label" style="margin-bottom:12px;">Rate your current mood (1-10)</div>
                        <div class="mood-scale">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                                <div class="scale-item" onclick="ZenithPages.setSelectedMoodScale(${i})">${i}</div>
                            `).join('')}
                        </div>
                        <div class="form-label" style="margin-top:24px; margin-bottom:12px;">Add final emotion tags</div>
                        <div class="tag-selector" id="check-out-tags">
                            ${['relaxed', 'centered', 'vibrant', 'sleepy', 'balanced', 'clear', 'happy', 'expansive'].map(t => `
                                <div class="tag-option" onclick="this.classList.toggle('active')">${t}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="cta-button" style="width:100%;" onclick="ZenithPages.submitMoodCheckOut()">Complete Flow</button>
                    </div>
                </div>
            </div>
        `;
    },

    aiInsightCard() {
        const insight = ZenithState.getMoodInsights();
        const isAlert = insight.includes('Alert');
        return `
            <div class="ai-insight-card animate-fade-in-up ${isAlert ? 'alert' : ''}">
                <div class="ai-insight-icon">${isAlert ? '⚠️' : '🧠'}</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-label">Zenith AI Observer</div>
                    <div class="ai-insight-text">${insight}</div>
                </div>
            </div>
        `;
    },

    resilienceJourney() {
        const currentDay = ZenithState.resilienceDay;
        const progress = ZenithState.resilienceProgress;
        const sessions = ResilienceProgramData;

        const weeks = [
            { title: 'Week 1: Nervous System Reset', range: [1, 7], theme: 'basement' },
            { title: 'Week 2: Emotional Regulation', range: [8, 14], theme: 'building' },
            { title: 'Week 3: Peak Performance', range: [15, 21], theme: 'peak' }
        ];

        return `
            <div class="resilience-journey page-enter">
                <div class="journey-header">
                    <div class="journey-badge">21-DAY PREMIUM PROGRAM</div>
                    <h1 class="journey-title">Mental Resilience for High-Stakes Professionals</h1>
                    <div class="journey-progress-summary">
                        <span>Overall Progress</span>
                        <span>${Math.round((Object.keys(progress).length / 21) * 100)}%</span>
                    </div>
                    <div class="program-progress-bar">
                        <div class="program-progress-fill" style="width: ${(Object.keys(progress).length / 21) * 100}%"></div>
                    </div>
                </div>

                <div class="journey-weeks">
                    ${weeks.map(w => `
                        <div class="journey-week">
                            <h2 class="week-title">${w.title}</h2>
                            <div class="week-grid">
                                ${sessions.filter(s => s.day >= w.range[0] && s.day <= w.range[1]).map(s => {
            const isCompleted = progress[s.day];
            const isActive = s.day === currentDay;
            const isLocked = s.day > currentDay;
            let statusClass = isLocked ? 'locked' : (isCompleted ? 'completed' : (isActive ? 'active' : ''));

            return `
                                        <div class="journey-day-card ${statusClass}" 
                                             onclick="${isLocked ? '' : `ZenithState.navigateTo('detail', { sessionId: '${s.id}' })`}">
                                            <div class="day-number">Day ${s.day}</div>
                                            <div class="day-dot"></div>
                                            <div class="day-info">
                                                <div class="day-title">${s.title}</div>
                                                <div class="day-meta">${s.duration} min · ${isLocked ? 'Locked' : (isCompleted ? '✓ Completed' : 'Start now')}</div>
                                            </div>
                                            ${isLocked ? `
                                                <div class="day-lock">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                    </svg>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ── Streak Display ──
    streakDisplay() {
        const user = ZenithData.user;
        const streak = user.currentStreak || 0;
        const longest = user.longest_streak || streak;

        return `
            <div class="streak-widget animate-fade-in-up" 
                 style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:20px; display:flex; align-items:center; gap:20px; margin: 0 16px 24px;">
                <div class="streak-fire" style="font-size: 40px; filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.4));">🔥</div>
                <div style="flex:1;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Current Streak</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin: 2px 0;">${streak} Days</div>
                    <div style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">Personal Best: ${longest} Days</div>
                </div>
                <div class="streak-milestone" style="width: 50px; height: 50px; background: rgba(20, 184, 166, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(20, 184, 166, 0.2);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
            </div>
        `;
    },

    // ── Notification Settings ──
    notificationSettings() {
        const settings = ZenithNotifications.settings;
        const timeOptions = [
            { label: 'Morning (8:00 AM)', value: '08:00:00' },
            { label: 'Afternoon (1:00 PM)', value: '13:00:00' },
            { label: 'Evening (8:00 PM)', value: '20:00:00' }
        ];

        return `
            <div class="notification-settings-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding:16px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:600; color:var(--text-primary);">Daily Reminders</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Get notified to complete your session</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif-enabled" ${settings.enabled ? 'checked' : ''} 
                                onchange="ZenithNotifications.saveSettings({ notifications_enabled: this.checked })">
                        <span class="slider round"></span>
                    </label>
                </div>

                <div class="form-group" style="margin-bottom:20px;">
                    <label>Preferred Channel</label>
                    <select id="notif-channel" onchange="const val = this.value; document.getElementById('whatsapp-settings').style.display = val === 'whatsapp' ? 'block' : 'none'; document.getElementById('telegram-settings').style.display = val === 'telegram' ? 'block' : 'none'; ZenithNotifications.saveSettings({ preferred_channel: val })"
                            style="width: 100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:var(--text-primary);">
                        <option value="in-app" ${settings.preferredChannel === 'in-app' ? 'selected' : ''}>In-App Only</option>
                        <option value="whatsapp" ${settings.preferredChannel === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                        <option value="telegram" ${settings.preferredChannel === 'telegram' ? 'selected' : ''}>Telegram</option>
                    </select>
                </div>

                <div id="whatsapp-settings" style="display: ${settings.preferredChannel === 'whatsapp' ? 'block' : 'none'}; margin-bottom: 20px;">
                    <label style="display:block; margin-bottom:8px; font-size:0.9rem;">WhatsApp Number</label>
                    <input type="tel" id="whatsapp-number" value="${settings.channelId && settings.preferredChannel === 'whatsapp' ? settings.channelId : ''}" 
                           placeholder="+1234567890"
                           onchange="ZenithNotifications.saveSettings({ channel_id: this.value })"
                           style="width: 100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:var(--text-primary);">
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Include country code (e.g., +1 for US)</div>
                </div>

                <div id="telegram-settings" style="display: ${settings.preferredChannel === 'telegram' ? 'block' : 'none'}; margin-bottom: 20px;">
                    <label style="display:block; margin-bottom:8px; font-size:0.9rem;">Telegram Connection</label>
                    ${settings.channelId && settings.preferredChannel === 'telegram' ? `
                        <div style="padding:12px; background:rgba(20, 184, 166, 0.1); border-radius:8px; color:var(--accent); font-size:0.85rem; border:1px solid rgba(20, 184, 166, 0.2);">
                            ✓ Connected to Telegram (${settings.channelId})
                        </div>
                    ` : `
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="telegram-id" placeholder="Your Telegram ID"
                                   onchange="ZenithNotifications.saveSettings({ channel_id: this.value })"
                                   style="flex:1; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:var(--text-primary);">
                            <a href="https://t.me/ZenithMindfulBot" target="_blank" class="cta-button" 
                               style="background:rgba(0, 136, 204, 0.1); color:#0088cc; border:1px solid #0088cc; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; padding: 0 16px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                Bot
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group" style="margin-bottom:20px;">
                    <label>Reminder Timing</label>
                    <select id="notif-time" onchange="ZenithNotifications.saveSettings({ reminder_time: this.value })"
                            style="width: 100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:var(--text-primary);">
                        ${timeOptions.map(t => `<option value="${t.value}" ${settings.reminderTime === t.value.substring(0, 5) ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding:16px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:600; color:var(--text-primary);">Streak Motivation</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Celebrate consistency milestones</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif-streak" ${settings.streakMotivation ? 'checked' : ''} 
                                onchange="ZenithNotifications.saveSettings({ streak_motivation_enabled: this.checked })">
                        <span class="slider round"></span>
                    </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button class="cta-button" style="background: rgba(20, 184, 166, 0.1); color: var(--accent); border: 1px solid var(--accent); font-size: 0.85rem;"
                            onclick="ZenithNotifications.requestPermission()">
                        Enable Push
                    </button>
                    <button class="cta-button" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;"
                            onclick="ZenithNotifications.checkAndNotify()">
                        Test Notification
                    </button>
                </div>
            </div>
        `;
    },
    // ── Platform Gateway Card ──
    gatewayCard(platform) {
        return `
            <div class="gateway-card glass-card" onclick="ZenithState.switchPlatform('${platform.id}')">
                <div class="gateway-icon">${platform.icon}</div>
                <div class="gateway-content">
                    <h3 class="gateway-title">${platform.title}</h3>
                    <p class="gateway-desc">${platform.description}</p>
                    <div class="gateway-features">
                        ${platform.features.slice(0, 3).map(f => `<span class="gateway-feature-tag">${f}</span>`).join('')}
                    </div>
                </div>
                <button class="btn btn-primary btn-sm gateway-btn">
                    Enter Platform
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        `;
    }
};
