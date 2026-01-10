
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReservations() {
    console.log('Checking reservations...');
    const { data, error } = await supabase
        .from('reservations')
        .select(`
            id,
            status,
            start_at,
            end_at,
            user_id,
            amenity_id,
            is_system
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reservations:', error);
    } else {
        console.log(`Found ${data?.length} reservations:`);
        data?.forEach(r => {
            console.log(`ID: ${r.id} | Status: ${r.status} | Start: ${r.start_at} | System: ${r.is_system}`);
        });
    }
}

checkReservations();
