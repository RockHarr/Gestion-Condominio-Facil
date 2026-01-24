## 2026-01-23 - [Insecure Data Access in getTickets]
**Vulnerability:** The `getTickets` function in `services/data.ts` had a commented-out line that was intended to filter tickets by `user_id`. This meant that any call to this function, even with a specific `userId`, would retrieve *all* tickets from the database. This effectively disabled the intended filtering, potentially exposing all user tickets to any authenticated user if backend Row Level Security (RLS) policies were not strictly enforcing isolation based on the user's session token alone.
**Learning:** Security logic (like data filtering) must never be commented out. Relying on client-side code to "behave" without enforcing it in the data query is insecure.
**Prevention:** Enforce data filtering at the lowest possible level (database or query builder). Ensure that optional parameters for filtering are actually used when provided.

## 2026-01-24 - [Information Disclosure in Login]
**Vulnerability:** `LoginScreen.tsx` was displaying raw error messages from the authentication provider (e.g., "User not found"), which allowed for User Enumeration. Attackers could determine which emails were registered in the system.
**Learning:** Defaulting to showing `error.message` is convenient for debugging but dangerous in production authentication flows.
**Prevention:** Always catch authentication errors and map them to a single, generic message (e.g., "Invalid credentials") in the UI, while logging the specific error securely for administrators.
