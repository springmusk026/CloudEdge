import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  base: '/admin/',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 3001, proxy: { '/api': 'http://localhost:8787' } },
});
