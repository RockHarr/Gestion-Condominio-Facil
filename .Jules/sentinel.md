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

## 2026-03-01 - [XSS Vulnerability in Image Sources]
**Vulnerability:** The application was directly rendering `src` attributes for `<img>` tags (e.g., `ticket.foto`, `amenity.photoUrl`) without sanitization. This allowed for potential Cross-Site Scripting (XSS) if an attacker could input a malicious payload via a non-image `data:` URI (e.g., `data:text/html,<script>alert(1)</script>`) into the image source.
**Learning:** Any user-supplied data used in attributes like `src` must be treated as untrusted and sanitized before rendering, validating against specific allowed protocols and types.
**Prevention:** Use a dedicated sanitization function like `getSafeImageUrl` to validate the URL's protocol against an allowlist (e.g., `http:`, `https:`, `blob:`, `data:`) and explicitly check that `data:` URIs start with `image/` before rendering them in the UI.

## 2026-03-01 - [Supabase Migration Ordering Failure]
**Vulnerability:** A database migration (`20260103_add_reservation_cols.sql`) attempted to alter the `reservation_types` table using the same date prefix as the script creating it (`20260103_phase4_schema.sql`). Lexicographical sorting caused the alter script to execute first, resulting in a `relation does not exist` error during `supabase start` in CI pipelines.
**Learning:** Supabase CLI applies migrations strictly in lexicographical order based on the filename. Prefixing multiple files with the exact same timestamp without accounting for dependency order will break database provisioning.
**Prevention:** Always ensure migrations that depend on each other have distinct, sequentially ordered date prefixes (e.g., changing `20260103_` to `20260104_`) to guarantee they execute in the correct order.

## 2026-03-01 - [Supabase Migration Dependency Failure on profiles]
**Vulnerability:** A database migration (`20260103_fix_profiles_rls.sql`) attempted to enable Row Level Security on the `profiles` table before the table was fully created or initialized by the base schema migration (`20260103_phase4_schema.sql`). This resulted in a `relation "profiles" does not exist` error during CI pipeline execution.
**Learning:** Migrations that depend on tables managed outside of the standard migration flow (e.g., tables created by triggers on `auth.users`) or that execute concurrently due to identical date prefixes must include existence checks.
**Prevention:** Wrap dependent migration logic in defensive PL/pgSQL blocks (`DO $$ BEGIN IF EXISTS (...) THEN ... END IF; END $$;`) to ensure the target relation exists before attempting to alter it or apply policies, preventing pipeline crashes.
