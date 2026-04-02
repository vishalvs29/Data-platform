import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

const router = Router();

// Middleware to check admin role (simplified for demo)
const isAdmin = async (req: Request, res: Response, next: any) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { data: profile } = await supabase.from('user_profiles').select('role, org_id').eq('user_id', userId).single();
    if (profile?.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });

    (req as any).orgId = profile.org_id;
    next();
};

// GET /api/admin/overview
router.get('/overview', isAdmin, async (req: Request, res: Response) => {
    const orgId = (req as any).orgId;

    try {
        // 1. Total & Active Users
        const { count: totalUsers } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId);

        // 2. Avg Mood (Last 7 days)
        const { data: moodData } = await supabase.rpc('get_org_avg_mood', { p_org_id: orgId });

        // 3. High Risk Count
        const { count: highRiskCount } = await supabase
            .from('insights')
            .select('user_id', { count: 'exact', head: true })
            .filter('metadata->>riskLevel', 'eq', 'high')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());

        res.json({
            success: true,
            data: {
                total_users: totalUsers || 0,
                active_users: Math.round((totalUsers || 0) * 0.8), // Mock active users for now
                avg_mood: moodData?.[0]?.avg_mood || 0,
                high_risk_count: highRiskCount || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/risk-distribution
router.get('/risk-distribution', isAdmin, async (req: Request, res: Response) => {
    const orgId = (req as any).orgId;

    try {
        const { data: risks } = await supabase
            .from('insights')
            .select('metadata->riskLevel')
            .eq('user_id', supabase.from('users').select('id').eq('org_id', orgId)) // Filtering by users in this org
            .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());

        const distribution = { low: 0, medium: 0, high: 0 };
        risks?.forEach(r => {
            const level = (r as any).riskLevel as keyof typeof distribution;
            if (distribution[level] !== undefined) distribution[level]++;
        });

        res.json({
            success: true,
            data: [
                { name: 'Low Risk', value: distribution.low || 10 }, // Fallback for demo
                { name: 'Medium Risk', value: distribution.medium || 5 },
                { name: 'High Risk', value: distribution.high || 2 }
            ]
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/high-risk-alerts
router.get('/high-risk-alerts', isAdmin, async (req: Request, res: Response) => {
    const orgId = (req as any).orgId;

    try {
        const { data: alerts } = await supabase
            .from('insights')
            .select('user_id, type, content, confidence, recommendation, created_at')
            .eq('user_id', supabase.from('users').select('id').eq('org_id', orgId))
            .filter('metadata->>riskLevel', 'eq', 'high')
            .order('created_at', { ascending: false })
            .limit(20);

        res.json({ success: true, data: alerts });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
