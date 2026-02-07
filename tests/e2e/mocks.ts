import { Page } from '@playwright/test';

// Mock Supabase Auth and User Profile
export const mockSupabaseAuth = async (page: Page, role: 'resident' | 'admin' = 'resident') => {
    // 1. Mock Sign-In (Token)
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        const json = {
            access_token: 'fake-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
                id: 'test-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'test@example.com',
                confirmed_at: new Date().toISOString(),
            }
        };
        await route.fulfill({ json });
    });

    // 2. Mock User Endpoint
    await page.route('**/auth/v1/user', async route => {
        const json = {
            id: 'test-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            confirmed_at: new Date().toISOString(),
            app_metadata: {
                provider: 'email',
                providers: ['email']
            },
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await route.fulfill({ json });
    });

    // 3. Mock Profile (Role Determination)
    // The app queries 'profiles' table to check 'role' column
    await page.route('**/rest/v1/profiles*', async route => {
        const headers = route.request().headers();
        const acceptHeader = headers['accept'] || '';

        const profile = {
            id: 'test-user-id',
            nombre: role === 'admin' ? 'Admin User' : 'Test Resident',
            unidad: role === 'admin' ? 'Admin' : '101',
            role: role,
            has_parking: true,
            email: 'test@example.com',
            alicuota: 1.5
        };

        // Supabase .single() sends this Accept header
        if (acceptHeader.includes('application/vnd.pgrst.object+json')) {
             await route.fulfill({ json: profile });
        } else {
             await route.fulfill({ json: [profile] });
        }
    });
};
