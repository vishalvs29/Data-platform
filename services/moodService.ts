import { getSupabaseClient } from '@/template';
import { MoodEntry, MoodType } from '@/types';

export const moodService = {
  async saveMoodEntry(userId: string, mood: MoodType, note?: string): Promise<{ data: MoodEntry | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();

      // Map MoodType to numerical mood_score (1-10)
      const moodMap: Record<MoodType, number> = {
        great: 9,
        good: 7,
        okay: 5,
        sad: 3,
        stressed: 2
      };

      const { data, error } = await supabase
        .from('mood_logs')
        .upsert({
          user_id: userId,
          mood_score: moodMap[mood],
          notes: note,
          date: new Date().toISOString().split('T')[0] // Ensure date format matches YYYY-MM-DD
        }, { onConflict: 'user_id, date' })
        .select()
        .single();

      if (error) throw error;

      // Map back to MoodEntry type for frontend compatibility
      const mappedData: MoodEntry = {
        id: data.id,
        mood: mood,
        note: data.notes,
        timestamp: data.created_at
      };

      return { data: mappedData, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getMoodHistory(userId: string): Promise<{ data: MoodEntry[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map back to MoodEntry type
      const mappedData: MoodEntry[] = (data || []).map(d => ({
        id: d.id,
        mood: this.getMoodFromScore(d.mood_score),
        note: d.notes,
        timestamp: d.created_at
      }));

      return { data: mappedData, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  getMoodFromScore: (score: number): MoodType => {
    if (score >= 8) return 'great';
    if (score >= 6) return 'good';
    if (score >= 4) return 'okay';
    if (score >= 2) return 'stressed';
    return 'sad';
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
