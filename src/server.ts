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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Security & Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(limiter);

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
