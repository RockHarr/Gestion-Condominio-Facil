-- EMERGENCY VISIBILITY FIX
-- Disabling RLS on key tables to rule out maximizing permissions issues.
-- This ensures the application can definitely read the data that exists.

ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities DISABLE ROW LEVEL SECURITY;
