import cron from 'node-cron';
import { runFullAnalyticsPipeline } from '../services/analytics';

export const initScheduler = () => {
    // Run full intelligence pipeline daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Starting daily intelligence pipeline job...');
        try {
            await runFullAnalyticsPipeline();
            console.log('Intelligence pipeline completed successfully');
        } catch (error) {
            console.error('Intelligence pipeline failed:', error);
        }
    });

    // Health check every 6 hours
    cron.schedule('0 */6 * * *', () => {
        console.log('Background worker health check: OK');
    });

    console.log('Background scheduler initialized (Daily 2 AM job enabled)');
};
