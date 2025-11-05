// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const PREVIEW_URL = 'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || PREVIEW_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: PREVIEW_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
