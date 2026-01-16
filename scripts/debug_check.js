
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

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
