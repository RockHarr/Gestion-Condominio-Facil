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

## 2026-03-02 - [XSS Vulnerability in Image Sources]
**Vulnerability:** The application directly rendered user-provided URLs in `img src` attributes across several components (`AdminTickets`, `AmenitiesScreen`, etc.) without sanitization. An attacker could potentially inject a malicious data URI payload (e.g., `data:text/html;base64,...` containing scripts) which might be interpreted by older browsers or specific DOM configurations to execute arbitrary JavaScript, leading to Cross-Site Scripting (XSS).
**Learning:** Even `img src` attributes can be vectors for XSS if untrusted input is passed, particularly through the use of `data:` URIs or `javascript:` URIs (if the browser still evaluates them in that context).
**Prevention:** Sanitize all URLs used in `src` attributes. Create and use a specific sanitizer like `getSafeImageUrl` that validates protocols against an allowlist (`http:`, `https:`, `blob:`, `data:`) and ensures `data:` URIs start specifically with `image/`.
