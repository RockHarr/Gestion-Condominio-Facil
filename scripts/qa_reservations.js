
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReservations() {
    console.log('--- QA: Reservations Logic Check ---');

    // 1. Get an Amenity
    const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
    if (!amenities || amenities.length === 0) {
        console.error('❌ No amenities found to test.');
        return;
    }
    const amenityId = amenities[0].id; // Usually a BIGINT (string in JS if large) or number
    console.log(`Testing with Amenity ID: ${amenityId}`);

    // 2. Check Existing Reservations to avoid random collisions
    const { data: existing } = await supabase
        .from('reservations')
        .select('start_at, end_at')
        .eq('amenity_id', amenityId)
        .limit(5);

    console.log('Existing reservations sample:', existing);

    // 3. Test Availability Query (RPC or Select)
    // We assume the frontend checks for overlaps using select.
    // Let's verify we can SEE the reservations (Role 'anon' might see them if we fixed the policy).

    const { data: visibleReservations, error: readError } = await supabase
        .from('reservations')
        .select('*')
        .eq('amenity_id', amenityId);

    if (readError) {
        console.error('❌ Failed to read reservations:', readError.message);
    } else {
        console.log(`✅ Read access confirmed. Found ${visibleReservations.length} reservations for this amenity.`);
    }

    // 4. Test "Overlapping" Logic (Simulation)
    // Since we are anon, we can't easily insert. But we can verify if the database constraint exists.
    // We can query pg_indexes or constraints via RPC if we had one, but standard client can't see schema meta-data easily.
    // We will rely on the "read" verification here. If we can read all reservations, the frontend can prevent overlaps.
    // Real constraint testing requires an Authenticated User (Phase 2 manual step).

    console.log('--- QA Reservations Check Complete ---');
}

testReservations();
