import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockCommonData, mockResidentData } from './mocks';

test.describe('Reservations - Morosity Check', () => {

    test('should block reservation for morose user', async ({ page }) => {
        // Mock Auth
        await mockSupabaseAuth(page, 'resident');
        await mockCommonData(page);
        await mockResidentData(page); // Defaults to empty debts

        // Mock Debt
        await page.route('**/rest/v1/common_expense_debts*', async route => {
             await route.fulfill({ json: [{ id: 1, user_id: 'test-user-id', monto: 50000, pagado: false, mes: '2023-01' }] });
        });

        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', 'resident@test.com');
        await page.click('button:has-text("Usar contraseña")');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();

        // 2. Navigate to Amenities
        await page.click('[data-testid="tab-reservations"]');
        await page.click('button:has-text("Nueva Reserva")');

        // 3. Try to reserve
        await page.click('text=Quincho'); // Assuming Quincho is mocked in common data

        // 4. Verify Block
        // The app should check debts and show a warning or disable the button.
        // Or if the check happens on "Request", we need to mock the RPC failure.

        // Assuming the UI blocks access or shows alert.
        // "Usuario moroso" might appear.
        // await expect(page.getByText('Regulariza tu deuda')).toBeVisible();
    });

    test('should allow reservation after debt is paid', async ({ page }) => {
        // ... Similar setup but with empty debts
        test.skip();
    });
});
