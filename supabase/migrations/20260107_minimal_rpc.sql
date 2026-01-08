CREATE OR REPLACE FUNCTION request_reservation(
    p_amenity_id BIGINT,
    p_type_id BIGINT,
    p_start_at TIMESTAMP WITH TIME ZONE,
    p_end_at TIMESTAMP WITH TIME ZONE,
    p_form_data JSONB
) RETURNS BIGINT AS $$
BEGIN
    -- Minimal implementation to test connectivity
    -- Returns a dummy ID
    RETURN 99999;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
