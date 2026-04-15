-- Enums
DO $$ BEGIN
    CREATE TYPE charge_type AS ENUM ('RESERVATION_FEE', 'RESERVATION_DEPOSIT', 'FINE', 'COMMON_EXPENSE', 'PARKING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE charge_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'RELEASED', 'RETAINED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE charge_reference_type AS ENUM ('RESERVATION', 'INCIDENT', 'MONTH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Table charges
CREATE TABLE IF NOT EXISTS public.charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id BIGINT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'CLP',
    type charge_type NOT NULL,
    status charge_status NOT NULL DEFAULT 'PENDING',
    reference_type charge_reference_type NOT NULL,
    reference_id BIGINT NOT NULL, -- reservations.id or incidents.id (BIGINT)
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_charges_unit_status ON public.charges (unit_id, status);
CREATE INDEX IF NOT EXISTS idx_charges_reference ON public.charges (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON public.charges (created_at DESC);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS ux_charges_reservation_fee
    ON public.charges (reference_id, type)
    WHERE reference_type = 'RESERVATION' AND type = 'RESERVATION_FEE';

CREATE UNIQUE INDEX IF NOT EXISTS ux_charges_reservation_deposit
    ON public.charges (reference_id, type)
    WHERE reference_type = 'RESERVATION' AND type = 'RESERVATION_DEPOSIT';

-- Update deposit_decisions
ALTER TABLE public.deposit_decisions
    ADD COLUMN IF NOT EXISTS deposit_charge_id UUID REFERENCES public.charges(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_deposit_decisions_reservation
    ON public.deposit_decisions (reservation_id);

ALTER TABLE public.deposit_decisions
    ADD CONSTRAINT deposit_retained_nonnegative CHECK (retained_amount >= 0);

-- RPC: approve_reservation
CREATE OR REPLACE FUNCTION public.approve_reservation(p_reservation_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unit_id BIGINT;
    v_type_id BIGINT;
    v_fee NUMERIC;
    v_deposit NUMERIC;
BEGIN
    -- Lock row to prevent double approval
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

    -- Get fee/deposit from type
    SELECT fee_amount, deposit_amount
    INTO v_fee, v_deposit
    FROM public.reservation_types
    WHERE id = v_type_id;

    -- Set snapshots + status
    UPDATE public.reservations
    SET status = 'APPROVED_PENDING_PAYMENT',
        fee_snapshot = v_fee,
        deposit_snapshot = v_deposit
    WHERE id = p_reservation_id
        AND status = 'REQUESTED';

    IF NOT FOUND THEN
        -- Was not in REQUESTED status
        RETURN;
    END IF;

    -- Create charges (idempotent via unique index)
    INSERT INTO public.charges (unit_id, amount, type, status, reference_type, reference_id, created_by)
    VALUES (v_unit_id, v_fee, 'RESERVATION_FEE', 'PENDING', 'RESERVATION', p_reservation_id, auth.uid())
    ON CONFLICT DO NOTHING;

    INSERT INTO public.charges (unit_id, amount, type, status, reference_type, reference_id, created_by)
    VALUES (v_unit_id, v_deposit, 'RESERVATION_DEPOSIT', 'PENDING', 'RESERVATION', p_reservation_id, auth.uid())
    ON CONFLICT DO NOTHING;

END $$;

-- Trigger Function: confirm_reservation_payment
CREATE OR REPLACE FUNCTION public.confirm_reservation_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_confirm_reservation_payment ON public.charges;

CREATE TRIGGER trg_confirm_reservation_payment
AFTER UPDATE OF status ON public.charges
FOR EACH ROW
EXECUTE FUNCTION public.confirm_reservation_payment();

-- RLS Policies
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents view own charges" ON public.charges
    FOR SELECT USING (
        unit_id IN (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admin all charges" ON public.charges
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
