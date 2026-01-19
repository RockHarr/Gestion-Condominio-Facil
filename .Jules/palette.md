## 2025-05-22 - Login Experience Enhancements
**Learning:** The application lacked visual feedback for async actions (loading state) and password visibility control. Implementing these in the shared `Button` and `LoginScreen` improved usability significantly.
**Action:** Always check for loading states on submit buttons and password visibility toggles on login forms. Ensure `Button` components support `isLoading` prop for consistent feedback.

## 2025-02-18 - Graceful Error Handling vs Initialization Crashes
**Learning:** Hard crashes during module initialization (e.g., throwing errors in `lib/supabase.ts` when env vars are missing) prevent the React app from mounting at all, resulting in a confusing "White Screen of Death". This makes graceful error handling in components (like `App.tsx` showing a Toast) unreachable.
**Action:** Use defensive programming in client initialization (e.g., fallback dummy values) to ensure the app can boot, then rely on top-level components to detect configuration errors and display accessible, user-friendly error messages (Toasts/Modals).
