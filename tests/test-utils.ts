export function checkTestEnv() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Skipping test: Missing Supabase environment variables');
    return false;
  }
  return true;
}
