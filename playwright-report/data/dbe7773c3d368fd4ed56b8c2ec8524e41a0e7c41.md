# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/reservations_menu_smoke.spec.ts >> reservations_menu_smoke
- Location: tests/e2e/reservations_menu_smoke.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Panel de Control' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Panel de Control' })

```

```yaml
- heading "Bienvenido" [level=2]
- paragraph: Ingresa tus credenciales
- text: Correo Electrónico
- textbox "Correo Electrónico":
  - /placeholder: tu@email.com
  - text: rockwell.harrison@gmail.com
- text: Contraseña
- textbox "Contraseña": "270386"
- button "Mostrar contraseña":
  - img
- text: "Error al iniciar sesión: Failed to fetch"
- img
- text: Problema de Conexión
- paragraph: No se pudo conectar con el servidor. Verifique su internet y credenciales.
- text: "Sugerencia: Revise que las variables VITE_SUPABASE_URL y ANNON_KEY sean correctas en .env.local"
- button "Iniciar Sesión"
- button "Usar enlace mágico (sin contraseña)"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('reservations_menu_smoke', async ({ page }) => {
  4  |     // 1. Mock network to ensure no 400 errors (validation logic)
  5  |     const failedRequests: string[] = [];
  6  |     page.on('requestfailed', request => {
  7  |         failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
  8  |     });
  9  |     page.on('response', response => {
  10 |         if (response.status() >= 400 && response.url().includes('/rest/v1/reservations')) {
  11 |             failedRequests.push(`${response.url()} - ${response.status()}`);
  12 |         }
  13 |     });
  14 |
  15 |     // 2. Login as Admin
  16 |     await page.goto('/');
  17 |
  18 |     await page.fill('input[type="email"]', 'rockwell.harrison@gmail.com');
  19 |     await page.click('button:has-text("Usar contraseña")');
  20 |     await page.fill('input[type="password"]', '270386');
  21 |     await page.click('button[type="submit"]');
  22 |
  23 |     // Wait for Dashboard to ensure login is complete
> 24 |     await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible({ timeout: 15000 });
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  25 |
  26 |     // 3. Navigate
  27 |     await page.click('button:has-text("Reservas")');
  28 |
  29 |     // 4. Verify Page Content
  30 |     await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();
  31 |
  32 |     // 5. Verify Tabs
  33 |     await expect(page.getByText('Pendientes')).toBeVisible();
  34 |     await expect(page.getByText('Próximas')).toBeVisible();
  35 |     await expect(page.getByText('Historial')).toBeVisible();
  36 |
  37 |     // 6. Final Network Check
  38 |     expect(failedRequests).toEqual([]);
  39 | });
  40 |
```