import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        // Local: la API FastAPI corriendo en el puerto 8000.
        // Nube: cambiar por la URL de Render, ej. 'https://mi-api-llegadas.onrender.com'
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
