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
    v_has_debt BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    -- Get Unit ID
    SELECT unit_id INTO v_unit_id FROM profiles WHERE id = v_user_id;
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User has no assigned unit';
    END IF;

    -- DEBUG: Check ONLY requesting user's debt (Simplified)
    SELECT EXISTS (
        SELECT 1 FROM common_expense_debts
        WHERE user_id = v_user_id AND pagado = false
    ) INTO v_has_debt;

    IF v_has_debt THEN
        RAISE EXCEPTION 'Usuario moroso: La unidad tiene gastos comunes impagos.';
    END IF;

    -- Check Morosity (Parking) - Simplified
    SELECT EXISTS (
        SELECT 1 FROM parking_debts
        WHERE user_id = v_user_id AND pagado = false
    ) INTO v_has_debt;

    IF v_has_debt THEN
        RAISE EXCEPTION 'Usuario moroso: La unidad tiene deudas de estacionamiento.';
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
