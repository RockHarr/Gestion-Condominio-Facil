
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
