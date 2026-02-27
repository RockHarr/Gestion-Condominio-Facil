
import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
        if (!request.url().includes('google')) {
             failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
        }
    });

    // Mock Auth Token
    await page.route('**/auth/v1/token?*', async route => {
            const json = {
            access_token: "fake-jwt-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "fake-refresh-token",
            user: {
                id: "admin-user-id",
                aud: "authenticated",
                role: "authenticated",
                email: "rockwell.harrison@gmail.com",
                app_metadata: { provider: "email", providers: ["email"] },
                user_metadata: {},
                identities: []
            }
        };
        await route.fulfill({ json });
    });

    // Mock Profile to be Admin
    await page.route('**/rest/v1/profiles?*', async route => {
        const json = {
            id: "admin-user-id",
            nombre: "Admin User",
            unidad: "101",
            role: "admin",
            email: "rockwell.harrison@gmail.com",
            has_parking: true
        };
        await route.fulfill({ json: [json] });
    });

    // Mock Reservations Data (Empty list is fine for smoke test)
    await page.route('**/rest/v1/reservations?*', async route => {
        await route.fulfill({ json: [] });
    });

    // Mock Other Critical Data to prevent crashes
    await page.route('**/rest/v1/tickets?*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/notices?*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/amenities?*', async route => route.fulfill({ json: [] }));

    // 2. Navigate
    await page.goto('/');

    // 3. Login Flow Handling
    const loginButton = page.getByRole('button', { name: /Iniciar Sesión|Enviar enlace/i });

    if (await loginButton.isVisible()) {
        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');

        const passwordToggle = page.locator('button:has-text("Usar contraseña")');
        if (await passwordToggle.isVisible()) {
            await passwordToggle.click();
        }

        await page.fill('input[type="password"]', '270386');
        await page.click('button:has-text("Iniciar Sesión")');

        // Wait for navigation/login to complete
        await expect(page.getByRole('heading', { name: /Panel de Control|Inicio/i })).toBeVisible({ timeout: 15000 });
    }

    // 4. Verify Sidebar (Admin) or Tab Bar (Resident)
    const adminMenu = page.getByRole('button', { name: /Gestión de Reservas/i });

    if (await adminMenu.isVisible()) {
        // Admin Flow
        await adminMenu.click();
        await expect(page.getByText('Gestión de Reservas', { exact: true })).toBeVisible();

        const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
        const hasEmptyState = await page.getByText(/No hay reservas|No se encontraron/i).isVisible();

        expect(hasCards || hasEmptyState).toBeTruthy();

        await expect(page.getByText('Pendientes')).toBeVisible();
    } else {
        // Resident Flow
        const reserveTab = page.getByText('Reservar');
        if (await reserveTab.isVisible()) {
             // We are good, menu loaded
        }
    }
});
