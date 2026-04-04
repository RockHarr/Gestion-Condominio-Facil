import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from './mocks';

test.describe('Admin — Rechazo de Gasto', () => {

  test('abre modal, ingresa motivo y rechaza', async ({ page }) => {
    // 1. Mock Auth as Admin
    await mockSupabaseAuth(page, 'admin');

    // 2. Mock Initial Data (Expenses)
    const expense = {
        id: 101,
        descripcion: 'Reparación de prueba',
        monto: 50000,
        categoria: 'Mantenimiento',
        fecha: new Date().toISOString(),
        status: 'En Revision',
        proveedor: 'Proveedor Test',
        numeroDocumento: 'DOC-123',
        evidenciaUrl: '',
    };

    // Mock getExpenses call
    await page.route('**/rest/v1/expenses*', async route => {
        const url = route.request().url();
        if (url.includes('status=eq.En%20Revision')) {
             await route.fulfill({ json: [expense] });
        } else {
             await route.fulfill({ json: [expense] });
        }
    });

    // Mock other data calls to avoid errors
    await page.route('**/rest/v1/payments*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/notices*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/community_settings*', async route => route.fulfill({ json: { commonExpense: 50000, parkingCost: 10000 } }));
    await page.route('**/rpc/get_financial_kpis*', async route => route.fulfill({ json: { total_collected: 0, deposits_custody: 0, pending_review_count: 1, total_expenses_approved: 0 } }));

    // 3. Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.click('button:has-text("Usar contraseña")');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // 4. Wait for Dashboard and Expense
    await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();
    await expect(page.getByText('Reparación de prueba')).toBeVisible();

    // 5. Click Reject
    // Ensure we can see the button (our fix!)
    await page.click('button:has-text("Rechazar")');

    // 6. Fill Reason
    await expect(page.getByRole('heading', { name: 'Rechazar Gasto' })).toBeVisible();
    await page.fill('textarea', 'El monto es excesivo y no hay cotización previa.');

    // 7. Mock the Reject API Call
    let rejectCalled = false;
    await page.route('**/rest/v1/expenses?id=eq.101', async route => {
        if (route.request().method() === 'PATCH') {
            rejectCalled = true;
            await route.fulfill({ status: 204 }); // Success no content
        } else {
            await route.continue();
        }
    });

    // 8. Confirm Rejection
    await page.click('button:has-text("Confirmar Rechazo")');

    // 9. Verify
    await expect(page.getByRole('heading', { name: 'Rechazar Gasto' })).not.toBeVisible();
    // In a real app, the list would refresh. We can check if toast appeared.
    // However, since we mocked the update but maybe not the subsequent fetch, UI might not update perfectly without more mocks.
    // The critical part is that the reject call was made.
    expect(rejectCalled).toBe(true);
  });
});
