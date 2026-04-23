# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/security_check.spec.ts >> Security Policy Verification >> Resident should only see own data and public notices
- Location: tests/e2e/security_check.spec.ts:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="tab-home"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="tab-home"]')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Bienvenido" [level=2] [ref=e6]
    - paragraph [ref=e7]: Ingresa tus credenciales
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Correo Electrónico
        - textbox "Correo Electrónico" [ref=e12]:
          - /placeholder: tu@email.com
          - text: contacto@rockcode.cl
      - generic [ref=e13]:
        - generic [ref=e14]: Contraseña
        - generic [ref=e15]:
          - textbox "Contraseña" [ref=e16]: "180381"
          - button "Mostrar contraseña" [ref=e17] [cursor=pointer]:
            - img [ref=e18]
    - generic [ref=e21]: "Error al iniciar sesión: Failed to fetch"
    - generic [ref=e22]:
      - generic [ref=e23]:
        - img [ref=e24]
        - generic [ref=e26]: Problema de Conexión
      - paragraph [ref=e27]: No se pudo conectar con el servidor. Verifique su internet y credenciales.
      - generic [ref=e28]: "Sugerencia: Revise que las variables VITE_SUPABASE_URL y ANNON_KEY sean correctas en .env.local"
    - generic [ref=e29]:
      - button "Iniciar Sesión" [ref=e30] [cursor=pointer]
      - button "Usar enlace mágico (sin contraseña)" [ref=e31] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | // ==========================================
  4  | // CONFIGURATION: UPDATE THESE BEFORE RUNNING
  5  | // ==========================================
  6  | const RESIDENT_EMAIL = 'contacto@rockcode.cl'; // REPLACE WITH REAL RESIDENT EMAIL
  7  | const RESIDENT_PASSWORD = '180381';       // REPLACE WITH REAL RESIDENT PASSWORD
  8  | const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';       // REPLACE WITH REAL ADMIN EMAIL
  9  | const ADMIN_PASSWORD = '270386';          // REPLACE WITH REAL ADMIN PASSWORD
  10 | // ==========================================
  11 |
  12 | test.describe('Security Policy Verification', () => {
  13 |
  14 |     test('Resident should only see own data and public notices', async ({ page }) => {
  15 |         // 1. Login as Resident
  16 |         await page.goto('/');
  17 |         await page.fill('input[type="email"]', RESIDENT_EMAIL);
  18 |         await page.click('button:has-text("Usar contraseña")');
  19 |         await page.fill('input[type="password"]', RESIDENT_PASSWORD);
  20 |         await page.click('button[type="submit"]');
  21 |
  22 |         // Wait for login to complete (check for home page element)
> 23 |         await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  24 |
  25 |         // 2. Check Notices (Should only see Published)
  26 |         await page.click('text=Avisos');
  27 |         // Assuming there is at least one published notice and one draft in the DB
  28 |         // This is a loose check, but we verify we don't see "Borrador" badges if UI shows them
  29 |         await expect(page.locator('text=Borrador')).not.toBeVisible();
  30 |
  31 |         // 3. Check Tickets (Should only see own)
  32 |         await page.click('text=Tickets');
  33 |         // Verify we are on the tickets page
  34 |         await expect(page.getByRole('heading', { name: 'Mis Tickets' }).first()).toBeVisible();
  35 |
  36 |         // 4. Verify NO Admin Access
  37 |         // Try to navigate to admin route directly if possible, or check menu
  38 |         const adminMenu = page.locator('text=Admin Dashboard');
  39 |         await expect(adminMenu).not.toBeVisible();
  40 |
  41 |         // Logout
  42 |         await page.click('[data-testid="tab-more"]');
  43 |         await page.click('button:has-text("Cerrar Sesión")');
  44 |     });
  45 |
  46 |     test('Admin should see all data', async ({ page }) => {
  47 |         // 1. Login as Admin
  48 |         await page.goto('/');
  49 |         await page.fill('input[type="email"]', ADMIN_EMAIL);
  50 |         await page.click('button:has-text("Usar contraseña")');
  51 |         await page.fill('input[type="password"]', ADMIN_PASSWORD);
  52 |         await page.click('button[type="submit"]');
  53 |
  54 |         // Wait for dashboard
  55 |         await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();
  56 |
  57 |         // 2. Check Admin Access
  58 |         await expect(page.getByText('Cola de Aprobación')).toBeVisible();
  59 |
  60 |         // 3. Check Users List
  61 |         await page.click('text=Unidades');
  62 |         await expect(page.getByRole('heading', { name: 'Directorio de Unidades' })).toBeVisible();
  63 |         // Should see list of users (grid layout)
  64 |         await expect(page.locator('.grid.grid-cols-1')).toBeVisible();
  65 |     });
  66 |
  67 | });
  68 |
```