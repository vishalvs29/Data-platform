import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import ingestionRouter from './routes/ingestion';
import servingRouter from './routes/serving';
import adminRouter from './routes/admin';
import { createLogger, format, transports } from 'winston';
import { initScheduler } from './jobs/scheduler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Logger setup
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Auth Middleware (Basic API Key for this platform demonstration)
const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden: Invalid API Key' });
    }
};

// Routes
app.use('/api', apiKeyMiddleware, ingestionRouter);
app.use('/api', apiKeyMiddleware, servingRouter);
app.use('/api/admin', adminRouter);

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'up', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(port, () => {
    logger.info(`DrMindit Data Platform running on port ${port}`);
    console.log(`Server started on http://localhost:${port}`);

    // Initialize background scheduler
    initScheduler();
});

export default app;
