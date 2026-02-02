-- Protect sensitive profile fields from unauthorized updates
-- Replaces previous prevention of role escalation with broader protection.

-- Ensure is_admin exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is an admin
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Non-admins cannot change 'role'
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change the user role.';
    END IF;

    -- Non-admins cannot change 'has_parking'
    IF NEW.has_parking IS DISTINCT FROM OLD.has_parking THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change the parking status.';
    END IF;

    -- Non-admins cannot change 'unit_id'
    -- Note: unit_id is expected to exist from previous migrations (20260103_phase4_schema.sql)
    IF NEW.unit_id IS DISTINCT FROM OLD.unit_id THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change the assigned unit.';
    END IF;

    -- Also protect 'unidad' text column if it is still used
    IF NEW.unidad IS DISTINCT FROM OLD.unidad THEN
        RAISE EXCEPTION 'Unauthorized: You are not allowed to change the unit name.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists (cleanup)
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;

-- Create new trigger
DROP TRIGGER IF EXISTS on_profile_sensitive_update ON public.profiles;
CREATE TRIGGER on_profile_sensitive_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_profile_fields();
