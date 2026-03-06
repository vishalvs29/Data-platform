import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { audioService, SpeakOptions } from '@/services/audioService';

export const useAudio = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
        setIsSpeaking(true);
        try {
            await audioService.speak(text, options);
        } catch (error) {
            console.error('Error in useAudio speak:', error);
        } finally {
            setIsSpeaking(false);
        }
    }, []);

    const stop = useCallback(async () => {
        await audioService.stop();
        setIsSpeaking(false);
    }, []);

    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        isSpeaking,
        speak,
        stop,
    };
};
