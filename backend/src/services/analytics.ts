import { supabase } from './supabase';

export const runAnalytics = async () => {
    console.log('Running background analytics job...');

    // 1. Fetch all users
    const { data: users, error: userError } = await supabase.from('users').select('id');
    if (userError) {
        console.error('Error fetching users for analytics:', userError);
        return;
    }

    for (const user of users) {
        await processUserAnalytics(user.id);
    }
};

const processUserAnalytics = async (userId: string) => {
    // 1. Mood Streak Detection (Recent Low Mood Streak)
    // Check last 3 days
    const { data: recentMoods, error: moodError } = await supabase
        .from('mood_logs')
        .select('mood_score, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(3);

    if (!moodError && recentMoods && recentMoods.length === 3) {
        const isLowStreak = recentMoods.every(m => m.mood_score < 4);
        if (isLowStreak) {
            await createInsight(userId, 'low_mood_streak', 'Detected a low mood streak over the past 3 days. Consider reaching out for support.', 'high');
        }
    }

    // 2. Stress Spike Detection (Sudden drop in mood)
    if (!moodError && recentMoods && recentMoods.length >= 2) {
        const lastMood = recentMoods[0].mood_score;
        const prevMood = recentMoods[1].mood_score;
        if (prevMood - lastMood >= 4) {
            await createInsight(userId, 'stress_spike', 'Sudden drop in mood detected today. Are you feeling okay?', 'medium');
        }
    }

    // 3. User Summary / Engagement Warning
    const { count, error: countError } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!countError && (count === null || count === 0)) {
        await createInsight(userId, 'low_engagement', 'You haven\'t completed any sessions this week. Need some motivation?', 'low');
    }
};

const createInsight = async (userId: string, type: string, content: string, severity: string) => {
    // Check if same insight already exists for today to avoid spam
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
        .from('insights')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('created_at', today);

    if (existing && existing.length > 0) return;

    await supabase.from('insights').insert([{
        user_id: userId,
        type,
        content,
        metadata: { severity }
    }]);
};
