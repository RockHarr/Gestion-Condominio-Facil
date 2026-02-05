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
    // Check if we are on the login screen by looking for the "Bienvenido" title or email input
    if (await page.locator('input[type="email"]').isVisible()) {
        // If we are in "magic link" mode, switch to password mode
        // Use a more specific selector for the button
        const toggleButton = page.getByRole('button', { name: 'Usar contraseña' });
        if (await toggleButton.isVisible()) {
            await toggleButton.click();
            // Wait for password input to appear with a longer timeout
            await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
        }

        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');
        await page.fill('input[type="password"]', '270386'); // Known valid admin creds
        await page.click('button:has-text("Iniciar Sesión")');
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
