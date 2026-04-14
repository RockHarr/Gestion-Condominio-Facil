import { test, expect } from '@playwright/test';

// ==========================================
// CONFIGURATION: UPDATE THESE BEFORE RUNNING
// ==========================================
const RESIDENT_EMAIL = 'contacto@rockcode.cl'; // REPLACE WITH REAL RESIDENT EMAIL
const RESIDENT_PASSWORD = '180381';       // REPLACE WITH REAL RESIDENT PASSWORD
// ==========================================

test.describe('Resident — Reservations Flow', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Login as Resident
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');
        // Wait for a post-login element (e.g., the Home tab)
        await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });
    });

    test('should allow a resident to create and cancel a reservation', async ({ page }) => {
        // 2. Navigate to Amenities via Tab Bar
        await page.click('[data-testid="tab-amenities"]');
        await expect(page.getByRole('heading', { name: 'Espacios Comunes' }).first()).toBeVisible();

        // 3. Click "Reservar" on the first amenity (e.g., Quincho)
        // This navigates to the 'reservations' page
        await page.locator('button:has-text("Reservar")').first().click();

        // 4. Wait for Calendar
        await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible(); // Header in ResidentApp for reservations page
        await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible(); // Calendar grid

        // 5. Select a Date
        // Find a day button that is NOT disabled (future date) and click it.
        // We pick the last available day to ensure it's in the future.
        const availableDays = page.locator('button.aspect-square:not([disabled])');
        const count = await availableDays.count();
        expect(count).toBeGreaterThan(0);
        await availableDays.last().click();

        // 6. Confirm Booking in Modal
        const modal = page.getByRole('dialog').or(page.locator('.fixed.inset-0')); // Fallback if role not set
        await expect(modal).toBeVisible();

        // Wait for types to load
        await expect(modal.getByText('Cargando tipos de reserva...')).not.toBeVisible();

        // Check if we have types
        if (await modal.getByText('No hay tipos de reserva disponibles para este espacio.').isVisible()) {
            throw new Error('No reservation types available for this amenity. Setup failed?');
        }

        // Select Reservation Type if multiple exist
        const typeSelect = modal.locator('select');
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption({ index: 1 });
        } else {
            // If no select, it should be auto-selected (single type). 
            // Verify by checking if tariff info is visible (which depends on selectedType)
            await expect(modal.getByText(/Tarifa de uso:/i)).toBeVisible();
        }

        // Click "Solicitar Reserva" or "Confirmar"
        await modal.getByRole('button', { name: /solicitar|confirmar/i }).click();

        // 7. Verify Success Toast or Error
        try {
            await expect(page.getByText('Solicitud de reserva enviada exitosamente.')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            // If success toast not found, check for error message in modal
            const errorMsg = await page.locator('.bg-red-100').textContent();
            if (errorMsg) {
                throw new Error(`Reservation failed with error: ${errorMsg}`);
            }
            throw e;
        }

        // 8. Verify in "Mis Reservas" Section
        // It should appear in the list below the calendar
        const myReservations = page.locator('h3:has-text("Mis Reservas")').locator('..');
        await expect(myReservations).toBeVisible();
        // Check for "Pendiente" or "Solicitada" badge
        await expect(myReservations.getByText(/pendiente|solicitada/i).first()).toBeVisible();

        // 9. Cancel Reservation
        // Handle window.confirm
        page.on('dialog', dialog => dialog.accept());

        const cancelBtn = myReservations.getByRole('button', { name: /cancelar/i }).first();
        await cancelBtn.click();

        // 10. Verify Cancellation
        // The reservation should disappear or status change
        // Since the list filters out cancelled or updates status, we check for disappearance or toast
        await expect(page.getByText('Reserva cancelada')).toBeVisible();
    });

});
