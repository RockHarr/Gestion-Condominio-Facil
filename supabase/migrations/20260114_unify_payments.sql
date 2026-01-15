-- Migration: Unify Payment Flow (Charges <-> Payments)
-- Date: 2026-01-14
-- Description: Ensures consistency and idempotency when confirming payments.

BEGIN;

-- 1. Schema Update: Add charge_id to payments
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS charge_id UUID REFERENCES public.charges(id) ON DELETE SET NULL;

-- 2. Guarantee Idempotency: Unique constraint on charge_id
-- We use a partial index if we want to allow existing records without charge_id
-- but for current logic, UNIQUE(charge_id) is enough as it allows multiple NULLs in standard SQL,
-- but PostgreSQL treats NULLs as distinct unless otherwise specified. 
-- However, we want to ensure only ONE payment per charge.
DO $$ BEGIN
    CREATE UNIQUE INDEX ux_payments_charge_id ON public.payments (charge_id) WHERE charge_id IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 3. Optimization: Index for common dashboard filters
CREATE INDEX IF NOT EXISTS idx_payments_periodo_fecha ON public.payments (periodo, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_charges_paid_at ON public.charges (paid_at) WHERE status = 'PAID';

-- 4. RPC: confirm_charge_payment
-- Atomic transaction to mark charge as paid and record in payments.
CREATE OR REPLACE FUNCTION public.confirm_charge_payment(
    p_charge_id UUID,
    p_method TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_charge RECORD;
    v_payment_id BIGINT;
    v_payment_type TEXT;
    v_period TEXT;
BEGIN
    -- 1. Validate Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only admins can confirm payments';
    END IF;

    -- 2. Lock the charge row for atomic update
    SELECT * INTO v_charge
    FROM public.charges
    WHERE id = p_charge_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Charge not found: %', p_charge_id;
    END IF;

    -- 3. Handle Idempotency
    IF v_charge.status = 'PAID' THEN
        -- Check if payment record already exists
        SELECT id INTO v_payment_id
        FROM public.payments
        WHERE charge_id = p_charge_id;

        RETURN jsonb_build_object(
            'success', true,
            'charge_id', p_charge_id,
            'payment_id', v_payment_id,
            'already_paid', true,
            'message', 'El cargo ya fue pagado anteriormente'
        );
    END IF;

    -- 4. Map charge_type to payments.type
    v_payment_type := CASE v_charge.type
        WHEN 'RESERVATION_FEE' THEN 'Reserva'
        WHEN 'RESERVATION_DEPOSIT' THEN 'Reserva'
        WHEN 'FINE' THEN 'Multa'
        WHEN 'COMMON_EXPENSE' THEN 'Gasto Común'
        WHEN 'PARKING' THEN 'Estacionamiento'
        ELSE 'Otro'
    END;

    -- 5. Calculate Period (YYYY-MM)
    v_period := to_char(now(), 'YYYY-MM');

    -- 6. Update Charge
    UPDATE public.charges
    SET status = 'PAID',
        paid_at = now(),
        notes = COALESCE(notes, '') || E'\n---\nPagado via RPC: ' || COALESCE(p_note, '')
    WHERE id = p_charge_id;

    -- 7. Insert into payments
    INSERT INTO public.payments (
        user_id,
        charge_id,
        type,
        periodo,
        monto,
        fecha_pago,
        metodo_pago,
        observacion
    )
    SELECT 
        p.id, -- profiles.id (UUID)
        p_charge_id,
        v_payment_type,
        v_period,
        v_charge.amount::integer, -- payments.monto is integer
        CURRENT_DATE,
        p_method,
        COALESCE(p_note, 'Pago automático vía sistema')
    FROM public.profiles p
    WHERE p.unit_id = v_charge.unit_id
    LIMIT 1 -- Assign to the first profile of the unit if multiple (common for residents)
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'success', true,
        'charge_id', p_charge_id,
        'payment_id', v_payment_id,
        'already_paid', false,
        'message', 'Pago registrado exitosamente'
    );
END;
$$;

COMMIT;
