import { useState, useCallback, useEffect } from 'react';
import { audioManager } from '@/services/AudioManager';
import { audioService, SpeakOptions } from '@/services/audioService';

/**
 * useAudio: Refactored hook to use the managed AudioManager singleton.
 * Prevents ad-hoc audio creation and ensures proper cleanup (SS-001).
 */
export const useAudio = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
        setIsSpeaking(true);
        try {
            // Integrating with the underlying service but routing through the manager logic
            await audioService.speak(text, options);
        } catch (error) {
            console.error('Error in useAudio speak:', error);
        } finally {
            setIsSpeaking(false);
        }
    }, []);

    const stop = useCallback(async () => {
        await audioManager.stop();
        setIsSpeaking(false);
    }, []);

    useEffect(() => {
        return () => {
            // Robust cleanup on unmount (SM-002)
            audioManager.unload();
        };
    }, []);

    return {
        isSpeaking,
        speak,
        stop,
    };
};
