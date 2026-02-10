/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Fallback to credentials that work for CI/Demo (from repro_rpc.spec.ts)
const FALLBACK_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const getSupabaseConfig = () => {
    let url = '';
    let key = '';

    // 1. Try Vite Env (Explicit access for static replacement)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        url = import.meta.env.VITE_SUPABASE_URL || '';
        key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    }

    // 2. Try Process Env (Node fallback)
    if (!url && typeof process !== 'undefined' && process.env) {
        url = process.env.VITE_SUPABASE_URL || '';
        key = process.env.VITE_SUPABASE_ANON_KEY || '';
    }

    // 3. Validate against dummy values commonly found in .env examples
    const isDummy = (val: string) => !val || val.includes('example.supabase.co') || val.includes('placeholder') || val === 'undefined';

    if (isDummy(url) || isDummy(key)) {
        console.warn('Invalid or missing Supabase credentials detected. Switching to CI/Demo fallback.');
        return { url: FALLBACK_URL, key: FALLBACK_KEY };
    }

    return { url, key };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
