
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tqshoddiisfgfjqlkntv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDepositLogic() {
    console.log('--- QA: Deposit Logic Check ---');

    // 1. Get a resident user
    const { data: users } = await supabase.from('profiles').select('id').eq('role', 'resident').limit(1);
    if (!users || users.length === 0) {
        console.error('No resident user found');
        return;
    }
    const userId = users[0].id;
    console.log(`Using user: ${userId}`);

    // 2. Get an amenity
    const { data: amenities } = await supabase.from('amenities').select('id').limit(1);
    if (!amenities) return;
    const amenityId = amenities[0].id;

    // 3. Create Reservation (Admin)
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1); // Tomorrow
    startAt.setHours(10, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(14, 0, 0, 0);

    console.log('Creating reservation...');
    const { data: resData, error: resError } = await supabase.rpc('create_reservation_as_admin', {
        p_amenity_id: amenityId,
        p_user_id: userId,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString()
    });

    if (resError) {
        console.error('Error creating reservation:', resError);
        return;
    }
    const reservationId = resData;
    console.log(`Reservation created: ${reservationId}`);

    // 4. Pay Charges (Fee + Deposit)
    console.log('Fetching charges...');
    const { data: charges } = await supabase.from('charges').select('*').eq('reference_id', reservationId);

    if (!charges || charges.length === 0) {
        console.error('No charges found');
        return;
    }

    for (const charge of charges) {
        console.log(`Paying charge ${charge.id} (${charge.type})...`);
        const { error: payError } = await supabase.rpc('confirm_charge_payment', {
            p_charge_id: charge.id,
            p_method: 'Transferencia',
            p_note: 'QA Test'
        });
        if (payError) console.error('Error paying charge:', payError);
    }

    // 5. Complete Reservation
    console.log('Marking reservation as COMPLETED...');
    await supabase.from('reservations').update({ status: 'COMPLETED' }).eq('id', reservationId);

    // 6. Test RELEASE
    console.log('Testing decision: RELEASE...');
    // Create another reservation for RELEASE test? 
    // Actually, let's just test RELEASE on this one.
    const { error: decError } = await supabase.rpc('decide_deposit', {
        p_reservation_id: reservationId,
        p_decision: 'RELEASE'
    });

    if (decError) {
        console.error('Error deciding deposit (RELEASE):', decError);
    } else {
        console.log('Deposit RELEASED successfully.');

        // Verify Status
        const { data: updatedCharges } = await supabase.from('charges')
            .select('*')
            .eq('reference_id', reservationId)
            .eq('type', 'RESERVATION_DEPOSIT');

        const deposit = updatedCharges?.[0];
        console.log(`Deposit Status: ${deposit?.status} (Expected: RELEASED)`);
    }

    // --- Scenario 2 could be added here independently ---
}

verifyDepositLogic();
