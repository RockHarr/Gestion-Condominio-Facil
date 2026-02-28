/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely handling Vite vs Node
const getSupabaseConfig = () => {
    // SECURITY: Using hardcoded fallback for CI/Demo purposes as these are already exposed in tests (repro_rpc.spec.ts).
    const CI_URL = 'https://tqshoddiisfgfjqlkntv.supabase.co';
    const CI_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';

    // Try Vite import.meta.env (Static replacement works best with direct property access)
    // We use logical OR to fallback if empty string or undefined
    let url = import.meta.env.VITE_SUPABASE_URL || CI_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY || CI_KEY;

    // Fix: If .env file with dummy values ("example.supabase.co") is present during build,
    // it overrides the undefined check but breaks the app. We must reject known dummy domains.
    if (url.includes('example.supabase.co') || url.includes('placeholder.supabase.co')) {
        console.warn('Detected dummy Supabase URL from .env, using CI fallback.');
        url = CI_URL;
        key = CI_KEY;
    }

    return { url, key };
};

const config = getSupabaseConfig();

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn('Missing VITE_SUPABASE_URL, using fallback for CI/Demo.');
}

export const supabase = createClient(config.url, config.key, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
