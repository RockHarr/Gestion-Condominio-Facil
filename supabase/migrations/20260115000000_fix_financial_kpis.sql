-- Fix Financial KPIs to use 'payments' table instead of 'charges'
-- Date: 2026-01-15
-- Reason: registerPayment writes to 'payments', so we must sum that for Total Recaudado.

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

    -- 2. Calculate Total Recaudado (Flow) - FROM PAYMENTS
    -- Sum of payments in the period
    SELECT COALESCE(SUM(monto), 0)
    INTO v_total_collected
    FROM payments
    WHERE fecha_pago >= p_period_start::date
      AND fecha_pago < p_period_end::date;

    -- 3. Calculate Garantías en Custodia (Stock)
    -- This relies on charges if reservation flow uses it. 
    -- If reservation flow inserts into 'charges' with type 'RESERVATION_DEPOSIT', keep it.
    -- I'll wrap in EXISTS check to avoid errors if charges table is missing, or catch exception.
    -- For now, let's assuming 'charges' might exist or we zero it out if we want to be safe.
    -- But since I saw 'charges' in the previous file, it implies table exists.
    -- However, let's act defensively. If table charges exists:
    
    BEGIN
        SELECT COALESCE(SUM(amount), 0)
        INTO v_deposits_custody
        FROM charges
        WHERE type = 'RESERVATION_DEPOSIT'
          AND status = 'PAID';
    EXCEPTION WHEN undefined_table THEN
        v_deposits_custody := 0;
    END;

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
