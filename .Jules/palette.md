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

## 2025-06-04 - Adding ARIA labels to Icon-only Buttons
**Learning:** Found multiple `<button>` elements in management screens (`AmenitiesManager` and `ReservationTypesManager`) that contained only icons and lacked both `aria-label` and `type="button"`. This makes them invisible to screen readers and potentially causes unintended form submissions if wrapped in a `<form>`. Using dynamic string interpolation for labels (e.g., `aria-label={\`Eliminar ${amenity.name}\`}`) significantly improves context for screen reader users compared to static labels.
**Action:** When creating lists with item-specific actions (Edit/Delete), ensure icon-only buttons include descriptive ARIA labels that reference the specific item name to provide context. Always include `type="button"` for icon buttons that trigger actions rather than submissions.
