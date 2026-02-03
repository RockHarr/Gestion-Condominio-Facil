-- Enable Row Level Security on tables where it is currently disabled but policies exist.
-- This fixes the security warnings reported by Supabase Security Advisor.

-- 1. Amenities (Public read, Admin write)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- 2. Profiles (Public read, User update own)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Reservations (Public read for availability, User create/update own)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 4. Units (Public read)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
