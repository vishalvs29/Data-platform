import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

/**
 * AudioManager: A robust singleton for handling all audio playback in the app.
 * Resolves SS-001 by ensuring audio is not created ad-hoc and is properly cleaned up.
 */
class AudioManager {
    private static instance: AudioManager;
    private sound: Audio.Sound | null = null;
    private isPlaying: boolean = false;
    private onTimeUpdate: ((seconds: number) => void) | null = null;
    private timer: any = null;

    private constructor() { }

    public static getInstance(): AudioManager {
        if (!this.instance) {
            this.instance = new AudioManager();
        }
        return this.instance;
    }

    async load(uri: string, autoPlay: boolean = true) {
        await this.unload(); // Always clean up before loading new audio

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: autoPlay }
            );
            this.sound = sound;
            this.isPlaying = autoPlay;

            this.sound.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate.bind(this));

            if (autoPlay) this._startTimer();
            console.log('✦ AudioManager: Audio loaded successfully.');
        } catch (error) {
            console.error('✦ AudioManager: Error loading audio:', error);
        }
    }

    async play() {
        if (this.sound) {
            await this.sound.playAsync();
            this.isPlaying = true;
            this._startTimer();
        }
    }

    async pause() {
        if (this.sound) {
            await this.sound.pauseAsync();
            this.isPlaying = false;
            this._stopTimer();
        }
    }

    async stop() {
        if (this.sound) {
            await this.sound.stopAsync();
            this.isPlaying = false;
            this._stopTimer();
        }
        await Speech.stop();
    }

    async unload() {
        this._stopTimer();
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }
        this.isPlaying = false;
        await Speech.stop();
        console.log('✦ AudioManager: Audio unloaded and cleaned up.');
    }

    setOnTimeUpdate(callback: (seconds: number) => void) {
        this.onTimeUpdate = callback;
    }

    private _onPlaybackStatusUpdate(status: any) {
        if (status.isLoaded && status.didJustFinish) {
            this.isPlaying = false;
            this._stopTimer();
            // Handle completion logic if needed
        }
    }

    private _startTimer() {
        this._stopTimer();
        this.timer = setInterval(async () => {
            if (this.sound && this.isPlaying && this.onTimeUpdate) {
                const status = await this.sound.getStatusAsync();
                if (status.isLoaded) {
                    this.onTimeUpdate(Math.floor(status.positionMillis / 1000));
                }
            }
        }, 1000);
    }

    private _stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

export const audioManager = AudioManager.getInstance();
