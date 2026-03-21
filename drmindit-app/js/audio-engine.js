const DrMinditAudioEngine = {
    // Audio context and nodes
    audioCtx: null,

    // Layers
    introPlayer: null,      // Howl
    narrationPlayer: null,  // Howl (Premium AI voice)
    backgroundPlayer: null, // Howl (Meditation music)
    binauralOscs: [],      // Real-time binaural beats (stays in AudioContext)

    // State
    isRunning: false,
    isPaused: false,
    currentCaption: '',
    playbackRate: 1.0,
    scriptQueue: [],
    scriptIndex: 0,

    // Callbacks
    onCaptionUpdate: null,
    onTimeUpdate: null,
    onEnded: null,
    onLoading: null, // New: for buffering states

    // ═══════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════
    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._setupGains();
    },

    _setupGains() {
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.audioCtx.destination);

        this.binauralGain = this.audioCtx.createGain();
        this.binauralGain.gain.value = 0.05; // Subtle beats
        this.binauralGain.connect(this.masterGain);
    },

    // ═══════════════════════════════════════════
    // START PREMIUM SESSION
    // ═══════════════════════════════════════════
    async start(sessionId, startAtSeconds = 0) {
        this.stop();
        this.init();
        this.isRunning = true;

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        console.log(`✦ Starting Immersive Session: ${sessionId} (Resume: ${startAtSeconds}s)`);
        const session = DrMinditData.getSessionById(sessionId);

        // 1. Play Binaural Beats (Immediate - synthesized)
        this._startBinauralBeats();

        // 2. Play Background Ambience (Howler)
        this._playLayer('background', 'assets/audio/ambient-theta.mp3', true);

        // 3. Play Intro Ambient (Howler)
        this._playLayer('intro', 'assets/audio/session-intro.mp3', false);

        // 4. Main Narration
        let narrationUrl = session?.audio_url;
        const localPremiumUrl = `assets/audio/sessions/${sessionId}.mp3`;

        // Determine actual URL by checking local existence first if not explicit
        if (!narrationUrl) {
            try {
                const response = await fetch(localPremiumUrl, { method: 'HEAD' });
                if (response.ok) narrationUrl = localPremiumUrl;
            } catch (e) { }
        }

        if (narrationUrl) {
            console.log(`✦ DrMindit Audio: Loading ${narrationUrl}`);
            const delay = session?.id.startsWith('s5') ? 8000 : 15000;

            setTimeout(() => {
                if (this.isRunning) {
                    this._playLayer('narration', narrationUrl, false, startAtSeconds);
                }
            }, delay);
        } else {
            this._startTtsFallback(sessionId);
        }

        this._fadeIn(5);
    },

    _playLayer(type, url, loop = false, seekTo = 0) {
        try {
            if (this.onLoading) this.onLoading(true);

            const sound = new Howl({
                src: [url],
                loop: loop,
                html5: true, // Force HTML5 for streaming large files
                volume: type === 'background' ? 0.15 : 1.0,
                rate: type === 'narration' ? this.playbackRate : 1.0,
                onload: () => {
                    if (this.onLoading) this.onLoading(false);
                    if (seekTo > 0) sound.seek(seekTo);
                },
                onplay: () => {
                    if (type === 'narration') {
                        this._startTimeTracker();
                    }
                },
                onend: () => {
                    if (type === 'narration') {
                        this._handleSessionEnd();
                    }
                },
                onloaderror: (id, err) => {
                    console.error(`✦ Howler load error (${type}):`, err);
                    if (type === 'narration' && this.onNarrationError) {
                        this.onNarrationError('Audio file unavailable or invalid.');
                    }
                }
            });

            if (type === 'narration') this.narrationPlayer = sound;
            else if (type === 'background') this.backgroundPlayer = sound;
            else if (type === 'intro') this.introPlayer = sound;

            sound.play();

        } catch (err) {
            console.error(`✦ DrMindit Audio: Setup error for ${type}:`, err);
        }
    },

    _startTimeTracker() {
        if (this._timeTrackInterval) clearInterval(this._timeTrackInterval);
        this._timeTrackInterval = setInterval(() => {
            if (this.narrationPlayer && this.narrationPlayer.playing()) {
                const current = this.narrationPlayer.seek();
                const duration = this.narrationPlayer.duration();
                if (this.onTimeUpdate) this.onTimeUpdate(current, duration);
            }
        }, 1000);
    },

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.narrationPlayer) {
            this.narrationPlayer.rate(rate);
        }
    },

    _startBinauralBeats() {
        const frequencies = [200, 210]; // 10Hz Alpha
        frequencies.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const panner = this.audioCtx.createStereoPanner();
            osc.frequency.value = freq;
            panner.pan.value = i === 0 ? -1 : 1;
            osc.connect(panner);
            panner.connect(this.binauralGain);
            osc.start();
            this.binauralOscs.push(osc);
        });
    },

    _startTtsFallback(sessionId) {
        const script = window.DrMinditSessionScripts ? window.DrMinditSessionScripts[sessionId] : null;
        if (!script) return;

        this.scriptQueue = script;
        this.scriptIndex = 0;
        setTimeout(() => this._processNextTtsCue(), 15000);
    },

    _processNextTtsCue() {
        if (!this.isRunning || this.isPaused) return;
        if (this.scriptIndex >= this.scriptQueue.length) {
            this._handleSessionEnd();
            return;
        }

        const cue = this.scriptQueue[this.scriptIndex++];
        if (cue.type === 'speak') {
            const utter = new SpeechSynthesisUtterance(cue.text);
            utter.rate = 0.8;
            utter.pitch = 0.9;
            utter.onend = () => {
                this._ttsTimeout = setTimeout(() => this._processNextTtsCue(), 1000);
            };

            this.currentCaption = cue.text;
            if (this.onCaptionUpdate) this.onCaptionUpdate(cue.text);

            window.speechSynthesis.speak(utter);
        } else {
            const delay = cue.duration ? cue.duration * 1000 : 3000;
            this._ttsTimeout = setTimeout(() => this._processNextTtsCue(), delay);
        }
    },

    pause() {
        this.isPaused = true;
        if (this.audioCtx) this.audioCtx.suspend();
        if (this.narrationPlayer) this.narrationPlayer.pause();
        if (this.backgroundPlayer) this.backgroundPlayer.pause();
        if (this.introPlayer) this.introPlayer.pause();
        if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
    },

    resume() {
        this.isPaused = false;
        if (this.audioCtx) this.audioCtx.resume();
        if (this.narrationPlayer) this.narrationPlayer.play();
        if (this.backgroundPlayer) this.backgroundPlayer.play();
        if (this.introPlayer) this.introPlayer.play();
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    },

    stop(immediate = false) {
        this.isRunning = false;
        this.isPaused = false;
        if (this._timeTrackInterval) clearInterval(this._timeTrackInterval);
        this._clearAllTimeouts();

        if (immediate) {
            this._performHardStop();
        } else {
            this._fadeOut(2);
            setTimeout(() => this._performHardStop(), 2100);
        }
    },

    _performHardStop() {
        if (this.narrationPlayer) {
            this.narrationPlayer.stop();
            this.narrationPlayer.unload();
            this.narrationPlayer = null;
        }
        if (this.backgroundPlayer) {
            this.backgroundPlayer.stop();
            this.backgroundPlayer.unload();
            this.backgroundPlayer = null;
        }
        if (this.introPlayer) {
            this.introPlayer.stop();
            this.introPlayer.unload();
            this.introPlayer = null;
        }

        this.binauralOscs.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) { }
        });
        this.binauralOscs = [];

        window.speechSynthesis.cancel();

        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.close();
        }
        this.audioCtx = null;
        console.log('✦ DrMindit Audio: Hard stop performed.');
    },

    _clearAllTimeouts() {
        if (this._ttsTimeout) clearTimeout(this._ttsTimeout);
        // Add any other specific timers here
    },

    _fadeIn(sec) {
        if (!this.masterGain) return;
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setTargetAtTime(1, now, sec / 3);
    },

    _fadeOut(sec) {
        if (!this.masterGain) return;
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setTargetAtTime(0, now, sec / 3);
    },

    _handleSessionEnd() {
        this._playSfx('assets/audio/end-bell.mp3');
        setTimeout(() => {
            if (this.onEnded) this.onEnded();
            this.stop();
        }, 5000);
    },

    _playSfx(url) {
        new Howl({ src: [url], volume: 0.5 }).play();
    },

    seek(sec) {
        if (this.narrationPlayer) {
            this.narrationPlayer.seek(sec);
        } else if (!this.narrationPlayer && this.scriptQueue.length > 0) {
            window.speechSynthesis.cancel();
            this.scriptIndex = Math.floor(sec / 5);
            this._processNextTtsCue();
        }
    },

    getCaption() { return this.currentCaption; }
};

