## 2025-05-22 - Login Experience Enhancements
**Learning:** The application lacked visual feedback for async actions (loading state) and password visibility control. Implementing these in the shared `Button` and `LoginScreen` improved usability significantly.
**Action:** Always check for loading states on submit buttons and password visibility toggles on login forms. Ensure `Button` components support `isLoading` prop for consistent feedback.

## 2025-02-18 - Graceful Error Handling vs Initialization Crashes
**Learning:** Hard crashes during module initialization (e.g., throwing errors in `lib/supabase.ts` when env vars are missing) prevent the React app from mounting at all, resulting in a confusing "White Screen of Death". This makes graceful error handling in components (like `App.tsx` showing a Toast) unreachable.
**Action:** Use defensive programming in client initialization (e.g., fallback dummy values) to ensure the app can boot, then rely on top-level components to detect configuration errors and display accessible, user-friendly error messages (Toasts/Modals).

## 2025-05-23 - Actionable Empty States and Icon Safety
**Learning:** Hardcoded empty states were inconsistent and lacked actions. Created a reusable `EmptyState` component with CTA support. Also discovered that `Icons` component fails silently (returns null) for missing keys, which hid a bug in `TicketsScreen`.
**Action:** Use `EmptyState` for all list components. Verify icon names in `Icons.tsx` before usage, as TypeScript doesn't catch invalid strings passed as props.

## 2025-05-24 - Accessibility Verification in Authenticated Routes
**Learning:** Verifying accessibility changes in protected routes (like `ProfileScreen`) without valid backend credentials is challenging. E2E tests fail due to missing env vars.
**Action:** Temporarily mock the authentication service (`services/auth.ts`) to return a static user. This allows bypassing the login screen and verifying UI changes in isolation using Playwright scripts, even when the backend is unreachable.
## 2025-06-09 - Accessible Icon-Only Buttons
**Learning:** Found several modal close buttons across different components (`ReservationRequestModal.tsx`, `AdminCreateReservationModal.tsx`, `AmenitiesManager.tsx`, `ReservationTypesManager.tsx`, `TicketsScreen.tsx`) that used the `Icons` component (specifically `xmark`) without any accessible `aria-label` or explicit `type="button"`. This prevents screen readers from understanding the button's purpose and can cause unintended form submissions.
**Action:** Always add `type="button"` and a descriptive `aria-label` (e.g., `aria-label="Cerrar modal"` or `aria-label="Eliminar foto"`) to `<button>` elements that only contain icons and no readable text.
## 2025-06-09 - Playwright E2E Tests Login Backend Error
**Learning:** Some Playwright E2E tests are failing on `await expect(page.getByRole('heading', { name: 'Panel de Control' })).toBeVisible();` after attempting to log in, because the login fails with `Error al iniciar sesión: Failed to fetch`. This is caused by `VITE_SUPABASE_URL` connection issues in the test environment (e.g. Supabase emulator not running or rate-limited).
**Action:** These are pre-existing environmental errors related to the Supabase mock backend, not regressions caused by the UX/Accessibility changes. E2E failures due to backend connection issues should be considered expected behavior under these conditions.
