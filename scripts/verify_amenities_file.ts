
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tqshoddiisfgfjqlkntv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

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
