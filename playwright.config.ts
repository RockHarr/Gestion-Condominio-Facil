import { defineConfig, devices } from '@playwright/test';

// Define fallback credentials for CI/Testing if not provided
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

// Inject into process.env for tests running in Node
if (!process.env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = SUPABASE_URL;
if (!process.env.VITE_SUPABASE_ANON_KEY) process.env.VITE_SUPABASE_ANON_KEY = SUPABASE_KEY;

export default defineConfig({
  // Carpeta donde viven los tests
  testDir: './tests',

  // Tiempos razonables para E2E
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Reportes: HTML (guardado como artifact en CI) + lista en consola
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Defaults para todos los tests
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Navegador principal
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /**
   * Hace que Playwright levante la app antes de correr los tests.
   * Usamos el build de Vite (por eso en CI corremos `npm run build` antes).
   */
  webServer: {
    command: 'npx vite --port 3000 --strictPort',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: SUPABASE_KEY,
    }
  },
});
