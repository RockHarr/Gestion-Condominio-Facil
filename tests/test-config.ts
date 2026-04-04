import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Demo credentials for CI fallback (public demo environment)
const DEMO_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';
const DEMO_ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
// Note: This password is for a demo account only
const DEMO_ADMIN_PASSWORD = '270386';
const DEMO_RESIDENT_EMAIL = 'contacto@rockcode.cl';
const DEMO_RESIDENT_PASSWORD = '180381';

export const TEST_CONFIG = {
  // Supabase URL/Key
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || DEMO_URL,
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || DEMO_KEY,

  // Test User Credentials
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || DEMO_ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || DEMO_ADMIN_PASSWORD,

  RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || DEMO_RESIDENT_EMAIL,
  RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || DEMO_RESIDENT_PASSWORD,
};

// Validate configuration
if (!TEST_CONFIG.ADMIN_PASSWORD || !TEST_CONFIG.RESIDENT_PASSWORD) {
  console.warn('WARNING: TEST_ADMIN_PASSWORD or TEST_RESIDENT_PASSWORD are not set. E2E tests may fail.');
}
