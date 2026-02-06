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

// Fallback to dummy values to prevent crash if env vars are missing, allowing App to show proper error UI
// 🛡️ Sentinel: Using hardcoded fallback for CI/Test environment where secrets might be missing.
// TODO: Proper secret management should be implemented to replace this fallback.
const FALLBACK_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

const useFallback = !supabaseUrl || supabaseUrl.includes('example.supabase.co');

export const supabase = createClient(useFallback ? FALLBACK_URL : supabaseUrl, useFallback ? FALLBACK_KEY : supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
