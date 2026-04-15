-- Fix Loading Issues for Amenities and Reservations
-- 1. Ensure is_admin() is executable by authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Reset Amenities RLS to ensure readability
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read amenities" ON public.amenities;
DROP POLICY IF EXISTS amenities_select_authenticated ON public.amenities;
DROP POLICY IF EXISTS "Admin all amenities" ON public.amenities;
DROP POLICY IF EXISTS amenities_admin_write ON public.amenities;

-- Allow everyone to read amenities (simpler for now)
CREATE POLICY "Public read amenities" ON public.amenities FOR SELECT USING (true);

-- Allow admins to do everything
CREATE POLICY "Admin all amenities" ON public.amenities FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Reset Reservations RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read all reservations" ON public.reservations;
DROP POLICY IF EXISTS reservations_select_own_or_admin ON public.reservations;
DROP POLICY IF EXISTS "Admin all reservations" ON public.reservations;
DROP POLICY IF EXISTS reservations_admin_write ON public.reservations;
DROP POLICY IF EXISTS reservations_update_own_or_admin ON public.reservations;
DROP POLICY IF EXISTS reservations_delete_own_or_admin ON public.reservations;

-- Allow reading all reservations (required for calendar availability)
CREATE POLICY "Read all reservations" ON public.reservations FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Admin all reservations" ON public.reservations FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Residents insert own" ON public.reservations;
DROP POLICY IF EXISTS "Residents update own" ON public.reservations;

-- Allow residents to insert (via RPC mostly, but allow partial for now if needed)
CREATE POLICY "Residents insert own" ON public.reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- Allow residents to update their own (for cancellation references basically)
CREATE POLICY "Residents update own" ON public.reservations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Fix Profiles RLS (Critical for Resident Load)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Allow reading all profiles (needed for admin lists, and potentially for social features/neighbors in future)
-- If strict privacy is needed, we can restrict to "own profile OR is_admin".
-- For now, to unblock "Unit Session", at least "own profile" is needed.
-- But the "Units" list often needs to cross-reference profiles.
-- Let's allow authenticated users to read profiles (Name, Unit) which is standard in communities.
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;

CREATE POLICY "Authenticated read profiles" ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- 5. RPC for Admin to Create Reservation (Bypassing auth.uid check if any)
CREATE OR REPLACE FUNCTION public.create_reservation_as_admin(
    p_amenity_id BIGINT,
    p_user_id UUID,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass potential RLS if needed, although is_admin check should handle it.
AS $$
DECLARE
    v_new_id BIGINT;
    v_unit_id BIGINT;
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

    SELECT id INTO v_unit_id FROM public.units WHERE name = v_unit_name;

    IF v_unit_id IS NULL THEN
        -- Fallback: If unit name exists in profile but not in units table (data inconsistency),
        -- we could try to insert it or fail. Failing is safer for data integrity.
        -- BUT, for "Sin Asignar" or similar, maybe we need a fallback. 
        RAISE EXCEPTION 'La unidad "%" del usuario no existe en la tabla de Unidades.', v_unit_name;
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
        unit_id, -- Added this field
        start_at,
        end_at,
        status,
        is_system
    ) VALUES (
        p_amenity_id,
        p_user_id,
        v_unit_id, -- Use resolved ID
        p_start_at,
        p_end_at,
        'CONFIRMED', 
        false
    ) RETURNING id INTO v_new_id;

    -- Return the created reservation
    SELECT to_jsonb(r) INTO v_reservation FROM public.reservations r WHERE id = v_new_id;
    RETURN v_reservation;
END;
$$;

