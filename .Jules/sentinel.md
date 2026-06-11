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

## 2024-05-30 - Add Security Headers to vercel.json
**Vulnerability:** The Vercel deployment configuration (`vercel.json`) was missing essential security headers (CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy). This left the application vulnerable to various attacks such as XSS, clickjacking, and MIME-type sniffing.
**Learning:** Security headers are not applied automatically by Vercel; they must be explicitly defined in `vercel.json`. The CSP must carefully whitelist external CDNs (React, Tailwind, Google Fonts) and backend connections (Supabase, local emulators).
**Prevention:** Always ensure that deployment configurations include standard security headers and that any new external dependency is properly whitelisted in the CSP to maintain security without breaking functionality.

## 2024-05-30 - Remove hardcoded live database URLs and keys from test files
**Vulnerability:** Several E2E test files contained hardcoded live Supabase URLs and API keys (`https://tqshoddiisfgfjqlkntv.supabase.co` and the JWT key). This exposed the production database credentials directly in the source code.
**Learning:** Hardcoding live credentials in test files or scripts is a critical security vulnerability and violates the principle of least privilege and secret management. Tests must use environment variables and mock local values.
**Prevention:** Always use `process.env.VITE_SUPABASE_URL` and `process.env.VITE_SUPABASE_ANON_KEY` or an equivalent environment configuration for test setups, and default to mock values like `http://127.0.0.1:54321`.
