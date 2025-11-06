import { test, expect } from '@playwright/test';

test.describe('Admin — Aprobación de Gasto', () => {
  test('aprueba el primer gasto en revisión', async ({ page }) => {
    await page.goto('/');

    // Login Admin
    await page.getByRole('combobox').selectOption(/admin/i);
    await page.getByRole('button', { name: /ingresar/i }).click();

    const items = page.locator('[data-qa="expense-item"]');
    const before = await items.count();
    test.skip(before === 0, 'No hay gastos en revisión.');

    const first = items.first();
    await expect(first).toBeVisible();

    // Aprobar
    await first.locator('[data-qa="btn-aprobar"]').click();

    // Feedback
    await expect(page.getByText(/gasto aprobado/i)).toBeVisible();

    // La cola se reduce en 1 (si la UI remueve el item)
    await expect(items).toHaveCount(before - 1);
  });
});
