
export const shouldSkipRealBackendTests = () => {
    // Check if running in an environment without real credentials
    const url = process.env.VITE_SUPABASE_URL || '';
    const key = process.env.VITE_SUPABASE_ANON_KEY || '';

    // Skip if placeholders are present (CI usually injects these if secrets are missing)
    if (url.includes('example.supabase.co') || url.includes('placeholder') || key === 'placeholder') {
        console.log('Skipping test: Missing real Supabase credentials.');
        return true;
    }
    return false;
};
