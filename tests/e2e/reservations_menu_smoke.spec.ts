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

    // 2. Login as Admin (Mock)
    // Mock Supabase Auth to succeed without real backend
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        const json = {
            access_token: 'fake-jwt-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'admin-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                created_at: new Date().toISOString(),
            }
        };
        await route.fulfill({ json, contentType: 'application/json' });
    });

    await page.route('**/auth/v1/user', async route => {
         const json = {
            id: 'admin-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@condominio.com',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await route.fulfill({ json, contentType: 'application/json' });
    });

    // Also mock the profile request which happens after login
    await page.route('**/rest/v1/profiles*', async route => {
        const json = {
            id: 'admin-user-id',
            nombre: 'Admin User',
            unidad: 'Admin Office',
            role: 'admin', // Crucial for admin menu access
            has_parking: false,
            email: 'admin@condominio.com',
            alicuota: 0
        };
        // Distinguish between single profile fetch (auth) and list fetch (admin units)
        if (route.request().url().includes('id=eq')) {
             await route.fulfill({ json, contentType: 'application/json' });
        } else {
             await route.fulfill({ json: [json], contentType: 'application/json' });
        }
    });

    // Mock other endpoints to prevent crashes/timeouts
    await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/expenses*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/users*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [], contentType: 'application/json' }));
    await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [], contentType: 'application/json' }));

    // Settings mock (returns object, not array)
    await page.route('**/rest/v1/community_settings*', async route => {
        const json = { commonExpense: 50000, parkingCost: 10000, id: 1 };
         if (route.request().url().includes('select')) {
             await route.fulfill({ json: [json], contentType: 'application/json' });
        } else {
             await route.fulfill({ json, contentType: 'application/json' });
        }
    });

    // Inject Session directly into LocalStorage to bypass login flow
    await page.addInitScript(() => {
        const session = {
            access_token: 'fake-jwt-token',
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'admin-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@condominio.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                created_at: new Date().toISOString(),
            }
        };
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(session));
    });

    await page.goto('/');

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
