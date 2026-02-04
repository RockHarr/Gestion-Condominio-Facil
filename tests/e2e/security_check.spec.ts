import { test, expect } from '@playwright/test';
import {
    TEST_RESIDENT_EMAIL,
    TEST_RESIDENT_PASSWORD,
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    checkTestEnv
} from '../test-config';

test.describe('Security Policy Verification', () => {
    test.skip(!checkTestEnv(), 'Skipping test: Missing environment variables');

    test('Resident should only see own data and public notices', async ({ page }) => {
        // 1. Login Resident
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_RESIDENT_EMAIL!);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_RESIDENT_PASSWORD!);
        await page.click('button[type="submit"]');

        // Wait for login to complete (check for home page element)
        await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });

        // 2. Check Notices (Should only see Published)
        await page.click('text=Avisos');
        // We assume there are some published notices. If 'Borrador' appears, it's a fail.
        await expect(page.getByText('Borrador')).not.toBeVisible();

        // 3. Check Admin Menu Access (Should not exist)
        // Admin menu usually has 'Panel de Control' or specific admin routes
        await expect(page.getByText('Panel de Control')).not.toBeVisible();
    });

    test('Admin should see all data', async ({ page }) => {
        // 1. Login Admin
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_ADMIN_EMAIL!);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD!);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

        // 2. Check Admin Access
        await expect(page.getByText('Cola de Aprobación')).toBeVisible();
    });
});
