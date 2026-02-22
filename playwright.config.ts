import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Carpeta donde viven los tests
  testDir: './tests',

  // Tiempos razonables para E2E (Increased for CI)
  timeout: 60_000,
  expect: { timeout: 10_000 },

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
    viewport: { width: 1280, height: 720 }, // Ensure desktop view
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
