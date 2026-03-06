import { useState, useEffect } from 'react';
import { MoodEntry, MoodType } from '@/types';
import { moodService } from '@/services/moodService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_STORAGE_KEY = '@mindful_moods';

export function useMood() {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      const stored = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
      if (stored) {
        const parsedMoods: MoodEntry[] = JSON.parse(stored);
        setMoods(parsedMoods);
        
        // Check if there's a mood entry for today
        const today = new Date().setHours(0, 0, 0, 0);
        const todayEntry = parsedMoods.find(m => {
          const moodDate = new Date(m.timestamp).setHours(0, 0, 0, 0);
          return moodDate === today;
        });
        setTodayMood(todayEntry || null);
      }
    } catch (error) {
      console.error('Failed to load moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMood = async (mood: MoodType, note?: string) => {
    try {
      const entry = moodService.saveMoodEntry(mood, note);
      
      // Remove any existing mood entry for today
      const today = new Date().setHours(0, 0, 0, 0);
      const filteredMoods = moods.filter(m => {
        const moodDate = new Date(m.timestamp).setHours(0, 0, 0, 0);
        return moodDate !== today;
      });
      
      const updatedMoods = [entry, ...filteredMoods];
      await AsyncStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(updatedMoods));
      setMoods(updatedMoods);
      setTodayMood(entry);
    } catch (error) {
      console.error('Failed to save mood:', error);
      throw error;
    }
  };

  const getMoodStats = () => {
    const last7Days = moods.slice(0, 7);
    const moodCounts: Record<MoodType, number> = {
      great: 0,
      good: 0,
      okay: 0,
      sad: 0,
      stressed: 0,
    };

    last7Days.forEach(entry => {
      moodCounts[entry.mood]++;
    });

    return { moodCounts, totalDays: last7Days.length };
  };

  return {
    moods,
    todayMood,
    loading,
    saveMood,
    getMoodStats,
  };
}
