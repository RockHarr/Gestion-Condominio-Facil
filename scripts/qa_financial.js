
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinancials() {
    console.log('--- QA: Financial Module Check (JS) ---');

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
    console.log(`Period: ${currentMonthStr}`);

    // 1. Calculate Expected Income (Payments)
    // "Cash Flow" comes from payments table
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('monto');

    if (payError) {
        console.error('❌ Error fetching payments:', payError);
    } else {
        const totalIncome = payments ? payments.reduce((sum, p) => sum + p.monto, 0) : 0;
        console.log(`💰 Manual Calculation - Total Income (All Time): $${totalIncome}`);
    }

    // 2. Calculate Expected Expenses (Approved)
    const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('monto')
        .eq('status', 'Aprobado'); // Assuming strictly 'Aprobado'

    if (expError) {
        console.error('❌ Error fetching expenses:', expError);
    } else {
        const totalExpenses = expenses ? expenses.reduce((sum, e) => sum + e.monto, 0) : 0;
        console.log(`💸 Manual Calculation - Total Expenses (Approved): $${totalExpenses}`);
    }

    // 3. Test RPC 'get_financial_kpis'
    console.log('\nTesting RPC: get_financial_kpis...');
    const { data: kpis, error: rpcError } = await supabase
        .rpc('get_financial_kpis', {
            p_period_start: `${currentMonthStr}-01`,
            p_period_end: `${currentMonthStr}-31`
        });

    if (rpcError) {
        console.error('❌ RPC Failed:', rpcError.message);
        console.warn('⚠️ If this RPC is missing, the Dashboard will not show graphs correctly.');
    } else {
        console.log('✅ RPC Success. Result:', JSON.stringify(kpis, null, 2));
    }
}

testFinancials();
