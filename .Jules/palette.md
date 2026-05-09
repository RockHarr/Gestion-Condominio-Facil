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

## 2025-06-01 - Keyboard Accessibility for Hover-only Actions
**Learning:** Actions hidden via hover states (`opacity-0 group-hover:opacity-100`) are inaccessible to keyboard users, leading to a critical accessibility blocker in management lists (e.g. `AmenitiesManager`).
**Action:** Always append `focus-within:opacity-100` alongside `group-hover:opacity-100` to container elements that hide child buttons, and ensure the child buttons have `focus:outline-none focus-visible:ring-2` to guarantee visual focus cues during keyboard navigation.

## 2025-06-01 - Fixing Playwright Local Dev URLs
**Learning:** Hardcoding `http://localhost:5173` in E2E tests causes intermittent connection refused errors and fails when Vite starts on alternative ports or during CI preview server runs.
**Action:** Never hardcode development URLs. Always use relative paths (`await page.goto('/')`) to let Playwright resolve against the configured `baseURL`, ensuring tests work reliably across all environments.
