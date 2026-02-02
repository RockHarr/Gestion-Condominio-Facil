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
    // Using standard Admin credentials
    // Wait for either login input OR dashboard to be visible to avoid race condition
    const emailInput = page.locator('input[type="email"]');
    const dashboard = page.getByRole('button', { name: /Gestión de Reservas/i });

    try {
        await expect(emailInput.or(dashboard)).toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log('Neither login nor dashboard appeared.');
    }

    if (await emailInput.isVisible()) {
        await emailInput.fill('rockwell.harrison@gmail.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', '270386');
        await page.click('button[type="submit"]');
    }

    // 3. Verify Sidebar
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    // Either we see cards OR the empty state message
    // Card uses: bg-white dark:bg-gray-800 rounded-xl shadow-md
    const hasCards = await page.locator('.shadow-md.rounded-xl').count() > 0;
    const hasEmptyState = await page.getByText('No hay reservas en esta categoría').isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();

    // 8. Final Network Check
    expect(failedRequests).toEqual([]);
});
