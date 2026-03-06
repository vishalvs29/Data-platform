import { getSupabaseClient } from '@/template';
import { FocusSession } from '@/types';

export const focusService = {
  async getTodayFocus(userId: string): Promise<{ data: FocusSession[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  async getRecentFocus(userId: string, days: number = 7): Promise<{ data: FocusSession[]; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  async addFocusSession(
    userId: string,
    durationMinutes: number,
    activity?: string,
    notes?: string
  ): Promise<{ data: FocusSession | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: userId,
          date: today,
          duration_minutes: durationMinutes,
          activity,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  getTotalMinutes(sessions: FocusSession[]): number {
    return sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  },

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },
};
