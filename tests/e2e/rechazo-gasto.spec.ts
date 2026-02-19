import { test, expect } from '@playwright/test';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test.skip(!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co', 'Skipping test because Supabase credentials are not set');
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});
