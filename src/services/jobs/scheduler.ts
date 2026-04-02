import cron from 'node-cron';
import { runFullAnalyticsPipeline } from '../analytics';
import { runIntelligencePipeline } from '../intelligence';
import { runJob } from '../jobRunner';
import logger from '../../utils/logger';

export const initScheduler = () => {
    // 1. Daily Analytics & Metrics Aggregation (2:00 AM)
    cron.schedule('0 2 * * *', async () => {
        await runJob(runFullAnalyticsPipeline, { name: 'DailyAnalyticsPipeline' });
    });

    // 2. Intelligence & Personalization Pipeline (3:00 AM)
    cron.schedule('0 3 * * *', async () => {
        await runJob(runIntelligencePipeline, { name: 'IntelligenceEnginePipeline' });
    });

    // 3. Health check every 6 hours
    cron.schedule('0 */6 * * *', () => {
        logger.info('Background worker health check: OK');
    });

    logger.info('Advanced Scheduler initialized (Production-Grade JobRunner enabled)');
};
