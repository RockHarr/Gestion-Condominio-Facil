# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/setup.spec.ts >> System Setup >> Ensure Amenities and Reservation Types exist
- Location: tests/e2e/setup.spec.ts:7:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Panel de Control' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Panel de Control' })

```

```yaml
- text: La conexión está tardando mucho. Verifique su red o configuración.
- button "Cerrar notificación":
  - img
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
  3  | const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
  4  | const ADMIN_PASSWORD = '270386';
  5  |
  6  | test.describe('System Setup', () => {
  7  |     test('Ensure Amenities and Reservation Types exist', async ({ page }) => {
  8  |         // 1. Login as Admin
  9  |         await page.goto('/');
  10 |
  11 |         const emailInput = page.locator('input[type="email"]');
  12 |         await expect(emailInput).toBeVisible();
  13 |         await emailInput.fill(ADMIN_EMAIL);
  14 |
  15 |         // Click "Usar contraseña" to reveal the password field
  16 |         await page.waitForLoadState('networkidle');
  17 |         await page.click('button:has-text("Usar contraseña")');
  18 |
  19 |         const passwordInput = page.locator('input[type="password"]');
  20 |         await expect(passwordInput).toBeVisible();
  21 |         await passwordInput.fill(ADMIN_PASSWORD);
  22 |
  23 |         await page.click('button:has-text("Iniciar Sesión")');
> 24 |         await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();
     |                                                                               ^ Error: expect(locator).toBeVisible() failed
  25 |
  26 |         // 2. Navigate to Amenities
  27 |         await page.click('text=Espacios Comunes');
  28 |         await expect(page.getByRole('heading', { name: 'Espacios Comunes' })).toBeVisible();
  29 |
  30 |         // 3. Check/Create Quincho
  31 |         // Use first() to avoid strict mode violation if duplicates exist
  32 |         const quinchoCard = page.getByRole('heading', { name: 'Quincho', exact: true }).first();
  33 |         if (!(await quinchoCard.isVisible())) {
  34 |             console.log('Creating Quincho...');
  35 |             await page.click('button:has-text("Nuevo Espacio")');
  36 |             await page.fill('input[placeholder="Ej: Quincho Norte"]', 'Quincho');
  37 |             await page.fill('textarea[placeholder="Detalles sobre el espacio..."]', 'Espacio para asados');
  38 |             await page.fill('input[placeholder="0"]', '20'); // Capacity
  39 |             await page.click('button:has-text("Guardar")');
  40 |             await expect(page.getByRole('heading', { name: 'Quincho', exact: true }).first()).toBeVisible();
  41 |         }
  42 |
  43 |         // 4. Manage Reservation Types for Quincho
  44 |         const card = page.locator('.group', { has: page.getByRole('heading', { name: 'Quincho', exact: true }) }).first();
  45 |         // Force click the hidden button or hover
  46 |         await card.hover();
  47 |         const manageTypesBtn = card.getByTitle('Gestionar Tipos de Reserva');
  48 |         await manageTypesBtn.click();
  49 |
  50 |         await expect(page.getByRole('heading', { name: 'Tipos de Reserva' })).toBeVisible();
  51 |
  52 |         // 5. Check/Create "Asado Familiar"
  53 |         const typeRow = page.getByRole('heading', { name: 'Asado Familiar' });
  54 |         if (!(await typeRow.isVisible())) {
  55 |             console.log('Creating Asado Familiar type...');
  56 |             await page.click('button:has-text("Nuevo Tipo")');
  57 |
  58 |             // Fill Form
  59 |             await page.fill('input[placeholder="Ej: Cumpleaños, Asado Familiar, Evento Masivo"]', 'Asado Familiar');
  60 |
  61 |             // Use labels for numeric inputs to avoid ambiguity
  62 |             await page.getByLabel('Tarifa (CLP)').fill('10000');
  63 |             await page.getByLabel('Garantía (CLP)').fill('20000');
  64 |             await page.getByLabel('Duración Máxima (minutos)').fill('240');
  65 |
  66 |             await page.click('button:has-text("Guardar")');
  67 |             await expect(page.getByRole('heading', { name: 'Asado Familiar' }).first()).toBeVisible();
  68 |         }
  69 |     });
  70 | });
  71 |
```