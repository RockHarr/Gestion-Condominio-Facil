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

## 2026-01-28 - [Incomplete Security Patch Application]
**Vulnerability:** Although a migration file existed to fix the privilege escalation vulnerability (`20260124_prevent_profile_role_escalation.sql`), the `supabase/schema.sql` (used for new deployments) did not include the trigger or the necessary `is_admin` function, leaving new environments vulnerable by default.
**Learning:** Security patches in migrations must be backported to the primary schema definition file to ensure consistency and security for new instances.
**Prevention:** Verify that `schema.sql` matches the state of applied migrations, especially for critical security objects like RLS policies and triggers.
