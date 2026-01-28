## 2026-01-28 - Missing Security Primitives in Migrations
**Vulnerability:** Core security function `public.is_admin()` was used in triggers and RLS policies but was not defined in any applied migration file, only in a manual script.
**Learning:** Security infrastructure (helper functions, triggers) must be treated as first-class citizens in the migration history. Relying on manual scripts or assuming existence leads to broken or vulnerable deployments.
**Prevention:** Always verify that functions used in RLS/Triggers are defined in a preceding or same migration file.
