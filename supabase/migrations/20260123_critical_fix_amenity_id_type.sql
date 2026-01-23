
-- Force reservations.amenity_id to be TEXT to match amenities.id
-- This fixes the "operator does not exist: bigint = text" error

-- 1. Drop the constraint first if it exists to allow type change
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_amenity_id_fkey;

-- 2. Alter the column type
-- Using a safe cast if possible, or just force it. 
-- Since previous attempts failed with type mismatch, data there might be garbage or empty.
ALTER TABLE public.reservations ALTER COLUMN amenity_id TYPE TEXT USING amenity_id::text;

-- 3. Re-add the foreign key constraint
-- Ensure amenities.id is indeed TEXT (it should be 'quincho', 'sala_eventos')
ALTER TABLE public.reservations 
    ADD CONSTRAINT reservations_amenity_id_fkey 
    FOREIGN KEY (amenity_id) 
    REFERENCES public.amenities(id) 
    ON DELETE CASCADE;

-- 4. Re-apply the helper function just to be safe it's loaded correctly
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
    v_unit_name TEXT;
    v_reservation JSONB;
BEGIN
    -- Check Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Admin only';
    END IF;

    -- Lookup Unit ID from Profile
    SELECT unidad INTO v_unit_name FROM public.profiles WHERE id = p_user_id;
    
    IF v_unit_name IS NULL THEN
        RAISE EXCEPTION 'El usuario seleccionado no tiene una unidad asignada en su perfil.';
    END IF;

    -- Basic overlap check
    IF EXISTS (
        SELECT 1 FROM public.reservations
        WHERE amenity_id = p_amenity_id
        AND status IN ('CONFIRMED', 'APPROVED_PENDING_PAYMENT')
        AND (
            (start_at <= p_start_at AND end_at > p_start_at) OR
            (start_at < p_end_at AND end_at >= p_end_at) OR
            (start_at >= p_start_at AND end_at <= p_end_at)
        )
    ) THEN
        RAISE EXCEPTION 'Conflicto: El horario seleccionado ya está ocupado.';
    END IF;

    -- Insert directly
    INSERT INTO public.reservations (
        amenity_id,
        user_id,
        fecha,
        hora,
        status,
        start_at,
        end_at
    ) VALUES (
        p_amenity_id,
        p_user_id,
        p_start_at::date,
        p_start_at::time,
        'CONFIRMED',
        p_start_at,
        p_end_at
    ) RETURNING id INTO v_new_id;

    -- Return the created reservation
    SELECT to_jsonb(r) INTO v_reservation FROM public.reservations r WHERE id = v_new_id;
    RETURN v_reservation;
END;
$$;
