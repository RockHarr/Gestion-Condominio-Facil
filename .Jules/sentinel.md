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

## 2026-01-26 - [Insecure Environment Variable Injection in Vite]
**Vulnerability:** `vite.config.ts` was configured to inject `process.env.GEMINI_API_KEY` into the client-side bundle using the `define` property. This would hardcode the value of this environment variable into the production build artifacts, exposing it to anyone who inspects the client code.
**Learning:** Never use `define` in Vite to shim potentially sensitive environment variables. Once built, these values are static strings in the public JavaScript files.
**Prevention:** Use `import.meta.env` to access environment variables in Vite. Only variables prefixed with `VITE_` are exposed to the client, making the exposure explicit and intentional. For sensitive keys that must remain secret, do not use them in client-side code at all; use a backend proxy.
