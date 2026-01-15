-- Verification Script: confirm_charge_payment idempotency
-- Instructions: Run in SQL Editor.

-- 1. Setup Admin Context (Simulated)
DO $$
DECLARE v_admin UUID;
BEGIN
  SELECT id INTO v_admin FROM public.profiles WHERE role='admin' LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE NOTICE 'No admin user found. Creating dummy admin...';
    -- This might fail if auth.users is constrained, skip if possible or use a known ID
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

-- 2. Test Execution
DO $$
DECLARE
    v_unit_id BIGINT;
    v_charge_id UUID;
    v_res1 JSONB;
    v_res2 JSONB;
    v_payment_count INTEGER;
BEGIN
    -- Get a unit
    SELECT id INTO v_unit_id FROM public.units LIMIT 1;
    
    -- Create a PENDING charge
    INSERT INTO public.charges (unit_id, amount, type, status, reference_type, reference_id)
    VALUES (v_unit_id, 1000, 'FINE', 'PENDING', 'INCIDENT', 9999)
    RETURNING id INTO v_charge_id;

    RAISE NOTICE 'Created charge: %', v_charge_id;

    -- Call RPC first time
    SELECT public.confirm_charge_payment(v_charge_id, 'Transferencia', 'Primer intento') INTO v_res1;
    RAISE NOTICE 'First call result: %', v_res1;

    -- Call RPC second time (Idempotency check)
    SELECT public.confirm_charge_payment(v_charge_id, 'Transferencia', 'Segundo intento') INTO v_res2;
    RAISE NOTICE 'Second call result: %', v_res2;

    -- Verify payment count
    SELECT count(*) INTO v_payment_count FROM public.payments WHERE charge_id = v_charge_id;
    
    IF v_payment_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Only 1 payment record created.';
    ELSE
        RAISE EXCEPTION 'FAILURE: % payment records created!', v_payment_count;
    END IF;

    -- Verify charge status
    IF (SELECT status FROM public.charges WHERE id = v_charge_id) = 'PAID' THEN
        RAISE NOTICE 'SUCCESS: Charge status is PAID.';
    ELSE
        RAISE EXCEPTION 'FAILURE: Charge status is NOT PAID!';
    END IF;

    -- Cleanup (Implicitly done if we wrapped in a transaction, but let's be explicit if running in editor)
    -- DELETE FROM public.payments WHERE charge_id = v_charge_id;
    -- DELETE FROM public.charges WHERE id = v_charge_id;
    
    RAISE NOTICE 'Verification completed successfully.';
END $$;
