# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/reservations_morosity.spec.ts >> Reservations - Morosity Check >> should block reservation for morose user
- Location: tests/e2e/reservations_morosity.spec.ts:87:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Inicio', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Inicio', exact: true })

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   |
  4   | // Credentials from .env.local (hardcoded for test execution since process.env might not load .env.local automatically in all setups)
  5   | const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
  6   | const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';
  7   |
  8   | const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  9   |
  10  | const RESIDENT_EMAIL = 'contacto@rockcode.cl';
  11  | const RESIDENT_PASSWORD = '180381'; // Assuming this is the password from previous context
  12  |
  13  | test.describe('Reservations - Morosity Check', () => {
  14  |     let moroseUnitId: number;
  15  |     let moroseUserId: string;
  16  |
  17  |     test.beforeAll(async () => {
  18  |         // 1. Get the Resident User ID
  19  |         // Login as Resident first to get their own ID
  20  |         const { data: residentAuth, error: residentError } = await supabase.auth.signInWithPassword({
  21  |             email: RESIDENT_EMAIL,
  22  |             password: RESIDENT_PASSWORD
  23  |         });
  24  |
  25  |         if (residentError || !residentAuth.user) {
  26  |             throw new Error('Failed to login as resident for setup: ' + residentError?.message);
  27  |         }
  28  |
  29  |         moroseUserId = residentAuth.user.id;
  30  |
  31  |         // Get Unit ID from profile
  32  |         const { data: profileData, error: pError } = await supabase
  33  |             .from('profiles')
  34  |             .select('unit_id')
  35  |             .eq('id', moroseUserId)
  36  |             .single();
  37  |
  38  |         if (pError || !profileData) {
  39  |             throw new Error('Failed to get profile/unit: ' + pError?.message);
  40  |         }
  41  |         moroseUnitId = profileData.unit_id;
  42  |         console.log(`Setup: User ${moroseUserId}, Unit ${moroseUnitId}`);
  43  |
  44  |         // Logout Resident
  45  |         await supabase.auth.signOut();
  46  |
  47  |         // 2. Login as Admin to Insert Debt
  48  |         const { error: adminError } = await supabase.auth.signInWithPassword({
  49  |             email: 'rockwell.harrison@gmail.com',
  50  |             password: '270386'
  51  |         });
  52  |
  53  |         if (adminError) {
  54  |             throw new Error('Failed to login as admin for setup: ' + adminError.message);
  55  |         }
  56  |
  57  |         // 3. Ensure Debt Exists
  58  |         // Insert a debt into common_expense_debts
  59  |         const { error: debtError } = await supabase
  60  |             .from('common_expense_debts')
  61  |             .insert({
  62  |                 // unit_id: moroseUnitId, // Column does not exist
  63  |                 mes: '2025-01',
  64  |                 monto: 50000,
  65  |                 pagado: false,
  66  |                 user_id: moroseUserId
  67  |             });
  68  |
  69  |         if (debtError) {
  70  |             console.error('Error inserting debt:', debtError);
  71  |         } else {
  72  |             console.log('Debt inserted successfully by Admin.');
  73  |         }
  74  |     });
  75  |
  76  |     test.afterAll(async () => {
  77  |         // Cleanup: Pay the debt
  78  |         if (moroseUserId) {
  79  |             await supabase
  80  |                 .from('common_expense_debts')
  81  |                 .delete()
  82  |                 .eq('user_id', moroseUserId)
  83  |                 .eq('mes', '2025-01');
  84  |         }
  85  |     });
  86  |
  87  |     test('should block reservation for morose user', async ({ page }) => {
  88  |         // 1. Login
  89  |         await page.goto('/');
  90  |         await page.fill('input[type="email"]', RESIDENT_EMAIL);
  91  |         await page.click('button:has-text("Usar contraseña")');
  92  |         await page.fill('input[type="password"]', RESIDENT_PASSWORD);
  93  |         await page.click('button[type="submit"]');
  94  |
  95  |         // Wait for dashboard
  96  |         // The header title on home is "Inicio", and the greeting is "Hola, [Name]"
> 97  |         await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
      |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  98  |         await expect(page.getByText(/Hola,/)).toBeVisible();
  99  |
  100 |         // 2. Navigate to Amenities
  101 |         // Use the "Reservar" button from the Quick Actions on Home
  102 |         await page.click('text=Reservar');
  103 |
  104 |         // 3. Select Quincho (or any amenity)
  105 |         await page.click('text=Quincho');
  106 |
  107 |         // Wait for calendar
  108 |         // The custom calendar renders buttons for days. We wait for a day to be visible.
  109 |         // We pick the 15th day of the current month.
  110 |         const dayButton = page.getByRole('button', { name: '15', exact: true });
  111 |         await expect(dayButton).toBeVisible({ timeout: 10000 });
  112 |
  113 |         // 4. Select a day
  114 |         await dayButton.click();
  115 |
  116 |         // 5. Attempt to Reserve
  117 |         await expect(page.getByText('Solicitar Reserva')).toBeVisible();
  118 |
  119 |         const typeSelect = page.locator('select');
  120 |         if (await typeSelect.isVisible()) {
  121 |             await typeSelect.selectOption({ index: 1 });
  122 |         }
  123 |
  124 |         // Wait for type selection (prevents race condition)
  125 |         await expect(page.getByText('Tarifa de uso:')).toBeVisible();
  126 |
  127 |         await page.click('button:has-text("Confirmar Reserva")');
  128 |
  129 |         // 6. Verify Error
  130 |         // Check if success toast appears (which would mean failure of the test goal)
  131 |         const successToast = page.getByText(/Solicitud de reserva enviada/i);
  132 |         if (await successToast.isVisible({ timeout: 2000 })) {
  133 |             throw new Error('TEST FAILED: Reservation succeeded but should have been blocked!');
  134 |         }
  135 |
  136 |         // 3. Verify Blocking
  137 |         // The error is displayed in the modal, not as a toast
  138 |         const errorMessage = page.getByText(/Usuario moroso/i);
  139 |         await expect(errorMessage).toBeVisible({ timeout: 10000 });
  140 |
  141 |         console.log('Verified: Reservation blocked with "Usuario moroso" message.');
  142 |     });
  143 |
  144 |     test('should allow reservation after debt is paid', async ({ page }) => {
  145 |         // 1. Pay Debt (Backend)
  146 |         await supabase
  147 |             .from('common_expense_debts')
  148 |             .update({ pagado: true })
  149 |             .eq('user_id', moroseUserId)
  150 |             .eq('mes', '2025-01');
  151 |
  152 |         console.log('Debt paid via backend.');
  153 |
  154 |         // 2. Retry Reservation
  155 |         // We need to login again because each test has a fresh context
  156 |         await page.goto('/');
  157 |         await page.fill('input[type="email"]', RESIDENT_EMAIL);
  158 |         await page.click('button:has-text("Usar contraseña")');
  159 |         await page.fill('input[type="password"]', RESIDENT_PASSWORD);
  160 |         await page.click('button[type="submit"]');
  161 |
  162 |         await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
  163 |
  164 |         await page.click('text=Reservar');
  165 |         await page.click('text=Quincho');
  166 |         const dayButton = page.getByRole('button', { name: '15', exact: true });
  167 |         await expect(dayButton).toBeVisible({ timeout: 10000 });
  168 |         await dayButton.click();
  169 |
  170 |         const typeSelect = page.locator('select');
  171 |         if (await typeSelect.isVisible()) {
  172 |             await typeSelect.selectOption({ index: 1 });
  173 |         }
  174 |
  175 |         // Wait for type selection (prevents race condition)
  176 |         await expect(page.getByText('Tarifa de uso:')).toBeVisible();
  177 |
  178 |         await page.click('button:has-text("Confirmar Reserva")');
  179 |
  180 |         // 3. Verify Success
  181 |         const successToast = page.getByText(/Solicitud de reserva enviada/i);
  182 |         await expect(successToast).toBeVisible({ timeout: 10000 });
  183 |
  184 |         console.log('Verified: Reservation allowed after payment.');
  185 |     });
  186 | });
  187 |
```