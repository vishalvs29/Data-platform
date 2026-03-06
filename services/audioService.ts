import * as Speech from 'expo-speech';
import { Audio } from 'expo-av'; // Using expo-av as it's more stable for URI playback in some Expo versions, but package.json has both.
// Given package.json has expo-audio ~0.4.6 and expo-av ~15.1.2. I'll stick to a generic approach or use expo-av which is more common for this.

export interface SpeakOptions {
  voice?: string;
  useAI?: boolean;
}

const UNREAL_SPEECH_API_KEY = process.env.EXPO_PUBLIC_UNREAL_SPEECH_API_KEY || '';
const UNREAL_SPEECH_URL = 'https://api.unrealspeech.com/speech';

export const audioService = {
  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const { useAI = true, voice = 'will' } = options;

    if (useAI && UNREAL_SPEECH_API_KEY) {
      try {
        const response = await fetch(UNREAL_SPEECH_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNREAL_SPEECH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Text: text,
            VoiceId: voice,
            Bitrate: '192k',
            Speed: '0',
            Pitch: '1.0',
            TimestampType: 'sentence', // can be word or sentence
          }),
        });

        if (!response.ok) {
          throw new Error('AI Voice API request failed');
        }

        const data = await response.json();
        const audioUri = data.OutputUri;

        if (audioUri) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );
          // Optional: handle sound unload
          return;
        }
      } catch (error) {
        console.error('AI Voice Error, falling back to native Speech:', error);
      }
    }

    // Fallback to native Speech
    Speech.speak(text, {
      language: 'en',
    });
  },

  async stop(): Promise<void> {
    await Speech.stop();
    // For AI voice, we might need to track the sound object to stop it.
    // This is handled better in the hook.
  }
};
