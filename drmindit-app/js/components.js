/* ============================================================
   DRMINDIT REUSABLE COMPONENTS
   ============================================================ */

const DrMinditComponents = {

    // ── Mood Selector ──
    moodSelector() {
        const moods = [
            { value: 10, emoji: '😊', label: 'Great' },
            { value: 8, emoji: '🙂', label: 'Good' },
            { value: 6, emoji: '😐', label: 'Okay' },
            { value: 4, emoji: '😟', label: 'Low' },
            { value: 2, emoji: '😰', label: 'Stressed' }
        ];

        return `
            <div class="mood-selector">
                ${moods.map(m => `
                    <div class="mood-option ${DrMinditState.selectedMood === m.value ? 'active' : ''}"
                         onclick="DrMinditState.setMood(${m.value})">
                        <div class="mood-emoji">${m.emoji}</div>
                        <span class="mood-label">${m.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ── Session Card (Vertical) ──
    sessionCard(session, size = 'normal') {
        const therapist = DrMinditData.getTherapistById(session.therapist);
        const width = size === 'large' ? '280px' : '260px';

        return `
            <div class="session-card animate-fade-in-up" 
                 style="width: ${width}"
                 onclick="DrMinditState.navigateTo('detail', { sessionId: '${session.id}' })">
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
        const therapist = DrMinditData.getTherapistById(session.therapist);

        return `
            <div class="session-card animate-fade-in-up"
                 onclick="DrMinditState.navigateTo('detail', { sessionId: '${session.id}' })">
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
        const therapist = DrMinditData.getTherapistById(session.therapist);

        return `
            <div class="session-card-mini animate-fade-in-up"
                 onclick="DrMinditState.navigateTo('detail', { sessionId: '${session.id}' })">
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
                 onclick="DrMinditState.navigateTo('detail', { sessionId: '${session.id}' })">
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
                        onclick="DrMinditState.setFilter('duration', null)">All</button>
                ${DrMinditData.durations.map(d => `
                    <button class="duration-pill ${selected === d ? 'active' : ''}"
                            onclick="DrMinditState.setFilter('duration', ${d})">${d} min</button>
                `).join('')}
            </div>
        `;
    },

    // ── Category Tabs ──
    categoryTabs(selected, filteredCategories = null) {
        let categories = DrMinditData.categories;
        if (filteredCategories) {
            categories = categories.filter(c => c.id === 'all' || filteredCategories.includes(c.id));
        }

        return `
            <div class="category-tabs">
                ${categories.map(c => `
                    <button class="category-tab ${selected === c.id ? 'active' : ''}"
                            onclick="DrMinditState.setFilter('category', '${c.id}')">${c.icon} ${c.label}</button>
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
        const maxVal = 10;
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
                    ${[0, 2, 4, 6, 8, 10].map(i => {
            const y = padding + chartH - i / maxVal * chartH;
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
        const elapsed = DrMinditState.playerElapsed;
        const progress = elapsed / totalSeconds;
        const therapist = DrMinditData.getTherapistById(session.therapist);

        const radius = 120; // Slightly larger for elegance
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - progress * circumference;

        const formatTime = (s) => {
            if (!s || isNaN(s)) return "00:00";
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        };

        // Breathing label based on 14s cycle
        const cyclePos = elapsed % 14;
        let breatheLabel = 'Inhale';
        let phaseClass = 'phase-inhale';
        if (cyclePos >= 4 && cyclePos < 8) {
            breatheLabel = 'Hold';
            phaseClass = 'phase-hold';
        } else if (cyclePos >= 8) {
            breatheLabel = 'Exhale';
            phaseClass = 'phase-exhale';
        }

        const bars = Array.from({ length: 32 }, (_, i) => {
            const delay = (i * 0.08).toFixed(2);
            const active = DrMinditState.playerPlaying ? 'playing' : '';
            return `<div class="waveform-bar-refined ${active}" style="animation-delay:${delay}s;"></div>`;
        }).join('');

        return `
            <div class="audio-player-container page-enter ${phaseClass}">
                <div class="page-active animate-fade-in" 
                 ontouchstart="DrMinditState.handlePlayerTouchStart(event)" 
                 ontouchend="DrMinditState.handlePlayerTouchEnd(event)"
                 onclick="DrMinditState.toggleControls()">
                 
                <!-- Dynamic Atmosphere -->
                <div class="aura-glow aura-1"></div>
                <div class="aura-glow aura-2"></div>
                <div class="aura-glow aura-3"></div>
                <div class="player-bg-gradient-premium ${session.thumbGradient || 'grad-stress'}"></div>
                
                <!-- Close Button: High Visibility / Always Accessible -->
                <button class="player-exit-btn-fixed" onclick="DrMinditState.requestExit(); event.stopPropagation();" aria-label="Exit session">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>

                <!-- Exit Confirmation Modal (Conditionally Rendered) -->
                ${DrMinditState.showExitConfirmation ? this.exitConfirmationModal() : ''}

                <div class="player-main-layout-refined ${DrMinditState.showExitConfirmation ? 'modal-active' : ''}">
                    <!-- 1. Header: Elegant Typography -->
                    <div class="player-header-premium animate-fade-down ${DrMinditState.playerControlsVisible ? '' : 'controls-hidden'}">
                        <div class="session-meta-pill">${session.category.toUpperCase()} SESSION · ${session.duration} MIN</div>
                        <h1 class="session-title-elegant">${session.title}</h1>
                        <div class="session-subtitle-elegant">Guide: ${therapist ? therapist.name : 'Marcus'}</div>
                    </div>

                    <!-- 2. Center Piece: The Breathing Soul -->
                    <div class="player-center-premium">
                        <div class="orb-container-premium">
                            <!-- Visual Resonance (Ambient expansion) -->
                            <div class="orb-resonance ${DrMinditState.playerPlaying ? 'active' : ''}"></div>
                            
                            <!-- Progress Ring (Thin & Glowing) -->
                            <svg class="progress-ring-elegant" viewBox="0 0 300 300">
                                <circle class="ring-track-elegant" cx="150" cy="150" r="${radius}"/>
                                <circle id="player-ring-fill" class="ring-progress-elegant" cx="150" cy="150" r="${radius}"
                                        stroke-dasharray="${circumference}"
                                        stroke-dashoffset="${offset}"/>
                            </svg>
                            
                            <!-- The Breathing Orb -->
                            <div class="breathing-orb-premium ${DrMinditState.playerPlaying ? 'active breathe' : ''}">
                                <div class="orb-content-premium">
                                    <div class="phase-label-elegant" id="orb-breath-label">${DrMinditState.playerPlaying ? breatheLabel : ''}</div>
                                    <div class="timer-display-premium">
                                        <div class="time-main" id="player-time-current">${formatTime(elapsed)}</div>
                                        <div class="time-sub">Remains: ${formatTime(totalSeconds - elapsed)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guidance Text (Faded out when controls are hidden) -->
                        <div class="guidance-text-container ${DrMinditState.playerControlsVisible ? '' : 'controls-hidden'}">
                            <p id="player-caption-text" class="guidance-text-elegant animate-fade-in">
                                ${DrMinditState.narrationError ? `<span class="err">Connection stable. Narrative resuming...</span>` : (DrMinditAudioEngine.getCaption() || 'Find a comfortable space...')}
                            </p>
                        </div>
                    </div>

                    <!-- 3. Footer: Refined Controls -->
                    <div class="player-footer-premium ${DrMinditState.playerControlsVisible ? '' : 'controls-hidden'}">
                        <!-- Minimalist Scrubber -->
                        <div class="scrubber-premium">
                            <div class="scrubber-bar-container">
                                <input id="player-scrubber-slider" type="range" class="scrubber-input" min="0" max="${totalSeconds}" value="${elapsed}" 
                                       oninput="DrMinditState.seekTo(this.value); event.stopPropagation();"
                                       onclick="event.stopPropagation()">
                                <div id="player-scrubber-fill" class="scrubber-fill-elegant" style="width: ${progress * 100}%"></div>
                            </div>
                        </div>

                        <!-- Control Center -->
                        <div class="control-center-premium" onclick="event.stopPropagation()">
                            <div class="playback-main-group">
                                <button class="btn-secondary-modern" onclick="DrMinditState.skipBackward()" aria-label="Skip back 15 seconds">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                                </button>
                                
                                <button class="btn-play-premium ${DrMinditState.playerPlaying ? 'playing' : ''}" onclick="DrMinditState.togglePlayer()" aria-label="Play/Pause">
                                    <div class="btn-inner-glow"></div>
                                    <div class="icon-wrap-premium">
                                        ${DrMinditState.playerPlaying
                ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            }
                                    </div>
                                </button>
        
                                <button class="btn-secondary-modern" onclick="DrMinditState.skipForward()" aria-label="Skip forward 15 seconds">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.41 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.92 16c1.05-3.19 4.05-5.5 7.58-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.59 3.6z"/></svg>
                                </button>
                            </div>

                            <div class="speed-selector-premium">
                                <button class="speed-pill ${DrMinditState.playbackRate === 1.0 ? 'active' : ''}" onclick="DrMinditState.setPlaybackRate(1.0)">1x</button>
                                <button class="speed-pill ${DrMinditState.playbackRate === 1.25 ? 'active' : ''}" onclick="DrMinditState.setPlaybackRate(1.25)">1.25x</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    exitConfirmationModal() {
        return `
            <div class="modal-overlay-premium animate-fade-in" onclick="DrMinditState.cancelExit()">
                <div class="modal-glass-card animate-zoom-in" onclick="event.stopPropagation()">
                    <div class="modal-icon-wrap">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="modal-title-elegant">End Session Early?</h2>
                    <p class="modal-desc-refined">You’ve done great so far. Ending now will save your current progress, but don’t forget to return for the full benefit.</p>
                    
                    <div class="modal-actions-stack">
                        <button class="btn btn-primary btn-block modal-btn-main" onclick="DrMinditState.stopSession()">
                            End Session Now
                        </button>
                        <button class="btn-link modal-btn-alt" onclick="DrMinditState.cancelExit()">
                            Continue Meditation
                        </button>
                    </div>
                </div>
            </div>
        `;
    },


    // ── Mini Player ──
    miniPlayer() {
        if (!DrMinditState.activeSessionId) return '';
        const session = DrMinditData.getSessionById(DrMinditState.activeSessionId);
        if (!session) return '';

        const progress = DrMinditState.playerElapsed / (session.duration * 60);

        return `
            <div class="mini-player-sticky animate-slide-up" onclick="DrMinditState.navigateTo('active')">
                <div class="mini-player-progress" style="width: ${progress * 100}%"></div>
                <div class="mini-player-content">
                    <div class="mini-player-info">
                        <div class="mini-thumb ${session.thumbGradient}">${session.thumbIcon}</div>
                        <div class="mini-text">
                            <div class="mini-title">${session.title}</div>
                            <div class="mini-subtext">${session.duration} min · Now Playing</div>
                        </div>
                    </div>
                    <div class="mini-controls" onclick="event.stopPropagation()">
                        <button class="mini-ctrl-btn" onclick="DrMinditState.togglePlayer()">
                            ${DrMinditState.playerPlaying
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            }
                        </button>
                        <button class="mini-ctrl-btn" onclick="DrMinditState.stopSession()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ── Calm Now Overlay ──
    calmNowOverlay() {
        const timer = DrMinditState.calmNowTimer || 300;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} `;

        // Initial instruction text based on timer
        const cyclePos = (300 - timer) % 14;
        let instruction = 'Breathe in...';
        if (cyclePos >= 4 && cyclePos < 8) instruction = 'Hold...';
        else if (cyclePos >= 8) instruction = 'Breathe out...';

        const radius = 135;
        const circumference = 2 * Math.PI * radius;
        const progress = (300 - timer) / 300;
        const offset = circumference - progress * circumference;

        return `
    <div class="calm-now-overlay page-enter" >
                < !--Ambient Particles-- >
                <div class="calm-particles">
                    <div class="particle" style="top:20%; left:10%; animation-delay: 0s;"></div>
                    <div class="particle" style="top:60%; left:80%; animation-delay: 2s;"></div>
                    <div class="particle" style="top:80%; left:30%; animation-delay: 4s;"></div>
                    <div class="particle" style="top:10%; left:70%; animation-delay: 1s;"></div>
                </div>

                <div class="calm-bg-glow"></div>

                <button class="calm-close" onclick="DrMinditState.closeCalmNow()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div class="calm-content">
                    <div class="calm-title">Calm Now</div>
                    <div class="calm-subtitle">Physiological Reset Protocol</div>

                    <div class="breathing-ring-container">
                        <!-- Progress Ring -->
                        <svg class="calm-progress-ring" viewBox="0 0 300 300">
                            <circle class="ring-bg" cx="150" cy="150" r="${radius}"/>
                            <circle id="calm-progress-ring-fill" class="ring-fill" cx="150" cy="150" r="${radius}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${offset}"/>
                        </svg>

                        <!-- Breathing Orb -->
                        <div class="breathing-orb-wrap">
                            <div class="breathing-orb-glow"></div>
                            <div class="breathing-orb"></div>
                            <div class="breathing-orb-inner"></div>
                        </div>
                    </div>

                    <div class="calm-timer" id="calm-timer-display">${timeStr}</div>
                    <div class="calm-instruction" id="calm-instruction-text">${instruction}</div>
                </div>
            </div>
    `;
    },

    // ── Stat Card ──
    statCard(value, label, trend = null) {
        const trendHtml = trend
            ? `<div class="${trend > 0 ? 'trend-up' : 'trend-down'}" >
    ${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%
               </div> `
            : '';
        return `
    <div class="stat-card animate-fade-in-up" >
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
                ${trendHtml}
            </div>
    `;
    },

    // ── Achievement Grid ──
    achievementGrid(achievements) {
        return `
    <div class="achievement-grid stagger-children" >
        ${achievements.map(a => `
                    <div class="achievement-badge ${a.unlocked ? '' : 'locked'} animate-fade-in-up">
                        <div class="achievement-icon">${a.icon}</div>
                        <div class="achievement-name">${a.name}</div>
                    </div>
                `).join('')
            }
            </div>
    `;
    },

    narratorSettings() {
        const voices = DrMinditAudioEngine.getVoices();
        const selected = DrMinditAudioEngine.selectedVoice ? DrMinditAudioEngine.selectedVoice.name : '';

        const options = voices.map(v => `
    < option value = "${v.name}" ${v.name === selected ? 'selected' : ''}>
        ${v.name} (${v.lang})
            </option >
    `).join('');

        return `
    <div class="info-card" style = "margin-top: 24px; padding: 24px;" >
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    🎙️ AI Narrator Settings
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px;">
                    Select the professional AI voice that best fits your focus practice.
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <select class="custom-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); border-radius: 8px;"
                            onchange="DrMinditAudioEngine.setVoice(this.value)">
                        ${options || '<option disabled>Loading AI voices...</option>'}
                    </select>
                    
                    <button class="cta-button" style="width: 100%; background: rgba(20, 184, 166, 0.1); color: var(--accent); border: 1px solid var(--accent);"
                            onclick="DrMinditAudioEngine.testVoice()">
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
        const user = DrMinditData.user;
        return `
    <div class="profile-form page-enter" >
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
                <button class="cta-button" style="margin-top:20px; width:100%;" onclick="DrMinditPages.handleProfileSave()">Save Changes</button>
            </div>
    `;
    },

    // ── Mood Modals ──
    moodCheckInModal() {
        return `
    <div class="modal-overlay page-enter" >
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">Check-in: Pre-Session</div>
                <div class="modal-subtitle">How are you arriving to your practice?</div>
            </div>
            <div class="modal-body">
                <div class="form-label" style="margin-bottom:12px;">Rate your current mood (1-10)</div>
                <div class="mood-scale">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                                <div class="scale-item" onclick="DrMinditPages.setSelectedMoodScale(${i})">${i}</div>
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
                <button class="cta-button" style="width:100%;" onclick="DrMinditPages.submitMoodCheckIn()">Start Session</button>
            </div>
        </div>
            </div>
    `;
    },

    moodCheckOutModal() {
        return `
    <div class="modal-overlay page-enter" >
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">Check-out: Post-Session</div>
                <div class="modal-subtitle">How do you feel after your practice?</div>
            </div>
            <div class="modal-body">
                <div class="form-label" style="margin-bottom:12px;">Rate your current mood (1-10)</div>
                <div class="mood-scale">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                                <div class="scale-item" onclick="DrMinditPages.setSelectedMoodScale(${i})">${i}</div>
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
                <button class="cta-button" style="width:100%;" onclick="DrMinditPages.submitMoodCheckOut()">Complete Flow</button>
            </div>
        </div>
            </div>
    `;
    },

    aiInsightCard() {
        const insight = DrMinditState.getMoodInsights();
        const isAlert = insight.includes('Alert');
        return `
    <div class="ai-insight-card animate-fade-in-up ${isAlert ? 'alert' : ''}" >
                <div class="ai-insight-icon">${isAlert ? '⚠️' : '🧠'}</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-label">DrMindit AI Observer</div>
                    <div class="ai-insight-text">${insight}</div>
                </div>
            </div>
    `;
    },

    resilienceJourney() {
        const currentDay = DrMinditState.resilienceDay;
        const progress = DrMinditState.resilienceProgress;
        const sessions = ResilienceProgramData;

        const weeks = [
            { title: 'Week 1: Nervous System Reset', range: [1, 7], theme: 'basement' },
            { title: 'Week 2: Emotional Regulation', range: [8, 14], theme: 'building' },
            { title: 'Week 3: Peak Performance', range: [15, 21], theme: 'peak' }
        ];

        return `
    <div class="resilience-journey page-enter" >
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
                                             onclick="${isLocked ? '' : `DrMinditState.navigateTo('detail', { sessionId: '${s.id}' })`}">
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
        const user = DrMinditData.user;
        const streak = user.currentStreak || 0;
        const longest = user.longest_streak || streak;

        // Custom motivational text based on streak
        let motivation = "Keep showing up!";
        if (streak > 0 && streak < 3) motivation = "Great start! Keep it up.";
        if (streak >= 3) motivation = "You're on fire! Stay consistent.";
        if (streak >= 7) motivation = "Weekly milestone reached! incredible focus.";

        return `
            <div class="streak-widget-premium animate-fade-in-up" onclick="DrMinditState.navigateTo('insights')">
                <div class="streak-icon-wrap">
                    <span class="streak-icon-fire">🔥</span>
                </div>
                
                <div class="streak-content-main">
                    <div class="streak-label-subtle">Personal Streak</div>
                    <div class="streak-count-prominent">
                        <span class="streak-number-bold">${streak}</span>
                        <span class="streak-text-bold">Day Streak</span>
                    </div>
                    <div class="streak-motivation-text">${motivation}</div>
                </div>

                <div class="streak-action-chevron">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>
        `;
    },

    // ── Notification Settings ──
    notificationSettings() {
        const settings = DrMinditNotifications.settings;
        const timeOptions = [
            { label: 'Morning (8:00 AM)', value: '08:00:00' },
            { label: 'Afternoon (1:00 PM)', value: '13:00:00' },
            { label: 'Evening (8:00 PM)', value: '20:00:00' }
        ];

        return `
    <div class="notification-settings-panel" >
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding:16px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:600; color:var(--text-primary);">Daily Reminders</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">Get notified to complete your session</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif-enabled" ${settings.enabled ? 'checked' : ''} 
                                onchange="DrMinditNotifications.saveSettings({ notifications_enabled: this.checked })">
                        <span class="slider round"></span>
                    </label>
                </div>

                <div class="form-group" style="margin-bottom:20px;">
                    <label>Preferred Channel</label>
                    <select id="notif-channel" onchange="const val = this.value; document.getElementById('whatsapp-settings').style.display = val === 'whatsapp' ? 'block' : 'none'; document.getElementById('telegram-settings').style.display = val === 'telegram' ? 'block' : 'none'; DrMinditNotifications.saveSettings({ preferred_channel: val })"
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
                           onchange="DrMinditNotifications.saveSettings({ channel_id: this.value })"
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
                                   onchange="DrMinditNotifications.saveSettings({ channel_id: this.value })"
                                   style="flex:1; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:var(--text-primary);">
                            <a href="https://t.me/DrMinditMindfulBot" target="_blank" class="cta-button" 
                               style="background:rgba(0, 136, 204, 0.1); color:#0088cc; border:1px solid #0088cc; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; padding: 0 16px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                Bot
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group" style="margin-bottom:20px;">
                    <label>Reminder Timing</label>
                    <select id="notif-time" onchange="DrMinditNotifications.saveSettings({ reminder_time: this.value })"
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
                                onchange="DrMinditNotifications.saveSettings({ streak_motivation_enabled: this.checked })">
                        <span class="slider round"></span>
                    </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button class="cta-button" style="background: rgba(20, 184, 166, 0.1); color: var(--accent); border: 1px solid var(--accent); font-size: 0.85rem;"
                            onclick="DrMinditNotifications.requestPermission()">
                        Enable Push
                    </button>
                    <button class="cta-button" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;"
                            onclick="DrMinditNotifications.checkAndNotify()">
                        Test Notification
                    </button>
                </div>
            </div>
    `;
    },
    // ── Platform Gateway Card ──
    gatewayCard(platform) {
        return `
            <div class="gateway-card glass-card animate-fade-in-up" onclick="DrMinditState.switchPlatform('${platform.id}')">
                <div class="gateway-icon-wrap">
                    <div class="gateway-icon-bg ${platform.id}-glow"></div>
                    <div class="gateway-icon-main">${platform.icon}</div>
                </div>
                
                <div class="gateway-content-premium">
                    <h3 class="gateway-title-elegant">${platform.title}</h3>
                    <p class="gateway-desc-refined">${platform.description}</p>
                    
                    <div class="gateway-feature-chips">
                        ${platform.features.slice(0, 3).map(f => `
                            <span class="platform-chip">
                                <span class="chip-dot"></span>
                                ${f}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <div class="gateway-action-area">
                    <button class="btn-gateway-premium" aria-label="Enter ${platform.title} Platform">
                        <span>Enter Platform</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
                
                <div class="card-interaction-overlay"></div>
            </div>
        `;
    }
};
