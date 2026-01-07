
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let env = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Could not read .env.local');
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('Checking profiles table...');
    const start = Date.now();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    const duration = Date.now() - start;
    console.log(`Query took ${duration}ms`);

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles fetched successfully:', data?.length);
        if (data && data.length > 0) {
            console.log('Sample profile:', data[0]);
        } else {
            console.log('No profiles found.');
        }
    }
}

checkProfiles();
