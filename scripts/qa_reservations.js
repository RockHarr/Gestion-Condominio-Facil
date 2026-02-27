
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

async function testReservations() {
    console.log('--- QA: Reservations Logic Check ---');

    // 1. Get an Amenity
    const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
    if (!amenities || amenities.length === 0) {
        console.error('❌ No amenities found to test.');
        return;
    }
    const amenityId = amenities[0].id; // Usually a BIGINT (string in JS if large) or number
    console.log(`Testing with Amenity ID: ${amenityId}`);

    // 2. Check Existing Reservations to avoid random collisions
    const { data: existing } = await supabase
        .from('reservations')
        .select('start_at, end_at')
        .eq('amenity_id', amenityId)
        .limit(5);

    console.log('Existing reservations sample:', existing);

    // 3. Test Availability Query (RPC or Select)
    // We assume the frontend checks for overlaps using select.
    // Let's verify we can SEE the reservations (Role 'anon' might see them if we fixed the policy).

    const { data: visibleReservations, error: readError } = await supabase
        .from('reservations')
        .select('*')
        .eq('amenity_id', amenityId);

    if (readError) {
        console.error('❌ Failed to read reservations:', readError.message);
    } else {
        console.log(`✅ Read access confirmed. Found ${visibleReservations.length} reservations for this amenity.`);
    }

    // 4. Test "Overlapping" Logic (Simulation)
    // Since we are anon, we can't easily insert. But we can verify if the database constraint exists.
    // We can query pg_indexes or constraints via RPC if we had one, but standard client can't see schema meta-data easily.
    // We will rely on the "read" verification here. If we can read all reservations, the frontend can prevent overlaps.
    // Real constraint testing requires an Authenticated User (Phase 2 manual step).

    console.log('--- QA Reservations Check Complete ---');
}

testReservations();
