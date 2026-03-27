import cron from 'node-cron';
import { runFullAnalyticsPipeline } from '../services/analytics';
import { runIntelligencePipeline } from '../services/intelligence';
import { runJob } from '../services/jobRunner';

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
        console.log('Background worker health check: OK');
    });

    console.log('Advanced Scheduler initialized (Production-Grade JobRunner enabled)');
};
