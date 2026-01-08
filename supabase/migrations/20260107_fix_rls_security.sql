-- Fix RLS Security Issues for Phase 4 Tables

-- 1. Deposit Decisions
ALTER TABLE public.deposit_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all deposit decisions" ON public.deposit_decisions;
CREATE POLICY "Admin all deposit decisions" ON public.deposit_decisions
    FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Resident view own deposit decisions" ON public.deposit_decisions;
CREATE POLICY "Resident view own deposit decisions" ON public.deposit_decisions
    FOR SELECT
    USING (
        reservation_id IN (
            SELECT id FROM public.reservations WHERE user_id = auth.uid()
        )
    );

-- 2. Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all incidents" ON public.incidents;
CREATE POLICY "Admin all incidents" ON public.incidents
    FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Resident view own incidents" ON public.incidents;
CREATE POLICY "Resident view own incidents" ON public.incidents
    FOR SELECT
    USING (
        reservation_id IN (
            SELECT id FROM public.reservations WHERE user_id = auth.uid()
        )
    );
