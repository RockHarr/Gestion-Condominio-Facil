-- Prevent users from updating sensitive profile columns (Security Hardening)
-- Replaces previous prevent_role_escalation trigger to include more columns.
-- This mitigates Privilege Escalation and Financial Integrity risks.

-- 1. Create the new, more comprehensive function
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is an admin (using existing is_admin function if available,
    -- or fallback to role check if is_admin() is not defined/accessible in this context,
    -- but usually triggers run with SECURITY DEFINER so they can access everything).
    -- We assume public.is_admin() exists as per previous migrations.

    IF NOT public.is_admin() THEN
        -- Check sensitive columns

        -- Role (Privilege Escalation)
        IF (NEW.role IS DISTINCT FROM OLD.role) THEN
             RAISE EXCEPTION 'Unauthorized: You are not allowed to change your role.';
        END IF;

        -- Parking Status (Financial Integrity - Avoid parking fees)
        IF (NEW.has_parking IS DISTINCT FROM OLD.has_parking) THEN
             RAISE EXCEPTION 'Unauthorized: You are not allowed to change your parking status.';
        END IF;

        -- Unit Assignment (Impersonation / Financial Integrity)
        IF (NEW.unidad IS DISTINCT FROM OLD.unidad) THEN
             RAISE EXCEPTION 'Unauthorized: You are not allowed to change your unit assignment.';
        END IF;

        -- Note: 'alicuota' is excluded for now as it may not exist in all environments yet.
        -- If it exists, it should be added here in a future migration.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop old trigger/function if they exist (Clean up)
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_escalation();

-- 3. Drop new trigger if exists (Idempotency)
DROP TRIGGER IF EXISTS prevent_sensitive_profile_updates ON public.profiles;

-- 4. Create the new trigger
CREATE TRIGGER prevent_sensitive_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_profile_updates();
