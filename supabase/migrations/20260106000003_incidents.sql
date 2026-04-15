-- RPC to report an incident and generate a fine
-- This creates an incident record AND a charge of type 'FINE'

CREATE OR REPLACE FUNCTION report_incident(
    p_reservation_id BIGINT,
    p_description TEXT,
    p_amount NUMERIC,
    p_evidence_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id BIGINT;
    v_unit_id BIGINT;
    v_incident_id BIGINT;
    v_charge_id UUID;
BEGIN
    -- 1. Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can report incidents';
    END IF;

    -- 2. Get Reservation and Unit ID
    SELECT id, (SELECT unit_id FROM profiles WHERE id = user_id) INTO v_reservation_id, v_unit_id
    FROM reservations
    WHERE id = p_reservation_id;

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User associated with reservation has no unit assigned';
    END IF;

    -- 3. Validate Input
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Fine amount must be greater than zero';
    END IF;

    IF p_description IS NULL OR trim(p_description) = '' THEN
        RAISE EXCEPTION 'Description is required';
    END IF;

    -- 4. Create Incident Record
    INSERT INTO incidents (
        reservation_id,
        regulation_ref, -- Can be passed as arg later if needed, for now using description as ref or generic
        evidence_urls,
        fine_amount,
        status,
        created_at
    ) VALUES (
        p_reservation_id,
        p_description, -- Using description as regulation_ref/details for now
        CASE WHEN p_evidence_url IS NOT NULL THEN ARRAY[p_evidence_url] ELSE NULL END,
        p_amount,
        'CHARGED', -- Auto-charged
        now()
    )
    RETURNING id INTO v_incident_id;

    -- 5. Create Charge (FINE)
    INSERT INTO charges (
        unit_id,
        amount,
        currency,
        type,
        status,
        reference_type,
        reference_id,
        created_by,
        notes
    ) VALUES (
        v_unit_id,
        p_amount,
        'CLP',
        'FINE',
        'PENDING',
        'INCIDENT', -- We need to make sure this enum value exists or use RESERVATION if INCIDENT not in enum
        v_incident_id, -- Linking to incident ID
        auth.uid(),
        'Multa por incidente en reserva #' || p_reservation_id || ': ' || p_description
    )
    RETURNING id INTO v_charge_id;

    RETURN jsonb_build_object(
        'id', v_incident_id,
        'charge_id', v_charge_id,
        'status', 'SUCCESS',
        'message', 'Incident reported and fine generated successfully'
    );
END;
$$;
