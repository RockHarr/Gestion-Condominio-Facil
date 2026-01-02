-- Fix: Allow Admins to update any profile (needed for Unit Management)

-- 1. Create new policy for Admin updates on profiles
CREATE POLICY profiles_update_admin
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Ensure the policy is applied
-- (No need to enable RLS again as it is already enabled)
