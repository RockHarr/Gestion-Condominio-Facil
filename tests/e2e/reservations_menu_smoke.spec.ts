import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock Auth to succeed immediately (bypass Supabase flake/creds)
    await page.route('**/auth/v1/token?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-jwt',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh',
                user: {
                    id: 'fake-admin-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@condominio.com',
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                }
            })
        });
    });

    // Mock Profile to ensure Admin role
    await page.route('**/rest/v1/profiles*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'fake-admin-id',
                    nombre: 'Admin Mock',
                    unidad: 'Admin Unit',
                    role: 'admin',
                    has_parking: false
                })
            });
        } else {
            await route.continue();
        }
    });

    // Mock initial data loads to prevent blocking
    await page.route('**/rest/v1/community_settings*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ common_expense_amount: 50000, parking_cost_amount: 10000 })
        });
    });

    // 2. Login as Admin (Mock)
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.click('button:has-text("Usar contraseña")'); // Ensure UI state
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Ingresar")');
    }

    // 3. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByText('Gestión de Reservas')).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    // Either we see cards OR the empty state message
    const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
    const hasEmptyState = await page.getByText('No hay reservas en esta categoría').isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();

    // 8. Final Network Check
    expect(failedRequests).toEqual([]);
});
