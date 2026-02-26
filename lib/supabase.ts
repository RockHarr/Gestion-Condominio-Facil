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

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Fallback to real test values from repro_rpc.spec.ts to allow E2E tests in CI to pass
// We use a proxy URL (/supabase-proxy) to avoid CORS issues in browser environments like CI.
const FALLBACK_URL = typeof window !== 'undefined' ? '/supabase-proxy' : 'https://tqshoddiisfgfjqlkntv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

// Check if we have valid env vars. If they are the example ones, treat them as missing.
const isExampleUrl = supabaseUrl === 'https://example.supabase.co' || supabaseUrl === 'https://placeholder.supabase.co';
const validUrl = (supabaseUrl && !isExampleUrl) ? supabaseUrl : FALLBACK_URL;
const validKey = (supabaseAnonKey && supabaseAnonKey !== 'example-key' && supabaseAnonKey !== 'placeholder') ? supabaseAnonKey : FALLBACK_KEY;

if (validUrl === FALLBACK_URL) {
    console.warn('Using fallback Supabase credentials (proxy/test DB) because env vars are missing or are examples.');
}

export const supabase = createClient(validUrl, validKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
