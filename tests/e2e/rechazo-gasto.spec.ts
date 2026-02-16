import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../test-config';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    test.skip(!checkTestEnv(), 'Test environment not configured (VITE_SUPABASE_URL missing)');
    // ... (existing code)
  });
});