import { getSupabaseClient } from '@/template';
import { MoodEntry, MoodType } from '@/types';

export const moodService = {
  async saveMoodEntry(userId: string, mood: MoodType, note?: string): Promise<{ data: MoodEntry | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: userId,
          mood,
          note,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getMoodHistory(userId: string): Promise<{ data: MoodEntry[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  getMoodLabel: (mood: MoodType): string => {
    const labels: Record<MoodType, string> = {
      great: 'Great',
      good: 'Good',
      okay: 'Okay',
      sad: 'Sad',
      stressed: 'Stressed',
    };
    return labels[mood];
  },

  getMoodEmoji: (mood: MoodType): string => {
    const emojis: Record<MoodType, string> = {
      great: '😊',
      good: '🙂',
      okay: '😐',
      sad: '😢',
      stressed: '😰',
    };
    return emojis[mood];
  },

  getMoodDescription: (mood: MoodType): string => {
    const descriptions: Record<MoodType, string> = {
      great: "You're feeling wonderful today!",
      good: "You're doing well!",
      okay: "You're managing fine.",
      sad: "It's okay to feel sad sometimes.",
      stressed: "Take a deep breath, you've got this.",
    };
    return descriptions[mood];
  },
};
