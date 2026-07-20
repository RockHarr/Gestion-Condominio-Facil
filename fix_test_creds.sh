for file in tests/e2e/*.spec.ts tests/*.ts; do
  if [ -f "$file" ]; then
    sed -i "s/const SUPABASE_URL = 'https:\/\/tqshoddiisfgfjqlkntv.supabase.co';/const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http:\/\/127.0.0.1:54321';/" "$file"
    sed -i "s/const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2hvZGRpaXNmZ2ZqcWxrbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODQzMTAsImV4cCI6MjA4MjI2MDMxMH0.eiD6ZgiBU3Wsj9NfJoDtX3J9wHHxOVCINLoeULZJEYc';/const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';/" "$file"
  fi
done
