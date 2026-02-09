import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];

    // A minimally valid JWT structure (header.payload.signature)
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: 'fake-admin-id',
        role: 'authenticated',
        exp: futureExp,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { role: 'admin', nombre: 'Admin User' }
    }));
    const signature = 'fake-signature';
    const fakeJwt = `${header}.${payload}.${signature}`;

    // Generic Data Mock (return empty list for all GETs to Supabase)
    await page.route('**/rest/v1/*', async route => {
        const url = route.request().url();
        const method = route.request().method();
        const headers = route.request().headers();

        // Specific handling for Profiles
        if (url.includes('/rest/v1/profiles')) {
            // Check if it's a "single" request (Accept header implies object expectation)
            // or if it filters by ID (auth check)
            const isSingle = headers['accept']?.includes('application/vnd.pgrst.object+json');

            if (isSingle || url.includes('id=eq.')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'fake-admin-id',
                        role: 'admin',
                        nombre: 'Admin User',
                        unidad: '101'
                    })
                });
                return;
            }

            // Otherwise return array (list of users)
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'fake-admin-id', role: 'admin', nombre: 'Admin User', unidad: '101' }
                ])
            });
            return;
        }

        // Generic fallback
        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        } else {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        }
    });

    // Mock Auth Token
    await page.route('**/auth/v1/token?*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: fakeJwt,
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

    page.on('requestfailed', request => {
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
    await page.goto('/');

    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        const usePassBtn = page.locator('button:has-text("Usar contraseña")');
        if (await usePassBtn.isVisible()) {
            await usePassBtn.click();
        }
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 3. Verify Login Success via Dashboard Header
    await expect(page.getByRole('heading', { name: /Panel de Control|Admin Panel/i })).toBeVisible({ timeout: 15000 });

    // 4. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas|Reservas/i }).first()).toBeVisible({ timeout: 10000 });

    // 5. Navigate
    await page.getByRole('button', { name: /Gestión de Reservas|Reservas/i }).first().click();

    // 6. Verify Page Content
    await expect(page.getByText('Gestión de Reservas').first()).toBeVisible();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes').first()).toBeVisible();
    await expect(page.getByText('Próximas').first()).toBeVisible();
    await expect(page.getByText('Historial').first()).toBeVisible();

    // 8. Final Network Check
    expect(failedRequests).toEqual([]);
});
