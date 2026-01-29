import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Credentials from .env.local (hardcoded for test execution since process.env might not load .env.local automatically in all setups)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

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

        // Note: unit_id might not exist on profile in some schemas, relying on user_id primarily for debts
        if (profileData) {
             moroseUnitId = profileData.unit_id;
        }

        console.log(`Setup: User ${moroseUserId}`);

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
        // Clean up first
        await supabase
            .from('common_expense_debts')
            .delete()
            .eq('user_id', moroseUserId)
            .eq('mes', '2025-01');

        // Insert a debt into common_expense_debts
        const { error: debtError } = await supabase
            .from('common_expense_debts')
            .insert({
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
        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
        await expect(page.getByText(/Hola,/)).toBeVisible();

        // 2. Navigate to Amenities
        await page.click('text=Reservar');

        // 3. Select Quincho
        await page.click('text=Quincho');

        // Wait for calendar
        // Select a dynamic date: tomorrow + 2 days to ensure it's valid/enabled
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);
        const dayString = targetDate.getDate().toString();

        const dayButton = page.getByRole('button', { name: dayString, exact: true });

        // Wait for it to be enabled before clicking
        await expect(dayButton).toBeEnabled({ timeout: 10000 });
        await dayButton.click();

        // 5. Attempt to Reserve
        // Wait for the form header
        await expect(page.getByText('Solicitar Reserva')).toBeVisible();

        // Handle Type Selection if multiple types exist
        const typeSelect = page.locator('select');
        // Wait briefly to see if select appears (types are fetched async)
        // If types < 2, select won't appear, but selectedType should be auto-set
        try {
            await expect(typeSelect).toBeVisible({ timeout: 3000 });
            await typeSelect.selectOption({ index: 1 });
        } catch (e) {
            // Ignore if select not found (single type scenario)
            console.log('Single type or select not found, assuming auto-selection');
        }

        // Wait for selected type info to appear (key indicator that state is ready)
        await expect(page.getByText('Tarifa de uso:')).toBeVisible({ timeout: 10000 });

        await page.click('button:has-text("Confirmar Reserva")');

        // 6. Verify Error
        const successToast = page.getByText(/Solicitud de reserva enviada/i);
        if (await successToast.isVisible({ timeout: 2000 })) {
            throw new Error('TEST FAILED: Reservation succeeded but should have been blocked!');
        }

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
        await page.goto('/');
        await page.fill('input[type="email"]', RESIDENT_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', RESIDENT_PASSWORD);
        await page.click('button[type="submit"]');

        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();

        await page.click('text=Reservar');
        await page.click('text=Quincho');

        // Use same date logic
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);
        const dayString = targetDate.getDate().toString();

        const dayButton = page.getByRole('button', { name: dayString, exact: true });
        await expect(dayButton).toBeEnabled({ timeout: 10000 });
        await dayButton.click();

        const typeSelect = page.locator('select');
        try {
            await expect(typeSelect).toBeVisible({ timeout: 3000 });
            await typeSelect.selectOption({ index: 1 });
        } catch (e) {
            console.log('Single type or select not found, assuming auto-selection');
        }

        // Wait for type selection (prevents race condition)
        await expect(page.getByText('Tarifa de uso:')).toBeVisible({ timeout: 10000 });

        await page.click('button:has-text("Confirmar Reserva")');

        // 3. Verify Success
        const successToast = page.getByText(/Solicitud de reserva enviada/i);
        await expect(successToast).toBeVisible({ timeout: 10000 });

        console.log('Verified: Reservation allowed after payment.');
    });
});
