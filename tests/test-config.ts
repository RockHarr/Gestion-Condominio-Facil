import 'dotenv/config';

export const checkTestEnv = () => {
    const url = process.env.VITE_SUPABASE_URL;
    if (!url || url.includes('example.supabase.co')) {
        console.warn('Skipping test: VITE_SUPABASE_URL is missing or invalid.');
        return false;
    }
    return true;
};

// Fallback to hardcoded for local dev if not in .env, but usually .env has them.
// In CI, we expect these to be set or we skip.
export const TEST_RESIDENT_EMAIL = process.env.TEST_RESIDENT_EMAIL || 'contacto@rockcode.cl';
export const TEST_RESIDENT_PASSWORD = process.env.TEST_RESIDENT_PASSWORD || '180381';
export const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'rockwell.harrison@gmail.com';
export const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '270386';
