import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];

    // Generic Data Mock (return empty list for all GETs to Supabase)
    await page.route('**/rest/v1/*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        } else {
            // For POST/PUT/DELETE, return success with empty object
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        }
    });

    // Mock Auth Token endpoint to return success (overrides generic if auth is under rest/v1 which it isn't usually, but usually /auth/v1)
    await page.route('**/auth/v1/token?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh-token',
                user: {
                    id: 'fake-admin-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@condominio.com',
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: { role: 'admin', nombre: 'Admin User' },
                    created_at: new Date().toISOString(),
                }
            })
        });
    });

    // Mock User endpoint
    await page.route('**/auth/v1/user*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'fake-admin-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: { role: 'admin', nombre: 'Admin User' },
                created_at: new Date().toISOString(),
            })
        });
    });

    // Mock Profiles specifically to ensure we have an Admin profile
    await page.route('**/rest/v1/profiles*', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 'fake-admin-id', role: 'admin', nombre: 'Admin User', unidad: '101' }
            ])
        });
    });

    page.on('requestfailed', request => {
        // Ignore aborted requests (often due to navigation)
        if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
             failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
        }
    });

    page.on('response', response => {
        if (response.status() >= 400 && response.url().includes('/rest/v1/reservations')) {
            failedRequests.push(`${response.url()} - ${response.status()}`);
        }
    });

    // 2. Login as Admin (Mock)
    // Use relative URL to leverage baseURL from config
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        // Click "Usar contraseña" if present
        const usePassBtn = page.locator('button:has-text("Usar contraseña")');
        if (await usePassBtn.isVisible()) {
            await usePassBtn.click();
        }
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 3. Verify Sidebar
    // Wait for sidebar to load
    await expect(page.getByRole('button', { name: /Gestión de Reservas|Reservas/i }).first()).toBeVisible({ timeout: 10000 });

    // 4. Navigate
    await page.getByRole('button', { name: /Gestión de Reservas|Reservas/i }).first().click();

    // 5. Verify Page Content
    await expect(page.getByText('Gestión de Reservas').first()).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    // Since we mock [], we expect empty state
    // Just check that page loaded without crashing

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes').first()).toBeVisible();
    await expect(page.getByText('Próximas').first()).toBeVisible();
    await expect(page.getByText('Historial').first()).toBeVisible();

    // 8. Final Network Check
    expect(failedRequests).toEqual([]);
});
