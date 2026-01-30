
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Diagnosing Amenities ---');

    // 1. Direct fetch
    const { data, error } = await supabase.from('amenities').select('*');

    if (error) {
        console.error('Error fetching amenities:', error);
    } else {
        console.log(`Fetched ${data?.length} amenities`);
        console.log('Sample:', data?.[0]);
    }

    // 2. Check RLS (inferred by error or empty data if we know data exists)
    // We can't easily check pg_settings from client, but we can try to insert/update if needed, 
    // but let's stick to read.
}

diagnose();
