import { test, expect } from '@playwright/test';

test.describe('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    await page.goto('/');

    // Login Admin
    await page.getByRole('combobox').selectOption(/admin/i);
    await page.getByRole('button', { name: /ingresar/i }).click();

    const items = page.locator('[data-qa="expense-item"]');
    const count = await items.count();
    test.skip(count === 0, 'No hay gastos en revisión.');

    const first = items.first();
    await expect(first).toBeVisible();

    // Rechazar
    await first.locator('[data-qa="btn-rechazar"]').click();

    const modal = page.getByRole('dialog', { name: /rechazar gasto/i });
    await expect(modal).toBeVisible();

    await modal.getByLabel(/motivo del rechazo/i).fill('No corresponde a OC');
    await modal.getByRole('button', { name: /confirmar rechazo/i }).click();

    // Feedback
    await expect(page.getByText(/gasto rechazado/i)).toBeVisible();

    // El item ya no muestra "En Revisión" (opcional según UI)
    await expect(first).not.toContainText(/en revisión/i);
  });
});
