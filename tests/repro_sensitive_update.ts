
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Reproduction Script: Sensitive Profile Update ---');

  // 1. Sign in as a regular user (if credentials available, otherwise mock)
  // For this repro, we assume we have a user token or sign in.
  // Replace with valid credentials to test.
  const email = 'resident@example.com';
  const password = 'password123';

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.log('Could not sign in (expected if user does not exist). skipping execution.');
    console.log('Error:', authError.message);
    return;
  }

  const user = authData.user;
  if (!user) return;

  console.log(`Signed in as ${user.email} (${user.id})`);

  // 2. Attempt to update role to 'admin'
  console.log('Attempting to update role to "admin"...');
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'admin' } as any)
    .eq('id', user.id);

  if (roleError) {
    console.log('Role update failed (Good!):', roleError.message);
  } else {
    console.error('CRITICAL: Role update SUCCESSFUL! User is now admin.');
  }

  // 3. Attempt to update 'has_parking' (Financial fraud)
  console.log('Attempting to remove parking (avoid fees)...');
  const { error: parkingError } = await supabase
    .from('profiles')
    .update({ has_parking: false } as any)
    .eq('id', user.id);

  if (parkingError) {
    console.log('Parking update failed (Good!):', parkingError.message);
  } else {
    console.error('CRITICAL: Parking update SUCCESSFUL! User avoided fees.');
  }

    // 4. Attempt to update 'unidad' (Impersonation)
  console.log('Attempting to change unit...');
  const { error: unitError } = await supabase
    .from('profiles')
    .update({ unidad: 'PH-01' } as any)
    .eq('id', user.id);

  if (unitError) {
    console.log('Unit update failed (Good!):', unitError.message);
  } else {
    console.error('CRITICAL: Unit update SUCCESSFUL! User changed unit.');
  }
}

main().catch(console.error);
