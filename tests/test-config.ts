import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local first so its variables take precedence (dotenv doesn't overwrite)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const TEST_CONFIG = {
    ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || 'password',
    RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || 'resident@example.com',
    RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || 'password',
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
};

export const shouldSkipE2E = () => {
    return TEST_CONFIG.SUPABASE_URL.includes('example.supabase.co') || TEST_CONFIG.SUPABASE_URL.includes('placeholder.supabase.co');
};
