import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock Authentication
    await page.route('**/auth/v1/token*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: {
                    id: 'mock-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@condominio.com',
                    app_metadata: { provider: 'email' },
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                }
            })
        });
    });

    // Mock profile query to return admin role
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'mock-user-id',
                nombre: 'Admin Test',
                unidad: 'Admin',
                role: 'admin',
                has_parking: false
            }])
        });
    });

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
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');
        // Click "Usar contraseña" to reveal the password field if needed (based on LoginScreen logic)
        const usePasswordBtn = page.locator('button:has-text("Usar contraseña")');
        if (await usePasswordBtn.isVisible()) {
            await usePasswordBtn.click();
        }
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")'); // Updated button text match
    }

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
