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

## 2026-03-02 - [Predictable Random Identifiers in Frontend UI]
**Vulnerability:** The application was using the cryptographically weak `Math.random()` to generate Order IDs and Transaction IDs on the frontend (`components/PaymentsScreen.tsx`). Additionally, these random values were called directly in the render body, meaning they would unpredictably change every time the component re-rendered.
**Learning:** `Math.random()` is not suitable for generating security-sensitive or unique identifiers as it is predictable and prone to collisions. Furthermore, calling random generators directly inside a React render function leads to unstable UI state across re-renders.
**Prevention:** Use the cryptographically secure Web Crypto API (e.g., `crypto.randomUUID()`) for generating unique identifiers. To ensure UI stability, wrap the generation logic within a `useState` lazy initializer (e.g., `const [id] = useState(() => crypto.randomUUID().split('-')[0].toUpperCase());`) so it is only generated once per component lifecycle.

## 2026-03-03 - [E2E Testing Node.js Deprecation and Fallback Misconfiguration]
**Vulnerability:** GitHub Actions workflows generating warnings due to deprecated Node.js 20 components. Furthermore, CI workflows were not instantiating the required mocked local environment (Supabase CLI start) despite E2E tests specifically attempting to rely on actual server connectivity rather than browser-level (Playwright) mock responses.
**Learning:** CI pipelines must cleanly replicate the expected backend conditions, either via strict networking stubs (Playwright `page.route()`) or by fully bootstrapping the local stack (e.g., `supabase start`), and they must track upstream dependency deprecations carefully.
**Prevention:** Hardcode Node.js 24 upgrade flags (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`) for legacy actions, and implement complete local test database bootstrapping (e.g., `supabase start` in CI actions) when the testing suite directly queries the database.

## 2026-03-04 - [Database Schema Initialization Failure in CI]
**Vulnerability:** The local dummy Supabase test environment failed to bootstrap because migration files were being applied out of order and without the foundational base schema. Specifically, a migration file (`20260103_add_reservation_cols.sql`) attempted to alter a table before it was created because it was sorted alphabetically before the actual schema creation file (`20260103_phase4_schema.sql`). Furthermore, the base schema (`schema.sql`) was entirely excluded from the automated migration path.
**Learning:** Database schema migrations rely on strict chronological and alphabetical sorting. Placing initial schemas outside the tracked migrations directory or naming migration files ambiguously guarantees environment instantiation failures, preventing automated testing and continuous integration checks from passing.
**Prevention:** Always place initial schemas in the migrations folder (e.g., `20260101_initial_schema.sql`) and ensure all subsequent migrations are strictly prefixed with timestamps and logical alphabetical characters to enforce correct application order.

## 2026-03-05 - [Duplicate Supabase Migration Identifiers]
**Vulnerability:** The Supabase migrations directory contained multiple files sharing the exact same timestamp prefix (e.g., `20260103_`). When deploying or starting a fresh local instance using `supabase start`, the Supabase CLI threw a `duplicate key value violates unique constraint "schema_migrations_pkey"` error because it relies on strictly unique timestamp versions to track applied migrations in the `schema_migrations` table.
**Learning:** Database migration scripts managed by Supabase CLI must utilize fully unique, zero-padded timestamp versions (e.g., standard 14 digits `YYYYMMDDHHMMSS`) rather than abbreviated 8-digit dates to prevent accidental collisions when creating multiple migrations on the same calendar day.
**Prevention:** Strictly utilize the standard 14-digit timestamp structure for all migration files. When bulk migrating or fixing files manually, write an automated script to parse dates and zero-pad with incrementing second values (e.g., `20260103000000`, `20260103000001`).
