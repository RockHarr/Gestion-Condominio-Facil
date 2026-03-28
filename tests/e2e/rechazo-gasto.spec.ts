import { test, expect } from '@playwright/test';
import { shouldSkipRealBackendTests } from '../test-utils';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    if (shouldSkipRealBackendTests()) test.skip();
    // ... (existing code)
  });
});