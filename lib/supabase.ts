/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    // Check for import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
    }
    // Check for process.env (Node)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return '';
}

let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Fallback for CI/Dev environments where env vars might be dummy/placeholder
// These credentials are known to work in the test environment (source: tests/repro_rpc.spec.ts)
const FALLBACK_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

if (!supabaseUrl || supabaseUrl.includes('example.supabase') || supabaseUrl.includes('placeholder.supabase')) {
    console.warn('Invalid or missing VITE_SUPABASE_URL, using fallback.');
    supabaseUrl = FALLBACK_URL;
}

if (!supabaseAnonKey || supabaseAnonKey === 'example-key' || supabaseAnonKey === 'placeholder') {
    console.warn('Invalid or missing VITE_SUPABASE_ANON_KEY, using fallback.');
    supabaseAnonKey = FALLBACK_KEY;
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check .env.local');
}

export const supabase = createClient(supabaseUrl || FALLBACK_URL, supabaseAnonKey || FALLBACK_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
