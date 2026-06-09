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

    // 2. Login as Admin
    await page.goto('/');

    await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');
    await page.click('button:has-text("Usar contraseña")');
    await page.fill('input[type="password"]', '270386');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to ensure login is complete
    await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible({ timeout: 15000 });

    // 3. Navigate
    await page.click('button:has-text("Reservas")');

    // 4. Verify Page Content
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

    // 5. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();

    // 6. Final Network Check
    expect(failedRequests).toEqual([]);
});
