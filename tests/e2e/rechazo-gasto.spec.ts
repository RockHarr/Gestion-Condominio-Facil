import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { test, expect } from '@playwright/test';

test.describe.skip('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // ... (existing code)
  });
});