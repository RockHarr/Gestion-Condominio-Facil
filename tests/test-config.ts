export const checkTestEnv = () => {
    // Check if variables are set
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.warn('Skipping tests: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing');
        return false;
    }

    // Check if they are placeholders (common CI pattern)
    if (url.includes('placeholder.supabase.co') || anonKey === 'placeholder') {
        console.warn('Skipping tests: VITE_SUPABASE_URL is a placeholder');
        return false;
    }

    return true;
};
