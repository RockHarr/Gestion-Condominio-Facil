
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Verifying Reservations (Simple) ---');
    // 1. Count
    const { count, error: countError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Count Error:', countError);
    else console.log('Total Rows:', count);

    // 2. Fetch last one raw
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) console.error('Fetch Error:', error);
    else console.log('Last Reservation:', data);
}

verify();
