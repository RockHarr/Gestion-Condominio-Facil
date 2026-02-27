
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env.local or environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    let output = '';
    const log = (msg: string) => {
        console.log(msg);
        output += msg + '\n';
    };

    log('--- VERIFY AMENITIES ---');
    try {
        const { data, error } = await supabase.from('amenities').select('*');
        if (error) {
            log(`❌ Error fetching amenities: ${error.message}`);
        } else {
            log(`✅ Success! Found ${data.length} amenities.`);
            data.forEach(a => log(` - [${a.id}] ${a.name}`));
        }
    } catch (e: any) {
        log(`❌ Exception: ${e.message}`);
    }

    fs.writeFileSync('verify_output.txt', output);
}

run();
