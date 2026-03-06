/* ============================================================
   ZENITH AUDIO ENGINE
   Real-time binaural beats + TTS voice narration
   Uses Web Audio API + Web Speech API
   ============================================================ */

const ZenithAudioEngine = {
    // Audio context and nodes
    audioCtx: null,
    binauralLeft: null,
    binauralRight: null,
    panLeft: null,
    panRight: null,
    droneOsc: null,
    binauralGain: null,
    droneGain: null,
    masterGain: null,
    mp3Gain: null,
    mp3Element: null,
    mp3Source: null,

    // TTS state
    synth: window.speechSynthesis,
    currentUtterance: null,
    scriptQueue: [],
    scriptIndex: 0,
    pauseTimer: null,
    isPaused: false,
    isRunning: false,
    currentCaption: '',
    selectedVoice: null,
    onCaptionUpdate: null,
    onTimeUpdate: null,
    onEnded: null,

    // ═══════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════
    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._selectVoice();
    },

    _selectVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            if (voices.length === 0) return;

            // Prefer high-quality English voices
            // Priority: Aaron (resonant male), Daniel (UK male), Alex, Samantha (macOS), then any English
            const preferredNames = [
                'aaron', 'daniel', 'alex', 'fred', 'tom',
                'google uk english male', 'microsoft david',
                'samantha', 'karen', 'moira',
                'google us english', 'microsoft zira'
            ];

            const englishVoices = voices.filter(v =>
                v.lang.startsWith('en')
            );

            for (const name of preferredNames) {
                const found = englishVoices.find(v =>
                    v.name.toLowerCase().includes(name)
                );
                if (found) {
                    this.selectedVoice = found;
                    console.log(`%c🎙️ Voice selected: ${found.name}`, 'color: #14b8a6;');
                    return;
                }
            }

            // Fallback to first English voice
            if (englishVoices.length > 0) {
                this.selectedVoice = englishVoices[0];
                console.log(`%c🎙️ Voice fallback: ${englishVoices[0].name}`, 'color: #f59e0b;');
            }
        };

        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    },

    // ═══════════════════════════════════════════
    // START SESSION AUDIO
    // ═══════════════════════════════════════════
    start(sessionId, customFileUrl = null) {
        this.stop(); // Clean up any existing session first
        this.init(); // Then initialize (creates audioCtx)

        if (!this.audioCtx) {
            console.error('Failed to initialize AudioContext');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.currentCaption = '';

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Setup master gain first
        this._setupMasterGain();

        // Start binaural beats + drone
        this._startBinauralBeats();
        this._startDrone();

        // Fade in background audio over 5 seconds (shorter for responsiveness)
        this._fadeIn(5);

        if (customFileUrl) {
            this._startMp3(customFileUrl);
        } else {
            const script = ZenithSessionScripts[sessionId];
            if (script) {
                this.scriptQueue = script;
                this.scriptIndex = 0;
                // Begin TTS narration after a 2-second initial pause
                setTimeout(() => {
                    if (this.isRunning && !this.isPaused) {
                        this._processNextCue();
                    }
                }, 2000);
            } else {
                console.warn(`No script or MP3 found for session: ${sessionId}`);
            }
        }
    },

    _setupMasterGain() {
        if (!this.masterGain) {
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioCtx.destination);
        }
    },

    // ═══════════════════════════════════════════
    // BINAURAL BEAT GENERATOR
    // 200 Hz left ear, 210 Hz right ear → 10 Hz alpha
    // ═══════════════════════════════════════════
    _startBinauralBeats() {
        // Binaural gain (–30 dB relative ≈ 0.03)
        this.binauralGain = this.audioCtx.createGain();
        this.binauralGain.gain.value = 0.03;
        this.binauralGain.connect(this.masterGain);

        // Left oscillator: 200 Hz, panned hard left
        this.binauralLeft = this.audioCtx.createOscillator();
        this.binauralLeft.type = 'sine';
        this.binauralLeft.frequency.value = 200;
        this.panLeft = this.audioCtx.createStereoPanner();
        this.panLeft.pan.value = -1;
        this.binauralLeft.connect(this.panLeft);
        this.panLeft.connect(this.binauralGain);

        // Right oscillator: 210 Hz, panned hard right
        this.binauralRight = this.audioCtx.createOscillator();
        this.binauralRight.type = 'sine';
        this.binauralRight.frequency.value = 210;
        this.panRight = this.audioCtx.createStereoPanner();
        this.panRight.pan.value = 1;
        this.binauralRight.connect(this.panRight);
        this.panRight.connect(this.binauralGain);

        // Start both
        this.binauralLeft.start();
        this.binauralRight.start();
    },

    // ═══════════════════════════════════════════
    // AMBIENT DRONE (180 Hz, center-panned)
    // ═══════════════════════════════════════════
    _startDrone() {
        this.droneGain = this.audioCtx.createGain();
        this.droneGain.gain.value = 0.015; // –36 dB relative
        this.droneGain.connect(this.masterGain);

        this.droneOsc = this.audioCtx.createOscillator();
        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.value = 180;
        this.droneOsc.connect(this.droneGain);
        this.droneOsc.start();
    },

    // ═══════════════════════════════════════════
    // FADE IN / OUT
    // ═══════════════════════════════════════════
    _fadeIn(durationSec) {
        if (!this.masterGain) return;
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(1, now + durationSec);
    },

    _fadeOut(durationSec) {
        if (!this.masterGain) return;
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + durationSec);
    },

    // Soft tone shift: briefly lower background 3 dB, then restore
    _softToneShift() {
        if (!this.masterGain) return;
        const now = this.audioCtx.currentTime;
        const currentMaster = this.masterGain.gain.value;
        const lowered = currentMaster * 0.7; // ~3 dB reduction
        this.masterGain.gain.setValueAtTime(currentMaster, now);
        this.masterGain.gain.linearRampToValueAtTime(lowered, now + 2);
        this.masterGain.gain.linearRampToValueAtTime(currentMaster, now + 4);
    },

    _startMp3(url) {
        this.mp3Element = new Audio(url);
        this.mp3Source = this.audioCtx.createMediaElementSource(this.mp3Element);
        this.mp3Gain = this.audioCtx.createGain();
        this.mp3Gain.gain.value = 1.0;

        this.mp3Source.connect(this.mp3Gain);
        this.mp3Gain.connect(this.audioCtx.destination); // Connect MP3 directly to destination to avoid binaural fade logic if desired

        this.mp3Element.play();

        this.mp3Element.ontimeupdate = () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.mp3Element.currentTime, this.mp3Element.duration);
            }
        };

        this.mp3Element.onended = () => {
            if (this.onEnded) this.onEnded();
            this.stop();
        };
    },

    // ═══════════════════════════════════════════
    // TTS SCRIPT PROCESSOR
    // ═══════════════════════════════════════════
    _processNextCue() {
        if (!this.isRunning || this.isPaused) return;
        if (this.scriptIndex >= this.scriptQueue.length) {
            // Script complete — begin fade out
            this._fadeOut(20);
            setTimeout(() => {
                this.stop();
            }, 20000);
            return;
        }

        const cue = this.scriptQueue[this.scriptIndex];
        this.scriptIndex++;

        switch (cue.type) {
            case 'speak':
                this._speak(cue.text);
                break;

            case 'pause':
                this.currentCaption = '· · ·';
                if (this.onCaptionUpdate) this.onCaptionUpdate(this.currentCaption);
                this.pauseTimer = setTimeout(() => {
                    this._processNextCue();
                }, (cue.duration || 3) * 1000);
                break;

            case 'tone_shift':
                this._softToneShift();
                this._processNextCue(); // Continue immediately
                break;

            case 'fade_out':
                this._fadeOut(cue.duration || 20);
                this._processNextCue();
                break;

            default:
                this._processNextCue();
        }
    },

    _speak(text) {
        // Cancel any in-progress speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;   // Slower than default (~95 WPM)
        utterance.pitch = 0.8;   // Lower pitch for a darker, more resonant tone
        utterance.volume = 1.0;

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        // Update live caption
        this.currentCaption = text;
        if (this.onCaptionUpdate) this.onCaptionUpdate(text);

        utterance.onend = () => {
            if (this.isRunning && !this.isPaused) {
                // Small natural pause between lines
                this.pauseTimer = setTimeout(() => {
                    this._processNextCue();
                }, 800);
            }
        };

        utterance.onerror = (e) => {
            console.warn('TTS error:', e.error);
            // Continue despite errors
            if (this.isRunning && !this.isPaused) {
                this.pauseTimer = setTimeout(() => {
                    this._processNextCue();
                }, 1000);
            }
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    },

    // ═══════════════════════════════════════════
    // PLAYBACK CONTROL
    // ═══════════════════════════════════════════
    pause() {
        this.isPaused = true;
        this.synth.pause();
        if (this.mp3Element) this.mp3Element.pause();
        clearTimeout(this.pauseTimer);
        if (this.audioCtx && this.audioCtx.state === 'running') {
            this.audioCtx.suspend();
        }
    },

    resume() {
        this.isPaused = false;
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.synth.resume();
        if (this.mp3Element) this.mp3Element.play();

        // If we were between cues when paused, continue
        if (this.synth.speaking === false && this.isRunning && !this.mp3Element) {
            this._processNextCue();
        }
    },

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentCaption = '';
        clearTimeout(this.pauseTimer);

        // Stop TTS
        this.synth.cancel();

        // Stop MP3
        if (this.mp3Element) {
            this.mp3Element.pause();
            this.mp3Element.src = '';
            this.mp3Element = null;
        }

        // Stop oscillators
        try { if (this.binauralLeft) { this.binauralLeft.stop(); this.binauralLeft.disconnect(); } } catch (e) { }
        try { if (this.binauralRight) { this.binauralRight.stop(); this.binauralRight.disconnect(); } } catch (e) { }
        try { if (this.droneOsc) { this.droneOsc.stop(); this.droneOsc.disconnect(); } } catch (e) { }

        // Disconnect gains
        try { if (this.panLeft) this.panLeft.disconnect(); } catch (e) { }
        try { if (this.panRight) this.panRight.disconnect(); } catch (e) { }
        try { if (this.binauralGain) this.binauralGain.disconnect(); } catch (e) { }
        try { if (this.droneGain) this.droneGain.disconnect(); } catch (e) { }
        try { if (this.masterGain) this.masterGain.disconnect(); } catch (e) { }
        try { if (this.mp3Gain) this.mp3Gain.disconnect(); } catch (e) { }
        try { if (this.mp3Source) this.mp3Source.disconnect(); } catch (e) { }

        // Null references
        this.binauralLeft = null;
        this.binauralRight = null;
        this.droneOsc = null;
        this.panLeft = null;
        this.panRight = null;
        this.binauralGain = null;
        this.droneGain = null;
        this.masterGain = null;
        this.mp3Gain = null;
        this.mp3Source = null;
        this.currentUtterance = null;
        this.scriptQueue = [];
        this.scriptIndex = 0;

        // Close and recreate context for next session
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.close().catch(() => { });
        }
        this.audioCtx = null;

        if (this.onCaptionUpdate) this.onCaptionUpdate('');
    },

    // Get current caption for UI
    getCaption() {
        return this.currentCaption;
    },

    getVoices() {
        return this.synth.getVoices().filter(v => v.lang.startsWith('en'));
    },

    setVoice(voiceName) {
        const voices = this.synth.getVoices();
        const found = voices.find(v => v.name === voiceName);
        if (found) {
            this.selectedVoice = found;
            console.log(`Voice changed to: ${found.name}`);
        }
    },

    testVoice() {
        this.synth.cancel();
        const utter = new SpeechSynthesisUtterance("Welcome to Zenith. This is your professional AI narrator.");
        utter.rate = 0.8;
        if (this.selectedVoice) utter.voice = this.selectedVoice;
        this.synth.speak(utter);
    }
};
