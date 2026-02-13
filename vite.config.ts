import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const loadedEnv = loadEnv(mode, '.', '');

  // Merge process.env to include system environment variables (e.g. CI secrets)
  // that might not be in .env files.
  const env = { ...process.env, ...loadedEnv };

  return {
    server: {
      port: 5500,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Explicitly inject Supabase variables to ensure they are available in the client bundle,
      // especially in CI environments where automatic injection might vary.
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
