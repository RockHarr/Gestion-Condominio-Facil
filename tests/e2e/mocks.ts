import { Page } from '@playwright/test';

export async function mockSupabaseAuth(page: Page) {
    // Mock Login (Access Token)
    await page.route('**/auth/v1/token*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh-token',
                user: {
                    id: 'test-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'test@condominio.com',
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

    // Mock User Session
    await page.route('**/auth/v1/user*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'test-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'test@condominio.com',
                app_metadata: { provider: 'email', providers: ['email'] },
                user_metadata: {}
            })
        });
    });

    // Mock Profile Data (Default to Admin for setup tests)
    // Specific tests can override this using page.route again if needed
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'test-user-id',
                nombre: 'Test User',
                unidad: '101',
                role: 'admin',
                has_parking: true,
                email: 'test@condominio.com'
            }])
        });
    });
}
