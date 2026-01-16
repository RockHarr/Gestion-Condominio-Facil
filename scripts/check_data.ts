
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('Error loading .env.local', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking amenities...');
    const { data: amenities, error: amenError } = await supabase
        .from('amenities')
        .select('*');

    if (amenError) {
        console.error('Error fetching amenities:', amenError);
    } else {
        console.log(`Found ${amenities?.length} amenities`);
        amenities?.forEach(a => console.log(`- ${a.name} (Capacity: ${a.capacity})`));
    }

    console.log('\nChecking reservation types...');
    const { data: types, error: typeError } = await supabase
        .from('reservation_types')
        .select('*, amenity:amenities(name)');

    if (typeError) {
        console.error('Error fetching reservation types:', typeError);
    } else {
        console.log(`Found ${types?.length} reservation types`);
        types?.forEach(t => console.log(`- ${t.name} for ${(t.amenity as any)?.name} ($${t.fee_amount})`));
    }
    console.log('\nChecking reservations...');
    const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*');

    if (resError) {
        console.error('Error fetching reservations:', resError);
    } else {
        console.log(`Found ${reservations?.length} reservations`);
    }
}

checkData();
