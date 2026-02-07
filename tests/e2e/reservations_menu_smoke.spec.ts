import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from './mocks';

test('reservations_menu_smoke', async ({ page }) => {
    // 1. Mock Auth as Admin
    await mockSupabaseAuth(page, 'admin');

    // Mock Data to prevent hangs
    await page.route('**/rest/v1/amenities*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/reservations*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/reservation_types*', async route => route.fulfill({ json: [] }));

    // 2. Login as Admin
    await page.goto('/');

    await page.fill('input[type="email"]', 'admin@test.com');
    await page.click('button:has-text("Usar contraseña")');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // 3. Verify Sidebar
    // AdminDashboard uses "AdminNavigation" or similar.
    // Let's verify we are on dashboard first
    await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();

    // Check for "Reservas" link/button. In AdminNavigation it's usually "Reservas" or icon.
    // The previous test used regex /Gestión de Reservas/i.
    // Let's check the actual text in AdminMenuScreen or similar.
    // It seems "Reservas" is the text in AdminNavigation.
    // The previous test might have been for an older version or different component?
    // Let's use text='Reservas' which is standard in the sidebar/menu.
    // Or check the "Accesos Directos" which has "Reservas" (if available) or the button in the sidebar.

    // Looking at AdminDashboard.tsx shortcuts: "Administrar Espacios" is there. "Próximas Reservas" -> "Ver todas".

    // Let's try to find "Reservas" in the navigation.
    const reservasBtn = page.getByRole('button', { name: 'Reservas' }).or(page.getByText('Reservas'));
    await expect(reservasBtn.first()).toBeVisible();

    // 4. Navigate
    await reservasBtn.first().click();

    // 5. Verify Page Content
    await expect(page.getByRole('heading', { name: 'Gestión de Reservas' })).toBeVisible();

    // 6. Verify Tabs (Pendientes, Próximas, Historial, Calendario)
    await expect(page.getByText('Pendientes')).toBeVisible();
    await expect(page.getByText('Próximas')).toBeVisible();
    await expect(page.getByText('Historial')).toBeVisible();
});
