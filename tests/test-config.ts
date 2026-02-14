import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load from .env and .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

export const checkTestEnv = (): boolean => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder') || key === 'placeholder') {
    console.warn('Skipping tests: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing or invalid.');
    return false;
  }
  return true;
};
