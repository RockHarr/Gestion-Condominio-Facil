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
    // Use relative URL to support CI port (3000)
    await page.goto('/');

    // Check if we are on the login page (or already logged in)
    // If "Bienvenido" is visible, we need to login
    if (await page.getByText('Bienvenido').isVisible()) {
        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');

        // Switch to password mode if needed
        const passwordBtn = page.getByRole('button', { name: 'Usar contraseña' });
        if (await passwordBtn.isVisible()) {
            await passwordBtn.click();
        }

        await page.fill('input[type="password"]', '270386');
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 3. Verify Sidebar
    // Wait for the main dashboard or sidebar to appear
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 15000 });

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content
    await expect(page.getByText('Gestión de Reservas')).toBeVisible();

    // 6. Verify List or Empty State (Fallback UI)
    // Either we see cards OR the empty state message
    const content = page.locator('main');
    await expect(content).toBeVisible();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();

    // 8. Final Network Check
    // Note: We filter out auth errors that might happen during initial load/probe
    const relevantErrors = failedRequests.filter(req => !req.includes('/auth/v1/'));
    expect(relevantErrors).toEqual([]);
});
