import { test, expect } from '@playwright/test';

test.describe('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // 1) Ir a app
    await page.goto('/');

    // 2) Login como Admin
    // Asumiendo pantalla de login por select (como tu UI):
    await page.getByRole('combobox').selectOption(/admin/i); // si el option muestra (Admin)
    await page.getByRole('button', { name: /ingresar/i }).click();

    // 3) En dashboard debe verse "Cola de Aprobación"
    await expect(page.getByRole('heading', { name: /cola de aprobación/i })).toBeVisible();

    // 4) Tomar el primer gasto "En Revisión"
    const card = page.locator('section:has-text("Cola de Aprobación")').locator('li').first();

    // 5) Click en "Rechazar" (botón rojo del item)
    await expect(card.getByRole('button', { name: /rechazar/i })).toBeVisible();
    await card.getByRole('button', { name: /rechazar/i }).click();

    // 6) Debe abrir modal "Rechazar Gasto"
    const modal = page.getByRole('dialog', { name: /rechazar gasto/i });
    await expect(modal).toBeVisible();

    // 7) Escribir motivo y confirmar
    await modal.getByLabel(/motivo del rechazo/i).fill('No coincide con OC');
    await modal.getByRole('button', { name: /confirmar rechazo/i }).click();

    // 8) Esperar toast de éxito
    await expect(page.getByText(/gasto rechazado/i)).toBeVisible();

    // 9) El item ya no debe estar en "En Revisión" (o debe mostrar estado Rechazado)
    await expect(card).not.toContainText(/en revisión/i);

    // Opcional: validar que aparece en otra lista/estado si la UI lo muestra
  });
});
