import { getSupabaseClient } from '@/template';
import { SleepSession, SleepQuality } from '@/types';

export const sleepService = {
  async getTodaySleep(userId: string): Promise<{ data: SleepSession | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return { data: data || null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getRecentSleep(userId: string, days: number = 7): Promise<{ data: SleepSession[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  async saveSleep(
    userId: string,
    hours: number,
    quality: SleepQuality,
    notes?: string
  ): Promise<{ data: SleepSession | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      // Map quality to quality_score
      const qualityMap: Record<SleepQuality, number> = {
        excellent: 10,
        good: 8,
        fair: 5,
        poor: 2
      };

      const { data, error } = await supabase
        .from('sleep_logs')
        .upsert({
          user_id: userId,
          date: today,
          sleep_efficiency: (hours / 8) * 100, // Derived efficiency
          quality_score: qualityMap[quality],
          duration_hours: hours,
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  getAverageHours(sessions: SleepSession[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + s.hours, 0);
    return Math.round((total / sessions.length) * 10) / 10;
  },

  getSleepQualityEmoji(quality: SleepQuality): string {
    const emojis = {
      poor: '😴',
      fair: '😐',
      good: '😊',
      excellent: '🌟',
    };
    return emojis[quality];
  },
};
