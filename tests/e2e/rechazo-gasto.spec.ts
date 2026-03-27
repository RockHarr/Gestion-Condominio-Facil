import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../test-config';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test.beforeEach(async () => {
      test.skip(!checkTestEnv(), 'Skipping test because Supabase credentials are missing');
  });

  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});