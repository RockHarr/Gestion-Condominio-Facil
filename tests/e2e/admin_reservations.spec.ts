import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// CONFIGURATION
// ==========================================
const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
const ADMIN_PASSWORD = '270386';

const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ==========================================

test.describe('Admin — Reservations Management', () => {
    let residentId: string;
    let unitId: number;
    let amenityId: number;
    let typeId: number;

    test.beforeAll(async () => {
        // 1. Get Resident ID and Unit
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, unit_id')
            .eq('email', RESIDENT_EMAIL)
            .single();

        if (userError || !userData) throw new Error('Resident not found');
        residentId = userData.id;
        unitId = userData.unit_id;

        // 2. Get an Amenity and Type
        const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
        if (!amenities || amenities.length === 0) throw new Error('No amenities found');
        amenityId = amenities[0].id; // string or number depending on DB, assumed number/int from context or string UUID

        const { data: types } = await supabase.from('reservation_types').select('id').eq('amenity_id', amenityId).limit(1);
        if (!types || types.length === 0) throw new Error('No reservation types found');
        typeId = types[0].id;
    });

    test.beforeEach(async ({ page }) => {
        // Clean up any pending reservations for this user to avoid clutter
        await supabase.from('reservations').delete().eq('user_id', residentId).eq('status', 'REQUESTED');
    });

    test('should allow admin to approve a pending reservation', async ({ page }) => {
        // 1. Seed Reservation via API
        const startAt = new Date();
        startAt.setDate(startAt.getDate() + 10); // Future date
        startAt.setHours(10, 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setHours(14, 0, 0, 0);

        const { data: reservation, error } = await supabase.from('reservations').insert({
            amenity_id: amenityId,
            type_id: typeId,
            user_id: residentId,
            unit_id: unitId,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            status: 'REQUESTED',
            is_system: false
        }).select().single();

        if (error) throw new Error('Failed to seed reservation: ' + error.message);
        console.log('Seeded reservation:', reservation.id);

        // 2. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for login - Ensure loading spinner is gone first
        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });
        // Check for dashboard elements
        await expect(page.locator('[data-testid="tab-home"]').or(page.getByRole('heading', { name: 'Panel de Control' }))).toBeVisible({ timeout: 30000 });

        // 3. Navigate to Reservations
        const navButton = page.locator('button').filter({ hasText: /^Reservas$|^Gestión de Reservas$/ }).first();
        await expect(navButton).toBeVisible({ timeout: 20000 });
        await navButton.click();

        // 4. Verify "Gestión de Reservas" and "Pendientes" tab
        await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

        // 5. Find the specific reservation card
        // We can look for the ID or user name
        const reservationCard = page.locator('.p-4.flex.flex-col').filter({ hasText: `Reserva #${reservation.id}` }).first();
        await expect(reservationCard).toBeVisible({ timeout: 10000 });
        await expect(reservationCard).toContainText('REQUESTED');

        // 6. Approve Reservation
        page.on('dialog', async dialog => {
            console.log('Dialog appeared:', dialog.message());
            await dialog.accept();
        });
        await reservationCard.getByRole('button', { name: 'Aprobar' }).click();

        // 7. Verify Status Change (optimistic UI or re-fetch)
        // It might move to "Próximas" or stay if we are in "Pendientes" tab (it should disappear from Pending)
        // The list filters by status. If status becomes APPROVED, it should vanish from "Pendientes".
        await expect(reservationCard).not.toBeVisible();

        console.log('Reservation disappeared from Pending tab');
    });

    test('should allow admin to reject a pending reservation', async ({ page }) => {
        // 1. Seed Reservation via API
        const startAt = new Date();
        startAt.setDate(startAt.getDate() + 11); // Future date
        startAt.setHours(10, 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setHours(14, 0, 0, 0);

        const { data: reservation, error } = await supabase.from('reservations').insert({
            amenity_id: amenityId,
            type_id: typeId,
            user_id: residentId,
            unit_id: unitId,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            status: 'REQUESTED',
            is_system: false
        }).select().single();

        if (error) throw new Error('Failed to seed reservation: ' + error.message);
        console.log('Seeded reservation for rejection:', reservation.id);

        // 2. Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');

        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });
        const navButton = page.locator('button').filter({ hasText: /^Reservas$|^Gestión de Reservas$/ }).first();
        await expect(navButton).toBeVisible({ timeout: 20000 });
        await navButton.click();

        // 3. Find reservation
        const reservationCard = page.locator('.p-4.flex.flex-col').filter({ hasText: `Reserva #${reservation.id}` }).first();
        await expect(reservationCard).toBeVisible({ timeout: 10000 });

        // 4. Reject
        page.on('dialog', async dialog => {
            console.log('Dialog appeared:', dialog.message());
            await dialog.accept();
        });
        await reservationCard.getByRole('button', { name: 'Rechazar' }).click();

        // 5. Verify disappearance
        await expect(reservationCard).not.toBeVisible();
        console.log('Reservation rejected and removed from view');
    });

});
