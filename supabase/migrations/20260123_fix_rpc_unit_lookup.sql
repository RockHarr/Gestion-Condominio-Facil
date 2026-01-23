-- Final RPC Fix: Include unit_id lookup and insertion to satisfy check_system_unit constraint.
-- Also maintains previous fixes (TEXT input casting, start_at/end_at columns).

CREATE OR REPLACE FUNCTION public.create_reservation_as_admin(
    p_amenity_id TEXT,
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
    v_amenity_id_int BIGINT;
    v_unit_id BIGINT;
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

    -- 3. Lookup Unit ID
    -- First get the unit name (text) from the profile
    SELECT unidad INTO v_unit_name FROM public.profiles WHERE id = p_user_id;
    
    IF v_unit_name IS NULL THEN
         RAISE EXCEPTION 'El usuario seleccionado no tiene una unidad asignada en su perfil.';
    END IF;

    -- Then resolve the unit_id from the 'units' table
    SELECT id INTO v_unit_id FROM public.units WHERE name = v_unit_name;
    
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'La unidad % (del perfil) no se encuentra en la tabla maestra de Unidades.', v_unit_name;
    END IF;

    -- 4. Check for Overlaps
    IF EXISTS (
        SELECT 1 FROM public.reservations
        WHERE amenity_id = v_amenity_id_int
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
    -- Now explicitly including unit_id to satisfy 'check_system_unit' constraint
    INSERT INTO public.reservations (
        amenity_id,
        user_id,
        unit_id,
        status,
        start_at,
        end_at
    ) VALUES (
        v_amenity_id_int,
        p_user_id,
        v_unit_id,
        'CONFIRMED',
        p_start_at,
        p_end_at
    ) RETURNING id INTO v_new_id;

    -- 6. Return Result
    SELECT to_jsonb(r) INTO v_reservation FROM public.reservations r WHERE id = v_new_id;
    RETURN v_reservation;
END;
$$;
