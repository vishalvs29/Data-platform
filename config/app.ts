import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const apiKey = process.env.API_KEY;

if (env === 'production' && !apiKey) {
    throw new Error('FATAL: API_KEY environment variable is required in production mode.');
}

export const config = {
    port: process.env.PORT || 3000,
    env,
    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    apiKey: apiKey || 'dev-key-123',
    logLevel: process.env.LOG_LEVEL || 'info',
};
