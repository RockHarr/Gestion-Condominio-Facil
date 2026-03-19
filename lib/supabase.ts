/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Access environment variables statically for Vite production builds.
// In Node.js environments (like tests outside Vite), fallback to process.env.
const supabaseUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
    'http://127.0.0.1:54321';

const supabaseAnonKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
    'dummy_key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
