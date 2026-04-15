-- Migration: Deposit Retention Revenue Logic (Refined)
-- Date: 2026-01-10
-- Description: Updates deposit logic to treat retention as revenue (FINE charge) and release as non-revenue.
-- Includes strict validations, locking, and note concatenation.

-- 1. Extend deposit_decisions table
ALTER TABLE public.deposit_decisions
ADD COLUMN IF NOT EXISTS retention_charge_id UUID REFERENCES public.charges(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deposit_decisions_retention_charge_id
ON public.deposit_decisions(retention_charge_id)
WHERE retention_charge_id IS NOT NULL;

-- 2. Update decide_deposit RPC
-- Drop old versions to avoid return type conflicts or signature mismatches
DROP FUNCTION IF EXISTS public.decide_deposit(bigint, text, numeric, text);
DROP FUNCTION IF EXISTS public.decide_deposit(bigint, deposit_decision_type, numeric, text);

CREATE OR REPLACE FUNCTION public.decide_deposit(
    p_reservation_id BIGINT,
    p_decision deposit_decision_type, -- Using enum type directly
    p_retained_amount NUMERIC,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id BIGINT;
    v_unit_id BIGINT;
    v_res_status reservation_status;
    v_charge_id UUID;
    v_charge_amount NUMERIC;
    v_charge_status charge_status;
    v_decision_id BIGINT;
    v_retention_charge_id UUID := NULL;
    v_final_retained_amount NUMERIC := 0;
BEGIN
    -- 1. Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can decide on deposits';
    END IF;

    -- 2. Lock and Get Reservation
    SELECT id, unit_id, status INTO v_reservation_id, v_unit_id, v_res_status
    FROM reservations
    WHERE id = p_reservation_id
    FOR UPDATE; -- Lock reservation

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    -- Validate Reservation Status
    IF v_res_status NOT IN ('COMPLETED', 'NO_SHOW') THEN
        RAISE EXCEPTION 'Reservation must be COMPLETED or NO_SHOW to decide on deposit (Current: %)', v_res_status;
    END IF;

    -- 3. Lock and Find the deposit charge
    SELECT id, amount, status INTO v_charge_id, v_charge_amount, v_charge_status
    FROM charges
    WHERE reference_id = p_reservation_id
      AND reference_type = 'RESERVATION'
      AND type = 'RESERVATION_DEPOSIT'
    FOR UPDATE; -- Lock charge

    IF v_charge_id IS NULL THEN
        RAISE EXCEPTION 'No deposit charge found for this reservation';
    END IF;

    -- Validate Deposit Status
    IF v_charge_status != 'PAID' THEN
        RAISE EXCEPTION 'Deposit must be PAID to decide (Current: %)', v_charge_status;
    END IF;

    -- 4. Idempotency Check
    IF EXISTS (SELECT 1 FROM deposit_decisions WHERE reservation_id = p_reservation_id) THEN
        RAISE EXCEPTION 'Deposit decision already exists';
    END IF;

    -- 5. Validate Decision & Calculate Amount
    -- p_decision is already typed as enum, so basic validation is implicit.
    
    IF p_decision = 'RELEASE' THEN
        v_final_retained_amount := 0;
    ELSIF p_decision = 'RETAIN_FULL' THEN
        v_final_retained_amount := v_charge_amount;
    ELSIF p_decision = 'RETAIN_PARTIAL' THEN
        IF p_retained_amount IS NULL OR p_retained_amount <= 0 OR p_retained_amount >= v_charge_amount THEN
            RAISE EXCEPTION 'Invalid retained amount for partial retention';
        END IF;
        v_final_retained_amount := p_retained_amount;
    END IF;

    IF v_final_retained_amount > 0 AND (p_reason IS NULL OR trim(p_reason) = '') THEN
        RAISE EXCEPTION 'Reason is required for retention';
    END IF;

    -- 6. Create Revenue Charge (FINE) if retained amount > 0
    IF v_final_retained_amount > 0 THEN
        INSERT INTO charges (
            unit_id,
            amount,
            currency,
            type,
            status,
            reference_type,
            reference_id,
            paid_at,
            notes
        ) VALUES (
            v_unit_id,
            v_final_retained_amount,
            'CLP',
            'FINE',
            'PAID',
            'RESERVATION',
            p_reservation_id,
            now(),
            'DEPOSIT_RETENTION: ' || p_decision || ' | reason: ' || COALESCE(p_reason, 'N/A')
        )
        RETURNING id INTO v_retention_charge_id;
    END IF;

    -- 7. Insert Decision
    INSERT INTO deposit_decisions (
        reservation_id,
        deposit_charge_id,
        decision,
        retained_amount,
        reason,
        decided_by,
        decided_at,
        retention_charge_id
    ) VALUES (
        p_reservation_id,
        v_charge_id,
        p_decision,
        v_final_retained_amount,
        p_reason,
        auth.uid(),
        now(),
        v_retention_charge_id
    )
    RETURNING id INTO v_decision_id;

    -- 8. Update Original Deposit Charge Status
    -- Moves out of "Custody" (PAID) to RELEASED or RETAINED
    -- Concatenate notes instead of overwriting
    IF p_decision = 'RELEASE' THEN
        UPDATE charges
        SET status = 'RELEASED', 
            notes = COALESCE(notes, '') || ' | Deposit released by admin'
        WHERE id = v_charge_id;
    ELSE
        UPDATE charges
        SET status = 'RETAINED', 
            notes = COALESCE(notes, '') || ' | Deposit retained: ' || COALESCE(p_reason, '')
        WHERE id = v_charge_id;
    END IF;

    RETURN jsonb_build_object(
        'id', v_decision_id,
        'status', 'SUCCESS',
        'message', 'Deposit decision recorded successfully',
        'retention_charge_id', v_retention_charge_id
    );
END;
$$;
