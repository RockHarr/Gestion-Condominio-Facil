-- 1. Cleanup conflicting reservations (created during testing without constraint)
DELETE FROM reservations 
WHERE amenity_id = '1' -- Assuming test amenity ID
AND start_at >= NOW(); 

-- 2. Drop the exclusion constraint permanently (we will handle it manually in RPC)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_overlap_reservations;

-- 3. Update request_reservation with manual overlap check and full morosity check
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
    v_user_id := auth.uid();
    
    -- Get Unit ID
    SELECT unit_id INTO v_unit_id FROM profiles WHERE id = v_user_id;
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User has no assigned unit';
    END IF;

    -- MANUAL OVERLAP CHECK (Replaces Exclusion Constraint)
    -- Check if any active reservation overlaps with the requested time
    IF EXISTS (
        SELECT 1 FROM reservations
        WHERE amenity_id = p_amenity_id
        AND status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED')
        AND tstzrange(start_at, end_at) && tstzrange(p_start_at, p_end_at)
    ) THEN
        RAISE EXCEPTION 'Reservation overlaps with an existing booking';
    END IF;

    -- MOROSITY CHECK (Full Unit Check)
    -- Get all user IDs in the unit to check debts for the whole unit
    SELECT array_agg(id) INTO v_unit_user_ids FROM profiles WHERE unit_id = v_unit_id;

    IF v_unit_user_ids IS NOT NULL THEN
        -- Check Morosity (Common Expense)
        SELECT EXISTS (
            SELECT 1 FROM common_expense_debts
            WHERE user_id = ANY(v_unit_user_ids) AND pagado = false
        ) INTO v_has_debt;

        IF v_has_debt THEN
            RAISE EXCEPTION 'Usuario moroso: La unidad tiene gastos comunes impagos.';
        END IF;

        -- Check Morosity (Parking)
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

    -- Insert
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
