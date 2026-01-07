
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually to avoid issues
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAmenities() {
    console.log('Fetching amenities...');
    const { data, error } = await supabase
        .from('amenities')
        .select('*');

    if (error) {
        console.error('Error fetching amenities:', error);
        return;
    }

    console.log('Amenities found:', data.length);
    console.log(JSON.stringify(data, null, 2));
}

checkAmenities();
