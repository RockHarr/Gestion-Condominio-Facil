import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock Authentication
    const mockUser = {
        id: 'fake-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'admin@condominio.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Mock Token Endpoint (Login)
    await page.route('**/auth/v1/token*', async route => {
        const json = {
            access_token: 'fake-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: mockUser,
        };
        await route.fulfill({ json });
    });

    // Mock User Endpoint (Session Validation)
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({ json: mockUser });
    });

    // Mock User Profile (Admin Check)
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            json: [{
                id: 'fake-user-id',
                email: 'admin@condominio.com',
                role: 'admin',
                nombre: 'Admin User',
                unidad: '101'
            }]
        });
    });

    // Mock Reservations Data
    await page.route('**/rest/v1/reservations*', async route => {
        await route.fulfill({
            json: [] // Return empty list for smoke test
        });
    });

    // Mock other potential calls to avoid errors
    await page.route('**/rest/v1/amenities*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/reservation_types*', async route => {
        await route.fulfill({ json: [] });
    });

    // 2. Login as Admin (Mock)
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Ingresar")');
    }

    // 3. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 10000 });

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByText('Gestión de Reservas')).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
    const hasEmptyState = await page.getByText('No hay reservas en esta categoría').isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
