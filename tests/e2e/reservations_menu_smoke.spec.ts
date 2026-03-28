
import { test, expect } from '@playwright/test';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock network to ensure no 400 errors (validation logic)
    // We mock aggressively to prevent ANY network call to the real (or missing) backend.

    // Mock Auth Token (Login response)
    // Matches /auth/v1/token, /auth/v1/token?grant_type=password, etc.
    await page.route('**/auth/v1/token*', async route => {
            const json = {
            access_token: "fake-jwt-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "fake-refresh-token",
            user: {
                id: "admin-user-id",
                aud: "authenticated",
                role: "authenticated",
                email: "rockwell.harrison@gmail.com",
                app_metadata: { provider: "email", providers: ["email"] },
                user_metadata: {},
                identities: []
            }
        };
        await route.fulfill({ json });
    });

    // Mock User endpoint (sometimes called on startup)
    await page.route('**/auth/v1/user*', async route => {
        await route.fulfill({ json: {
            id: "admin-user-id",
            aud: "authenticated",
            role: "authenticated",
            email: "rockwell.harrison@gmail.com"
        }});
    });

    // Mock Profile to be Admin
    await page.route('**/rest/v1/profiles*', async route => {
        const json = {
            id: "admin-user-id",
            nombre: "Admin User",
            unidad: "101",
            role: "admin",
            email: "rockwell.harrison@gmail.com",
            has_parking: true
        };
        // Supabase returns an array for select calls usually
        await route.fulfill({ json: [json] });
    });

    // Mock Data Endpoints
    await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/tickets*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/common_expenses*', async route => route.fulfill({ json: [] }));

    // 2. Navigate
    await page.goto('/');

    // 3. Login Flow Handling - HIGH ROBUSTNESS
    const emailInput = page.locator('input[type="email"]');
    // Wait for the form to be interactive
    await expect(emailInput).toBeVisible();

    if (await emailInput.isVisible()) {
        await emailInput.fill('rockwell.harrison@gmail.com');

        // Check if we need to switch to password mode
        // The button text is "Usar contraseña"
        const toggleBtn = page.getByRole('button', { name: 'Usar contraseña' });
        if (await toggleBtn.isVisible()) {
            await toggleBtn.click();
        }

        // Verify password input appears
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
        await passwordInput.fill('270386');

        // Submit
        // Ensure we click the primary submit button
        const submitBtn = page.getByRole('button', { name: 'Iniciar Sesión', exact: true });
        await submitBtn.click();
    }

    // Wait for navigation/login to complete
    // Strict mode safety: match specific heading if possible, or relax regex
    await expect(page.getByRole('heading', { name: /Panel de Control|Inicio/i }).first()).toBeVisible({ timeout: 15000 });

    // 4. Verify Sidebar (Admin)
    const adminMenu = page.getByRole('button', { name: /Gestión de Reservas/i });
    if (await adminMenu.isVisible()) {
        await adminMenu.click();
        await expect(page.getByText('Gestión de Reservas', { exact: true })).toBeVisible();
    } else {
        // Fallback if mobile menu or layout differs
        const mobileMenu = page.getByRole('button', { name: 'Más' });
        if (await mobileMenu.isVisible()) {
             await mobileMenu.click();
             await expect(page.getByText(/Perfil|Cerrar/i).first()).toBeVisible();
        }
    }
});
