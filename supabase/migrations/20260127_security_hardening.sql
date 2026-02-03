-- SECURITY HARDENING MIGRATION
-- Fixes recursive policies and insecure functions

-- 1. SECURE is_admin() FUNCTION
-- Re-create is_admin to be SECURITY DEFINER with search_path=public
-- This allows it to bypass RLS on profiles table, preventing recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. FIX PROFILES RLS
-- Ensure profiles are not public to the world (only authenticated users)
-- And fix recursion by using the new secure is_admin()

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Allow authenticated users to view all profiles (needed for user directory)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 3. HARDEN RPC FUNCTIONS
-- Add SET search_path = public to all SECURITY DEFINER functions to prevent privilege escalation

-- Common functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, role, unidad)
  VALUES (new.id, new.raw_user_meta_data->>'nombre', new.email, 'resident', new.raw_user_meta_data->>'unidad');
  RETURN new;
END;
$$;

-- Voting Module
CREATE OR REPLACE FUNCTION create_poll(
    p_question TEXT,
    p_options TEXT[],
    p_start_at TIMESTAMP WITH TIME ZONE,
    p_end_at TIMESTAMP WITH TIME ZONE,
    p_strategy weighting_strategy,
    p_show_results_when poll_results_visibility
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_poll_id BIGINT;
    v_snapshot JSONB := NULL;
    v_opt TEXT;
    v_idx INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can create polls';
    END IF;

    IF p_end_at <= p_start_at THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    IF p_strategy = 'ALICUOTA' THEN
        SELECT jsonb_object_agg(id, alicuota) INTO v_snapshot FROM units;
    END IF;

    INSERT INTO polls (
        question, start_at, end_at, weighting_strategy, show_results_when, weight_snapshot_json, created_by, options
    ) VALUES (
        p_question, p_start_at, p_end_at, p_strategy, p_show_results_when, v_snapshot, auth.uid(), '[]'::jsonb
    ) RETURNING id INTO v_poll_id;

    FOREACH v_opt IN ARRAY p_options
    LOOP
        INSERT INTO poll_options (poll_id, option_text, option_index)
        VALUES (v_poll_id, v_opt, v_idx);
        v_idx := v_idx + 1;
    END LOOP;

    RETURN jsonb_build_object('id', v_poll_id, 'status', 'SUCCESS');
END;
$$;

-- Reservation Cancel
CREATE OR REPLACE FUNCTION cancel_reservation(p_reservation_id BIGINT)
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
    SELECT user_id, status, start_at INTO v_res_user_id, v_status, v_start_at
    FROM reservations
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

    UPDATE reservations
    SET status = 'CANCELLED'
    WHERE id = p_reservation_id;

    RETURN jsonb_build_object('status', 'SUCCESS');
END;
$$;
