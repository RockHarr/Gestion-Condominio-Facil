# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/reservations_flow.spec.ts >> Resident — Reservations Flow >> should allow a resident to create and cancel a reservation
- Location: tests/e2e/reservations_flow.spec.ts:23:5

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
  4   | // CONFIGURATION: UPDATE THESE BEFORE RUNNING
  5   | // ==========================================
  6   | const RESIDENT_EMAIL = 'contacto@rockcode.cl'; // REPLACE WITH REAL RESIDENT EMAIL
  7   | const RESIDENT_PASSWORD = process.env.TEST_RESIDENT_PASSWORD || 'dummy_password';       // REPLACE WITH REAL RESIDENT PASSWORD
  8   | // ==========================================
  9   |
  10  | test.describe('Resident — Reservations Flow', () => {
  11  |
  12  |     test.beforeEach(async ({ page }) => {
  13  |         // 1. Login as Resident
  14  |         await page.goto('/');
  15  |         await page.fill('input[type="email"]', RESIDENT_EMAIL);
  16  |         await page.click('button:has-text("Usar contraseña")');
  17  |         await page.fill('input[type="password"]', RESIDENT_PASSWORD);
  18  |         await page.click('button[type="submit"]');
  19  |         // Wait for a post-login element (e.g., the Home tab)
> 20  |         await expect(page.locator('[data-testid="tab-home"]')).toBeVisible({ timeout: 15000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  21  |     });
  22  |
  23  |     test('should allow a resident to create and cancel a reservation', async ({ page }) => {
  24  |         // 2. Navigate to Amenities via Tab Bar
  25  |         await page.click('[data-testid="tab-amenities"]');
  26  |         await expect(page.getByRole('heading', { name: 'Espacios Comunes' }).first()).toBeVisible();
  27  |
  28  |         // 3. Click "Reservar" on the first amenity (e.g., Quincho)
  29  |         // This navigates to the 'reservations' page
  30  |         await page.locator('button:has-text("Reservar")').first().click();
  31  |
  32  |         // 4. Wait for Calendar
  33  |         await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible(); // Header in ResidentApp for reservations page
  34  |         await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible(); // Calendar grid
  35  |
  36  |         // 5. Select a Date
  37  |         // Find a day button that is NOT disabled (future date) and click it.
  38  |         // We pick the last available day to ensure it's in the future.
  39  |         const availableDays = page.locator('button.aspect-square:not([disabled])');
  40  |         const count = await availableDays.count();
  41  |         expect(count).toBeGreaterThan(0);
  42  |         await availableDays.last().click();
  43  |
  44  |         // 6. Confirm Booking in Modal
  45  |         const modal = page.getByRole('dialog').or(page.locator('.fixed.inset-0')); // Fallback if role not set
  46  |         await expect(modal).toBeVisible();
  47  |
  48  |         // Wait for types to load
  49  |         await expect(modal.getByText('Cargando tipos de reserva...')).not.toBeVisible();
  50  |
  51  |         // Check if we have types
  52  |         if (await modal.getByText('No hay tipos de reserva disponibles para este espacio.').isVisible()) {
  53  |             throw new Error('No reservation types available for this amenity. Setup failed?');
  54  |         }
  55  |
  56  |         // Select Reservation Type if multiple exist
  57  |         const typeSelect = modal.locator('select');
  58  |         if (await typeSelect.isVisible()) {
  59  |             await typeSelect.selectOption({ index: 1 });
  60  |         } else {
  61  |             // If no select, it should be auto-selected (single type).
  62  |             // Verify by checking if tariff info is visible (which depends on selectedType)
  63  |             await expect(modal.getByText(/Tarifa de uso:/i)).toBeVisible();
  64  |         }
  65  |
  66  |         // Click "Solicitar Reserva" or "Confirmar"
  67  |         await modal.getByRole('button', { name: /solicitar|confirmar/i }).click();
  68  |
  69  |         // 7. Verify Success Toast or Error
  70  |         try {
  71  |             await expect(page.getByText('Solicitud de reserva enviada exitosamente.')).toBeVisible({ timeout: 5000 });
  72  |         } catch (e) {
  73  |             // If success toast not found, check for error message in modal
  74  |             const errorMsg = await page.locator('.bg-red-100').textContent();
  75  |             if (errorMsg) {
  76  |                 throw new Error(`Reservation failed with error: ${errorMsg}`);
  77  |             }
  78  |             throw e;
  79  |         }
  80  |
  81  |         // 8. Verify in "Mis Reservas" Section
  82  |         // It should appear in the list below the calendar
  83  |         const myReservations = page.locator('h3:has-text("Mis Reservas")').locator('..');
  84  |         await expect(myReservations).toBeVisible();
  85  |         // Check for "Pendiente" or "Solicitada" badge
  86  |         await expect(myReservations.getByText(/pendiente|solicitada/i).first()).toBeVisible();
  87  |
  88  |         // 9. Cancel Reservation
  89  |         // Handle window.confirm
  90  |         page.on('dialog', dialog => dialog.accept());
  91  |
  92  |         const cancelBtn = myReservations.getByRole('button', { name: /cancelar/i }).first();
  93  |         await cancelBtn.click();
  94  |
  95  |         // 10. Verify Cancellation
  96  |         // The reservation should disappear or status change
  97  |         // Since the list filters out cancelled or updates status, we check for disappearance or toast
  98  |         await expect(page.getByText('Reserva cancelada')).toBeVisible();
  99  |     });
  100 |
  101 | });
  102 |
```