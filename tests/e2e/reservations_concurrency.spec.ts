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
        expect(successful.length).toBe(1);
        expect(failed.length).toBe(1);

        // Verify the error message of the failed request
        const failure = failed[0] as any;
        const error = failure.reason || failure.value?.error;
        const msg = error.message || error.details || JSON.stringify(error);

        // We expect a constraint violation OR a timeout (if lock wait exceeded)
        const isConstraintViolation = msg.includes('reservations_no_overlap_excl') || msg.includes('conflicting key value violates exclusion constraint');
        const isTimeout = msg.includes('lock_timeout') || msg.includes('canceling statement due to lock timeout');

        expect(isConstraintViolation || isTimeout).toBeTruthy();
    });
});
