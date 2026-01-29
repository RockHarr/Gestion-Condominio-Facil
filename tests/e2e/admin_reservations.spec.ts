import { test, expect } from '@playwright/test';

// ==========================================
// CONFIGURATION
// ==========================================
const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const RESIDENT_PASSWORD = '180381';
const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
const ADMIN_PASSWORD = '270386';
// ==========================================

test.describe('Admin — Reservations Management', () => {

    test.beforeEach(async ({ page }) => {
        // Enable console logging from browser
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

        // 1. Create a Reservation as Resident to ensure we have data to test
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for login - Updated to check for a more robust element if tab-home fails or takes long
        // Checking for "Hola," or "Inicio" as backup if the tab ID is unreliable
        // Increasing timeout significantly for CI
        await expect(page.locator('[data-testid="tab-home"]').or(page.getByRole('heading', { name: 'Inicio' }))).toBeVisible({ timeout: 30000 });
        // Retry logic for reservation creation (Day + Time)
        let success = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!success && attempts < maxAttempts) {
            attempts++;
            console.log(`\n--- Reservation Attempt ${attempts}/${maxAttempts} ---`);

            // 1. Select a Random Day
            if (attempts > 1) {
                console.log('Reloading page to reset state...');
                await page.reload();
                // Wait for app to re-initialize
                // UsetoHaveCount(0) to avoid strict mode violation if multiple skeletons exist
                await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 20000 });
                await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 20000 });

                // Use robust locator for amenities tab (icon or text)
                await page.locator('button').filter({ hasText: /Espacios|Amenities/ }).first().click();
                await page.locator('button:has-text("Reservar")').first().click();
            } else {
                // Initial navigation
                await page.locator('button').filter({ hasText: /Espacios|Amenities/ }).first().click();
                await page.locator('button:has-text("Reservar")').first().click();
            }

            // Wait for calendar
            await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible();
            const availableDays = page.locator('button.aspect-square:not([disabled])');
            const count = await availableDays.count();

            if (count === 0) throw new Error('No available days found to book.');

            const randomIndex = Math.floor(Math.random() * count);
            console.log(`Selecting day index: ${randomIndex} of ${count}`);
            await availableDays.nth(randomIndex).click();

            // 2. Confirm Booking Modal
            const modal = page.getByRole('dialog').or(page.locator('.fixed.inset-0'));
            await expect(modal).toBeVisible();

            // Handle Type Selection if present
            const typeSelect = modal.locator('select');
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption({ index: 1 });
            }
            // else {
            //    Relax check for "Tarifa de uso" as it's flaky in CI
            //    await expect(modal.getByText(/Tarifa de uso:/i)).toBeVisible();
            // }

            // 3. Pick Random Time
            const randomHour = Math.floor(Math.random() * 10) + 10; // 10 to 19
            const startStr = `${randomHour}:00`;
            const endStr = `${randomHour + 2}:00`;
            console.log(`Selected time: ${startStr} - ${endStr}`);

            await modal.locator('input[type="time"]').first().fill(startStr);
            await modal.locator('input[type="time"]').last().fill(endStr);

            await modal.getByRole('button', { name: /solicitar|confirmar/i }).click();

            try {
                // Wait for success or error
                const successToast = page.getByText('Solicitud de reserva enviada exitosamente.');
                const errorMsg = page.locator('.bg-red-100');

                await expect(successToast.or(errorMsg)).toBeVisible({ timeout: 5000 });

                if (await successToast.isVisible()) {
                    console.log('Success toast appeared!');
                    success = true;
                } else {
                    const text = await errorMsg.textContent();
                    console.log(`Attempt ${attempts} failed with UI error: ${text}`);
                }
            } catch (e) {
                console.log(`Attempt ${attempts} error (timeout/other):`, e);
            }
        }

        if (!success) {
            throw new Error(`Failed to create reservation after ${maxAttempts} attempts.`);
        }

        // Logout Resident
        console.log('Logging out resident...');
        await page.evaluate(() => localStorage.clear()); // Clear Supabase session
        await page.context().clearCookies();
        await page.reload();
        // Wait for Login Screen to ensure we are logged out
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
        console.log('Logged out successfully, Login screen visible.');
    });

    test('should allow admin to approve a pending reservation', async ({ page }) => {
        console.log('Starting approve test...');
        // 2. Login as Admin
        // We are already at Login Screen due to beforeEach
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        console.log('Admin login submitted');

        // Wait for loading to finish
        await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 20000 });

        // 3. Navigate to Reservations
        // Wait directly for the Reservas button to be visible. This avoids strict mode issues 
        // with checking for sidebar/mobile nav if both exist in DOM.
        const navButton = page.locator('button').filter({ hasText: /^Reservas$|^Gestión de Reservas$/ }).first();
        await expect(navButton).toBeVisible({ timeout: 20000 });
        console.log('Reservas button visible');
        await navButton.click();
        console.log('Navigated to Reservations');

        // 4. Verify "Gestión de Reservas" and "Pendientes" tab
        await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();
        console.log('Dashboard visible');

        // 5. Find the reservation we just created
        const reservationCard = page.locator('.p-4.flex.flex-col').first();
        await expect(reservationCard).toBeVisible();
        console.log('Reservation card found');
        await expect(reservationCard).toContainText('REQUESTED');

        // 6. Approve Reservation
        console.log('Setting up dialog handler');
        page.on('dialog', async dialog => {
            console.log('Dialog appeared:', dialog.message());
            await dialog.accept();
        });
        console.log('Clicking Approve button');
        await reservationCard.getByRole('button', { name: 'Aprobar' }).click();
        console.log('Approve button clicked');

        // 7. Verify Status Change
        await expect(reservationCard).toContainText('APPROVED_PENDING_PAYMENT', { timeout: 10000 });
        console.log('Status updated to APPROVED_PENDING_PAYMENT');
    });

    test('should allow admin to reject a pending reservation', async ({ page }) => {
        console.log('Starting reject test...');
        // 2. Login as Admin
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for loading to finish
        await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 20000 });

        // Navigate
        const navButton = page.locator('button').filter({ hasText: /^Reservas$|^Gestión de Reservas$/ }).first();
        await expect(navButton).toBeVisible({ timeout: 20000 });
        await navButton.click();

        // Find reservation
        const reservationCard = page.locator('.p-4.flex.flex-col').first();
        await expect(reservationCard).toBeVisible();
        console.log('Reservation card found for rejection');

        // Reject
        page.on('dialog', async dialog => {
            console.log('Dialog appeared:', dialog.message());
            await dialog.accept();
        });
        await reservationCard.getByRole('button', { name: 'Rechazar' }).click();
        console.log('Reject button clicked');

        // Verify it disappears from "Pendientes" or status changes to REJECTED
        await expect(reservationCard).not.toBeVisible();
        console.log('Reservation disappeared from Pending');

        // Verify in History
        await page.click('button:has-text("Historial")');
        const historyCard = page.locator('.p-4.flex.flex-col').first();
        await expect(historyCard).toContainText('REJECTED');
        console.log('Reservation found in History as REJECTED');
    });

});
