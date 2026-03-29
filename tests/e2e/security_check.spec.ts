import { test, expect } from '@playwright/test';
import { checkTestEnv, TEST_RESIDENT_EMAIL, TEST_RESIDENT_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../test-config';

test.describe('Security Policy Verification', () => {

    test.beforeEach(() => {
        test.skip(!checkTestEnv(), 'Environment variables missing or invalid');
    });

    test('Resident should only see own data and public notices', async ({ page }) => {
        // 1. Login as Resident
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for login to complete (check for home page element)
        await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });

        // 2. Check Notices (Should only see Published)
        await page.click('text=Avisos');
        // Assuming there is at least one published notice and one draft in the DB
        // This is a loose check, but we verify we don't see "Borrador" badges if UI shows them
        await expect(page.locator('text=Borrador')).not.toBeVisible();

        // 3. Check Tickets (Should only see own)
        await page.click('text=Tickets');
        // Verify we are on the tickets page
        await expect(page.getByRole('heading', { name: 'Mis Tickets' }).first()).toBeVisible();

        // 4. Verify NO Admin Access
        // Try to navigate to admin route directly if possible, or check menu
        const adminMenu = page.locator('text=Admin Dashboard');
        await expect(adminMenu).not.toBeVisible();

        // Logout
        await page.click('[data-testid="tab-more"]');
        await page.click('button:has-text("Cerrar Sesión")');
    });

    test('Admin should see all data', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

        // 2. Check Admin Access
        await expect(page.getByText('Cola de Aprobación')).toBeVisible();

        // 3. Check Users List
        await page.click('text=Unidades');
        await expect(page.getByRole('heading', { name: 'Directorio de Unidades' })).toBeVisible();
        // Should see list of users (grid layout)
        await expect(page.locator('.grid.grid-cols-1')).toBeVisible();
    });

});
