const DrMinditAudioEngine = {
    // Audio context and nodes
    audioCtx: null,

    // Layers
    introPlayer: null,      // Soft ambient intro
    narrationPlayer: null,  // Premium AI voice (MP3)
    backgroundPlayer: null, // Looping meditation music
    binauralOscs: [],      // Real-time binaural beats

    // Gains
    masterGain: null,
    narrationGain: null,
    backgroundGain: null,
    binauralGain: null,

    // State
    isRunning: false,
    isPaused: false,
    currentCaption: '',
    scriptQueue: [],
    scriptIndex: 0,

    // Callbacks
    onCaptionUpdate: null,
    onTimeUpdate: null,
    onEnded: null,

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

        this.narrationGain = this.audioCtx.createGain();
        this.narrationGain.gain.value = 1.0;
        this.narrationGain.connect(this.masterGain);

        this.backgroundGain = this.audioCtx.createGain();
        this.backgroundGain.gain.value = 0.15; // Soft background
        this.backgroundGain.connect(this.masterGain);

        this.binauralGain = this.audioCtx.createGain();
        this.binauralGain.gain.value = 0.05; // Subtle beats
        this.binauralGain.connect(this.masterGain);
    },

    // ═══════════════════════════════════════════
    // START PREMIUM SESSION
    // ═══════════════════════════════════════════
    async start(sessionId) {
        this.stop();
        this.init();
        this.isRunning = true;

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        console.log(`✦ Starting Premium Session: ${sessionId}`);

        // 1. Play Binaural Beats (Immediate)
        this._startBinauralBeats();

        // 2. Play Background Ambience
        this._playLayer('background', 'assets/audio/ambient-theta.mp3', true);

        // 3. Play Intro Ambient (Fade in/out)
        this._playLayer('intro', 'assets/audio/session-intro.mp3', false);

        // 4. Main Narration (Delayed or Sequential)
        // We attempt to load the pre-generated MP3
        const premiumUrl = `assets/audio/sessions/${sessionId}.mp3`;

        // Use Fetch to check if file exists, if not fallback to TTS
        try {
            const response = await fetch(premiumUrl, { method: 'HEAD' });
            if (response.ok) {
                // PREMIUM PATH: Pre-generated ElevenLabs
                setTimeout(() => {
                    if (this.isRunning) this._playLayer('narration', premiumUrl, false);
                }, 15000); // 15s intro before voice
            } else {
                // FALLBACK PATH: System TTS
                console.warn('Premium audio not found, falling back to System TTS.');
                this._startTtsFallback(sessionId);
            }
        } catch (e) {
            this._startTtsFallback(sessionId);
        }

        this._fadeIn(5);
    },

    _playLayer(type, url, loop = false) {
        const audio = new Audio(url);
        audio.loop = loop;
        audio.crossOrigin = "anonymous";

        const source = this.audioCtx.createMediaElementSource(audio);

        if (type === 'narration') {
            this.narrationPlayer = audio;
            source.connect(this.narrationGain);

            audio.ontimeupdate = () => {
                if (this.onTimeUpdate) this.onTimeUpdate(audio.currentTime, audio.duration);
            };
            audio.onended = () => this._handleSessionEnd();
        } else {
            source.connect(type === 'background' ? this.backgroundGain : this.masterGain);
        }

        audio.play().catch(e => console.error(`Error playing ${type}:`, e));
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
            utter.onend = () => setTimeout(() => this._processNextTtsCue(), 1000);

            this.currentCaption = cue.text;
            if (this.onCaptionUpdate) this.onCaptionUpdate(cue.text);

            window.speechSynthesis.speak(utter);
        } else {
            const delay = cue.duration ? cue.duration * 1000 : 3000;
            setTimeout(() => this._processNextTtsCue(), delay);
        }
    },

    pause() {
        this.isPaused = true;
        if (this.audioCtx) this.audioCtx.suspend();
        if (this.narrationPlayer) this.narrationPlayer.pause();
        if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
    },

    resume() {
        this.isPaused = false;
        if (this.audioCtx) this.audioCtx.resume();
        if (this.narrationPlayer) this.narrationPlayer.play();
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    },

    stop() {
        this.isRunning = false;
        this._fadeOut(2);

        setTimeout(() => {
            if (this.narrationPlayer) this.narrationPlayer.pause();
            if (this.backgroundPlayer) this.backgroundPlayer.pause();
            if (this.introPlayer) this.introPlayer.pause();

            this.binauralOscs.forEach(osc => {
                try { osc.stop(); osc.disconnect(); } catch (e) { }
            });
            this.binauralOscs = [];

            window.speechSynthesis.cancel();

            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close();
            }
            this.audioCtx = null;
        }, 2100);
    },

    _fadeIn(sec) {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setTargetAtTime(1, now, sec / 3);
    },

    _fadeOut(sec) {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setTargetAtTime(0, now, sec / 3);
    },

    _handleSessionEnd() {
        this._playLayer('sfx', 'assets/audio/end-bell.mp3', false);
        setTimeout(() => {
            if (this.onEnded) this.onEnded();
            this.stop();
        }, 5000);
    },

    seek(sec) {
        if (this.narrationPlayer) {
            this.narrationPlayer.currentTime = sec;
        } else if (!this.narrationPlayer && this.scriptQueue.length > 0) {
            // TTS Fallback seeking (crude: just restart from closest cue)
            window.speechSynthesis.cancel();
            // Estimate cue index based on average speed (approx 3s per cue)
            this.scriptIndex = Math.floor(sec / 5);
            this._processNextTtsCue();
        }
    },

    getCaption() { return this.currentCaption; }
};
