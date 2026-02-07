import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from './mocks';

test.describe('System Setup', () => {
    test('Ensure Amenities and Reservation Types exist', async ({ page }) => {
        // Mock Auth as Admin
        await mockSupabaseAuth(page, 'admin');

        // Mock Initial Data
        await page.route('**/rest/v1/expenses*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [] }));
        await page.route('**/rpc/get_financial_kpis*', async route => route.fulfill({ json: { total_collected: 0, deposits_custody: 0, pending_review_count: 0, total_expenses_approved: 0 } }));
        await page.route('**/rest/v1/community_settings*', async route => route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }));

        // Mock Amenities and Types
        await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/reservation_types*', async route => route.fulfill({ json: [] }));

        // 1. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button:has-text("Iniciar Sesión")');

        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

        // 2. Navigate to Amenities
        await page.click('text=Administrar Espacios');

        await expect(page.getByRole('heading', { name: 'Espacios Comunes' })).toBeVisible();

        // 3. Check/Create Quincho
        // Use regex for loose match or first()
        const quinchoCard = page.getByRole('heading', { name: 'Quincho' }).first();

        // Since we mocked empty amenities, it shouldn't be visible.
        // But if the app cached it or something...
        // Let's force creation flow

        // Mock POST for creation
        await page.route('**/rest/v1/amenities', async route => {
            if (route.request().method() === 'POST') {
                const postData = route.request().postDataJSON();
                await route.fulfill({
                    status: 201,
                    json: { ...postData, id: '1', photo_url: null }
                });
            } else {
                await route.continue();
            }
        });

        // Mock GET for refresh
        // Note: The app might use 'select=*' order by id
        await page.route('**/rest/v1/amenities*', async route => {
            const method = route.request().method();
            // If it's the refresh call (which happens after save)
            // We can detect it or just update the mock permanently
            if (method === 'GET') {
                 await route.fulfill({ json: [{ id: '1', name: 'Quincho', description: 'Espacio para asados', capacity: 20 }] });
            } else {
                await route.continue(); // Let POST pass to the other handler? No, route handlers are first-match or chain.
                // If we defined a specific route earlier, it might take precedence.
                // But here we redefine `amenities*`.
            }
        });

        if (!(await quinchoCard.isVisible())) {
            console.log('Creating Quincho...');
            await page.click('button:has-text("Nuevo Espacio")');
            await page.fill('input[placeholder="Ej: Quincho Norte"]', 'Quincho');
            await page.fill('textarea[placeholder="Detalles sobre el espacio..."]', 'Espacio para asados');
            await page.fill('input[placeholder="0"]', '20');
            await page.click('button:has-text("Guardar")');

            // Wait for it to appear
            await expect(page.getByRole('heading', { name: 'Quincho' }).first()).toBeVisible();
        }
    });
});
