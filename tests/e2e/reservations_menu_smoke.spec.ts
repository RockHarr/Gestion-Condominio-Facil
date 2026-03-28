import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // Shared mock data
    const mockUser = {
        id: 'admin-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'admin@condominio.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: new Date().toISOString(),
    };

    const mockProfile = {
        id: 'admin-id',
        role: 'admin',
        email: 'admin@condominio.com',
        first_name: 'Admin',
        last_name: 'User'
    };

    // 1. Mock Auth - Login (POST /token)
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: mockUser
            })
        });
    });

    // 2. Mock Auth - Get User (GET /user) - Used by getUser/getSession
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockUser)
        });
    });

    // 3. Mock Profile (Admin Role) - Used by dataService/authService
    await page.route('**/rest/v1/profiles?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockProfile) // Return single object or array depending on select()
        });
    });

    // 4. Mock Reservations
    await page.route('**/rest/v1/reservations?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // 5. Mock Reservation Types (needed for filters/rendering)
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
    // If mocking is perfect, we might auto-login if local storage was set,
    // but here we simulate the user flow to trigger the POST /token mock.
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.click('button:has-text("Usar contraseña")'); // Ensure password input is visible
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // Verify Sidebar Navigation
    // Increased timeout because auth state change + profile fetch might take a moment
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Gestión de Reservas")');

    // Verify Page Content
    await expect(page.getByText('Gestión de Reservas')).toBeVisible();

    // Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
