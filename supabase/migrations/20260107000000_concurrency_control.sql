-- Migration: Concurrency Control and Anti-Hang Strategy
-- Date: 2026-01-07
-- Description: Implements robust concurrency control using Exclusion Constraints and Timeouts.

-- 1. Partial Indexes for Unpaid Debts (Optimization)
CREATE INDEX IF NOT EXISTS idx_common_expense_debts_unpaid_by_user
  ON public.common_expense_debts (user_id)
  WHERE pagado = false;

CREATE INDEX IF NOT EXISTS idx_parking_debts_unpaid_by_user
  ON public.parking_debts (user_id)
  WHERE pagado = false;

-- 2. Enable btree_gist extension (Required for EXCLUDE with BIGINT)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 3. Cleanup Overlapping Reservations (Pre-requisite for Constraint)
-- Identify and delete overlapping reservations that would violate the constraint.
-- We prioritize keeping the oldest reservation (by ID) and delete the newer ones.
DELETE FROM public.reservations
WHERE id IN (
    SELECT b.id
    FROM public.reservations a
    JOIN public.reservations b
      ON a.id < b.id
     AND a.amenity_id = b.amenity_id
     AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(b.start_at, b.end_at, '[)')
    WHERE
      (a.is_system = true OR a.status IN ('REQUESTED','APPROVED_PENDING_PAYMENT','CONFIRMED'))
      AND
      (b.is_system = true OR b.status IN ('REQUESTED','APPROVED_PENDING_PAYMENT','CONFIRMED'))
);

-- 4. Add Exclusion Constraint
ALTER TABLE public.reservations
DROP CONSTRAINT IF EXISTS no_overlap_reservations; -- Drop if exists (e.g. from previous failed attempts)

ALTER TABLE public.reservations
ADD CONSTRAINT reservations_no_overlap_excl
EXCLUDE USING gist
(
  amenity_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (
  is_system = true
  OR status IN ('REQUESTED','APPROVED_PENDING_PAYMENT','CONFIRMED')
);

-- 5. Update RPC request_reservation with Timeouts and Remove Manual Check
CREATE OR REPLACE FUNCTION request_reservation(
    p_amenity_id BIGINT,
    p_type_id BIGINT,
    p_start_at TIMESTAMP WITH TIME ZONE,
    p_end_at TIMESTAMP WITH TIME ZONE,
    p_form_data JSONB
) RETURNS BIGINT AS $$
DECLARE
    v_unit_id BIGINT;
    v_user_id UUID;
    v_fee NUMERIC;
    v_deposit NUMERIC;
    v_reservation_id BIGINT;
    v_unit_user_ids UUID[];
    v_has_debt BOOLEAN;
BEGIN
    -- Anti-Hang Timeouts
    PERFORM set_config('lock_timeout', '5s', true);
    PERFORM set_config('statement_timeout', '10s', true);

    v_user_id := auth.uid();
    
    -- Get Unit ID
    SELECT unit_id INTO v_unit_id FROM profiles WHERE id = v_user_id;
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User has no assigned unit';
    END IF;

    -- Get all user IDs in the unit to check debts for the whole unit
    SELECT array_agg(id) INTO v_unit_user_ids FROM profiles WHERE unit_id = v_unit_id;

    IF v_unit_user_ids IS NOT NULL THEN
        -- Check Morosity (Common Expense) - Optimized with Partial Index
        SELECT EXISTS (
            SELECT 1 FROM common_expense_debts
            WHERE user_id = ANY(v_unit_user_ids) AND pagado = false
        ) INTO v_has_debt;

        IF v_has_debt THEN
            RAISE EXCEPTION 'Usuario moroso: La unidad tiene gastos comunes impagos.';
        END IF;

        -- Check Morosity (Parking) - Optimized with Partial Index
        SELECT EXISTS (
            SELECT 1 FROM parking_debts
            WHERE user_id = ANY(v_unit_user_ids) AND pagado = false
        ) INTO v_has_debt;

        IF v_has_debt THEN
            RAISE EXCEPTION 'Usuario moroso: La unidad tiene deudas de estacionamiento.';
        END IF;
    END IF;
    
    -- Get Snapshots
    SELECT fee_amount, deposit_amount INTO v_fee, v_deposit
    FROM reservation_types WHERE id = p_type_id;

    -- Insert (Constraint handles overlap check)
    INSERT INTO reservations (
        amenity_id, type_id, unit_id, user_id, start_at, end_at, 
        status, is_system, form_data, fee_snapshot, deposit_snapshot
    ) VALUES (
        p_amenity_id, p_type_id, v_unit_id, v_user_id, p_start_at, p_end_at,
        'REQUESTED', FALSE, p_form_data, v_fee, v_deposit
    ) RETURNING id INTO v_reservation_id;

    RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
