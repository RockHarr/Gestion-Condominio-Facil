
import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    await page.goto('/');

    // 1. Wait for Loading to finish and Login Screen to appear
    await expect(page.getByText('Bienvenido')).toBeVisible({ timeout: 15000 });

    // 2. Toggle Password Login
    const toggleButton = page.getByRole('button', { name: 'Usar contraseña' });
    if (await toggleButton.isVisible()) {
        await toggleButton.click();
    }

    // 3. Login
    await page.fill('input[type="email"]', 'contacto@rockcode.cl');
    await page.fill('input[type="password"]', '180381');
    await page.click('button[type="submit"]');

    // 4. Wait for Dashboard
    await expect(page.getByText('Hola,')).toBeVisible({ timeout: 15000 });

    // 5. Navigate to Amenities using the Tab Bar
    // The tab label is "Espacios"
    await page.getByRole('button', { name: 'Espacios', exact: true }).click();

    // 6. Verify Amenities and Select
    // Use .first() to avoid strict mode violations if multiple elements contain "Quincho"
    // (e.g. recent reservations list + amenities list)
    // We target the heading or button specifically.
    await expect(page.getByText('Quincho').first()).toBeVisible();
    await page.getByText('Quincho').first().click();

    // 7. Verify Detail/Reservations Page
    // Depending on navigation, this might open a modal or new page.
    // If it opens Amenities detail or Reservations list, we check for a key element.
    // Assuming it shows "Reservar" button.
    await expect(page.getByText('Reservar').first()).toBeVisible();
});
