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

## 2024-05-21 - Modal Close Button ARIA Labels
**Learning:** Found multiple instances where the custom `<Icons name="xmark" />` was used inside a `<button>` without any descriptive text. Screen readers would announce these as empty buttons. Additionally, the `ReservationPaymentModal.tsx` was calling an invalid icon name (`x-mark` instead of `xmark`), which caused the icon to silently fail and not render at all.
**Action:** Always verify that icon-only buttons have an `aria-label` (e.g., `aria-label="Cerrar modal"`). Also, ensure that icon names passed to the custom `<Icons>` component strictly match the defined keys in `components/Icons.tsx` to prevent invisible interactive elements.

## 2024-05-21 - Test Configuration Hardcoding Issue
**Learning:** Hardcoding `http://localhost:5173` in E2E tests (like in `reservations_menu_smoke.spec.ts`) breaks the tests in CI when the build is served from a different port (e.g., port 3000 as configured in `playwright.config.ts`).
**Action:** Always use relative paths like `await page.goto('/')` in Playwright tests to respect the `baseURL` configured in the project.

## 2024-05-21 - Test Configuration Hardcoding Issue Part 2
**Learning:** Hardcoding test credentials directly in the code (e.g. `admin@condominio.com` instead of the expected `rockwell.harrison@gmail.com`) causes the test to fail. Additionally, `npx vite preview` (which the test framework uses in CI depending on config) must correctly route the backend URL via env variables in `playwright.yml`.
**Action:** Ensure E2E tests use `await page.goto('/')` rather than full URLs, and align credentials with those expected by the test environment (using `ROCKWELL_HARRISON_EMAIL` etc or the configured one). Also, ensure the test environment provides network access to Supabase via `VITE_SUPABASE_URL`.
