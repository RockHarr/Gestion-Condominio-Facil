
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.warn('Error loading .env.local', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env.local or environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Amenities ---');
    const { data: amenities, error: amenError } = await supabase.from('amenities').select('*');
    if (amenError) {
        console.error('Error fetching amenities:', amenError);
    } else {
        console.log(`Success: Found ${amenities.length} amenities.`);
        // console.log(JSON.stringify(amenities, null, 2));
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
