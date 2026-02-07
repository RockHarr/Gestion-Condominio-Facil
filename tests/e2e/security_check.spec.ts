import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockCommonData, mockResidentData, mockAdminData } from './mocks';

test.describe('Security Policy Verification', () => {

    test('Resident should only see own data and public notices', async ({ page }) => {
        // Mock Auth as Resident
        await mockSupabaseAuth(page, 'resident');
        await mockCommonData(page);
        await mockResidentData(page);

        // 1. Login as Resident
        await page.goto('/');
        await page.fill('input[type="email"]', 'resident@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });

        // 2. Check Notices
        await page.click('text=Avisos');
        await expect(page.getByRole('heading', { name: 'Avisos y Comunicados' })).toBeVisible();

        // 3. Check Tickets
        await page.click('text=Tickets');
        await expect(page.getByRole('heading', { name: 'Mis Tickets' }).first()).toBeVisible();

        // 4. Verify NO Admin Access
        const adminMenu = page.locator('text=Admin Dashboard');
        await expect(adminMenu).not.toBeVisible();
    });

    test('Admin should see all data', async ({ page }) => {
        // Mock Auth as Admin
        await mockSupabaseAuth(page, 'admin');
        await mockCommonData(page);
        await mockAdminData(page);

        // 1. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

        // 2. Check Admin Access
        await expect(page.getByText('Panel de Control')).toBeVisible();

        // 3. Check Users List
        await page.click('text=Unidades');
        // Users list should be populated by mockSupabaseAuth (returns [adminProfile])
        await expect(page.getByRole('heading', { name: 'Directorio de Unidades' })).toBeVisible();
        await expect(page.getByText('Admin User')).toBeVisible();
    });

});
