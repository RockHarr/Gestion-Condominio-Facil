export const TEST_CONFIG = {
  RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || 'resident@example.com',
  RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || 'dummy_password_resident',
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || 'dummy_password_admin',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy_key',
};
