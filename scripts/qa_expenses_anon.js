
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnonInsert() {
    console.log('--- QA: Security Test - Expense Creation (Anon) ---');
    console.log('Attempting to create an expense as an unauthenticated user...');

    const expense = {
        descripcion: 'HACKER ATTEMPT',
        monto: 999999,
        categoria: 'Otros',
        fecha: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

    if (error) {
        console.log('✅ Security Pass: Insert prevented automatically.');
        console.log('Error details:', error.message, '(Code:', error.code, ')');
    } else {
        console.error('❌ SECURITY ALERT: Anon user successfully created an expense!');
        console.error('Created ID:', data.id);
        // Try to clean up
        await supabase.from('expenses').delete().eq('id', data.id);
    }
}

testAnonInsert();
