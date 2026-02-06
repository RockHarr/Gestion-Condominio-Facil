import { test, expect } from '@playwright/test';

// Remove skip: This test mocks everything so it SHOULD run in CI even without env vars.
// test.skip(!checkTestEnv(), 'Skipping test: Missing Supabase environment variables');

test.use({ viewport: { width: 1280, height: 720 } }); // Ensure desktop sidebar is visible

test('reservations_menu_smoke', async ({ page }) => {
    // 0. Mock Supabase Auth & Data to bypass backend requirement

    // Catch-all for placeholder requests to prevent DNS errors in CI
    await page.route('https://placeholder.supabase.co/**', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({})
        });
    });

    await page.route('**/auth/v1/user*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'admin-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                user_metadata: { role: 'admin' },
                app_metadata: { provider: 'email', providers: ['email'] }
            })
        });
    });

    await page.route('**/auth/v1/token*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-jwt',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh',
                user: {
                    id: 'admin-id',
                    email: 'admin@condominio.com',
                    user_metadata: { role: 'admin' }
                }
            })
        });
    });

    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: {
                'Content-Range': '0-0/1'
            },
            body: JSON.stringify([{
                id: 'admin-id',
                email: 'admin@condominio.com',
                role: 'admin',
                nombre: 'Admin User',
                unidad: '000'
            }])
        });
    });

    await page.route('**/rest/v1/reservations*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]) // Empty list
        });
    });

    await page.route('**/rest/v1/reservation_types*', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    await page.route('**/rest/v1/amenities*', async route => {
        await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify([])
       });
   });

    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
        // Ignore cancelled requests which often happen during navigation
        if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
             failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
        }
    });

    // 2. Login as Admin (Mock)
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Bienvenido').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
    }

    // 3. Verify Sidebar
    // Wait specifically for the reservations button. Use regex to be flexible.
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
