
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    let output = '';
    const log = (msg: string) => {
        // console.log(msg); 
        output += typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
        output += '\n';
    };

    log('--- FA: Financial Check ---');
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    log(`Period: ${currentMonthStr}`);

    try {
        // 1. Income (Payments)
        const { data: payments, error: payError } = await supabase.from('payments').select('monto').eq('periodo', currentMonthStr);
        if (payError) log(`❌ Payments Error: ${payError.message}`);
        else {
            const total = payments.reduce((acc, p) => acc + p.monto, 0);
            log(`💰 Total Income (Current Month): ${total}`);
        }

        // 2. Expenses
        const { data: expenses, error: expError } = await supabase.from('expenses').select('monto').eq('status', 'Aprobado');
        if (expError) log(`❌ Expenses Error: ${expError.message}`);
        else {
            const total = expenses.reduce((acc, e) => acc + e.monto, 0);
            log(`💸 Total Expenses (All Time Approved): ${total}`);
        }

        // 3. RPC Check
        log('Checking RPC get_financial_kpis...');
        const { data: kpis, error: rpcError } = await supabase.rpc('get_financial_kpis', {
            p_period_start: `${currentMonthStr}-01`,
            p_period_end: `${currentMonthStr}-28`
        });

        if (rpcError) {
            log(`❌ RPC Error: ${rpcError.message}`);
        } else {
            log(`✅ RPC Result: ${JSON.stringify(kpis)}`);
        }

    } catch (e: any) {
        log(`Create Exception: ${e.message}`);
    }

    fs.writeFileSync('financial_output.txt', output);
}

run();
