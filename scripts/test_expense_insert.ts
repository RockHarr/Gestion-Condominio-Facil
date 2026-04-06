
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// To test RLS failure for admin action, we really need the service_role key to bypass, 
// OR we need to sign in as an admin user.
// However, the user said "me salio error", presumably from the UI.
// The UI uses the anon key but with an authenticated session.
// We can't easily simulate a full auth session here without credentials.
// BUT, if we use the service_role key (if available), we can check if the INSERT works at a DB level.
// If it works with service_role, it's likely an RLS or Auth issue.
// If it fails with service_role, it's a Schema issue.

// Let's try to find SERVICE_ROLE key in .env.local if possible, otherwise use ANON and see (will likely fail RLS).
// The user likely has a SERVICE_ROLE key for admin scripts.

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('Missing Supabase URL');
    process.exit(1);
}

const keyToUse = supabaseServiceKey || supabaseKey;
console.log(`Using key: ${keyToUse === supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON'}`);

if (!keyToUse) {
    console.error('Missing Supabase Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, keyToUse);

async function testInsert() {
    console.log('Attempting to insert expense...');

    const expense = {
        descripcion: 'Test Expense Script',
        monto: 15000,
        categoria: 'Otros',
        proveedor: 'Test Provider',
        numero_documento: '123456',
        evidencia_url: 'http://example.com/doc.pdf',
        status: 'En Revision',
        fecha: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

    if (error) {
        console.error('INSERT FAILED:');
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS:', data);
        // Clean up
        await supabase.from('expenses').delete().eq('id', data.id);
    }
}

testInsert();
