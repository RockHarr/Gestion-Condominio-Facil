import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockCommonData, mockAdminData } from './mocks';

test.describe('System Setup', () => {
    test('Ensure Amenities and Reservation Types exist', async ({ page }) => {
        // Mock Auth as Admin
        await mockSupabaseAuth(page, 'admin');
        await mockCommonData(page);
        await mockAdminData(page);

        // Explicitly override the Amenities mock from mockCommonData
        // Initial state: Empty list (to trigger creation flow)
        await page.route('**/rest/v1/amenities*', async route => {
            if (route.request().method() === 'GET') {
                 await route.fulfill({ json: [] });
            } else {
                await route.continue();
            }
        });

        // Mock Reservation Types
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
        const quinchoCard = page.getByRole('heading', { name: 'Quincho' }).first();

        // Mock the creation POST request
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

        if (!(await quinchoCard.isVisible())) {
            console.log('Creating Quincho...');
            await page.click('button:has-text("Nuevo Espacio")');
            await page.fill('input[placeholder="Ej: Quincho Norte"]', 'Quincho');
            await page.fill('textarea[placeholder="Detalles sobre el espacio..."]', 'Espacio para asados');
            await page.fill('input[placeholder="0"]', '20');

            // IMPORTANT: Update the GET mock *before* triggering the save/refresh
            // We use unroute to remove the "empty list" mock, then add the "populated list" mock
            // This ensures the next fetch sees the new data.
            await page.unroute('**/rest/v1/amenities*');
            await page.route('**/rest/v1/amenities*', async route => {
                if (route.request().method() === 'GET') {
                     await route.fulfill({ json: [{ id: '1', name: 'Quincho', description: 'Espacio para asados', capacity: 20 }] });
                } else {
                    await route.continue();
                }
            });

            await page.click('button:has-text("Guardar")');

            // Wait for it to appear
            await expect(page.getByRole('heading', { name: 'Quincho' }).first()).toBeVisible();
        }
    });
});
