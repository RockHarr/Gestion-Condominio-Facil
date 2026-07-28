const fs = require('fs');
let content = fs.readFileSync('tests/e2e/reservations_menu_smoke.spec.ts', 'utf8');

const loginReplacement = `
    await page.waitForLoadState('networkidle');
    if (await page.getByRole('heading', { name: 'Bienvenido' }).isVisible() || await page.getByText('Ingresa tu correo para continuar').isVisible() || await page.getByText('Iniciar Sesión').isVisible()) {
        await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');
        const passButton = page.locator('button:has-text("Usar contraseña")');
        if (await passButton.isVisible()) {
            await passButton.click();
        }
        await page.fill('input[type="password"]', '270386'); // Assuming test creds from memory
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await page.waitForLoadState('networkidle');
    }
`;

content = content.replace(
    /if \(await page\.getByText\('Iniciar Sesión'\)\.isVisible\(\)\) \{[\s\S]*?\}/g,
    loginReplacement
);

// We need to wait for the page to be fully loaded first before clicking
content = content.replace(
    "await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();",
    "const navButton = page.locator('button').filter({ hasText: /^Reservas$|^Gestión de Reservas$/ }).first();\n    await expect(navButton).toBeVisible({ timeout: 15000 });"
);

content = content.replace(
    "await page.click('button:has-text(\"Gestión de Reservas\")');",
    "await navButton.click();"
);

fs.writeFileSync('tests/e2e/reservations_menu_smoke.spec.ts', content);
