
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const RESIDENT_PASSWORD = '180381';

async function main() {
    console.log('1. Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: RESIDENT_EMAIL,
        password: RESIDENT_PASSWORD
    });

    if (authError || !authData.user) {
        console.error('Login failed:', authError);
        return;
    }
    console.log('Logged in as:', authData.user.id);

    // Get a valid amenity and type
    console.log('2. Fetching amenity...');
    const { data: amenities } = await supabase.from('amenities').select('*').limit(1);
    if (!amenities || amenities.length === 0) {
        console.error('No amenities found');
        return;
    }
    const amenity = amenities[0];
    console.log('Amenity:', amenity.name, amenity.id);

    console.log('3. Fetching reservation type...');
    const { data: types } = await supabase.from('reservation_types').select('*').eq('amenity_id', amenity.id).limit(1);
    if (!types || types.length === 0) {
        console.error('No types found for amenity');
        return;
    }
    const type = types[0];
    console.log('Type:', type.name, type.id);

    // Prepare dates
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1); // Tomorrow
    startAt.setHours(10, 0, 0, 0);

    const endAt = new Date(startAt);
    endAt.setHours(14, 0, 0, 0);

    console.log('4. Calling request_reservation RPC...');
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('request_reservation', {
        p_amenity_id: amenity.id,
        p_type_id: type.id,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString(),
        p_form_data: {}
    });

    const duration = Date.now() - startTime;
    console.log(`RPC returned in ${duration}ms`);

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success:', data);
    }
}

main().catch(console.error);
