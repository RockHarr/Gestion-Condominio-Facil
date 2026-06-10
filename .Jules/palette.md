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

## 2026-06-10 - Button Accessibility and Focus States
**Learning:** `focus:ring` classes make focus rings appear on mouse click, which is often distracting for users. Using `focus-visible:ring` is better because it shows rings only during keyboard navigation. Additionally, explicitly adding `aria-label` to buttons provides better screen reader support.
**Action:** Replace `focus:` with `focus-visible:` on interactive elements to improve accessibility and visual polish. Ensure ARIA labels are present on core action buttons.

## 2026-06-10 - Playwright E2E Configurations and Vite Server
**Learning:** `npx vite preview` does not work in this repository for E2E tests because `npx` commands for Vite often fail to resolve properly with this project's dependency setup or node environment, leading to `Failed to fetch` errors in Playwright tests because the webserver doesn't start.
**Action:** When configuring Playwright's `webServer.command`, always use `npm run preview` to leverage the locally installed Vite dependencies defined in `package.json`'s scripts. Also ensure to use relative URLs (like `/`) instead of hardcoding `http://localhost:5173` in tests to respect Playwright's `baseURL` configuration.
