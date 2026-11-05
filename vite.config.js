import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api-colegio-he1h.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
