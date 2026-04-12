export const TEST_CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-build',
  RESIDENT_EMAIL: process.env.RESIDENT_EMAIL || 'contacto@rockcode.cl',
  RESIDENT_PASSWORD: process.env.RESIDENT_PASSWORD || 'dummy-password',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@condominio.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'dummy-password'
};
