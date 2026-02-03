-- Security Fix: Prevent Privilege Escalation via Profile Updates
-- Vulnerability: Users could update their own 'role' column to 'admin'.
-- Fix: Add a trigger to prevent role changes unless the user is already an admin.

-- 1. Helper function: is_admin()
-- Ensures we can reliably check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

-- Secure the function
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 2. Trigger Function: prevent_role_escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if role is being changed
  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- Check if the user is an admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You cannot change your own role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_role_escalation();
