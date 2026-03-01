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

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if env vars are missing or are dummy/placeholder values
const isDummyUrl = !envUrl || envUrl.includes('example.supabase.co') || envUrl.includes('placeholder');

const supabaseUrl = isDummyUrl ? 'https://tqshoddiisfgfjqlkntv.supabase.co' : envUrl;
const supabaseAnonKey = isDummyUrl ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc' : envKey;

if (isDummyUrl) {
    console.warn('Using Demo Supabase credentials because environment variables are missing or placeholders.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
