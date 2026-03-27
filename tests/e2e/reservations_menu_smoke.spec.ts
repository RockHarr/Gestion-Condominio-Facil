import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // Debug console logs to verify Auth state
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

    // 1. Mock Supabase Auth (Sign In)
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
                email_confirmed_at: new Date().toISOString(),
                phone: '',
                last_sign_in_at: new Date().toISOString(),
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: {},
                identities: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        };
        await route.fulfill({ json });
    });

    // 2. Mock User Profile (Admin Role)
    // The app uses .select('*').eq('id', user.id).single()
    // This translates to a request with ?id=eq.admin-user-id&select=*
    // And expects a single object in return (Accept header usually indicates this, or client handles array)
    // However, supabase-js .single() checks if response is array and has 1 element, or object.
    // If we return an array [obj], .single() works.
    await page.route('**/rest/v1/profiles?*', async route => {
        const json = {
            id: 'admin-user-id',
            email: 'admin@condominio.com',
            role: 'admin',
            nombre: 'Admin User',
            unidad: 'Admin Unit',
            has_parking: false
        };

        // If the request is for specific ID, return array with 1 item (Supabase standard for select)
        // If the app uses .single(), the client unwraps it.
        // If we return just the object, it might fail if client expects array.
        // SAFEST MOCK: Return Array [Object]. Supabase client .single() handles this.
        await route.fulfill({ json: [json] });
    });

    // 3. Mock Reservations Data
    await page.route('**/rest/v1/reservations?*', async route => {
        await route.fulfill({ json: [] }); // Return empty list for smoke test
    });

    // 4. Mock Other Data to prevent errors
    await page.route('**/rest/v1/tickets?*', async route => { await route.fulfill({ json: [] }); });
    await page.route('**/rest/v1/payments?*', async route => { await route.fulfill({ json: [] }); });
    await page.route('**/rest/v1/common_expense_debts?*', async route => { await route.fulfill({ json: [] }); });
    await page.route('**/rest/v1/parking_debts?*', async route => { await route.fulfill({ json: [] }); });
    await page.route('**/rest/v1/users?*', async route => { await route.fulfill({ json: [] }); });
     await page.route('**/rest/v1/amenities?*', async route => { await route.fulfill({ json: [] }); });
      await page.route('**/rest/v1/notices?*', async route => { await route.fulfill({ json: [] }); });
       await page.route('**/rest/v1/expenses?*', async route => { await route.fulfill({ json: [] }); });
        await page.route('**/rest/v1/community_settings?*', async route => { await route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }); });

    // 5. Navigate
    await page.goto('/');

    // 6. Perform Login
    // If we are redirected to login (which we should be if not auth'd)
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        await page.click('button:has-text("Usar contraseña")'); // Ensure password field is shown
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
    }

    // 7. Verify Admin Dashboard Access
    // Wait for the layout to load. The "Gestión de Reservas" button is in the Admin Sidebar.
    // If this fails, check console logs for "AuthService: Event ..."
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 10000 });

    // 8. Navigate to Reservations
    await page.click('button:has-text("Gestión de Reservas")');

    // 9. Verify Page Content
    await expect(page.getByText('Gestión de Reservas', { exact: true })).toBeVisible();

    // 10. Verify Tabs (Admin View)
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Aprobadas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
