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
    if (await page.getByText('Iniciar Sesión').isVisible()) {
        // Use known valid admin credentials
        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', '270386');
        await page.click('button[type="submit"]');
    }

    // 3. Wait for Dashboard to Load
    // Ensure we are past the loading state
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 20000 });

    // Check if we are logged in as Admin or Resident (to debug role issues)
    const isAdmin = await page.getByText('Panel de Control').isVisible();
    const isResident = await page.getByText('Hola,').isVisible();

    if (isResident) {
        console.error('Logged in as Resident, expected Admin.');
        // Fail the test if we are resident, as this test requires Admin
        expect(isAdmin).toBeTruthy();
    }

    // Check for "Error al cargar datos"
    if (await page.getByText('Error al cargar datos').isVisible()) {
        console.error('App crashed with Error al cargar datos');
        await page.getByText('Reintentar').click(); // Try to recover
    }

    // Check for Login Error
    if (await page.getByText('Error verificando sesión').isVisible()) {
         console.error('Session verification failed');
    }

    await expect(page.getByText('Panel de Control')).toBeVisible({ timeout: 20000 });

    // 3. Verify Sidebar
    // Use data-testid if available, or a more robust selector
    // We target the nav item specifically
    const navButton = page.locator('[data-testid="nav-admin-reservations"]').or(
        page.getByRole('button', { name: /Gestión de Reservas/i })
    );
    await expect(navButton).toBeVisible({ timeout: 10000 });

    // 4. Navigate
    await navButton.click();

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
