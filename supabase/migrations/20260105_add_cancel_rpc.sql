-- RPC: cancel_reservation
CREATE OR REPLACE FUNCTION cancel_reservation(p_reservation_id BIGINT) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_res_user_id UUID;
    v_res_status reservation_status;
BEGIN
    v_user_id := auth.uid();
    
    -- Get reservation details
    SELECT user_id, status INTO v_res_user_id, v_res_status 
    FROM reservations WHERE id = p_reservation_id;
    
    IF v_res_user_id IS NULL THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    -- Check ownership
    IF v_res_user_id != v_user_id THEN
        -- Allow admin to cancel any? (Optional, but for this RPC let's stick to user)
        -- If we want admin to use this too, we'd check role.
        -- But for "Resident App", it's the user cancelling.
        RAISE EXCEPTION 'Not authorized to cancel this reservation';
    END IF;

    -- Check status
    IF v_res_status NOT IN ('REQUESTED', 'CONFIRMED') THEN
        RAISE EXCEPTION 'Cannot cancel reservation in current status';
    END IF;

    -- Perform cancellation (Soft delete or status update? Requirement says "cancel", usually status update)
    -- But the frontend was trying to DELETE.
    -- If we DELETE, we lose the record. If we UPDATE to CANCELLED, we keep history.
    -- Let's UPDATE to 'CANCELLED'.
    
    UPDATE reservations SET status = 'CANCELLED' WHERE id = p_reservation_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
