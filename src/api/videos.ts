import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import logger from '../utils/logger';

const router = Router();

// Validation Schemas
const progressSchema = z.object({
    last_position_seconds: z.number().min(0),
    is_completed: z.boolean().default(false),
});

// GET /api/videos - List all videos with optional category filter
router.get('/', async (req: Request, res: Response) => {
    const category = req.query.category as string;

    try {
        let query = supabase.from('video_sessions').select('*').order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        logger.error('Error fetching videos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/videos/:id/progress - Get user progress for a video
router.get('/:id/progress', async (req: Request, res: Response) => {
    const videoId = req.params.id;
    const userId = req.headers['x-user-id'] as string; // Ideally from auth middleware

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
        const { data, error } = await supabase
            .from('video_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('video_id', videoId)
            .maybeSingle();

        if (error) throw error;

        res.json({
            success: true,
            data: data || { last_position_seconds: 0, is_completed: false }
        });
    } catch (error: any) {
        logger.error(`Error fetching progress for video ${videoId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/videos/:id/progress - Update user progress
router.post('/:id/progress', async (req: Request, res: Response) => {
    const videoId = req.params.id;
    const userId = req.headers['x-user-id'] as string;

    try {
        const payload = progressSchema.parse(req.body);

        const { error } = await supabase
            .from('video_progress')
            .upsert({
                user_id: userId,
                video_id: videoId,
                last_position_seconds: payload.last_position_seconds,
                is_completed: payload.is_completed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,video_id' });

        if (error) throw error;

        res.json({ success: true, message: 'Progress synchronized' });
    } catch (error: any) {
        logger.error(`Error updating progress for video ${videoId}:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
