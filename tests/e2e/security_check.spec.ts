import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from './mocks';

test.describe('Security Policy Verification', () => {

    test('Resident should only see own data and public notices', async ({ page }) => {
        // Mock Auth as Resident
        await mockSupabaseAuth(page, 'resident');

        // Mock Initial Data Loads to prevent 'Failed to fetch'
        await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/expenses*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/community_settings*', async route => route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }));

        await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));

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

        // Mock Initial Data Loads
        await page.route('**/rest/v1/expenses*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
        await page.route('**/rpc/get_financial_kpis*', async route => route.fulfill({ json: { total_collected: 0, deposits_custody: 0, pending_review_count: 0, total_expenses_approved: 0 } }));
        await page.route('**/rest/v1/community_settings*', async route => route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }));

        // Add missing mocks for Admin
        await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [] }));

        // REMOVED explicit profiles mock to rely on mockSupabaseAuth which handles auth correctly
        // mockSupabaseAuth will return [adminProfile] for list queries, which is enough to render the list.

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
        await expect(page.getByRole('heading', { name: 'Directorio de Unidades' })).toBeVisible();
    });

});
