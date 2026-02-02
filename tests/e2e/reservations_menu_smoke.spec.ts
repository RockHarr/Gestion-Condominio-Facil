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

    console.log('Navigating to /');
    await page.goto('/');

    // Check if we are on the login screen
    const loginHeader = page.getByRole('heading', { name: 'Bienvenido' });

    // Allow time for initial load
    await page.waitForTimeout(1000);

    if (await loginHeader.isVisible()) {
        console.log('Login screen detected. Logging in...');
        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');

        await page.click('button:has-text("Usar contraseña")');

        await page.fill('input[type="password"]', '270386');
        await page.click('button[type="submit"]');
        console.log('Login submitted.');
    } else {
        console.log('Login screen NOT visible. Checking if already logged in...');
    }

    // Wait for Admin Panel to ensure we are logged in as Admin
    // Increase timeout to handle slow CI
    try {
        await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 15000 });
        console.log('Admin Panel confirmed.');
    } catch (e) {
        console.log('Admin Panel NOT found. Current URL:', page.url());
        // Dump body text to debug
        const bodyText = await page.textContent('body');
        console.log('Body Text Snippet:', bodyText?.substring(0, 500));
        throw e;
    }

    // 3. Verify Sidebar Button
    await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();

    // 4. Navigate
    await page.click('button:has-text("Gestión de Reservas")');

    // 5. Verify Page Content (Heading)
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

    // 6. Verify List or Empty State
    const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
    const hasEmptyState = await page.getByText('No hay reservas en esta categoría').isVisible();

    expect(hasCards || hasEmptyState).toBeTruthy();

    expect(failedRequests).toEqual([]);
});
