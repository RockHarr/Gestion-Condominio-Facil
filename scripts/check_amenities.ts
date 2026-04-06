
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

async function checkAmenities() {
    console.log('Checking amenities...');
    const { data, error } = await supabase.from('amenities').select('*');

    if (error) {
        console.error('Error fetching amenities:', error);
    } else {
        console.log('Amenities found:', data?.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkAmenities();
