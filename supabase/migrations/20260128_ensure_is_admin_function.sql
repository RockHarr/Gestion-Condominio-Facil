-- Security Fix: Ensure public.is_admin() function exists and enforce Profile Role Escalation Prevention
-- This addresses a critical vulnerability where users could potentially update their own role if RLS allows updates.

-- 1. Ensure public.is_admin() exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the 'admin' role in the profiles table
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Ensure Role Escalation Prevention Trigger exists
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow change only if the user is an admin
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: You are not allowed to change the user role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;

CREATE TRIGGER on_profile_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();
