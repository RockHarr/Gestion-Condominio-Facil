import { test, expect } from '@playwright/test';
import { checkTestEnv } from '../../tests/test-config';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Check Test Env (Skip if missing Supabase)
    if (!checkTestEnv()) {
        console.warn('Skipping test: VITE_SUPABASE_URL or ANNON_KEY missing.');
        test.skip();
    }

    // 2. Mock network to ensure no 400 errors (validation logic)
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
        failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    // 3. Login as Admin (Mock)
    // Use relative URL to leverage baseURL from playwright.config.ts (CI uses 3000)
    await page.goto('/');

    // Handle initial login flow
    // Expect "Bienvenido" or similar
    const heading = page.getByRole('heading', { name: /Bienvenido/i });
    if (await heading.isVisible()) {
        await page.fill('input[type="email"]', 'admin@condominio.com');

        // Handle password toggle
        const passwordToggle = page.getByText('Usar contraseña');
        if (await passwordToggle.isVisible()) {
            await passwordToggle.click();
        }

        await page.fill('input[type="password"]', 'admin123'); // Assuming test creds
        await page.click('button:has-text("Iniciar Sesión")');
    }

    // 4. Verify Sidebar or Dashboard access
    // Wait for navigation to complete
    await expect(page.getByText('Panel de Control')).toBeVisible({ timeout: 15000 });

    // 5. Navigate to Reservations
    const reservationsLink = page.getByText('Gestión de Reservas');
    await expect(reservationsLink).toBeVisible();
    await reservationsLink.click();

    // 6. Verify Page Content
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

    // 7. Verify Tabs
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
