import { useState, useEffect } from 'react';
import { useAuth } from '@/template';
import { sleepService } from '@/services/sleepService';
import { SleepSession, SleepQuality } from '@/types';

export function useSleep() {
  const { user } = useAuth();
  const [todaySleep, setTodaySleep] = useState<SleepSession | null>(null);
  const [recentSleep, setRecentSleep] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSleepData();
    } else {
      setTodaySleep(null);
      setRecentSleep([]);
      setLoading(false);
    }
  }, [user]);

  const loadSleepData = async () => {
    if (!user) return;
    
    setLoading(true);
    const [todayResult, recentResult] = await Promise.all([
      sleepService.getTodaySleep(user.id),
      sleepService.getRecentSleep(user.id, 7),
    ]);

    if (!todayResult.error) setTodaySleep(todayResult.data);
    if (!recentResult.error) setRecentSleep(recentResult.data);
    setLoading(false);
  };

  const saveSleep = async (hours: number, quality: SleepQuality, notes?: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    const { data, error } = await sleepService.saveSleep(user.id, hours, quality, notes);
    if (!error && data) {
      setTodaySleep(data);
      await loadSleepData(); // Refresh recent sleep
    }
    return { data, error };
  };

  return {
    todaySleep,
    recentSleep,
    loading,
    saveSleep,
    refreshSleep: loadSleepData,
  };
}
