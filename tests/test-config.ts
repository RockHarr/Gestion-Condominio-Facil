export const checkTestEnv = () => {
    // Check for Supabase URL (Vite or standard env)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn('Skipping test: Missing VITE_SUPABASE_URL or using placeholder.');
        return false;
    }
    return true;
};
