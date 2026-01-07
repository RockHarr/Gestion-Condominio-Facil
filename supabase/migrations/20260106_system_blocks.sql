-- RPC to create a system reservation (Maintenance Block)
-- This bypasses payment logic and sets is_system = true
-- Only admins should be able to call this (enforced by RLS policy on reservations table or check inside RPC)

CREATE OR REPLACE FUNCTION create_system_reservation(
    p_amenity_id BIGINT,
    p_start_at TIMESTAMP WITH TIME ZONE,
    p_end_at TIMESTAMP WITH TIME ZONE,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id BIGINT;
    v_overlap_count INT;
BEGIN
    -- 1. Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can create system blocks';
    END IF;

    -- 2. Validate dates
    IF p_end_at <= p_start_at THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    -- 3. Check for overlaps (Explicit check for better error message, though Exclusion Constraint handles it)
    SELECT COUNT(*) INTO v_overlap_count
    FROM reservations
    WHERE amenity_id = p_amenity_id
      AND status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED')
      AND (
          (start_at, end_at) OVERLAPS (p_start_at, p_end_at)
      );

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'There is an existing reservation overlapping with this time block';
    END IF;

    -- 4. Insert Reservation
    INSERT INTO reservations (
        amenity_id,
        user_id, -- Null for system blocks
        start_at,
        end_at,
        status,
        is_system,
        system_reason
    ) VALUES (
        p_amenity_id,
        NULL,
        p_start_at,
        p_end_at,
        'CONFIRMED', -- System blocks are auto-confirmed
        TRUE,
        p_reason
    )
    RETURNING id INTO v_reservation_id;

    RETURN jsonb_build_object(
        'id', v_reservation_id,
        'status', 'CONFIRMED',
        'message', 'System block created successfully'
    );
END;
$$;
