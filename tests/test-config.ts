export function checkTestEnv() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('Skipping test: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
}
