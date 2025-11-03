import { test, expect } from '@playwright/test';

test('smoke: abre home y tiene título', async ({ page }) => {
  await page.goto('/');                 // usa baseURL del config
  // Aceptamos que tu título contenga cualquiera de estas palabras:
  const title = await page.title();
  expect(title).toMatch(/Condominio|Vite|React|App/i);
});
