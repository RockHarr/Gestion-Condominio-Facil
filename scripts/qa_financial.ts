
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

async function testFinancials() {
    console.log('--- QA: Financial Module Check ---');

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
    console.log(`Period: ${currentMonthStr}`);

    // 1. Calculate Expected Income (Payments)
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('monto');

    if (payError) {
        console.error('❌ Error fetching payments:', payError);
    } else {
        const totalIncome = payments.reduce((sum, p) => sum + p.monto, 0);
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
        const totalExpenses = expenses.reduce((sum, e) => sum + e.monto, 0);
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
        console.log('✅ RPC Success. Result:', kpis);
    }

    // 4. Simulate Close Month (Debt Generation)
    console.log('\n--- Simulation: Month Closing ---');
    const { data: residents } = await supabase.from('profiles').select('id, alicuota, has_parking').eq('role', 'resident');
    const { data: settings } = await supabase.from('community_settings').select('*').single();

    if (!residents || !settings) {
        console.warn('Skipping simulation (missing data).');
    } else {
        const parkingCost = settings.parking_cost_amount || 0;
        console.log(`Residents count: ${residents.length}`);
        console.log(`Parking Cost: ${parkingCost}`);

        // Mock expense total for simulation
        const mockTotalExpense = 1000000;
        console.log(`Simulating with Total Expenses: $${mockTotalExpense}`);

        residents.slice(0, 3).forEach(r => {
            const alicuota = r.alicuota || 0;
            const debt = Math.round((mockTotalExpense * alicuota) / 100);
            console.log(` - User ${r.id.slice(0, 8)}... | Alicuota: ${alicuota}% | Calc Debt: $${debt} | Parking: ${r.has_parking ? '$' + parkingCost : '$0'}`);
        });
    }
}

testFinancials();
