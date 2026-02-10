-- Secure Debt Payments and Enable Missing RLS

-- 1. Create RPC for paying own debts (replaces direct table update)
CREATE OR REPLACE FUNCTION public.pay_my_debts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update common expense debts
    UPDATE public.common_expense_debts
    SET pagado = true
    WHERE user_id = auth.uid() AND pagado = false;

    -- Update parking debts
    UPDATE public.parking_debts
    SET pagado = true
    WHERE user_id = auth.uid() AND pagado = false;
END;
$$;

-- 2. Enable RLS on sensitive tables
ALTER TABLE public.common_expense_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies

-- Common Expense Debts: Residents see own, Admins see all & manage
CREATE POLICY "Residents view own common expense debts" ON public.common_expense_debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage common expense debts" ON public.common_expense_debts
    FOR ALL USING (public.is_admin());

-- Parking Debts: Residents see own, Admins see all & manage
CREATE POLICY "Residents view own parking debts" ON public.parking_debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage parking debts" ON public.parking_debts
    FOR ALL USING (public.is_admin());

-- Financial Statements: Public Read, Admin Write
-- Financial Statements: Authenticated Read, Admin Write
CREATE POLICY "Residents view financial statements" ON public.financial_statements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage financial statements" ON public.financial_statements
    FOR ALL USING (public.is_admin());

-- Reserve Fund: Authenticated Read, Admin Write
CREATE POLICY "Residents view reserve fund" ON public.reserve_fund
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage reserve fund" ON public.reserve_fund
    FOR ALL USING (public.is_admin());

-- Community Settings: Authenticated Read, Admin Write
CREATE POLICY "Residents view community settings" ON public.community_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage community settings" ON public.community_settings
    FOR ALL USING (public.is_admin());

-- Expenses: Authenticated Read, Admin Write
CREATE POLICY "Residents view expenses" ON public.expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage expenses" ON public.expenses
    FOR ALL USING (public.is_admin());

-- Payments: Users view own, Admin manage all
CREATE POLICY "Users view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage payments" ON public.payments
    FOR ALL USING (public.is_admin());
