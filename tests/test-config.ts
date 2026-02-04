import 'dotenv/config';

export const TEST_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
export const TEST_SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

export const TEST_RESIDENT_EMAIL = process.env.TEST_RESIDENT_EMAIL;
export const TEST_RESIDENT_PASSWORD = process.env.TEST_RESIDENT_PASSWORD;
export const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
export const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

function validateEnv() {
  const missingVars: string[] = [];

  if (!TEST_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL or SUPABASE_URL');
  if (!TEST_SUPABASE_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY or SUPABASE_KEY');
  if (!TEST_RESIDENT_EMAIL) missingVars.push('TEST_RESIDENT_EMAIL');
  if (!TEST_RESIDENT_PASSWORD) missingVars.push('TEST_RESIDENT_PASSWORD');
  if (!TEST_ADMIN_EMAIL) missingVars.push('TEST_ADMIN_EMAIL');
  if (!TEST_ADMIN_PASSWORD) missingVars.push('TEST_ADMIN_PASSWORD');

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for tests:\n${missingVars.join('\n')}\nPlease create a .env file with these values.`);
  }
}

// Validate on import
validateEnv();
