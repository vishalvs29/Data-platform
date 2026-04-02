import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error via Winston
    logger.error(`[API ERROR] ${req.method} ${req.url}`, {
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        userId: (req as any).user?.id,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
            // Only provide stack trace in non-production environments
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};
