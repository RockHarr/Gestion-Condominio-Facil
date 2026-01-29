/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    // Priority 1: process.env (Node/Test environment)
    // We check this first because in some test setups, import.meta.env might be present but empty,
    // while process.env has the injected values.
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    // Priority 2: import.meta.env (Vite client environment)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
    }
    return '';
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check .env.local');
}

// Fallback to dummy values to prevent crash if env vars are missing, allowing App to show proper error UI
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
