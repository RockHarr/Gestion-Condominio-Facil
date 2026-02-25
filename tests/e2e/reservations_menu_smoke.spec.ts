import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
        failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
    page.on('response', response => {
        if (response.status() >= 400 && response.url().includes('/rest/v1/reservations')) {
            failedRequests.push(`${response.url()} - ${response.status()}`);
        }
    });

    // 2. Mock Login and Initial Data
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh-token',
                user: {
                    id: 'test-admin-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@condominio.com',
                    email_confirmed_at: new Date().toISOString(),
                    phone: '',
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: {},
                    identities: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
            })
        });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'test-admin-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: {}
            })
        });
    });

    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'test-admin-id',
                nombre: 'Administrador Test',
                unidad: 'Admin',
                role: 'admin', // Critical for admin access
                has_parking: false,
                email: 'admin@condominio.com'
            }])
        });
    });

    // 2. Login as Admin (Mock)
    // Assuming default dev login flow or using a known credential if E2E setup allows
    // For smoke test on existing session or quick login:
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        // Click "Usar contraseña" if visible (to handle magic link default)
        if (await page.getByText('Usar contraseña').isVisible()) {
             await page.click('text=Usar contraseña');
        }
        await page.fill('input[type="password"]', 'admin123'); // Assuming test creds
        await page.click('button:has-text("Iniciar Sesión")');
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
