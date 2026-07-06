
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Amenities ---');
    const { data: amenities, error: amenError } = await supabase.from('amenities').select('*');
    if (amenError) {
        console.error('Error fetching amenities:', amenError);
    } else {
        console.log(`Success: Found ${amenities.length} amenities.`);
        console.log(JSON.stringify(amenities, null, 2));
    }

    console.log('\n--- Checking Reservations ---');
    const { data: reservations, error: resError } = await supabase.from('reservations').select('*');
    if (resError) {
        console.error('Error fetching reservations:', resError);
    } else {
        console.log(`Success: Found ${reservations.length} reservations.`);
    }
}

check();
