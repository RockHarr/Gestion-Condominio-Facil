import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local if available
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export function checkTestEnv(): boolean {
  // Check for critical Supabase configuration
  const hasUrl = !!process.env.VITE_SUPABASE_URL;
  const hasAnonKey = !!process.env.VITE_SUPABASE_ANON_KEY;

  // In CI, these might be set via secrets, but if missing, we should skip
  if (!hasUrl || !hasAnonKey) {
    console.warn('Skipping tests: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
}
