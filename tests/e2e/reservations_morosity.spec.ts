import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Credentials from .env.local (hardcoded for test execution since process.env might not load .env.local automatically in all setups)
const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const RESIDENT_PASSWORD = '180381'; // Assuming this is the password from previous context

test.describe('Reservations - Morosity Check', () => {
    let moroseUnitId: number;
    let moroseUserId: string;

    test.beforeAll(async () => {
        // 1. Get the Resident User ID
        // Login as Resident first to get their own ID
        const { data: residentAuth, error: residentError } = await supabase.auth.signInWithPassword({
            email: RESIDENT_EMAIL,
            password: RESIDENT_PASSWORD
        });

        if (residentError || !residentAuth.user) {
            throw new Error('Failed to login as resident for setup: ' + residentError?.message);
        }

        moroseUserId = residentAuth.user.id;

        // Get Unit ID from profile
        const { data: profileData, error: pError } = await supabase
            .from('profiles')
            .select('unit_id')
            .eq('id', moroseUserId)
            .single();

        if (pError || !profileData) {
            throw new Error('Failed to get profile/unit: ' + pError?.message);
        }
        moroseUnitId = profileData.unit_id;
        console.log(`Setup: User ${moroseUserId}, Unit ${moroseUnitId}`);

        // Logout Resident
        await supabase.auth.signOut();

        // 2. Login as Admin to Insert Debt
        const { error: adminError } = await supabase.auth.signInWithPassword({
            email: 'rockwell.harrison@gmail.com',
            password: '270386'
        });

        if (adminError) {
            throw new Error('Failed to login as admin for setup: ' + adminError.message);
        }

        // 3. Ensure Debt Exists
        // Insert a debt into common_expense_debts
        const { error: debtError } = await supabase
            .from('common_expense_debts')
            .insert({
                // unit_id: moroseUnitId, // Column does not exist
                mes: '2025-01',
                monto: 50000,
                pagado: false,
                user_id: moroseUserId
            });

        if (debtError) {
            console.error('Error inserting debt:', debtError);
        } else {
            console.log('Debt inserted successfully by Admin.');
        }
    });

    test.afterAll(async () => {
        // Cleanup: Pay the debt
        if (moroseUserId) {
            await supabase
                .from('common_expense_debts')
                .delete()
                .eq('user_id', moroseUserId)
                .eq('mes', '2025-01');
        }
    });

    test('should block reservation for morose user', async ({ page }) => {
        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        // The header title on home is "Inicio", and the greeting is "Hola, [Name]"
        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
        await expect(page.getByText(/Hola,/)).toBeVisible();

        // 2. Navigate to Amenities
        // Use the "Reservar" button from the Quick Actions on Home
        await page.click('text=Reservar');

        // 3. Select Quincho (or any amenity)
        await page.click('text=Quincho');

        // Wait for calendar
        // Select a date in the future to ensure it's enabled (e.g., 28th)
        // Ideally we should calculate next available day, but for now 28 is safe for most "current" runs unless end of month
        // Better: Select the first enabled button that is a day number

        await expect(page.locator('.grid button:not([disabled])').first()).toBeVisible({ timeout: 10000 });

        // Click the first available day button that is a number
        const enabledDays = page.locator('.grid button:not([disabled])');
        const dayCount = await enabledDays.count();
        let clicked = false;

        for (let i = 0; i < dayCount; i++) {
            const btn = enabledDays.nth(i);
            const text = await btn.textContent();
            if (text && !isNaN(Number(text)) && Number(text) > 0) {
                await btn.click();
                clicked = true;
                break;
            }
        }

        if (!clicked) {
             throw new Error('No available day found to click');
        }

        // 5. Attempt to Reserve
        await expect(page.getByText('Solicitar Reserva')).toBeVisible();

        const typeSelect = page.locator('select');
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption({ index: 1 });
        }

        // Wait for type selection (prevents race condition)
        await expect(page.getByText('Tarifa de uso:')).toBeVisible();

        await page.click('button:has-text("Confirmar Reserva")');

        // 6. Verify Error
        // Check if success toast appears (which would mean failure of the test goal)
        const successToast = page.getByText(/Solicitud de reserva enviada/i);
        if (await successToast.isVisible({ timeout: 2000 })) {
            throw new Error('TEST FAILED: Reservation succeeded but should have been blocked!');
        }

        // 3. Verify Blocking
        // The error is displayed in the modal, not as a toast
        const errorMessage = page.getByText(/Usuario moroso/i);
        await expect(errorMessage).toBeVisible({ timeout: 10000 });

        console.log('Verified: Reservation blocked with "Usuario moroso" message.');
    });

    test('should allow reservation after debt is paid', async ({ page }) => {
        // 1. Pay Debt (Backend)
        await supabase
            .from('common_expense_debts')
            .update({ pagado: true })
            .eq('user_id', moroseUserId)
            .eq('mes', '2025-01');

        console.log('Debt paid via backend.');

        // 2. Retry Reservation
        // We need to login again because each test has a fresh context
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();

        await page.click('text=Reservar');
        await page.click('text=Quincho');

        // Select a valid day again
        await expect(page.locator('.grid button:not([disabled])').first()).toBeVisible({ timeout: 10000 });
        const enabledDays = page.locator('.grid button:not([disabled])');
        const dayCount = await enabledDays.count();

        for (let i = 0; i < dayCount; i++) {
            const btn = enabledDays.nth(i);
            const text = await btn.textContent();
            if (text && !isNaN(Number(text)) && Number(text) > 0) {
                await btn.click();
                break;
            }
        }

        const typeSelect = page.locator('select');
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption({ index: 1 });
        }

        // Wait for type selection (prevents race condition)
        await expect(page.getByText('Tarifa de uso:')).toBeVisible();

        await page.click('button:has-text("Confirmar Reserva")');

        // 3. Verify Success
        const successToast = page.getByText(/Solicitud de reserva enviada/i);
        await expect(successToast).toBeVisible({ timeout: 10000 });

        console.log('Verified: Reservation allowed after payment.');
    });
});
