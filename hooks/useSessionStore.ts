import { create } from 'zustand';
import { audioManager } from '../services/AudioManager';

export type SessionStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'exited';

interface SessionState {
    activeSession: any | null;
    status: SessionStatus;
    elapsedTime: number;
    duration: number;
    showExitConfirmation: boolean;
    isCompleted: boolean;

    // Actions
    startSession: (session: any) => Promise<void>;
    togglePlayback: () => void;
    requestExit: () => void;
    cancelExit: () => void;
    stopSession: (immediate?: boolean) => Promise<void>;
    finishSession: () => void;
    updateTime: (seconds: number) => void;
    reset: () => void;
}

/**
 * useSessionStore: The single source of truth for all session-related state.
 * Resolves SM-001 by eliminating duplicate data across components.
 */
export const useSessionStore = create<SessionState>((set, get) => ({
    activeSession: null,
    status: 'idle',
    elapsedTime: 0,
    duration: 0,
    showExitConfirmation: false,
    isCompleted: false,

    startSession: async (session) => {
        // 1. Reset and set loading state
        set({
            activeSession: session,
            status: 'loading',
            elapsedTime: 0,
            duration: session.duration * 60,
            isCompleted: false
        });

        // 2. Setup Audio Update Listener
        audioManager.setOnTimeUpdate((seconds) => {
            get().updateTime(seconds);
        });

        // 3. Load and start audio
        // Assuming session has an audioUri property
        await audioManager.load(session.audioUri || 'https://example.com/meditation.mp3', true);
        set({ status: 'playing' });
    },

    togglePlayback: async () => {
        const { status } = get();
        if (status === 'playing') {
            set({ status: 'paused' });
            await audioManager.pause();
        } else {
            set({ status: 'playing' });
            await audioManager.play();
        }
    },

    requestExit: () => set({ showExitConfirmation: true }),

    cancelExit: () => set({ showExitConfirmation: false }),

    stopSession: async (immediate = true) => {
        const { activeSession } = get();
        if (!activeSession) return;

        await audioManager.stop();
        await audioManager.unload(); // Critical cleanup (SS-001)

        set({
            activeSession: null,
            status: 'exited',
            showExitConfirmation: false,
            elapsedTime: 0
        });

        console.log('✦ Session Store: Session stopped/exited and audio cleaned up.');
    },

    finishSession: () => {
        set({ isCompleted: true, status: 'completed' });
        get().stopSession(false); // standard stop on finish
    },

    updateTime: (seconds) => {
        const { duration, isCompleted } = get();
        if (isCompleted) return;

        set({ elapsedTime: seconds });

        if (seconds >= duration && duration > 0) {
            get().finishSession();
        }
    },

    reset: () => {
        audioManager.unload();
        set({
            activeSession: null,
            status: 'idle',
            elapsedTime: 0,
            duration: 0,
            showExitConfirmation: false,
            isCompleted: false
        });
    }
}));
