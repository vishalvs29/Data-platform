import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import ingestionRouter from './api/ingestion';
import servingRouter from './api/serving';
import adminRouter from './api/admin';
import videoRouter from './api/videos';
import { initScheduler } from './services/jobs/scheduler';
import logger from './utils/logger';
import { jwtAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { config } from '../config/app';
import { supabase } from './services/supabase';

const app = express();
const port = config.port;

// Enhanced CORS Policy
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or if origin is whitelisted
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || config.env === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Security & Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' }
});

const ingestionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // strict limit for ingestion
    message: { success: false, error: 'Too much traffic on data ingestion endpoints. Slow down.' }
});

app.use('/api', globalLimiter);
app.use('/api/ingestion', ingestionLimiter);

// Routes
app.use('/api', jwtAuthMiddleware, ingestionRouter);
app.use('/api', jwtAuthMiddleware, servingRouter);
app.use('/api/videos', jwtAuthMiddleware, videoRouter);
app.use('/api/admin', jwtAuthMiddleware, adminRouter);

// Enhanced Health Check
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('users').select('id').limit(1);
        const dbStatus = error ? 'down' : 'up';

        res.json({
            status: 'ok',
            database: dbStatus,
            timestamp: new Date().toISOString(),
            version: '2.1.0-prod'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'down' });
    }
});

// Final Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(port, () => {
    logger.info(`DrMindit Data Platform running on port ${port} [${config.env}]`);

    // Initialize background scheduler
    initScheduler();
});

export default app;
