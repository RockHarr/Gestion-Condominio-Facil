-- Fix: Grant execution of is_admin to authenticated users so RLS policies can use it.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon; -- Opcional, si alguna politica anonima lo usara (poco probable, pero seguro si devuelve false)
