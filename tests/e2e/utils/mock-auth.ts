import { Page } from '@playwright/test';

export async function mockSupabaseAuth(page: Page, role = 'admin') {
    // 1. Mock network to ensure no 400 errors (validation logic)
    page.on('requestfailed', request => {
        // console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Mock Supabase Auth to bypass backend dependency in CI
    await page.route('**/auth/v1/token?*', async route => {
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

    // Mock Profile data
    await page.route('**/rest/v1/profiles*', async route => {
        const headers = route.request().headers();
        const profile = {
            id: 'mock-user-id',
            nombre: 'Admin Mock',
            unidad: '101',
            role: role,
            has_parking: true
        };

        if (headers['accept'] && headers['accept'].includes('application/vnd.pgrst.object+json')) {
             await route.fulfill({ json: profile });
        } else {
            await route.fulfill({ json: [profile] });
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
}
