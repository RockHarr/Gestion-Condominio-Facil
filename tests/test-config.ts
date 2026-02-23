import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local first (to override)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
// Then load from .env (defaults)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const TEST_CONFIG = {
  // Provide a valid URL format as fallback to prevent createClient from throwing during test discovery
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || '',
  RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || '',
  RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || '',
};

// Validate critical config
const requiredKeys = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'RESIDENT_EMAIL',
  'RESIDENT_PASSWORD'
] as const;

const missingKeys = requiredKeys.filter(key => !TEST_CONFIG[key]);

if (missingKeys.length > 0) {
  console.warn(`WARNING: Missing test configuration keys: ${missingKeys.join(', ')}. Tests requiring these may fail.`);
}
