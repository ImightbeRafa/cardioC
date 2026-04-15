import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        success: 'public/success.html',
        error: 'public/error.html',
      },
      plugins: [terser()],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
