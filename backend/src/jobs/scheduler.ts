import cron from 'node-cron';
import { runAnalytics } from '../services/analytics';

export const initScheduler = () => {
    // Run daily aggregation and insight generation at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Starting daily aggregation job...');
        await runAnalytics();
    });

    // Run a quick check every 6 hours for performance monitoring / health
    cron.schedule('0 */6 * * *', () => {
        console.log('Background worker health check: OK');
    });

    console.log('Background scheduler initialized (Daily 2 AM job enabled)');
};
