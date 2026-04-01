-- Secure expenses table (Financial Module Security)

-- 0. Ensure helper function exists (Idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 1. Enable RLS on expenses table (previously missing)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- SELECT: Authenticated users can see expenses.
-- Residents can only see approved expenses (transparency).
-- Admins can see all expenses (including 'En Revision', 'Rechazado').
CREATE POLICY "Authenticated users can view expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (
  status = 'Aprobado' OR public.is_admin()
);

-- INSERT: Only admins can create expenses.
CREATE POLICY "Admins can insert expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

-- UPDATE: Only admins can update expenses (e.g. approve/reject).
CREATE POLICY "Admins can update expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
);

-- DELETE: Only admins can delete expenses.
CREATE POLICY "Admins can delete expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);
