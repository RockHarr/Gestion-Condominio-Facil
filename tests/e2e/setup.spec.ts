import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
const ADMIN_PASSWORD = '270386';

test.describe('System Setup', () => {
    test('Ensure Amenities and Reservation Types exist', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('/');

        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill(ADMIN_EMAIL);

        // Click "Usar contraseña" to reveal the password field
        await page.click('button:has-text("Usar contraseña")');

        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill(ADMIN_PASSWORD);

        await page.click('button:has-text("Iniciar Sesión")');
        // Increase timeout for slow CI environments
        await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible({ timeout: 15000 });

        // 2. Navigate to Amenities
        await page.click('text=Espacios Comunes');
        await expect(page.getByRole('heading', { name: 'Espacios Comunes' })).toBeVisible();

        // 3. Check/Create Quincho
        // Use first() to avoid strict mode violation if duplicates exist
        const quinchoCard = page.getByRole('heading', { name: 'Quincho', exact: true }).first();
        if (!(await quinchoCard.isVisible())) {
            console.log('Creating Quincho...');
            await page.click('button:has-text("Nuevo Espacio")');
            await page.fill('input[placeholder="Ej: Quincho Norte"]', 'Quincho');
            await page.fill('textarea[placeholder="Detalles sobre el espacio..."]', 'Espacio para asados');
            await page.fill('input[placeholder="0"]', '20'); // Capacity
            await page.click('button:has-text("Guardar")');
            // Wait for creating animation/modal close
            await expect(page.getByRole('heading', { name: 'Quincho', exact: true }).first()).toBeVisible({ timeout: 10000 });
            // Close modal if still open (sometimes "Guardar" doesn't close it automatically in some flows?)
            // Assuming it closes.
        }

        // 4. Manage Reservation Types for Quincho
        const card = page.locator('.group', { has: page.getByRole('heading', { name: 'Quincho', exact: true }) }).first();
        // Force click the hidden button or hover
        await card.hover();
        const manageTypesBtn = card.getByTitle('Gestionar Tipos de Reserva');
        await manageTypesBtn.click();

        await expect(page.getByRole('heading', { name: 'Tipos de Reserva' })).toBeVisible();

        // 5. Check/Create "Asado Familiar"
        const typeRow = page.getByRole('heading', { name: 'Asado Familiar' });
        if (!(await typeRow.isVisible())) {
            console.log('Creating Asado Familiar type...');
            await page.click('button:has-text("Nuevo Tipo")');

            // Fill Form
            await page.fill('input[placeholder="Ej: Cumpleaños, Asado Familiar, Evento Masivo"]', 'Asado Familiar');

            // Use labels for numeric inputs to avoid ambiguity
            await page.getByLabel('Tarifa (CLP)').fill('10000');
            await page.getByLabel('Garantía (CLP)').fill('20000');
            await page.getByLabel('Duración Máxima (minutos)').fill('240');

            // Force click the save button within the modal to avoid ambiguity
            // Try generic selector if role="dialog" is not present
            const saveBtn = page.locator('button:has-text("Guardar")').last();
            await expect(saveBtn).toBeEnabled();
            await saveBtn.click();

            // Wait for modal to close or heading to appear
            // If the modal doesn't close, we might need to force a reload or check for errors
            // Try waiting longer or reloading if not found
            try {
                await expect(page.getByRole('heading', { name: 'Asado Familiar' }).first()).toBeVisible({ timeout: 10000 });
            } catch (e) {
                console.log('Heading not found, reloading to check if saved...');
                await page.reload();
                await expect(page.getByRole('heading', { name: 'Tipos de Reserva' })).toBeVisible();
                await expect(page.getByRole('heading', { name: 'Asado Familiar' }).first()).toBeVisible({ timeout: 10000 });
            }
        }
    });
});
