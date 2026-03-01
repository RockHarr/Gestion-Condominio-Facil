/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnvUrl = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) {
        return import.meta.env.VITE_SUPABASE_URL;
    }
    if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) {
        return process.env.VITE_SUPABASE_URL;
    }
    return '';
};

const getEnvKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return import.meta.env.VITE_SUPABASE_ANON_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) {
        return process.env.VITE_SUPABASE_ANON_KEY;
    }
    return '';
};

const supabaseUrl = getEnvUrl();
const supabaseAnonKey = getEnvKey();

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
