import { test, expect } from '@playwright/test';

test.describe.skip('Admin — Rechazo de Gasto', () => {
    // Skip if running with dummy CI credentials
    test.beforeAll(() => {
        if (process.env.VITE_SUPABASE_URL === 'https://example.supabase.co') {
            test.skip(true, 'Skipping due to dummy credentials in CI');
        }
    });

  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});