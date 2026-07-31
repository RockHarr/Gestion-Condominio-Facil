const fs = require('fs');
let yml = fs.readFileSync('.github/workflows/playwright.yml', 'utf8');
yml = yml.replace(
  'VITE_SUPABASE_URL: "http://127.0.0.1:54321"\n          VITE_SUPABASE_ANON_KEY: "dummy-key-for-build"',
  'VITE_SUPABASE_URL: "https://tqshoddiisfgfjqlkntv.supabase.co"\n          VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc"'
);
yml = yml.replace(
  'VITE_SUPABASE_URL: "http://127.0.0.1:54321"\n          VITE_SUPABASE_ANON_KEY: "dummy-key-for-build"',
  'VITE_SUPABASE_URL: "https://tqshoddiisfgfjqlkntv.supabase.co"\n          VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc"'
);
fs.writeFileSync('.github/workflows/playwright.yml', yml);
