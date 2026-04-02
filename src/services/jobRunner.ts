import { supabase } from './supabase';
import logger from '../utils/logger';

export interface JobOptions {
    name: string;
    maxRetries?: number;
    initialDelayMs?: number;
}

export const runJob = async (task: () => Promise<void>, options: JobOptions) => {
    const { name, maxRetries = 3, initialDelayMs = 1000 } = options;
    const startTime = Date.now();

    // Log start
    const { data: jobEntry } = await supabase.from('job_logs').insert([{
        job_name: name,
        status: 'running'
    }]).select().single();

    let attempt = 0;
    let success = false;
    let lastError = '';

    while (attempt <= maxRetries && !success) {
        try {
            await task();
            success = true;
        } catch (error: any) {
            attempt++;
            lastError = error.message || String(error);
            if (attempt <= maxRetries) {
                const delay = initialDelayMs * Math.pow(2, attempt - 1);
                logger.warn(`Job ${name} failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    const executionTime = Date.now() - startTime;

    // Final log update
    if (jobEntry) {
        await supabase.from('job_logs').update({
            status: success ? 'success' : 'failed',
            execution_time_ms: executionTime,
            errors: success ? null : lastError
        }).eq('id', jobEntry.id);
    }

    if (!success) {
        console.error(`Job ${name} failed after ${maxRetries + 1} attempts.`);
    } else {
        console.log(`Job ${name} completed successfully in ${executionTime}ms.`);
    }
};
