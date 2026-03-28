import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../test-config';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test.skip(!checkTestEnv());
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});