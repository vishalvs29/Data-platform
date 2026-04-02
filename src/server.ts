import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ingestionRouter from './api/ingestion';
import servingRouter from './api/serving';
import adminRouter from './api/admin';
import videoRouter from './api/videos';
import { initScheduler } from './services/jobs/scheduler';
import logger from './utils/logger';
import { config } from '../config/app';

const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Auth Middleware
const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === config.apiKey) {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden: Invalid API Key' });
    }
};

// Routes
app.use('/api', apiKeyMiddleware, ingestionRouter);
app.use('/api', apiKeyMiddleware, servingRouter);
app.use('/api/videos', apiKeyMiddleware, videoRouter);
app.use('/api/admin', adminRouter);

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'up',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// Start Server
app.listen(port, () => {
    logger.info(`DrMindit Data Platform running on port ${port} [${config.env}]`);

    // Initialize background scheduler
    initScheduler();
});

export default app;
