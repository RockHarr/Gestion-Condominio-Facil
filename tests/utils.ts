
import 'dotenv/config';

export const checkTestEnv = () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) return false;
    if (url.includes('placeholder') || url.includes('example')) return false;

    // Check if we have credentials for login too
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'rockwell.harrison@gmail.com'; // Fallback if hardcoded in tests
    const adminPass = process.env.TEST_ADMIN_PASSWORD || '270386';

    if (!adminEmail || !adminPass) return false;

    return true;
};
