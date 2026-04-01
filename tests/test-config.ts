export function checkTestEnv() {
    // In CI, these might not be set.
    // We check for them to decide whether to skip tests that require a real backend.
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn('⚠️ Missing Supabase credentials in environment. Skipping backend-dependent test.');
        return false;
    }
    return true;
}
