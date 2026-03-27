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

// GET /api/mood-trends?user_id=...
router.get('/mood-trends', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        const { data, error } = await supabase
            .from('mood_logs')
            .select('date, mood_score')
            .eq('user_id', userId)
            .order('date', { ascending: true })
            .limit(30); // Last 30 entries

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/user-summary?user_id=...
router.get('/user-summary', async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ success: false, error: 'user_id is required' });

    try {
        // 1. Avg Mood
        const { data: moodData } = await supabase.rpc('calculate_avg_mood', { user_uuid: userId });

        // 2. Session Count
        const { count: sessionCount } = await supabase
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 3. Completion Rate
        const { count: completedSessions } = await supabase
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true);

        const completionRate = sessionCount ? (completedSessions! / sessionCount!) * 100 : 0;

        res.json({
            success: true,
            data: {
                avg_mood: moodData || null,
                total_sessions: sessionCount || 0,
                completion_rate: completionRate.toFixed(2) + '%'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
