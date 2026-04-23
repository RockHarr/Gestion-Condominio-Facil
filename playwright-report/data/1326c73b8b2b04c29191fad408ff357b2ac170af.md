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

Locator: getByRole('button', { name: /Gestión de Reservas/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /Gestión de Reservas/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]: La conexión está tardando mucho. Verifique su red o configuración.
    - button "Cerrar notificación" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "Bienvenido" [level=2] [ref=e12]
      - paragraph [ref=e13]: Ingresa tu correo para continuar
    - generic [ref=e14]:
      - generic [ref=e16]:
        - generic [ref=e17]: Correo Electrónico
        - textbox "Correo Electrónico" [ref=e18]:
          - /placeholder: tu@email.com
      - generic [ref=e19]:
        - button "Enviar enlace de acceso" [ref=e20] [cursor=pointer]
        - button "Usar contraseña" [ref=e21] [cursor=pointer]
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
  15 |     // 2. Login as Admin (Mock)
  16 |     // Assuming default dev login flow or using a known credential if E2E setup allows
  17 |     // For smoke test on existing session or quick login:
  18 |     await page.goto('/');
  19 |
  20 |     // Fill login if redirected to login
  21 |     if (await page.getByText('Iniciar Sesión').isVisible()) {
  22 |         await page.fill('input[type="email"]', 'admin@condominio.com');
  23 |         await page.fill('input[type="password"]', 'admin123'); // Assuming test creds
  24 |         await page.click('button:has-text("Ingresar")');
  25 |     }
  26 |
  27 |     // 3. Verify Sidebar
> 28 |     await expect(page.getByRole('button', { name: /Gestión de Reservas/i })).toBeVisible();
     |                                                                              ^ Error: expect(locator).toBeVisible() failed
  29 |
  30 |     // 4. Navigate
  31 |     await page.click('button:has-text("Gestión de Reservas")');
  32 |
  33 |     // 5. Verify Page Content
  34 |     await expect(page.getByText('Gestión de Reservas')).toBeVisible();
  35 |
  36 |     // 6. Verify List or Empty State (Fallback UI)
  37 |     // Either we see cards OR the empty state message
  38 |     const hasCards = await page.locator('.bg-white.rounded-lg.shadow').count() > 0;
  39 |     const hasEmptyState = await page.getByText('No hay reservas en esta categoría').isVisible();
  40 |
  41 |     expect(hasCards || hasEmptyState).toBeTruthy();
  42 |
  43 |     // 7. Verify Tabs
  44 |     await expect(page.getByText('Pendientes')).toBeVisible();
  45 |     await expect(page.getByText('Próximas')).toBeVisible();
  46 |     await expect(page.getByText('Historial')).toBeVisible();
  47 |
  48 |     // 8. Final Network Check
  49 |     expect(failedRequests).toEqual([]);
  50 | });
  51 |
```