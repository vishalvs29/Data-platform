import { useState, useEffect } from 'react';
import { useAuth } from '@/template';
import { focusService } from '@/services/focusService';
import { FocusSession } from '@/types';

export function useFocus() {
  const { user } = useAuth();
  const [todayFocus, setTodayFocus] = useState<FocusSession[]>([]);
  const [recentFocus, setRecentFocus] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFocusData();
    } else {
      setTodayFocus([]);
      setRecentFocus([]);
      setLoading(false);
    }
  }, [user]);

  const loadFocusData = async () => {
    if (!user) return;
    
    setLoading(true);
    const [todayResult, recentResult] = await Promise.all([
      focusService.getTodayFocus(user.id),
      focusService.getRecentFocus(user.id, 7),
    ]);

    if (!todayResult.error) setTodayFocus(todayResult.data);
    if (!recentResult.error) setRecentFocus(recentResult.data);
    setLoading(false);
  };

  const addSession = async (durationMinutes: number, activity?: string, notes?: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    const { data, error } = await focusService.addFocusSession(user.id, durationMinutes, activity, notes);
    if (!error && data) {
      await loadFocusData(); // Refresh data
    }
    return { data, error };
  };

  return {
    todayFocus,
    recentFocus,
    loading,
    addSession,
    refreshFocus: loadFocusData,
  };
}
