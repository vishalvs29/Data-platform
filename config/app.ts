import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    apiKey: process.env.API_KEY || 'dev-key-123',
    logLevel: process.env.LOG_LEVEL || 'info',
};
