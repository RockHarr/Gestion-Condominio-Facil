-- Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS for tickets to allow Admins to view all
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own tickets" ON public.tickets;

CREATE POLICY "Users can see own tickets" ON public.tickets
  FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_admin()
  );
