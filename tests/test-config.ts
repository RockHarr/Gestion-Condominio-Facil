import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local first (overrides) then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const TEST_CONFIG = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key',
    ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@condominio.com',
    ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || 'dummy_password',
    RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || 'resident@condominio.com',
    RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || 'dummy_password',
};