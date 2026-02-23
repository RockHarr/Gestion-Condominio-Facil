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

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check .env.local');
}

// Fallback to known demo values to allow E2E tests to run in CI even if env vars are missing
const FALLBACK_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

export const supabase = createClient(supabaseUrl || FALLBACK_URL, supabaseAnonKey || FALLBACK_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
