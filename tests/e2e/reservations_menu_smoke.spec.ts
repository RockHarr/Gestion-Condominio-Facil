
import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Setup - Mock or ensure login
    // If we are already logged in via global setup, this might be redundant or we can just go to root.
    // However, to be robust, let's try to go to the root.

    // Using relative URL to rely on baseURL from playwright.config.ts
    // This avoids port mismatch (3000 vs 5173).
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'contacto@rockcode.cl');
        await page.fill('input[type="password"]', '180381');
        await page.click('button[type="submit"]');
    }

    // 2. Wait for Dashboard / Home
    // Check for a known element on the home page, e.g., "Hola," or "Inicio"
    await expect(page.getByText('Hola,')).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Reservations
    // We look for the "Espacios Comunes" button/tab
    await page.getByText('Espacios Comunes').click();

    // 4. Verify Amenities are visible
    // "Quincho" and "Salón de Eventos" are the default seed data
    await expect(page.getByText('Quincho')).toBeVisible();
    await expect(page.getByText('Salón de Eventos')).toBeVisible();

    // 5. Click on Quincho
    await page.getByText('Quincho').click();

    // 6. Verify Calendar or Reservation Page
    // Should see "Reservar Quincho" or similar header
    await expect(page.getByRole('heading', { name: 'Quincho' })).toBeVisible();

    // Check for "Reservar" button availability
    await expect(page.getByText('Reservar', { exact: true })).toBeVisible();
});
