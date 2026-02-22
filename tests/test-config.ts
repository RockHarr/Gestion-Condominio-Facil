import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local and .env
// We look for them in the project root (two levels up from tests/e2e if this file is in tests/test-config.ts, but wait, this file is in tests/)
// So root is one level up if in tests/
// Repo structure:
// /
//   tests/
//     test-config.ts
//     e2e/
//   .env

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const TEST_CONFIG = {
  // Supabase URL/Key (Public/Anon usually, but kept in env for flexibility)
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key',

  // Test User Credentials (SECRETS)
  // Admin User
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || '',

  // Resident User
  RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || 'resident@example.com',
  RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || '',
};

// Optional: Validate configuration
if (!TEST_CONFIG.ADMIN_PASSWORD || !TEST_CONFIG.RESIDENT_PASSWORD) {
  console.warn('WARNING: TEST_ADMIN_PASSWORD or TEST_RESIDENT_PASSWORD are not set. E2E tests may fail.');
}
