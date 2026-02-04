import { test, expect } from '@playwright/test';
import {
    checkTestEnv
} from '../test-config';

test('reservations_menu_smoke', async ({ page }) => {
    test.skip(!checkTestEnv(), 'Skipping test: Missing environment variables');

    // 1. Navigate
    await page.goto('/');

    // 2. Simple check for title
    await expect(page).toHaveTitle(/Condominio/);

    // 3. Verify Login Screen elements
    await expect(page.getByText('Bienvenido')).toBeVisible();
    await expect(page.getByPlaceholder('tucorreo@ejemplo.com')).toBeVisible();
});
