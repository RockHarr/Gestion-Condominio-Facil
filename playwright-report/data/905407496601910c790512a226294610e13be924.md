# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/admin_reservations.spec.ts >> Admin — Reservations Management >> should allow admin to reject a pending reservation
- Location: tests/e2e/admin_reservations.spec.ts:166:5

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

```yaml
- heading "Bienvenido" [level=2]
- paragraph: Ingresa tus credenciales
- text: Correo Electrónico
- textbox "Correo Electrónico":
  - /placeholder: tu@email.com
  - text: contacto@rockcode.cl
- text: Contraseña
- textbox "Contraseña": dummy_password
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
  1   | import { test, expect } from '@playwright/test';
  2   |
  3   | // ==========================================
  4   | // CONFIGURATION
  5   | // ==========================================
  6   | const RESIDENT_EMAIL = 'contacto@rockcode.cl';
  7   | const RESIDENT_PASSWORD = process.env.TEST_RESIDENT_PASSWORD || 'dummy_password';
  8   | const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
  9   | const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'dummy_admin_password';
  10  | // ==========================================
  11  |
  12  | test.describe('Admin — Reservations Management', () => {
  13  |
  14  |     test.beforeEach(async ({ page }) => {
  15  |         // Enable console logging from browser
  16  |         page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  17  |
  18  |         // 1. Create a Reservation as Resident to ensure we have data to test
  19  |         await page.goto('/');
  20  |         await page.fill('input[type="email"]', RESIDENT_EMAIL);
  21  |         await page.click('button:has-text("Usar contraseña")');
  22  |         await page.fill('input[type="password"]', RESIDENT_PASSWORD);
  23  |         await page.click('button[type="submit"]');
  24  |
  25  |         // Wait for login
> 26  |         await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  27  |         // Retry logic for reservation creation (Day + Time)
  28  |         let success = false;
  29  |         let attempts = 0;
  30  |         const maxAttempts = 10;
  31  |
  32  |         while (!success && attempts < maxAttempts) {
  33  |             attempts++;
  34  |             console.log(`\n--- Reservation Attempt ${attempts}/${maxAttempts} ---`);
  35  |
  36  |             // 1. Select a Random Day
  37  |             if (attempts > 1) {
  38  |                 console.log('Reloading page to reset state...');
  39  |                 await page.reload();
  40  |                 // Wait for app to re-initialize
  41  |                 await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 20000 });
  42  |                 await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 20000 });
  43  |
  44  |                 await page.click('[data-testid="tab-amenities"]');
  45  |                 await page.locator('button:has-text("Reservar")').first().click();
  46  |             } else {
  47  |                 // Initial navigation
  48  |                 await page.click('[data-testid="tab-amenities"]');
  49  |                 await page.locator('button:has-text("Reservar")').first().click();
  50  |             }
  51  |
  52  |             // Wait for calendar
  53  |             await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible();
  54  |             const availableDays = page.locator('button.aspect-square:not([disabled])');
  55  |             const count = await availableDays.count();
  56  |
  57  |             if (count === 0) throw new Error('No available days found to book.');
  58  |
  59  |             const randomIndex = Math.floor(Math.random() * count);
  60  |             console.log(`Selecting day index: ${randomIndex} of ${count}`);
  61  |             await availableDays.nth(randomIndex).click();
  62  |
  63  |             // 2. Confirm Booking Modal
  64  |             const modal = page.getByRole('dialog').or(page.locator('.fixed.inset-0'));
  65  |             await expect(modal).toBeVisible();
  66  |
  67  |             // Handle Type Selection if present
  68  |             const typeSelect = modal.locator('select');
  69  |             if (await typeSelect.isVisible()) {
  70  |                 await typeSelect.selectOption({ index: 1 });
  71  |             } else {
  72  |                 await expect(modal.getByText(/Tarifa de uso:/i)).toBeVisible();
  73  |             }
  74  |
  75  |             // 3. Pick Random Time
  76  |             const randomHour = Math.floor(Math.random() * 10) + 10; // 10 to 19
  77  |             const startStr = `${randomHour}:00`;
  78  |             const endStr = `${randomHour + 2}:00`;
  79  |             console.log(`Selected time: ${startStr} - ${endStr}`);
  80  |
  81  |             await modal.locator('input[type="time"]').first().fill(startStr);
  82  |             await modal.locator('input[type="time"]').last().fill(endStr);
  83  |
  84  |             await modal.getByRole('button', { name: /solicitar|confirmar/i }).click();
  85  |
  86  |             try {
  87  |                 // Wait for success or error
  88  |                 const successToast = page.getByText('Solicitud de reserva enviada exitosamente.');
  89  |                 const errorMsg = page.locator('.bg-red-100');
  90  |
  91  |                 await expect(successToast.or(errorMsg)).toBeVisible({ timeout: 5000 });
  92  |
  93  |                 if (await successToast.isVisible()) {
  94  |                     console.log('Success toast appeared!');
  95  |                     success = true;
  96  |                 } else {
  97  |                     const text = await errorMsg.textContent();
  98  |                     console.log(`Attempt ${attempts} failed with UI error: ${text}`);
  99  |                 }
  100 |             } catch (e) {
  101 |                 console.log(`Attempt ${attempts} error (timeout/other):`, e);
  102 |             }
  103 |         }
  104 |
  105 |         if (!success) {
  106 |             throw new Error(`Failed to create reservation after ${maxAttempts} attempts.`);
  107 |         }
  108 |
  109 |         // Logout Resident
  110 |         console.log('Logging out resident...');
  111 |         await page.evaluate(() => localStorage.clear()); // Clear Supabase session
  112 |         await page.context().clearCookies();
  113 |         await page.reload();
  114 |         // Wait for Login Screen to ensure we are logged out
  115 |         await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  116 |         console.log('Logged out successfully, Login screen visible.');
  117 |     });
  118 |
  119 |     test('should allow admin to approve a pending reservation', async ({ page }) => {
  120 |         console.log('Starting approve test...');
  121 |         // 2. Login as Admin
  122 |         // We are already at Login Screen due to beforeEach
  123 |         await page.fill('input[type="email"]', ADMIN_EMAIL);
  124 |         await page.click('button:has-text("Usar contraseña")');
  125 |         await page.fill('input[type="password"]', ADMIN_PASSWORD);
  126 |         await page.click('button[type="submit"]');
```