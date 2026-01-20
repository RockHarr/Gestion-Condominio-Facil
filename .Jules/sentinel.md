## 2026-01-20 - Authorization Bypass in Data Service
**Vulnerability:** Found a critical authorization bypass in `getTickets` where the `userId` filter was commented out, allowing any user (including residents) to retrieve all tickets from all users via the API.
**Learning:** The vulnerability existed because a developer likely commented out the security filter for debugging purposes and forgot to restore it. This highlights the danger of committing "quick fixes" or debug code.
**Prevention:** Implement strict code review policies that flag commented-out code, especially in security-critical paths (like data fetching). Add automated tests that specifically verify data isolation between different users (e.g., User A cannot see User B's data).
