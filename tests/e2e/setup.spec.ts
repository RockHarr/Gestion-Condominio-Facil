import { test, expect } from '@playwright/test';
import {
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    checkTestEnv
} from '../test-config';

test.describe('System Setup', () => {
    test.skip(!checkTestEnv(), 'Skipping test: Missing environment variables');

    test('Ensure Amenities and Reservation Types exist', async ({ page }) => {
        // 1. Login Admin
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_ADMIN_EMAIL!);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD!);
        await page.click('button:has-text("Iniciar Sesión")');
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

        // 2. Navigate to Amenities
        await page.click('text=Espacios Comunes');

        // 3. Verify content
        await expect(page.getByText('Quincho')).toBeVisible();
        await expect(page.getByText('Sala de Eventos')).toBeVisible();
    });
});
