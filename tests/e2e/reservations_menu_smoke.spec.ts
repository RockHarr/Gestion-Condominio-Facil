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

    // Mock Supabase Auth to bypass CI network issues
    await page.route('**/auth/v1/token*', async route => {
        const json = {
            access_token: "fake-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "fake-refresh-token",
            user: {
                id: "fake-user-id",
                aud: "authenticated",
                role: "authenticated",
                email: "admin@condominio.com",
                confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                app_metadata: { provider: "email", providers: ["email"] },
                user_metadata: { nombre: "Admin", role: "admin", unidad: "101" },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };
        await route.fulfill({ json });
    });

    // Also mock fetching the user profile if the app does it separately via REST
    await page.route('**/rest/v1/profiles*', async route => {
        const json = [{
            id: "fake-user-id",
            role: "admin",
            nombre: "Admin",
            unidad: "101",
            email: "admin@condominio.com"
        }];
        await route.fulfill({ json });
    });

    // 2. Login as Admin (Mock)
    // Assuming default dev login flow or using a known credential if E2E setup allows
    // For smoke test on existing session or quick login:
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        // Click "Usar contraseña" to reveal the password field
        const usePasswordBtn = page.getByRole('button', { name: 'Usar contraseña' });
        if (await usePasswordBtn.isVisible()) {
            await usePasswordBtn.click();
        }
        await page.fill('input[type="password"]', 'admin123'); // Assuming test creds
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 3. Verify Sidebar
    // Note: The app might need a moment to process the login and render the dashboard
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 15000 });

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByText('Gestión de Reservas').first()).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    // Either we see cards OR the empty state message
    const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
    // We added a new EmptyState component with a specific text or the old one
    const hasEmptyState = await page.getByText(/No hay reservas|Sin reservas/).isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();

    // Just ensure page didn't crash
    expect(page.url()).toContain('reservations');

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();

    // 8. Final Network Check
    expect(failedRequests).toEqual([]);
});
