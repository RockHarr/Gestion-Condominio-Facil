import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env file if present
// process.cwd() is usually the project root where .env lives
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function checkTestEnv() {
    // In CI, these should be set in the environment.
    // Locally, they might be in .env
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    // Strict validation to avoid "undefined" string or placeholders
    const isValid = (val: string | undefined) => {
        return val &&
               val !== 'undefined' &&
               val !== 'null' &&
               val !== 'placeholder' &&
               !val.includes('placeholder.supabase.co');
    };

    if (!isValid(url) || !isValid(key)) {
        console.warn('Skipping test: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing or invalid.');
        return false;
    }
    return true;
}
