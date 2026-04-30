import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth':     { target: 'http://localhost:3000', changeOrigin: true },
      '/rides':    { target: 'http://localhost:3000', changeOrigin: true },
      '/bookings': { target: 'http://localhost:3000', changeOrigin: true },
      '/users':    { target: 'http://localhost:3000', changeOrigin: true },
      '/admin':    { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
