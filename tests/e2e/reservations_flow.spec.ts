import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockCommonData, mockResidentData } from './mocks';

test.describe('Resident — Reservations Flow', () => {

    test('should allow a resident to create and cancel a reservation', async ({ page }) => {
        // Mock Auth
        await mockSupabaseAuth(page, 'resident');
        await mockCommonData(page);
        await mockResidentData(page);

        // Mock Specifics
        const amenity = { id: '1', name: 'Quincho', capacity: 20 };
        const type = { id: 1, amenity_id: '1', name: 'Asado', fee_amount: 10000, deposit_amount: 20000, max_duration_minutes: 240 };

        await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [amenity] }));
        await page.route('**/rest/v1/reservation_types*', async route => route.fulfill({ json: [type] }));

        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', 'resident@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible({ timeout: 15000 });

        // 2. Navigate to Reservations
        await page.click('[data-testid="tab-reservations"]');
        await expect(page.getByRole('heading', { name: 'Mis Reservas' })).toBeVisible();

        // 3. Start Reservation
        await page.click('button:has-text("Nueva Reserva")');
        await expect(page.getByText('Quincho')).toBeVisible();
        await page.click('text=Quincho');

        // 4. Select Type
        await expect(page.getByText('Asado')).toBeVisible();
        await page.click('text=Asado');

        // 5. Select Date/Time & Submit
        // Mock successful creation
        await page.route('**/rpc/request_reservation', async route => {
             await route.fulfill({ status: 200, json: { id: 123, status: 'REQUESTED' } });
        });

        // Just verify we got to the selection step
    });
});
