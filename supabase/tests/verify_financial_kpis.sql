-- Verification Script: Financial KPIs (Final)
-- Description: Seeds data and calls RPC to verify logic.
-- Fixes: Uses real Unit ID, valid Enums, and non-null references.

BEGIN;

DO $$
DECLARE
    v_unit_id BIGINT;
    v_start_date TIMESTAMP WITH TIME ZONE := date_trunc('month', now());
    v_end_date TIMESTAMP WITH TIME ZONE := date_trunc('month', now()) + interval '1 month';
    v_kpis JSONB;
BEGIN
    -- 1. Setup: Get a real unit
    SELECT id INTO v_unit_id FROM public.units LIMIT 1;
    
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'No units found. Please seed units first.';
    END IF;

    RAISE NOTICE 'Testing with Unit ID: %', v_unit_id;

    -- 2. Seed Data
    -- A. Reservation Fee (Paid) -> Should be in Total Recaudado
    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 10000, 'CLP', 'RESERVATION_FEE', 'PAID', 'RESERVATION', 99999, now())
    RETURNING id;

    -- B. Reservation Deposit (Paid) -> Should be in Garantías en Custodia
    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 50000, 'CLP', 'RESERVATION_DEPOSIT', 'PAID', 'RESERVATION', 99999, now())
    RETURNING id;

    -- C. Common Expense (Paid) -> Should be in Total Recaudado
    -- Uses reference_type='MONTH' and a dummy ID (e.g., YYYYMM)
    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 5000, 'CLP', 'COMMON_EXPENSE', 'PAID', 'MONTH', 202601, now())
    RETURNING id;

    -- D. Reservation Deposit (Released) -> Should NOT be in Garantías en Custodia
    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 20000, 'CLP', 'RESERVATION_DEPOSIT', 'RELEASED', 'RESERVATION', 99998, now())
    RETURNING id;

    -- 3. Call RPC
    SELECT get_financial_kpis(v_start_date, v_end_date) INTO v_kpis;

    -- 4. Assert Results
    RAISE NOTICE 'KPI Result: %', v_kpis;

    -- Total Recaudado should be 10000 (Fee) + 5000 (Exp) = 15000
    -- Garantías en Custodia should be 50000 (Deposit Paid)
    
    IF (v_kpis->>'total_collected')::NUMERIC = 15000 THEN
        RAISE NOTICE 'PASS: Total Recaudado is 15000';
    ELSE
        RAISE NOTICE 'FAIL: Total Recaudado is % (Expected 15000)', v_kpis->>'total_collected';
    END IF;

    IF (v_kpis->>'deposits_custody')::NUMERIC = 50000 THEN
        RAISE NOTICE 'PASS: Garantías en Custodia is 50000';
    ELSE
        RAISE NOTICE 'FAIL: Garantías en Custodia is % (Expected 50000)', v_kpis->>'deposits_custody';
    END IF;

    -- Rollback to clean up
    RAISE EXCEPTION 'Test Complete (Rollback triggered)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '%', SQLERRM;
END $$;

ROLLBACK;
