-- RPC to decide on a deposit (Release or Retain)
-- This updates the deposit_decisions table AND the associated charge status

CREATE OR REPLACE FUNCTION decide_deposit(
    p_reservation_id BIGINT,
    p_decision TEXT, -- 'RELEASE', 'RETAIN_PARTIAL', 'RETAIN_FULL'
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
    v_charge_id UUID;
    v_charge_amount NUMERIC;
    v_decision_id BIGINT;
BEGIN
    -- 1. Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can decide on deposits';
    END IF;

    -- 2. Get Reservation and associated Deposit Charge
    SELECT id INTO v_reservation_id
    FROM reservations
    WHERE id = p_reservation_id;

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    -- Find the deposit charge
    SELECT id, amount INTO v_charge_id, v_charge_amount
    FROM charges
    WHERE reference_id = p_reservation_id
      AND reference_type = 'RESERVATION'
      AND type = 'RESERVATION_DEPOSIT';

    IF v_charge_id IS NULL THEN
        RAISE EXCEPTION 'No deposit charge found for this reservation';
    END IF;

    -- 3. Validate Decision
    IF p_decision NOT IN ('RELEASE', 'RETAIN_PARTIAL', 'RETAIN_FULL') THEN
        RAISE EXCEPTION 'Invalid decision type';
    END IF;

    IF p_decision = 'RETAIN_PARTIAL' AND (p_retained_amount IS NULL OR p_retained_amount <= 0 OR p_retained_amount >= v_charge_amount) THEN
        RAISE EXCEPTION 'Invalid retained amount for partial retention';
    END IF;

    IF (p_decision = 'RETAIN_FULL' OR p_decision = 'RETAIN_PARTIAL') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
        RAISE EXCEPTION 'Reason is required for retention';
    END IF;

    -- 4. Insert Decision
    INSERT INTO deposit_decisions (
        reservation_id,
        deposit_charge_id,
        decision,
        retained_amount,
        reason,
        decided_by,
        decided_at
    ) VALUES (
        p_reservation_id,
        v_charge_id,
        p_decision::deposit_decision_type, -- Cast to enum if exists, or text if not
        COALESCE(p_retained_amount, 0),
        p_reason,
        auth.uid(),
        now()
    )
    RETURNING id INTO v_decision_id;

    -- 5. Update Charge Status
    IF p_decision = 'RELEASE' THEN
        UPDATE charges
        SET status = 'RELEASED', notes = 'Deposit released by admin'
        WHERE id = v_charge_id;
    ELSE
        UPDATE charges
        SET status = 'RETAINED', notes = p_reason
        WHERE id = v_charge_id;
        
        -- If partial, we might want to create a refund charge or just note it?
        -- For simplicity, we mark the whole charge as RETAINED, but the decision record holds the detail.
        -- Alternatively, we could split the charge, but that's complex.
        -- Let's stick to marking it RETAINED and relying on deposit_decisions for accounting.
    END IF;

    RETURN jsonb_build_object(
        'id', v_decision_id,
        'status', 'SUCCESS',
        'message', 'Deposit decision recorded successfully'
    );
END;
$$;
