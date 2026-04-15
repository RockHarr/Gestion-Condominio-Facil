-- Final Robust Fix for Reservation Creation
-- Problem: Frontend sends ID as string ("1"), but DB uses BIGINT.
-- Solution: Accept TEXT in RPC to satisfy frontend, but CAST to BIGINT for DB operations.

DROP FUNCTION IF EXISTS public.create_reservation_as_admin(text, uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.create_reservation_as_admin(bigint, uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.create_reservation_as_admin(
    p_amenity_id TEXT, -- Input as text to handle "1" string from frontend
    p_user_id UUID,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id BIGINT;
    v_amenity_id_int BIGINT; -- Variable to hold the integer ID
    v_unit_name TEXT;
    v_reservation JSONB;
BEGIN
    -- 1. Cast Input safely
    BEGIN
        v_amenity_id_int := p_amenity_id::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'ID de espacio inválido. Se esperaba un número, se recibió: %', p_amenity_id;
    END;

    -- 2. Check Admin Permissions
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acceso Denegado: Solo administradores.';
    END IF;

    -- 3. Lookup Unit Name from Profile
    SELECT unidad INTO v_unit_name FROM public.profiles WHERE id = p_user_id;
    
    IF v_unit_name IS NULL THEN
        RAISE EXCEPTION 'El usuario seleccionado no tiene una unidad asignada en su perfil.';
    END IF;

    -- 4. Check for Overlaps
    -- Note: We assume start_at/end_at columns exist based on previous interactions
    IF EXISTS (
        SELECT 1 FROM public.reservations
        WHERE amenity_id = v_amenity_id_int -- Comparing INT to INT
        AND status IN ('CONFIRMED', 'APPROVED_PENDING_PAYMENT')
        AND (
            (start_at <= p_start_at AND end_at > p_start_at) OR
            (start_at < p_end_at AND end_at >= p_end_at) OR
            (start_at >= p_start_at AND end_at <= p_end_at)
        )
    ) THEN
        RAISE EXCEPTION 'Conflicto: El horario seleccionado ya está ocupado.';
    END IF;

    -- 5. Insert Reservation
    INSERT INTO public.reservations (
        amenity_id,
        user_id,
        fecha,
        hora,
        status,
        start_at,
        end_at
    ) VALUES (
        v_amenity_id_int, -- Inserting INT
        p_user_id,
        p_start_at::date,
        p_start_at::time,
        'CONFIRMED',
        p_start_at,
        p_end_at
    ) RETURNING id INTO v_new_id;

    -- 6. Return Result
    SELECT to_jsonb(r) INTO v_reservation FROM public.reservations r WHERE id = v_new_id;
    RETURN v_reservation;
END;
$$;
