import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

const router = Router();

// GET /api/insights?user_id=...
router.get('/insights', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        const { data, error } = await supabase
            .from('insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/trends?user_id=...
router.get('/trends', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        // Fetch daily trend (last 7 days)
        const { data: daily } = await supabase
            .from('user_daily_metrics')
            .select('date, avg_mood')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(7);

        // Fetch weekly trend (latest)
        const { data: weekly } = await supabase
            .from('user_weekly_metrics')
            .select('avg_mood, mood_direction, engagement_score')
            .eq('user_id', userId)
            .order('week_start', { ascending: false })
            .limit(1);

        res.json({
            success: true,
            data: {
                daily_history: daily || [],
                weekly_summary: weekly?.[0] || null,
                mood_direction: weekly?.[0]?.mood_direction || 'stable'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/risk?user_id=...
router.get('/risk', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        const { data: insights } = await supabase
            .from('insights')
            .select('type, content, metadata')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        const riskInsight = insights?.find(i => i.metadata?.category === 'risk');

        res.json({
            success: true,
            data: {
                risk_level: riskInsight ? riskInsight.metadata.riskLevel : 'low',
                reason: riskInsight ? riskInsight.content : 'No significant risks detected recently.',
                latest_findings: insights?.map(i => i.type) || []
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/user-summary (legacy but updated)
router.get('/user-summary', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        const { data: metrics } = await supabase
            .from('user_weekly_metrics')
            .select('avg_mood, engagement_score')
            .eq('user_id', userId)
            .order('week_start', { ascending: false })
            .limit(1);

        res.json({
            success: true,
            data: {
                avg_mood: metrics?.[0]?.avg_mood || 0,
                engagement_score: metrics?.[0]?.engagement_score || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
