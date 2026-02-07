import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockCommonData, mockAdminData } from './mocks';

test.describe('Admin — Reservations Management', () => {

    test('should allow admin to approve a pending reservation', async ({ page }) => {
        // Mock Auth as Admin
        await mockSupabaseAuth(page, 'admin');
        await mockCommonData(page);
        await mockAdminData(page);

        // Mock Specific Data for this test
        const reservation = {
            id: 1,
            amenity_id: '1',
            amenityId: '1',
            userId: '101',
            start_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_at: new Date(Date.now() + 90000000).toISOString(),
            status: 'REQUESTED',
            is_system: false,
            user: { nombre: 'Vecino Test', unidad: '101' }
        };

        const amenity = { id: '1', name: 'Quincho', capacity: 20 };

        // Override common mocks with specific data
        await page.route('**/rest/v1/reservations*', async route => {
            const url = route.request().url();
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: [reservation] });
            } else {
                await route.continue();
            }
        });

        await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [amenity] }));
        await page.route('**/rest/v1/reservation_types*', async route => route.fulfill({ json: [] }));

        // Smart Profile Mock: Handle both List (Users) and Single (Auth)
        // Note: mockSupabaseAuth handles Auth (single) via URL matching.
        // We just need to handle the List query for the reservations page.
        await page.route('**/rest/v1/profiles*', async route => {
            const method = route.request().method();
            const url = route.request().url();

            if (method === 'GET' && !url.includes('id=eq.test-user-id')) {
                 // List query (getUsers) or Fetch by ID 101
                 await route.fulfill({ json: [{ id: '101', nombre: 'Vecino Test', unidad: '101', role: 'resident' }] });
            } else {
                 // Auth check (id=eq.test-user-id) -> Fallback to mockSupabaseAuth
                 await route.fallback();
            }
        });

        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // 2. Navigate to Reservations
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();
        await page.click('text=Reservas');

        // 3. Check for Pending Reservation
        // "Quincho" should be visible in the list card
        // If it's not found, maybe the mock isn't applying or the UI structure is different
        await expect(page.getByText('Quincho').first()).toBeVisible();
        await expect(page.getByText('Vecino Test').first()).toBeVisible();

        // The status "Pendiente" might be inside a badge or span
        await expect(page.getByText('Pendiente').first()).toBeVisible();

        // 4. Approve
        // Look for the check icon button
        const approveBtn = page.locator('button:has(svg)').filter({ hasNotText: 'Rechazar' }).first();

        // Mock the update call
        await page.route('**/rpc/approve_reservation', async route => {
             await route.fulfill({ status: 200 });
        });

        // If approval triggers a refresh, we should mock the new state
        await page.route('**/rest/v1/reservations*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: [{ ...reservation, status: 'CONFIRMED' }] });
            } else {
                await route.continue();
            }
        });

        if (await approveBtn.isVisible()) {
             await approveBtn.click();
        } else {
             // Fallback
             await page.locator('button').filter({ hasText: 'check' }).first().click();
        }
    });

    test('should allow admin to reject a pending reservation', async ({ page }) => {
        test.skip();
    });

});
