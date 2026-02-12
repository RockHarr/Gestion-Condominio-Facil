import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../test-config';

test.beforeAll(() => {
    test.skip(!checkTestEnv(), 'Skipping tests due to missing environment variables');
});

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});