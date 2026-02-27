import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // Enable Console Logging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
        console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
        failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    // Debug responses
    page.on('response', response => {
        // console.log(`RESPONSE: ${response.url()} - ${response.status()}`);
        if (response.status() >= 400 && response.url().includes('/rest/v1/reservations')) {
            failedRequests.push(`${response.url()} - ${response.status()}`);
        }
    });

    // Mock Supabase Auth to bypass backend dependency in CI
    await page.route('**/auth/v1/token?*', async route => {
        console.log('MOCK: Intercepted Auth Token Request');
        const json = {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
                id: 'mock-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                created_at: new Date().toISOString(),
            }
        };
        await route.fulfill({ json });
    });

    // Mock Profile data to ensure role is Admin
    // Handling potential "single" vs "array" expectations
    await page.route('**/rest/v1/profiles*', async route => {
        console.log('MOCK: Intercepted Profile Request');
        // Supabase .single() expects a single object in body if Accept header is correct,
        // but robust mocks often return array if not sure.
        // Let's check headers.
        const headers = route.request().headers();
        if (headers['accept'] && headers['accept'].includes('application/vnd.pgrst.object+json')) {
             await route.fulfill({
                json: {
                    id: 'mock-user-id',
                    nombre: 'Admin Mock',
                    unidad: '101',
                    role: 'admin',
                    has_parking: true
                }
            });
        } else {
            await route.fulfill({
                json: [{
                    id: 'mock-user-id',
                    nombre: 'Admin Mock',
                    unidad: '101',
                    role: 'admin',
                    has_parking: true
                }]
            });
        }
    });

    // Mock other potential blocking requests (Notices, etc)
    await page.route('**/rest/v1/notices*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/amenities*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/reservations*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/expenses*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/community_settings*', async route => {
        await route.fulfill({
            json: { commonExpense: 50000, parkingCost: 10000, id: 1 }
        });
    });

    // 2. Login as Admin (Mock)
    // Assuming default dev login flow or using a known credential if E2E setup allows
    // For smoke test on existing session or quick login:
    await page.goto('/');

    // Fill login if redirected to login
    try {
        if (await page.getByText('Iniciar Sesión').isVisible({ timeout: 5000 })) {
            await page.fill('input[type="email"]', 'admin@condominio.com');
            await page.fill('input[type="password"]', 'admin123'); // Assuming test creds
            await page.click('button:has-text("Ingresar"), button:has-text("Iniciar Sesión")');
        }
    } catch (e) {
        console.log('Login screen not found or timed out, assuming already logged in or stuck.');
    }

    // 3. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 10000 });

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
