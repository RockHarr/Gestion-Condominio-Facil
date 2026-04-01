import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../test-utils';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    test.skip(!checkTestEnv(), 'Skipping test: Missing Supabase environment variables');
    // ... (existing code)
  });
});