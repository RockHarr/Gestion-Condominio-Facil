-- Prevent Privilege Escalation via Profile Updates
-- This trigger ensures that users cannot change their own role (e.g. from 'resident' to 'admin')
-- even if RLS policies allow them to update their own profile row.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow change only if the user is an admin
        -- We use public.is_admin() which checks the current user's role
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: You are not allowed to change the user role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;

-- Create the trigger
CREATE TRIGGER on_profile_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();
