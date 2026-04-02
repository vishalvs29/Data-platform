import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';

const router = Router();

// Validation Schemas
const moodSchema = z.object({
    user_id: z.string().uuid(),
    mood_score: z.number().min(1).max(10),
    note: z.string().optional(),
});

const sessionSchema = z.object({
    user_id: z.string().uuid(),
    session_type: z.string(),
    duration_seconds: z.number().min(0),
    completed: z.boolean().default(true),
});

const eventSchema = z.object({
    user_id: z.string().uuid(),
    event_type: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/mood
router.post('/mood', async (req: Request, res: Response) => {
    try {
        const data = moodSchema.parse(req.body);
        const { error } = await supabase
            .from('mood_logs')
            .insert([{
                user_id: data.user_id,
                mood_score: data.mood_score,
                notes: data.note, // Existing table uses 'notes'
                date: new Date().toISOString().split('T')[0]
            }]);

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Mood logged successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || error });
    }
});

// POST /api/session
router.post('/session', async (req: Request, res: Response) => {
    try {
        const data = sessionSchema.parse(req.body);
        const { error } = await supabase
            .from('user_sessions')
            .insert([data]);

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Session logged successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || error });
    }
});

// POST /api/events
router.post('/events', async (req: Request, res: Response) => {
    try {
        const data = eventSchema.parse(req.body);
        const { error } = await supabase
            .from('events')
            .insert([data]);

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Event logged successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || error });
    }
});

export default router;
