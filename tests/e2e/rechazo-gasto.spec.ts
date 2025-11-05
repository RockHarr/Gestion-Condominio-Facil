import { test, expect } from '@playwright/test';

test.describe('Admin — Rechazo de Gasto', () => {
  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // 1) Ir a la app (si tienes baseURL en playwright.config, esto funciona tal cual)
    await page.goto('/');

    // 2) Login como Admin (selector robusto sobre <select> + botón "Ingresar")
    const userSelect = page.locator('select');
    await expect(userSelect).toBeVisible();
    // intenta por label; si no, por regex
    await userSelect.selectOption({ label: /admin/i }).catch(async () => {
      // fallback: cualquier opción que contenga "Admin"
      const option = page.locator('select option', { hasText: /admin/i }).first();
      const value = await option.getAttribute('value');
      if (!value) throw new Error('No encontré opción de Admin en el select');
      await userSelect.selectOption(value);
    });

    await page.getByRole('button', { name: /ingresar/i }).click();

    // 3) En dashboard debe verse algo estable; usamos el título del bloque
    await expect(page.getByText(/cola de aprobación/i)).toBeVisible();

    // 4) Tomar el primer ítem de la cola (tolerante)
    const queueSection = page.locator('section').filter({ hasText: /cola de aprobación/i }).first();
    // si tu lista es <ul><li>..., agarramos el primer LI
    const card = queueSection.locator('li, .card, .item').first();

    // 5) Click en "Rechazar"
    const rejectBtn = card.getByRole('button', { name: /rechazar/i });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // 6) Debe abrir modal "Rechazar Gasto"
    const modal = page.getByRole('dialog').filter({ hasText: /rechazar gasto/i }).first();
    await expect(modal).toBeVisible();

    // 7) Escribir motivo y confirmar (targeteamos el único textarea dentro del modal)
    const motivo = modal.locator('textarea, [role="textbox"]');
    await expect(motivo).toBeVisible();
    await motivo.fill('No coincide con OC');

    await modal.getByRole('button', { name: /confirmar rechazo/i }).click();

    // 8) Esperar feedback (toast/mensaje). Probamos varias opciones comunes.
    const toast = page.locator(
      '[role="status"]:has-text("rechazado"), [data-sonner-toast]:has-text("rechazado"), .toast:has-text("rechazado"), :text("Gasto rechazado")'
    );
    await expect(toast).toBeVisible({ timeout: 5000 });

    // 9) El item ya no debe mostrar "En Revisión"
    await expect(card).not.toContainText(/en revisión/i);
  });
});