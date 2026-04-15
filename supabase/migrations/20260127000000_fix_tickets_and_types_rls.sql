-- Fix RLS policies for Tickets and Reservation Types

-- 1. TICKETS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "Admins can do everything on tickets" ON public.tickets;
CREATE POLICY "Admins can do everything on tickets"
    ON public.tickets
    FOR ALL
    USING (public.is_admin());

-- Residents view their own tickets
DROP POLICY IF EXISTS "Residents can view own tickets" ON public.tickets;
CREATE POLICY "Residents can view own tickets"
    ON public.tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Residents create tickets
DROP POLICY IF EXISTS "Residents can insert own tickets" ON public.tickets;
CREATE POLICY "Residents can insert own tickets"
    ON public.tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. RESERVATION TYPES
ALTER TABLE public.reservation_types ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "Admins can do everything on reservation_types" ON public.reservation_types;
CREATE POLICY "Admins can do everything on reservation_types"
    ON public.reservation_types
    FOR ALL
    USING (public.is_admin());

-- Everyone can view reservation types
DROP POLICY IF EXISTS "Everyone can view reservation_types" ON public.reservation_types;
CREATE POLICY "Everyone can view reservation_types"
    ON public.reservation_types
    FOR SELECT
    USING (true);
