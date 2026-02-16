export const checkTestEnv = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Skipping test: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
};
