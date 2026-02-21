import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// Ensure we use the working Supabase instance for tests, overriding .env example values
const EXAMPLE_URL = 'https://example.supabase.co';
if (!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL === EXAMPLE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
}
if (!process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY === 'example-key') {
  process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';
}

export default defineConfig({
  // Carpeta donde viven los tests
  testDir: './tests',

  // Tiempos razonables para E2E
  timeout: 60_000, // Increased for CI
  expect: { timeout: 10_000 }, // Increased for slow UI

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
    launchOptions: {
      args: ['--disable-web-security'],
    },
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
    command: `VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL} VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY} npx vite --port 3000 --strictPort`,
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
