import { defineConfig, devices } from '@playwright/test';

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
    command: 'npx vite preview --port 3000 --strictPort',
    port: 3000,
    reuseExistingServer: !process.env.CI, // Reutiliza server en local, no en CI
  },
});
