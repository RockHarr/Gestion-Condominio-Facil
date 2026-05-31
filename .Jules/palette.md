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

## 2025-05-31 - Keyboard Accessibility for Hidden Hover Menus
**Learning:** Actions hidden behind CSS `hover` states (like `opacity-0 group-hover:opacity-100`) are invisible to keyboard-only users who navigate via the `Tab` key, breaking accessibility.
**Action:** Always combine `group-hover:opacity-100` with `focus-within:opacity-100` on the container so that hidden menus appear when interactive child elements receive focus. Additionally, ensure icon-only action buttons have descriptive `aria-label`s and clear focus rings (`focus-visible:ring-2`).

## 2026-05-31 - E2E Testing with Relative URLs
**Learning:** Hardcoding URLs (e.g., `http://localhost:5173`) in Playwright E2E tests causes them to fail in CI environments where the test server might be spun up on a different port (like 3000) or under a different hostname.
**Action:** Always use relative paths (`await page.goto('/')`) in E2E tests and rely on the `baseURL` setting configured in `playwright.config.ts`. Additionally, ensure the `webServer.command` in CI uses `vite preview` rather than `vite` dev server to properly test the production build with injected env vars.
