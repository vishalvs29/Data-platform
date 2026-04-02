"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    apiKey: process.env.API_KEY || 'dev-key-123',
    logLevel: process.env.LOG_LEVEL || 'info',
};
