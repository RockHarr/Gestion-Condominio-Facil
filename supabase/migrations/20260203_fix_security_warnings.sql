-- Fix "Extension in Public" warning
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION btree_gist SET SCHEMA extensions;

-- Fix "Function Search Path Mutable" warnings
-- We redefine the functions with `SET search_path = public`

-- 1. request_reservation
CREATE OR REPLACE FUNCTION public.request_reservation(
    p_amenity_id BIGINT,
    p_type_id BIGINT,
    p_start_at TIMESTAMP WITH TIME ZONE,
    p_end_at TIMESTAMP WITH TIME ZONE,
    p_form_data JSONB
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_unit_id BIGINT;
    v_user_id UUID;
    v_fee NUMERIC;
    v_deposit NUMERIC;
    v_reservation_id BIGINT;
    v_unit_user_ids UUID[];
    v_has_debt BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    -- Get Unit ID
    SELECT unit_id INTO v_unit_id FROM public.profiles WHERE id = v_user_id;
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User has no assigned unit';
    END IF;

    -- MANUAL OVERLAP CHECK
    IF EXISTS (
        SELECT 1 FROM public.reservations
        WHERE amenity_id = p_amenity_id
        AND status IN ('REQUESTED', 'APPROVED_PENDING_PAYMENT', 'CONFIRMED')
        AND tstzrange(start_at, end_at) && tstzrange(p_start_at, p_end_at)
    ) THEN
        RAISE EXCEPTION 'Reservation overlaps with an existing booking';
    END IF;

    -- MOROSITY CHECK (Full Unit Check)
    SELECT array_agg(id) INTO v_unit_user_ids FROM public.profiles WHERE unit_id = v_unit_id;

    IF v_unit_user_ids IS NOT NULL THEN
        -- Check Morosity (Common Expense)
        SELECT EXISTS (
            SELECT 1 FROM public.common_expense_debts
            WHERE user_id = ANY(v_unit_user_ids) AND pagado = false
        ) INTO v_has_debt;

        IF v_has_debt THEN
            RAISE EXCEPTION 'Usuario moroso: La unidad tiene gastos comunes impagos.';
        END IF;

        -- Check Morosity (Parking)
        SELECT EXISTS (
            SELECT 1 FROM public.parking_debts
            WHERE user_id = ANY(v_unit_user_ids) AND pagado = false
        ) INTO v_has_debt;

        IF v_has_debt THEN
            RAISE EXCEPTION 'Usuario moroso: La unidad tiene deudas de estacionamiento.';
        END IF;
    END IF;
    
    -- Get Snapshots
    SELECT fee_amount, deposit_amount INTO v_fee, v_deposit
    FROM public.reservation_types WHERE id = p_type_id;

    -- Insert
    INSERT INTO public.reservations (
        amenity_id, type_id, unit_id, user_id, start_at, end_at, 
        status, is_system, form_data, fee_snapshot, deposit_snapshot
    ) VALUES (
        p_amenity_id, p_type_id, v_unit_id, v_user_id, p_start_at, p_end_at,
        'REQUESTED', FALSE, p_form_data, v_fee, v_deposit
    ) RETURNING id INTO v_reservation_id;

    RETURN v_reservation_id;
END;
$$;

-- 2. approve_reservation
CREATE OR REPLACE FUNCTION public.approve_reservation(p_reservation_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_unit_id BIGINT;
    v_type_id BIGINT;
    v_fee NUMERIC;
    v_deposit NUMERIC;
BEGIN
    SELECT unit_id, type_id
    INTO v_unit_id, v_type_id
    FROM public.reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Cannot approve system reservation %', p_reservation_id;
    END IF;

    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Reservation % has no type_id', p_reservation_id;
    END IF;

    SELECT fee_amount, deposit_amount
    INTO v_fee, v_deposit
    FROM public.reservation_types
    WHERE id = v_type_id;

    UPDATE public.reservations
    SET status = 'APPROVED_PENDING_PAYMENT',
        fee_snapshot = v_fee,
        deposit_snapshot = v_deposit
    WHERE id = p_reservation_id
        AND status = 'REQUESTED';

    IF NOT FOUND THEN
        RETURN;
    END IF;

    INSERT INTO public.charges (unit_id, amount, type, status, reference_type, reference_id, created_by)
    VALUES (v_unit_id, v_fee, 'RESERVATION_FEE', 'PENDING', 'RESERVATION', p_reservation_id, auth.uid())
    ON CONFLICT DO NOTHING;

    INSERT INTO public.charges (unit_id, amount, type, status, reference_type, reference_id, created_by)
    VALUES (v_unit_id, v_deposit, 'RESERVATION_DEPOSIT', 'PENDING', 'RESERVATION', p_reservation_id, auth.uid())
    ON CONFLICT DO NOTHING;
END $$;

-- 3. confirm_reservation_payment
CREATE OR REPLACE FUNCTION public.confirm_reservation_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res_id BIGINT;
    v_paid_fee BOOLEAN;
    v_paid_dep BOOLEAN;
BEGIN
    IF TG_OP = 'UPDATE'
        AND NEW.status = 'PAID'
        AND OLD.status IS DISTINCT FROM NEW.status
        AND NEW.reference_type = 'RESERVATION'
    THEN
        v_res_id := NEW.reference_id;

        SELECT EXISTS(
            SELECT 1 FROM public.charges
            WHERE reference_type='RESERVATION'
                AND reference_id=v_res_id
                AND type='RESERVATION_FEE'
                AND status='PAID'
        ) INTO v_paid_fee;

        SELECT EXISTS(
            SELECT 1 FROM public.charges
            WHERE reference_type='RESERVATION'
                AND reference_id=v_res_id
                AND type='RESERVATION_DEPOSIT'
                AND status='PAID'
        ) INTO v_paid_dep;

        IF v_paid_fee AND v_paid_dep THEN
            UPDATE public.reservations
            SET status = 'CONFIRMED'
            WHERE id = v_res_id
                AND status = 'APPROVED_PENDING_PAYMENT';
        END IF;
    END IF;

    RETURN NEW;
END $$;

-- 4. create_reservation_as_admin
CREATE OR REPLACE FUNCTION public.create_reservation_as_admin(
    p_amenity_id TEXT,
    p_user_id UUID,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id BIGINT;
    v_amenity_id_int BIGINT;
    v_unit_name TEXT;
    v_reservation JSONB;
BEGIN
    BEGIN
        v_amenity_id_int := p_amenity_id::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'ID de espacio inválido. Se esperaba un número, se recibió: %', p_amenity_id;
    END;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acceso Denegado: Solo administradores.';
    END IF;

    SELECT unidad INTO v_unit_name FROM public.profiles WHERE id = p_user_id;
    
    IF v_unit_name IS NULL THEN
        RAISE EXCEPTION 'El usuario seleccionado no tiene una unidad asignada en su perfil.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.reservations
        WHERE amenity_id = v_amenity_id_int
        AND status IN ('CONFIRMED', 'APPROVED_PENDING_PAYMENT')
        AND tstzrange(start_at, end_at) && tstzrange(p_start_at, p_end_at)
    ) THEN
        RAISE EXCEPTION 'Conflicto: El horario seleccionado ya está ocupado.';
    END IF;

    INSERT INTO public.reservations (
        amenity_id, user_id, status, start_at, end_at
    ) VALUES (
        v_amenity_id_int, p_user_id, 'CONFIRMED', p_start_at, p_end_at
    ) RETURNING id INTO v_new_id;

    SELECT to_jsonb(r) INTO v_reservation FROM public.reservations r WHERE id = v_new_id;
    RETURN v_reservation;
END;
$$;

-- 5. close_reservation
CREATE OR REPLACE FUNCTION public.close_reservation(p_reservation_id BIGINT, p_status reservation_status) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF p_status NOT IN ('COMPLETED', 'NO_SHOW') THEN
        RAISE EXCEPTION 'Invalid status for closing';
    END IF;

    UPDATE public.reservations SET status = p_status WHERE id = p_reservation_id;
END;
$$;

-- 6. submit_vote
CREATE OR REPLACE FUNCTION public.submit_vote(
    p_poll_id BIGINT,
    p_option_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_unit_id BIGINT;
    v_poll_start TIMESTAMP WITH TIME ZONE;
    v_poll_end TIMESTAMP WITH TIME ZONE;
    v_strategy weighting_strategy;
    v_snapshot JSONB;
    v_weight NUMERIC := 1;
    v_closed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT unit_id INTO v_unit_id FROM public.profiles WHERE id = auth.uid();
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'User has no assigned unit';
    END IF;

    SELECT start_at, end_at, weighting_strategy, weight_snapshot_json, closed_at
    INTO v_poll_start, v_poll_end, v_strategy, v_snapshot, v_closed_at
    FROM public.polls WHERE id = p_poll_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Poll not found';
    END IF;

    IF v_closed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Poll is closed';
    END IF;

    IF now() < v_poll_start OR now() >= v_poll_end THEN
        RAISE EXCEPTION 'Voting is not currently active for this poll';
    END IF;

    PERFORM 1 FROM public.poll_options WHERE id = p_option_id AND poll_id = p_poll_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid option for this poll';
    END IF;

    IF v_strategy = 'ALICUOTA' THEN
        IF v_snapshot IS NULL THEN
             RAISE EXCEPTION 'Snapshot missing for ALICUOTA strategy';
        END IF;
        v_weight := (v_snapshot->>v_unit_id::text)::numeric;
        
        IF v_weight IS NULL THEN
            RAISE EXCEPTION 'Unit weight not found in snapshot';
        END IF;
    END IF;

    INSERT INTO public.poll_responses (poll_id, unit_id, option_id, weight_used)
    VALUES (p_poll_id, v_unit_id, p_option_id, v_weight);

    RETURN jsonb_build_object('status', 'SUCCESS', 'weight_used', v_weight);
END;
$$;

-- 7. cancel_reservation
DROP FUNCTION IF EXISTS public.cancel_reservation(BIGINT);

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res_user_id UUID;
    v_status TEXT;
    v_start_at TIMESTAMP WITH TIME ZONE;
    v_is_admin BOOLEAN;
BEGIN
    SELECT user_id, status::text, start_at INTO v_res_user_id, v_status, v_start_at
    FROM public.reservations
    WHERE id = p_reservation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reservation not found';
    END IF;

    v_is_admin := public.is_admin();

    IF auth.uid() != v_res_user_id AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Already cancelled';
    END IF;

    IF NOT v_is_admin AND v_start_at < now() THEN
        RAISE EXCEPTION 'Cannot cancel past reservations';
    END IF;

    UPDATE public.reservations
    SET status = 'CANCELLED'
    WHERE id = p_reservation_id;

    RETURN jsonb_build_object('status', 'SUCCESS');
END;
$$;
