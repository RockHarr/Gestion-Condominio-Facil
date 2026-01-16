
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

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
