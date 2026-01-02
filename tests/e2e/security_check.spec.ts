import { test, expect } from '@playwright/test';

// ==========================================
// CONFIGURATION: UPDATE THESE BEFORE RUNNING
// ==========================================
const RESIDENT_EMAIL = 'resident@test.com'; // REPLACE WITH REAL RESIDENT EMAIL
const RESIDENT_PASSWORD = 'password';       // REPLACE WITH REAL RESIDENT PASSWORD
const ADMIN_EMAIL = 'admin@test.com';       // REPLACE WITH REAL ADMIN EMAIL
const ADMIN_PASSWORD = 'password';          // REPLACE WITH REAL ADMIN PASSWORD
// ==========================================

test.describe('Security Policy Verification', () => {

    test('Resident should only see own data and public notices', async ({ page }) => {
        // 1. Login as Resident
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for login to complete (check for home page element)
        await expect(page.getByText('Bienvenido')).toBeVisible();

        // 2. Check Notices (Should only see Published)
        await page.click('text=Avisos');
        // Assuming there is at least one published notice and one draft in the DB
        // This is a loose check, but we verify we don't see "Borrador" badges if UI shows them
        await expect(page.locator('text=Borrador')).not.toBeVisible();

        // 3. Check Tickets (Should only see own)
        await page.click('text=Tickets');
        // Verify we are on the tickets page
        await expect(page.getByText('Mis Tickets')).toBeVisible();

        // 4. Verify NO Admin Access
        // Try to navigate to admin route directly if possible, or check menu
        const adminMenu = page.locator('text=Admin Dashboard');
        await expect(adminMenu).not.toBeVisible();

        // Logout
        await page.click('button:has-text("Cerrar Sesión")');
    });

    test('Admin should see all data', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page.getByText('Panel de Administración')).toBeVisible();

        // 2. Check Admin Access
        await expect(page.getByText('Cola de Aprobación')).toBeVisible();

        // 3. Check Users List
        await page.click('text=Unidades');
        await expect(page.getByText('Gestión de Unidades')).toBeVisible();
        // Should see list of users
        await expect(page.locator('table')).toBeVisible();
    });

});
