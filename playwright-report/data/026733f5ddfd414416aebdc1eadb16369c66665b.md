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
- textbox "Contraseña": dummy_admin_pwd
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
  16 |         await page.click('button:has-text("Usar contraseña")');
  17 |
  18 |         const passwordInput = page.locator('input[type="password"]');
  19 |         await expect(passwordInput).toBeVisible();
  20 |         await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || 'dummy_admin_pwd');
  21 |
  22 |         await page.click('button:has-text("Iniciar Sesión")');
> 23 |         await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();
     |                                                                               ^ Error: expect(locator).toBeVisible() failed
  24 |
  25 |         // 2. Navigate to Amenities
  26 |         await page.click('text=Espacios Comunes');
  27 |         await expect(page.getByRole('heading', { name: 'Espacios Comunes' })).toBeVisible();
  28 |
  29 |         // 3. Check/Create Quincho
  30 |         // Use first() to avoid strict mode violation if duplicates exist
  31 |         const quinchoCard = page.getByRole('heading', { name: 'Quincho', exact: true }).first();
  32 |         if (!(await quinchoCard.isVisible())) {
  33 |             console.log('Creating Quincho...');
  34 |             await page.click('button:has-text("Nuevo Espacio")');
  35 |             await page.fill('input[placeholder="Ej: Quincho Norte"]', 'Quincho');
  36 |             await page.fill('textarea[placeholder="Detalles sobre el espacio..."]', 'Espacio para asados');
  37 |             await page.fill('input[placeholder="0"]', '20'); // Capacity
  38 |             await page.click('button:has-text("Guardar")');
  39 |             await expect(page.getByRole('heading', { name: 'Quincho', exact: true }).first()).toBeVisible();
  40 |         }
  41 |
  42 |         // 4. Manage Reservation Types for Quincho
  43 |         const card = page.locator('.group', { has: page.getByRole('heading', { name: 'Quincho', exact: true }) }).first();
  44 |         // Force click the hidden button or hover
  45 |         await card.hover();
  46 |         const manageTypesBtn = card.getByTitle('Gestionar Tipos de Reserva');
  47 |         await manageTypesBtn.click();
  48 |
  49 |         await expect(page.getByRole('heading', { name: 'Tipos de Reserva' })).toBeVisible();
  50 |
  51 |         // 5. Check/Create "Asado Familiar"
  52 |         const typeRow = page.getByRole('heading', { name: 'Asado Familiar' });
  53 |         if (!(await typeRow.isVisible())) {
  54 |             console.log('Creating Asado Familiar type...');
  55 |             await page.click('button:has-text("Nuevo Tipo")');
  56 |
  57 |             // Fill Form
  58 |             await page.fill('input[placeholder="Ej: Cumpleaños, Asado Familiar, Evento Masivo"]', 'Asado Familiar');
  59 |
  60 |             // Use labels for numeric inputs to avoid ambiguity
  61 |             await page.getByLabel('Tarifa (CLP)').fill('10000');
  62 |             await page.getByLabel('Garantía (CLP)').fill('20000');
  63 |             await page.getByLabel('Duración Máxima (minutos)').fill('240');
  64 |
  65 |             await page.click('button:has-text("Guardar")');
  66 |             await expect(page.getByRole('heading', { name: 'Asado Familiar' }).first()).toBeVisible();
  67 |         }
  68 |     });
  69 | });
  70 |
```