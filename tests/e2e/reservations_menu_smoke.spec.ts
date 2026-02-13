import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // Mock Auth
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: {
                    id: 'admin-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@condominio.com',
                    app_metadata: { provider: 'email' },
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                }
            })
        });
    });

    // Mock User Profile (Admin Role)
    await page.route('**/rest/v1/profiles?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'admin-id',
                role: 'admin',
                email: 'admin@condominio.com',
                first_name: 'Admin',
                last_name: 'User'
            }) // Return single object as .single() expects, or array if .select()
        });
    });

    // Mock Reservations
    await page.route('**/rest/v1/reservations?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Mock Reservation Types (needed for filters/rendering)
    await page.route('**/rest/v1/reservation_types?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Navigate to App
    await page.goto('/');

    // Handle Login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.click('button:has-text("Usar contraseña")'); // Ensure password input is visible
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // Verify Sidebar Navigation
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Gestión de Reservas")');

    // Verify Page Content
    await expect(page.getByText('Gestión de Reservas')).toBeVisible();

    // Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
