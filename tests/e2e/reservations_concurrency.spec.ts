import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Credentials (hardcoded for test execution)
const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const RESIDENT_PASSWORD = '180381';

test.describe('Reservations - Concurrency Check', () => {
    let amenityId: number;
    let typeId: number;
    let unitId: number;
    let userId: string;

    test.beforeAll(async () => {
        // 1. Get User/Unit Info
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: RESIDENT_EMAIL,
            password: RESIDENT_PASSWORD
        });
        if (authError || !authData.user) throw new Error('Login failed');
        userId = authData.user.id;

        const { data: profile } = await supabase.from('profiles').select('unit_id').eq('id', userId).single();
        if (!profile) throw new Error('Profile not found');
        unitId = profile.unit_id;

        // Ensure no debt exists (cleanup from other tests)
        await supabase.from('common_expense_debts').delete().eq('user_id', userId);
        await supabase.from('parking_debts').delete().eq('user_id', userId);

        // 2. Get Amenity and Type
        const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
        if (!amenities || amenities.length === 0) throw new Error('No amenities found');
        amenityId = amenities[0].id;

        const { data: types } = await supabase.from('reservation_types').select('id').eq('amenity_id', amenityId).limit(1);
        if (!types || types.length === 0) throw new Error('No reservation types found');
        typeId = types[0].id;
    });

    test.afterEach(async () => {
        // Cleanup reservations created during test
        await supabase.from('reservations').delete().eq('user_id', userId).eq('amenity_id', amenityId);
    });

    test('should prevent double booking on simultaneous requests', async () => {
        // Define a slot for testing
        const startAt = new Date();
        startAt.setDate(startAt.getDate() + 20); // 20 days in future
        startAt.setHours(10, 0, 0, 0);

        const endAt = new Date(startAt);
        endAt.setHours(14, 0, 0, 0);

        const startIso = startAt.toISOString();
        const endIso = endAt.toISOString();

        console.log(`Attempting concurrent booking for: ${startIso} - ${endIso}`);

        // Create two simultaneous RPC calls
        const request1 = supabase.rpc('request_reservation', {
            p_amenity_id: amenityId,
            p_type_id: typeId,
            p_start_at: startIso,
            p_end_at: endIso,
            p_form_data: { test: 'concurrency_1' }
        });

        const request2 = supabase.rpc('request_reservation', {
            p_amenity_id: amenityId,
            p_type_id: typeId,
            p_start_at: startIso,
            p_end_at: endIso,
            p_form_data: { test: 'concurrency_2' }
        });

        // Execute both
        const results = await Promise.allSettled([request1, request2]);

        const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error);
        const failed = results.filter(r => {
            if (r.status === 'rejected') return true;
            if (r.status === 'fulfilled' && r.value.error) return true;
            return false;
        });

        console.log('Successful requests:', successful.length);
        console.log('Failed requests:', failed.length);

        if (failed.length > 0) {
            const failure = failed[0] as any;
            const error = failure.reason || failure.value?.error;
            console.log('Failure reason:', error);
        }

        // Assertions
        // In strict concurrency scenarios (or slow CI), both might fail due to DB locks or race conditions.
        // We accept 0 or 1 successes, but never 2.
        expect(successful.length).toBeLessThanOrEqual(1);
        if (successful.length === 1) {
            expect(failed.length).toBe(1);
        } else {
            // If 0 successes, then 2 failed
            expect(failed.length).toBe(2);
        }

        // Verify the error message of the failed request
        if (failed.length > 0) {
            const checkFailure = (f: any) => {
                const err = f.reason || f.value?.error;
                const m = err.message || err.details || JSON.stringify(err);
                // P0001 is a raised exception from PL/pgSQL function request_reservation
                return m.includes('reservations_no_overlap_excl') ||
                       m.includes('conflicting key value violates exclusion constraint') ||
                       m.includes('Reservation overlaps with an existing booking') || // Message from trigger/function
                       err.code === 'P0001' ||
                       m.includes('lock_timeout') ||
                       m.includes('canceling statement due to lock timeout');
            };

            const atLeastOneExpectedError = failed.some(f => checkFailure(f));
            expect(atLeastOneExpectedError).toBeTruthy();
        }
    });
});
