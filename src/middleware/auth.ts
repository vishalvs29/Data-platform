import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role?: string;
        org_id?: string;
    };
}

export const jwtAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        // Extract metadata (Role / Org) from Supabase User metadata if present
        req.user = {
            id: user.id,
            role: user.user_metadata?.role || 'user',
            org_id: user.user_metadata?.org_id
        };

        next();
    } catch (error: any) {
        logger.error('Authentication error:', error);
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
};

export const adminOnlyMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }
    next();
};
