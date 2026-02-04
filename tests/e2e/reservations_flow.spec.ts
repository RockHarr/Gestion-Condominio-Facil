import { test, expect } from '@playwright/test';
import {
    TEST_RESIDENT_EMAIL,
    TEST_RESIDENT_PASSWORD,
    checkTestEnv
} from '../test-config';

test.describe('Resident — Reservations Flow', () => {
    test.skip(!checkTestEnv(), 'Skipping test: Missing environment variables');

    test('should allow a resident to create and cancel a reservation', async ({ page }) => {
        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_RESIDENT_EMAIL!);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_RESIDENT_PASSWORD!);
        await page.click('button[type="submit"]');

        // Wait for a post-login element (e.g., the Home tab)
        await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });

        // 2. Go to Reservations
        await page.click('text=Reservar'); // Quick Action

        // 3. Select Amenity (e.g. Quincho)
        await page.click('text=Quincho');

        // 4. Select Date (e.g. 25th)
        // Ensure calendar is visible
        await expect(page.getByText('Dom', { exact: true })).toBeVisible();

        // Find a future date (simple approximation)
        // Just clicking a day button - hopefully valid
        const dayButtons = page.locator('button.aspect-square:not(:disabled)');
        if (await dayButtons.count() > 0) {
            await dayButtons.nth(15).click(); // Middle of month
        }

        // 5. Submit Request
        await expect(page.getByText('Solicitar Reserva')).toBeVisible();
        await page.click('button:has-text("Confirmar Reserva")');

        // 6. Verify Success Toast
        await expect(page.getByText('Solicitud de reserva enviada')).toBeVisible();

        // 7. Verify in "Mis Reservas"
        await page.click('text=Mis Reservas');
        await expect(page.getByText('Pendiente').first()).toBeVisible();

        // 8. Cancel
        await page.click('button:has-text("Cancelar")');
        // Handle alert confirm? Playwright handles confirm dialogs automatically by default if listeners set,
        // but here we might need to manually handle if it's a window.confirm
        page.on('dialog', dialog => dialog.accept());

        // Wait for update
        await expect(page.getByText('Cancelar')).not.toBeVisible();
    });
});
