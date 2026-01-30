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
    // Assuming default dev login flow or using a known credential if E2E setup allows
    // For smoke test on existing session or quick login:
    await page.goto('/');

    // Fill login if redirected to login
    // Wait for app to load (either login screen or dashboard)
    const loginHeader = page.getByText('Bienvenido');
    const usePasswordBtn = page.getByText('Usar contraseña');
    const dashboardBtn = page.getByRole('button', { name: /Gestión de Reservas/i });

    await expect(loginHeader.or(usePasswordBtn).or(dashboardBtn).first()).toBeVisible({ timeout: 15000 });

    if (await loginHeader.first().isVisible() || await usePasswordBtn.first().isVisible()) {
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
             await emailInput.fill('rockwell.harrison@gmail.com');
        }

        if (await usePasswordBtn.first().isVisible()) {
            await usePasswordBtn.first().click();
        }

        await page.fill('input[type="password"]', '270386');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 3. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

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
