-- Migration: Financial KPIs RPC
-- Date: 2026-01-10
-- Description: Creates get_financial_kpis RPC to calculate Total Recaudado and Garantías en Custodia based on charges table.

CREATE OR REPLACE FUNCTION public.get_financial_kpis(
    p_period_start TIMESTAMP WITH TIME ZONE,
    p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_collected NUMERIC := 0;
    v_deposits_custody NUMERIC := 0;
    v_pending_review_count INTEGER := 0;
    v_total_expenses_approved NUMERIC := 0;
BEGIN
    -- 1. Check Admin Permission
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only admins can view financial KPIs';
    END IF;

    -- 2. Calculate Total Recaudado (Flow)
    -- Sum of charges (COMMON_EXPENSE, FINE, RESERVATION_FEE, PARKING) with status PAID in the period
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_collected
    FROM charges
    WHERE status = 'PAID'
      AND paid_at >= p_period_start
      AND paid_at < p_period_end
      AND type IN ('COMMON_EXPENSE', 'FINE', 'RESERVATION_FEE', 'PARKING');

    -- 3. Calculate Garantías en Custodia (Stock)
    -- Sum of charges (RESERVATION_DEPOSIT) with status PAID that are NOT released or retained
    -- This is a balance metric, so it ignores the period filters (it's "as of now")
    SELECT COALESCE(SUM(amount), 0)
    INTO v_deposits_custody
    FROM charges
    WHERE type = 'RESERVATION_DEPOSIT'
      AND status = 'PAID';

    -- 4. Calculate Pending Review Count (Expenses)
    SELECT COUNT(*)
    INTO v_pending_review_count
    FROM expenses
    WHERE status = 'En Revision';

    -- 5. Calculate Total Expenses Approved (Flow)
    SELECT COALESCE(SUM(monto), 0)
    INTO v_total_expenses_approved
    FROM expenses
    WHERE status = 'Aprobado'
      AND fecha >= p_period_start::date
      AND fecha < p_period_end::date;

    RETURN jsonb_build_object(
        'total_collected', v_total_collected,
        'deposits_custody', v_deposits_custody,
        'pending_review_count', v_pending_review_count,
        'total_expenses_approved', v_total_expenses_approved
    );
END;
$$;
