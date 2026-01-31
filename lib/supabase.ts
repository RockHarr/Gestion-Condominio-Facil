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

const fallbackUrl = 'https://tqshoddiisfgfjqlkntv.supabase.co';
// Masked key for security in logs, but full key in usage
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

// Check if the URL is a dummy placeholder from .env.example or unconfigured .env
const isDummy = (url: string) => !url || url.includes('example.supabase.co') || url.includes('placeholder.supabase.co');

const supabaseUrl = !isDummy(envUrl) ? envUrl : fallbackUrl;
const supabaseAnonKey = (envKey && envKey !== 'example-key' && envKey !== 'placeholder') ? envKey : fallbackKey;

if (isDummy(envUrl)) {
    console.warn('Supabase: Environment variables missing or dummy. Using fallback test credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
