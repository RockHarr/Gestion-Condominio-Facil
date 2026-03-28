export function checkTestEnv(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Skipping tests: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.');
      return false;
    }
  }
  return true;
}
