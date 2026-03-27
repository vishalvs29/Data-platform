import { supabase } from './supabase';

export const runFullAnalyticsPipeline = async () => {
    console.log('Starting full intelligence pipeline...');
    const { data: users, error: userError } = await supabase.from('users').select('id');
    if (userError) return;

    for (const user of users) {
        await updateDailyMetrics(user.id);
        await updateWeeklyTrendsAndInsights(user.id);
    }
};

/**
 * Aggregates raw data into user_daily_metrics
 */
const updateDailyMetrics = async (userId: string, date: string = new Date().toISOString().split('T')[0]) => {
    // 1. Avg Mood
    const { data: moodData } = await supabase
        .from('mood_logs')
        .select('mood_score')
        .eq('user_id', userId)
        .eq('date', date);

    const avgMood = moodData?.length ? moodData.reduce((acc, m) => acc + m.mood_score, 0) / moodData.length : null;

    // 2. Session Stats
    const { data: sessions } = await supabase
        .from('user_sessions')
        .select('duration_seconds, completed')
        .eq('user_id', userId)
        .gte('timestamp', date + 'T00:00:00')
        .lt('timestamp', date + 'T23:59:59');

    const sessionCount = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completed).length || 0;
    const completionRate = sessionCount ? (completedSessions / sessionCount) * 100 : 0;
    const activeDuration = sessions?.reduce((acc, s) => acc + s.duration_seconds, 0) || 0;

    // 3. Upsert into user_daily_metrics
    await supabase.from('user_daily_metrics').upsert({
        user_id: userId,
        date,
        avg_mood: avgMood,
        session_count: sessionCount,
        completion_rate: completionRate,
        active_duration: activeDuration,
        updated_at: new Date().toISOString()
    });
};

/**
 * Computes weekly trends, mood direction, and flags risks
 */
const updateWeeklyTrendsAndInsights = async (userId: string) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];

    // 1. Fetch daily metrics for last 2 weeks
    const { data: metrics } = await supabase
        .from('user_daily_metrics')
        .select('avg_mood, session_count, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(14);

    if (!metrics || metrics.length === 0) return;

    const currentWeek = metrics.filter(m => m.date >= weekStart && m.avg_mood !== null);
    const prevWeek = metrics.filter(m => m.date < weekStart && m.avg_mood !== null);

    const avgCurrent = currentWeek.length ? currentWeek.reduce((acc, m) => acc + Number(m.avg_mood), 0) / currentWeek.length : null;
    const avgPrev = prevWeek.length ? prevWeek.reduce((acc, m) => acc + Number(m.avg_mood), 0) / prevWeek.length : null;

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (avgCurrent && avgPrev) {
        if (avgCurrent > avgPrev + 0.5) direction = 'improving';
        else if (avgCurrent < avgPrev - 0.5) direction = 'declining';
    }

    // 2. Engagement Score (0-100)
    const activeDays = currentWeek.filter(m => m.session_count! > 0).length;
    const engagementScore = Math.min(100, (activeDays / 7) * 100);

    // 3. Upsert Weekly Metrics
    await supabase.from('user_weekly_metrics').upsert({
        user_id: userId,
        week_start: weekStart,
        avg_mood: avgCurrent,
        mood_direction: direction,
        engagement_score: Math.round(engagementScore),
        updated_at: new Date().toISOString()
    });

    // 4. Intelligence Rules (Stress / Risk / Insights)
    await applyIntelligenceRules(userId, metrics, direction);
};

const applyIntelligenceRules = async (userId: string, metrics: any[], direction: string) => {
    const recent = metrics.slice(0, 3);

    // Stress Rule: 3 consecutive days < 3
    const highStress = recent.length === 3 && recent.every(m => m.avg_mood !== null && m.avg_mood < 3);
    if (highStress) {
        await createIntelligentInsight(userId, 'risk', 'High Stress Detected', 'High stress levels detected over 3 consecutive days. Reach out for support.', 'high');
    }

    // Emotional Instability: Heavy fluctuation
    if (recent.length >= 3) {
        const moods = recent.map(m => Number(m.avg_mood)).filter(m => !isNaN(m));
        const range = Math.max(...moods) - Math.min(...moods);
        if (range > 5) {
            await createIntelligentInsight(userId, 'insight', 'Emotional Instability', 'Your mood has been fluctuating heavily. Consider a grounding exercise.', 'medium');
        }
    }

    // Mood Direction Insight
    if (direction === 'declining') {
        await createIntelligentInsight(userId, 'insight', 'Mood Trend Warning', 'We noticed a slight decline in your mood this week. Taking a small break might help.', 'medium');
    } else if (direction === 'improving') {
        await createIntelligentInsight(userId, 'insight', 'Positive Progress', 'Great job! Your mood is on an upward trend this week.', 'low');
    }

    // Drop-off detection
    const lastActive = metrics.find(m => m.session_count! > 0);
    if (lastActive) {
        const daysSince = (new Date().getTime() - new Date(lastActive.date).getTime()) / (1000 * 3600 * 24);
        if (daysSince > 3) {
            await createIntelligentInsight(userId, 'engagement', 'Welcome Back?', 'It\'s been a few days since your last session. Ready to jump back in?', 'low');
        }
    }
};

const createIntelligentInsight = async (userId: string, category: string, title: string, content: string, riskLevel: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
        .from('insights')
        .select('id')
        .eq('user_id', userId)
        .eq('type', title)
        .gte('created_at', today);

    if (existing && existing.length > 0) return;

    await supabase.from('insights').insert([{
        user_id: userId,
        type: title,
        content: `${title}: ${content}`,
        metadata: { category, riskLevel, recommendation: getRecommendation(category) }
    }]);
};

const getRecommendation = (category: string) => {
    switch (category) {
        case 'risk': return 'Talk to a professional counselor or friend.';
        case 'insight': return 'Try the 4-7-8 breathing technique.';
        case 'engagement': return 'Start a quick 2-minute focus session.';
        default: return 'Keep tracking your daily stats.';
    }
};
