import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 5500,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // Security: Do not expose secrets via define. Use import.meta.env for public vars.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
