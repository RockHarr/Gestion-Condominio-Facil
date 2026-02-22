import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-config';

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
    // Using centralized test configuration
    await page.goto('/');

    // Fill login if redirected to login
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', TEST_CONFIG.ADMIN_EMAIL);
        // Assuming we need password flow
        if (await page.locator('button:has-text("Usar contraseña")').isVisible()) {
             await page.click('button:has-text("Usar contraseña")');
             await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_PASSWORD);
        } else {
             // Maybe direct password field if UI differs
             const pwd = page.locator('input[type="password"]');
             if (await pwd.isVisible()) {
                 await pwd.fill(TEST_CONFIG.ADMIN_PASSWORD);
             }
        }
        await page.click('button:has-text("Ingresar")');
    }

    // 3. Verify Sidebar
    // Wait for login
    // In mobile view (default CI often), sidebar might be hidden or this button might be in a menu.
    // Ensure we are on desktop or handle menu.
    // For smoke test, we can try force finding or wait longer.
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible({ timeout: 30000 });

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
