## 2026-01-23 - [Insecure Data Access in getTickets]
**Vulnerability:** The `getTickets` function in `services/data.ts` had a commented-out line that was intended to filter tickets by `user_id`. This meant that any call to this function, even with a specific `userId`, would retrieve *all* tickets from the database. This effectively disabled the intended filtering, potentially exposing all user tickets to any authenticated user if backend Row Level Security (RLS) policies were not strictly enforcing isolation based on the user's session token alone.
**Learning:** Security logic (like data filtering) must never be commented out. Relying on client-side code to "behave" without enforcing it in the data query is insecure.
**Prevention:** Enforce data filtering at the lowest possible level (database or query builder). Ensure that optional parameters for filtering are actually used when provided.

## 2026-01-24 - [Privilege Escalation via Profile Updates]
**Vulnerability:** Row Level Security (RLS) policies on the `profiles` table allowed users to update their own row (`USING (auth.uid() = id)`). However, there were no column-level restrictions, allowing any user to update their `role` field from 'resident' to 'admin' via a crafted API request.
**Learning:** RLS policies governing `UPDATE` operations must be paired with column-level restrictions or triggers if the table contains sensitive fields (like `role`) that the record owner should not control.
**Prevention:** Use a `BEFORE UPDATE` trigger to inspect `NEW` vs `OLD` values and forbid changes to sensitive columns unless the user has elevated privileges (e.g., check `public.is_admin()`).

## 2026-01-25 - [Broken Access Control Leading to Disabled Security Filters]
**Vulnerability:** The RLS policy for `tickets` was too restrictive (Admins could not see user tickets), which likely led developers to comment out the `user_id` filter in the backend service to "make it work", inadvertently creating a data leak vulnerability.
**Learning:** When security controls (RLS) break functionality (Admin views), developers may bypass other security layers (Service filters). Security must enable business requirements, not block them.
**Prevention:** Ensure RLS policies explicitly account for Admin privileges (e.g., `OR public.is_admin()`) so that correct application logic (filtering by user) can be safely enforced without workarounds.

## 2026-03-01 - [XSS Vulnerability in Expense Evidence URLs]
**Vulnerability:** The application was directly rendering `expense.evidenciaUrl` in an `href` attribute without sanitization in the `AdminDashboard`. This allowed for potential Cross-Site Scripting (XSS) if an attacker could input a malicious payload (e.g., `javascript:alert(1)`) into the URL.
**Learning:** Any user-supplied data used in attributes like `href`, `src`, or `action` must be treated as untrusted and sanitized before rendering, even if it comes from a supposedly secure backend or database, to follow the principle of defense-in-depth.
**Prevention:** Use a dedicated sanitization function like `getSafeUrl` to validate the URL's protocol against an allowlist (e.g., `http:`, `https:`, `mailto:`, `tel:`) before rendering it in the UI.

## 2024-07-08 - Hardcoded Secrets in Tests and Scripts
**Vulnerability:** Hardcoded Supabase URLs, ANON keys, and user/admin passwords were found directly in Playwright E2E tests (`tests/e2e/*.spec.ts`) and utility scripts (`scripts/*.js/ts`).
**Learning:** Even in non-production files like tests or helper scripts, hardcoding credentials creates a critical security risk as these files are version-controlled and could expose staging/production keys if copied blindly or if the repository becomes public.
**Prevention:** Always use environment variables (`process.env.VITE_SUPABASE_URL`, `process.env.TEST_RESIDENT_PASSWORD`, etc.) with safe local fallback values (e.g., `http://127.0.0.1:54321` or `dummy_key`) for tests and scripts.

## 2024-07-08 - E2E Tests Connecting to Live Instances
**Vulnerability:** CI E2E workflows and tests required access to a live database or emulator to authenticate and setup data, which originally worked because hardcoded passwords and a live URL were tracked in the test scripts.
**Learning:** When moving secrets out to `process.env`, CI tests interacting with an authentic backend must be provided valid credentials (e.g. via GitHub Secrets mapped into the CI workflow env `TEST_RESIDENT_PASSWORD: ${{ secrets.TEST_RESIDENT_PASSWORD }}`). Providing non-resolving dummy values simply breaks the login steps and fails the build.
**Prevention:** Always mirror the environment required by tests directly into the CI pipeline (via secrets mapping) when they rely on non-mocked external services.

## 2024-07-08 - E2E Tests Connecting to Live Instances (Correction)
**Vulnerability:** Same as before.
**Learning:** For E2E tests to succeed against a remote backend in a CI pipeline, *all* required environment variables (including the URL and ANON key, not just the passwords) must be securely injected via GitHub Secrets. Hardcoding dummy values in the workflow file causes `ECONNREFUSED` errors when the test runner attempts real network requests.
**Prevention:** Always map `${{ secrets.VARIABLE_NAME }}` for all necessary coordinates in the `.github/workflows/playwright.yml` environment blocks.
