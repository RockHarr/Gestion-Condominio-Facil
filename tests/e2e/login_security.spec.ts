import { test, expect } from '@playwright/test';

test('Login should show generic error message on failure', async ({ page }) => {
    await page.goto('/');

    // Attempt login with invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.click('button:has-text("Usar contraseña")');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Expect generic error message
    // "Credenciales inválidas o error de conexión. Por favor intente nuevamente."
    await expect(page.locator('text=Credenciales inválidas o error de conexión')).toBeVisible({ timeout: 10000 });

    // Ensure raw error is NOT visible (e.g. "Invalid login credentials" or "User not found")
    // Note: "Invalid login credentials" is the standard Supabase error, we want to hide it if we are strict,
    // or at least hide "User not found". My code hides ALL errors.
    await expect(page.locator('text=User not found')).not.toBeVisible();
    await expect(page.locator('text=Invalid login credentials')).not.toBeVisible();
});
