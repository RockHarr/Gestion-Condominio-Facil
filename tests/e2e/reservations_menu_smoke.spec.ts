import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
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
    await page.route('**/rest/v1/profiles?*', async route => {
        const json = {
            id: 'admin-user-id',
            email: 'admin@condominio.com',
            role: 'admin',
            nombre: 'Admin User',
            unidad: 'Admin Unit',
            has_parking: false
        };
        // Return single object if 'single' or array if 'select'
        // But usually profiles query is .select().eq().single()
        // If url has select=*, usually returns array. If single() used, returns object.
        // Let's assume array for safety if select is used without single(), or object if single.
        // Safest is to return array with one item if query params suggest list, but the app uses .single() often.
        // Let's check the url.
        if (route.request().url().includes('select=')) {
             // If the client expects a single object (header Accept: application/vnd.pgrst.object+json), return object
             const headers = route.request().headers();
             if (headers['accept']?.includes('application/vnd.pgrst.object+json')) {
                 await route.fulfill({ json });
             } else {
                 await route.fulfill({ json: [json] });
             }
        } else {
            await route.fulfill({ json: [json] });
        }
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
