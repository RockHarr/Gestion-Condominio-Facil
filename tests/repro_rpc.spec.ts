
import { test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESIDENT_EMAIL = 'contacto@rockcode.cl';
const RESIDENT_PASSWORD = '180381';
const ADMIN_EMAIL = 'rockwell.harrison@gmail.com';
const ADMIN_PASSWORD = '270386';

test('repro rpc hang with debt', async () => {
    // 1. Login as Resident to get ID
    console.log('1. Logging in as Resident...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: RESIDENT_EMAIL,
        password: RESIDENT_PASSWORD
    });
    if (authError || !authData.user) {
        console.error('Resident login failed:', authError);
        return;
    }
    const userId = authData.user.id;
    console.log('Resident ID:', userId);
    await supabase.auth.signOut();

    // 2. Login as Admin to insert debt
    console.log('2. Logging in as Admin...');
    const { error: adminError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    if (adminError) {
        console.error('Admin login failed:', adminError);
        return;
    }

    // 3. Insert Debt
    console.log('3. Inserting Debt...');
    // Clean up first to avoid duplicates
    await supabase.from('common_expense_debts').delete().eq('user_id', userId).eq('mes', '2025-01');

    const { error: debtError } = await supabase.from('common_expense_debts').insert({
        user_id: userId,
        mes: '2025-01',
        monto: 50000,
        pagado: false
    });
    if (debtError) {
        console.error('Debt insert failed:', debtError);
        // Proceed anyway, maybe it already exists
    } else {
        console.log('Debt inserted.');
    }
    await supabase.auth.signOut();

    // 4. Login as Resident again to call RPC
    console.log('4. Logging in as Resident again...');
    await supabase.auth.signInWithPassword({
        email: RESIDENT_EMAIL,
        password: RESIDENT_PASSWORD
    });

    // Get a valid amenity and type
    const { data: amenities } = await supabase.from('amenities').select('*').limit(1);
    const amenity = amenities![0];
    const { data: types } = await supabase.from('reservation_types').select('*').eq('amenity_id', amenity.id).limit(1);
    const type = types![0];

    // Prepare dates
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1);
    startAt.setHours(10, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(14, 0, 0, 0);

    console.log('5. Calling request_reservation RPC (Expect Error)...');
    const startTime = Date.now();

    const rpcPromise = supabase.rpc('request_reservation', {
        p_amenity_id: amenity.id,
        p_type_id: type.id,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString(),
        p_form_data: {}
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('RPC Timeout')), 10000));

    try {
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        const duration = Date.now() - startTime;
        console.log(`RPC returned in ${duration}ms`);

        if (error) {
            console.log('RPC Error (Expected):', error.message);
        } else {
            console.error('RPC Success (Unexpected):', data);
        }
    } catch (e) {
        console.error('RPC Call Failed/Timed out:', e);
    }

    // Cleanup
    console.log('6. Cleanup...');
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    await supabase.from('common_expense_debts').delete().eq('user_id', userId).eq('mes', '2025-01');
});
