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
## 2025-08-12 - Accessibility of Hover-Revealed Actions
**Learning:** Actions revealed only on hover (`group-hover:opacity-100`) in cards (like `AmenitiesManager` and `ReservationTypesManager`) are inaccessible via keyboard navigation. Users tabbing through the interface cannot see or access these edit/delete/manage buttons. Also, icon-only buttons lacked aria-labels, making their purpose invisible to screen readers.
**Action:** When using `group-hover:opacity-100` for action buttons, always pair it with `group-focus-within:opacity-100` on the container. Ensure all interactive elements receive `focus-visible:ring-2` styling so keyboard focus is apparent, and provide explicit context-aware `aria-label`s for icon-only buttons.
