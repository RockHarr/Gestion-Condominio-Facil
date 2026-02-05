export const checkTestEnv = (): boolean => {
    // Check if we have Supabase URL and Key in env
    const hasUrl = !!process.env.VITE_SUPABASE_URL;
    const hasKey = !!process.env.VITE_SUPABASE_ANON_KEY;

    // In CI, these might be missing if secrets aren't injected.
    if (!hasUrl || !hasKey) {
        console.warn('Skipping test: Missing Supabase credentials in environment.');
        return false;
    }
    return true;
};
