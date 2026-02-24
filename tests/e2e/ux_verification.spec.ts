import { test, expect } from '@playwright/test';

test.describe('UX Verification - ReservationRequestModal', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Auth
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'test@example.com',
                })
            });
        });

        await page.route('**/auth/v1/token?grant_type=password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'fake-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'fake-refresh',
                    user: {
                        id: 'test-user-id',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email: 'test@example.com',
                    }
                })
            });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-user-id',
                    nombre: 'Test User',
                    unidad: '101',
                    role: 'resident'
                })
            });
        });

        // Mock Amenities
        await page.route('**/rest/v1/amenities*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 1,
                    name: 'Quincho',
                    description: 'Espacio para asados',
                    capacity: 10,
                    image_url: null
                }])
            });
        });

        // Mock Reservation Types (for the modal)
        await page.route('**/rest/v1/reservation_types*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 1,
                    amenity_id: 1,
                    name: 'Evento Normal',
                    fee_amount: 10000,
                    deposit_amount: 5000,
                    max_duration_minutes: 240,
                    rules: 'Limpiar después de usar'
                },
                {
                    id: 2,
                    amenity_id: 1,
                    name: 'Evento Especial',
                    fee_amount: 20000,
                    deposit_amount: 10000,
                    max_duration_minutes: 480,
                    rules: 'Limpiar después de usar'
                }])
            });
        });

        // Mock Reservations (Availability)
        await page.route('**/rest/v1/reservations*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Mock Common Expenses (to prevent errors on home screen)
        await page.route('**/rest/v1/common_expenses*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Mock Notices
         await page.route('**/rest/v1/notices*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Mock Tickets
         await page.route('**/rest/v1/tickets*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Mock Financial Statements
        await page.route('**/rest/v1/financial_statements*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

         // Mock Parking Debts
        await page.route('**/rest/v1/parking_debts*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

         // Mock Payments
        await page.route('**/rest/v1/payments*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

         // Mock Expenses
        await page.route('**/rest/v1/expenses*', async route => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });


        // Login
        await page.goto('/');

        // Check if we are already logged in (due to mocked session)
        const homeHeader = page.getByRole('heading', { name: 'Inicio', exact: true });
        if (await homeHeader.isVisible()) {
            console.log('Already logged in');
            return;
        }

        // If not logged in, try to login
        const passwordBtn = page.getByText('Usar contraseña');
        if (await passwordBtn.isVisible()) {
             await passwordBtn.click();
        }

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
            await page.fill('input[type="email"]', 'test@example.com');

            const passwordInput = page.locator('input[type="password"]');
            if (await passwordInput.isVisible()) {
                await page.fill('input[type="password"]', 'password');
                await page.click('button[type="submit"]');
            }
        }

        // Wait for home
        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
    });

    test('should have accessible attributes on ReservationRequestModal', async ({ page }) => {
        // Navigate to Amenities (using the bottom tab bar)
        await page.click('button:has-text("Espacios")');

        // Wait for Amenities screen
        await expect(page.getByRole('heading', { name: 'Espacios Comunes', level: 2 })).toBeVisible();

        // Click "Reservar" on the Quincho card. This takes us to the Reservations list page.
        // Note: The UI flow is: Amenities -> Reservations List -> Reservation Availability
        const amenityCard = page.locator('div').filter({ hasText: 'Quincho' }).first();
        await amenityCard.getByRole('button', { name: 'Reservar' }).click();

        // Wait for Reservations list page
        await expect(page.getByRole('heading', { name: 'Reservas' })).toBeVisible();

        // Click on the amenity card to see availability
        // The card in Reservations page is a button with the amenity name
        await page.getByRole('button', { name: /Quincho/ }).click();

        // Now we should be in ReservationAvailabilityScreen
        await expect(page.getByText('Selecciona una fecha')).toBeVisible();

        // Click a date in the calendar.
        // AvailabilityCalendar renders buttons for days.
        // We need a non-disabled button.
        const dayButton = page.locator('button.aspect-square:not([disabled])').first();
        await dayButton.click();

        // Now the modal should open.
        const modal = page.locator('div[role="dialog"]');
        await expect(modal).toBeVisible();

        // Verify Accessibility Attributes

        // 1. role="dialog"
        await expect(modal).toHaveAttribute('role', 'dialog');

        // 2. aria-modal="true"
        await expect(modal).toHaveAttribute('aria-modal', 'true');

        // 3. aria-labelledby="modal-title"
        await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

        // 4. Title has id="modal-title"
        const title = modal.locator('#modal-title');
        await expect(title).toBeVisible();
        await expect(title).toHaveText('Solicitar Reserva');

        // 5. Close button has aria-label="Cerrar modal"
        const closeBtn = modal.locator('button[aria-label="Cerrar modal"]');
        await expect(closeBtn).toBeVisible();
        // Ensure it's the right button (contains xmark icon)
        // We can't easily check the icon content, but existence of aria-label is key.

        // 6. Form labels and inputs
        // Reservation Type Select (Now visible because we mocked > 1 type)
        const typeSelect = modal.locator('select#reservation-type');
        await expect(typeSelect).toBeVisible();
        const typeLabel = modal.locator('label[for="reservation-type"]');
        await expect(typeLabel).toBeVisible();
        await expect(typeLabel).toHaveText('Tipo de Evento');

        // Start Time
        const startTimeInput = modal.locator('input#start-time');
        await expect(startTimeInput).toBeVisible();
        const startTimeLabel = modal.locator('label[for="start-time"]');
        await expect(startTimeLabel).toBeVisible();
        await expect(startTimeLabel).toHaveText('Inicio');

        // End Time
        const endTimeInput = modal.locator('input#end-time');
        await expect(endTimeInput).toBeVisible();
        const endTimeLabel = modal.locator('label[for="end-time"]');
        await expect(endTimeLabel).toBeVisible();
        await expect(endTimeLabel).toHaveText('Término');
    });
});
