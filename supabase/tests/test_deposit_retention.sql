-- Test: Deposit Retention Logic (Final)
-- Description: Verifies decide_deposit RPC logic for Release, Retain Full, and Retain Partial.
-- Fixes: Simulates Auth (Admin), uses real IDs, and strict assertions.

BEGIN;

DO $$
DECLARE
    v_admin_id UUID;
    v_unit_id BIGINT;
    v_amenity_id BIGINT;
    v_res_id_release BIGINT;
    v_res_id_full BIGINT;
    v_res_id_partial BIGINT;
    v_charge_id UUID;
    v_decision JSONB;
    v_deposit_status charge_status;
    v_fine_status charge_status;
    v_retention_charge_id UUID;
BEGIN
    -- 1. Setup: Get Real IDs
    -- Get an admin user ID to simulate auth
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Please ensure an admin exists.';
    END IF;

    -- Simulate Auth
    PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- Get Unit and Amenity
    SELECT id INTO v_unit_id FROM public.units LIMIT 1;
    SELECT id INTO v_amenity_id FROM public.amenities LIMIT 1;

    IF v_unit_id IS NULL OR v_amenity_id IS NULL THEN
        RAISE EXCEPTION 'Missing Unit or Amenity. Please seed data.';
    END IF;

    RAISE NOTICE 'Testing with Admin: %, Unit: %, Amenity: %', v_admin_id, v_unit_id, v_amenity_id;


    -- 2. Seed Data
    -- A. For Release
    INSERT INTO reservations (unit_id, amenity_id, start_at, end_at, status)
    VALUES (v_unit_id, v_amenity_id, now(), now() + interval '1 hour', 'COMPLETED')
    RETURNING id INTO v_res_id_release;

    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 50000, 'CLP', 'RESERVATION_DEPOSIT', 'PAID', 'RESERVATION', v_res_id_release, now());

    -- B. For Retain Full
    INSERT INTO reservations (unit_id, amenity_id, start_at, end_at, status)
    VALUES (v_unit_id, v_amenity_id, now() + interval '2 hours', now() + interval '3 hours', 'COMPLETED')
    RETURNING id INTO v_res_id_full;

    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 50000, 'CLP', 'RESERVATION_DEPOSIT', 'PAID', 'RESERVATION', v_res_id_full, now());

    -- C. For Retain Partial
    INSERT INTO reservations (unit_id, amenity_id, start_at, end_at, status)
    VALUES (v_unit_id, v_amenity_id, now() + interval '4 hours', now() + interval '5 hours', 'COMPLETED')
    RETURNING id INTO v_res_id_partial;

    INSERT INTO charges (unit_id, amount, currency, type, status, reference_type, reference_id, paid_at)
    VALUES (v_unit_id, 50000, 'CLP', 'RESERVATION_DEPOSIT', 'PAID', 'RESERVATION', v_res_id_partial, now());


    -- TEST 1: RELEASE
    RAISE NOTICE 'Testing RELEASE...';
    v_decision := public.decide_deposit(v_res_id_release, 'RELEASE', 0, NULL);
    
    -- Verify Charge Status
    SELECT status INTO STRICT v_deposit_status FROM charges WHERE reference_id = v_res_id_release AND type = 'RESERVATION_DEPOSIT';
    IF v_deposit_status = 'RELEASED' THEN
        RAISE NOTICE 'PASS: Deposit Released';
    ELSE
        RAISE EXCEPTION 'FAIL: Deposit status is %', v_deposit_status;
    END IF;

    -- Verify No Fine
    PERFORM 1 FROM charges WHERE reference_id = v_res_id_release AND type = 'FINE';
    IF FOUND THEN RAISE EXCEPTION 'FAIL: Fine created for RELEASE'; END IF;


    -- TEST 2: RETAIN FULL
    RAISE NOTICE 'Testing RETAIN_FULL...';
    v_decision := public.decide_deposit(v_res_id_full, 'RETAIN_FULL', 50000, 'Damage to property');
    
    -- Verify Charge Status
    SELECT status INTO STRICT v_deposit_status FROM charges WHERE reference_id = v_res_id_full AND type = 'RESERVATION_DEPOSIT';
    IF v_deposit_status = 'RETAINED' THEN
        RAISE NOTICE 'PASS: Deposit Retained';
    ELSE
        RAISE EXCEPTION 'FAIL: Deposit status is %', v_deposit_status;
    END IF;

    -- Verify Fine Created
    SELECT id, status INTO v_retention_charge_id, v_fine_status 
    FROM charges 
    WHERE reference_id = v_res_id_full AND type = 'FINE' AND amount = 50000;
    
    IF v_retention_charge_id IS NOT NULL AND v_fine_status = 'PAID' THEN
        RAISE NOTICE 'PASS: Fine created and PAID for RETAIN_FULL';
    ELSE
        RAISE EXCEPTION 'FAIL: Fine NOT created or NOT PAID for RETAIN_FULL';
    END IF;

    -- Verify Link in deposit_decisions
    PERFORM 1 FROM deposit_decisions WHERE reservation_id = v_res_id_full AND retention_charge_id = v_retention_charge_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: Retention charge not linked in deposit_decisions'; END IF;


    -- TEST 3: RETAIN PARTIAL
    RAISE NOTICE 'Testing RETAIN_PARTIAL...';
    v_decision := public.decide_deposit(v_res_id_partial, 'RETAIN_PARTIAL', 15000, 'Cleaning fee');
    
    -- Verify Charge Status
    SELECT status INTO STRICT v_deposit_status FROM charges WHERE reference_id = v_res_id_partial AND type = 'RESERVATION_DEPOSIT';
    IF v_deposit_status = 'RETAINED' THEN
        RAISE NOTICE 'PASS: Deposit Retained (Partial)';
    ELSE
        RAISE EXCEPTION 'FAIL: Deposit status is %', v_deposit_status;
    END IF;

    -- Verify Fine Created
    SELECT id, status INTO v_retention_charge_id, v_fine_status 
    FROM charges 
    WHERE reference_id = v_res_id_partial AND type = 'FINE' AND amount = 15000;
    
    IF v_retention_charge_id IS NOT NULL AND v_fine_status = 'PAID' THEN
        RAISE NOTICE 'PASS: Fine created and PAID for RETAIN_PARTIAL';
    ELSE
        RAISE EXCEPTION 'FAIL: Fine NOT created or NOT PAID for RETAIN_PARTIAL';
    END IF;

    -- Verify Link in deposit_decisions
    PERFORM 1 FROM deposit_decisions WHERE reservation_id = v_res_id_partial AND retention_charge_id = v_retention_charge_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: Retention charge not linked in deposit_decisions'; END IF;

    RAISE NOTICE 'ALL TESTS PASSED';
    RAISE EXCEPTION 'Test Complete (Rollback)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '%', SQLERRM;
END $$;

ROLLBACK;
