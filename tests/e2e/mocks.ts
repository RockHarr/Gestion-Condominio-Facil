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
        const method = route.request().method();
        const url = route.request().url();

        const profile = {
            id: 'test-user-id',
            nombre: role === 'admin' ? 'Admin User' : 'Test Resident',
            unidad: role === 'admin' ? 'Admin' : '101',
            role: role,
            has_parking: true,
            email: 'test@example.com',
            alicuota: 1.5
        };

        if (method === 'GET') {
            // Check for Auth query (id=eq.test-user-id) OR single object header
            if (url.includes('id=eq.test-user-id') || acceptHeader.includes('application/vnd.pgrst.object+json')) {
                 await route.fulfill({ json: profile });
            } else {
                 await route.fulfill({ json: [profile] });
            }
        } else {
            await route.continue();
        }
    });
};

// Mock Common Data (fetched by both roles)
export const mockCommonData = async (page: Page) => {
    await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/expenses*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/community_settings*', async route => route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }));
};

// Mock Resident Data
export const mockResidentData = async (page: Page) => {
    await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));
};

// Mock Admin Data
export const mockAdminData = async (page: Page) => {
    await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/common_expense_debts*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/parking_debts*', async route => route.fulfill({ json: [] }));
    // Removed profiles mock to avoid conflict with mockSupabaseAuth
    await page.route('**/rpc/get_financial_kpis*', async route => route.fulfill({ json: { total_collected: 0, deposits_custody: 0, pending_review_count: 0, total_expenses_approved: 0 } }));
};
