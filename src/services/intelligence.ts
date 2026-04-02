import { supabase } from './supabase';

export const runIntelligencePipeline = async () => {
    const { data: users } = await supabase.from('users').select('id');
    if (!users) return;

    for (const user of users) {
        await updateUserBaseline(user.id);
        await analyzeMultiFactorInsights(user.id);
    }
};

/**
 * Calculates rolling 14-day mood and engagement baselines
 */
const updateUserBaseline = async (userId: string) => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const { data: metrics } = await supabase
        .from('user_daily_metrics')
        .select('avg_mood, session_count')
        .eq('user_id', userId)
        .gte('date', fourteenDaysAgo);

    if (!metrics || metrics.length < 3) return; // Need at least 3 days for baseline

    const moodBaseline = metrics.filter(m => m.avg_mood !== null).reduce((acc, m) => acc + Number(m.avg_mood), 0) / metrics.length;
    const engagementBaseline = metrics.reduce((acc, m) => acc + (m.session_count || 0), 0) / metrics.length;

    await supabase.from('user_profiles').upsert({
        user_id: userId,
        baseline_mood: moodBaseline,
        engagement_baseline: engagementBaseline,
        last_baseline_update: new Date().toISOString()
    });
};

/**
 * Generates rich, personalized insights
 */
const analyzeMultiFactorInsights = async (userId: string) => {
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
    const { data: recentMetrics } = await supabase
        .from('user_daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(7);

    if (!profile || !recentMetrics || recentMetrics.length === 0) return;

    const currentMood = Number(recentMetrics[0].avg_mood);
    const baseline = Number(profile.baseline_mood);
    const reasons: string[] = [];
    let confidence = 0.5;

    // 1. Personalized Threshold Detection
    if (currentMood < baseline - 1.5) {
        reasons.push(`Mood is significantly below your 14-day average of ${baseline.toFixed(1)}`);
        confidence += 0.2;

        // Check engagement correlation
        const recentEngagement = recentMetrics.slice(0, 3).reduce((acc, m) => acc + (m.session_count || 0), 0);
        if (recentEngagement === 0) {
            reasons.push('Low engagement detected alongside mood drop');
            confidence += 0.1;
            await createRichInsight(userId, 'risk', 'High Personalized Risk', 'Your metrics indicate a significant deviation from your normal well-being baseline.', Math.min(1, confidence), reasons, 'Try a 5-minute stress relief session immediately.');
        } else {
            await createRichInsight(userId, 'insight', 'Mood Deviation', 'We noticed you are feeling lower than your usual baseline.', 0.7, reasons, 'Consider taking a short sensory break.');
        }
    }

    // 2. Behavioral Patterns (Burnout)
    const highUsage = recentMetrics.slice(0, 5).every(m => m.session_count! > 2);
    const lowImprovement = currentMood <= baseline;
    if (highUsage && lowImprovement) {
        await createRichInsight(userId, 'pattern', 'Burnout Warning', 'High app usage without mood improvement may indicate digital fatigue.', 0.8, ['5+ consecutive days with 2+ sessions', 'Stagnant mood scores'], 'Reduce session frequency and try offline grounding.');
    }

    // 3. Time-Series (Anomaly Detection)
    if (recentMetrics.length >= 2) {
        const drop = Number(recentMetrics[1].avg_mood) - currentMood;
        if (drop > 3) {
            await createRichInsight(userId, 'risk', 'Sudden Mood Drop', 'A sharp decline in mood was detected since yesterday.', 0.9, [`Sudden drop of ${drop.toFixed(1)} points in 24 hours`], 'Reach out to a trusted contact or friend.');
        }
    }
};

const createRichInsight = async (userId: string, type: string, title: string, content: string, confidence: number, reasons: string[], recommendation: string) => {
    const today = new Date().toISOString().split('T')[0];

    // Idempotency: skip if same insight type created today
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
        confidence,
        reasons,
        recommendation,
        metadata: { generated_by: 'IntelligenceService_v2' }
    }]);
};
