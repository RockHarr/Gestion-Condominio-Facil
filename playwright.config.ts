import { defineConfig, devices } from '@playwright/test';

const isDummyCI = process.env.VITE_SUPABASE_URL === 'https://example.supabase.co';

if (isDummyCI) {
  console.log('Skipping E2E tests: VITE_SUPABASE_URL is set to dummy example.supabase.co');
}

export default defineConfig({
  // Carpeta donde viven los tests
  testDir: isDummyCI ? './tests/e2e/utils' : './tests',

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
  },
});
