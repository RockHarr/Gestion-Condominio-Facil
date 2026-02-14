-- Prevent users from updating sensitive fields in their own profile
-- RLS allows users to update their own profile, but we must restrict which columns.

CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow admins to bypass this check
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Check for sensitive field changes

    -- 1. Role (already checked by another trigger, but good to be explicit here too)
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change the user role.';
    END IF;

    -- 2. Unit (Unidad) - Assigned by admin
    IF NEW.unidad IS DISTINCT FROM OLD.unidad THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change your unit assignment.';
    END IF;

    -- 3. Parking Status - Assigned by admin (affects billing)
    IF NEW.has_parking IS DISTINCT FROM OLD.has_parking THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change your parking status.';
    END IF;

    -- 4. Alicuota - Assigned by admin (affects billing)
    -- We assume the column exists (added in previous migration)
    IF NEW.alicuota IS DISTINCT FROM OLD.alicuota THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change your alicuota.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists (from 20260124_prevent_profile_role_escalation.sql)
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;

-- Drop this trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_profile_sensitive_update ON public.profiles;

-- Create the new comprehensive trigger
CREATE TRIGGER on_profile_sensitive_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_profile_updates();
