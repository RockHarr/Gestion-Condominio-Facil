-- RPC: cancel_system_reservation
-- Allows admins to cancel a system block (maintenance).
-- Sets status to 'CANCELLED' and is_system to FALSE to release the block while keeping audit trail.

CREATE OR REPLACE FUNCTION public.cancel_system_reservation(p_reservation_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_system BOOLEAN;
    v_status public.reservation_status;
    v_new_status public.reservation_status;
BEGIN
    -- 1. Check Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can cancel system blocks';
    END IF;

    -- 2. Lock Row & Get Details
    SELECT is_system, status
    INTO v_is_system, v_status
    FROM public.reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    -- 3. Validate
    IF v_is_system IS NOT TRUE THEN
        RAISE EXCEPTION 'This is not a system block';
    END IF;

    IF v_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'System block is already cancelled';
    END IF;

    -- 4. Update
    UPDATE public.reservations
    SET status = 'CANCELLED',
        is_system = FALSE
    WHERE id = p_reservation_id
    RETURNING status INTO v_new_status;

    RETURN jsonb_build_object(
        'id', p_reservation_id,
        'status', v_new_status,
        'is_system', FALSE,
        'message', 'System block cancelled successfully'
    );
END;
$$;

-- MANUAL VERIFICATION STEPS
-- Run these queries in SQL Editor to verify:

-- 1. Create a System Block (e.g., for amenity_id 1)
-- SELECT public.create_system_reservation(1, '2026-02-01 10:00:00+00', '2026-02-01 12:00:00+00', 'Maintenance');
-- Note the returned ID (e.g., 999)

-- 2. Verify Block Exists
-- SELECT id, amenity_id, status, is_system, start_at, end_at FROM public.reservations WHERE id = 999;

-- 3. Attempt Conflict (Should Fail)
-- Note: 1 is amenity_id, 1 is type_id, then dates, then empty form data
-- SELECT public.request_reservation(1, 1, '2026-02-01 10:00:00+00', '2026-02-01 11:00:00+00', '{}'::jsonb);

-- 4. Cancel Block
-- SELECT public.cancel_system_reservation(999);

-- 5. Verify Cancellation (is_system should be false)
-- SELECT id, amenity_id, status, is_system, start_at, end_at FROM public.reservations WHERE id = 999;

-- 6. Attempt Conflict Again (Should Succeed)
-- SELECT public.request_reservation(1, 1, '2026-02-01 10:00:00+00', '2026-02-01 11:00:00+00', '{}'::jsonb);
