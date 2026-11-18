import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const TARGET_RENDER = 'https://api-colegio-he1h.onrender.com';
const TARGET_EXPRESS = process.env.VITE_EMAIL_API_URL || 'http://127.0.0.1:3000';

// Plugin para limpiar redirecciones antiguas en caché del navegador (ej. estudiantes-backend-pye7.onrender.com)
const limpiarCacheRedirecciones = {
  name: 'limpiar-cache-redirecciones',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      if (req.url === '/' || req.url?.startsWith('/admin') || req.url?.startsWith('/coordinador') || req.url?.startsWith('/login')) {
        res.setHeader('Clear-Site-Data', '"cache"');
      }
      next();
    });
  }
};

export default defineConfig({
  plugins: [limpiarCacheRedirecciones, sveltekit()],
  server: {
    proxy: {
      '/api-correo': {
        target: TARGET_EXPRESS,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-correo/, '')
      },
      '/api/correos': {
        target: TARGET_EXPRESS,
        changeOrigin: true
      },
      '/api/envios': {
        target: TARGET_EXPRESS,
        changeOrigin: true
      },
      '/api/plantillas': {
        target: TARGET_EXPRESS,
        changeOrigin: true
      },
      '/api/logs': {
        target: TARGET_EXPRESS,
        changeOrigin: true
      },
      '/api': {
        target: TARGET_RENDER,
        changeOrigin: true,
        secure: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Si FastAPI en Render devuelve un Location absoluto, lo convertimos a ruta relativa local
            // para evitar redirecciones cross-origin que disparen errores de CORS en el navegador.
            const loc = proxyRes.headers['location'];
            if (loc && loc.startsWith(TARGET_RENDER)) {
              proxyRes.headers['location'] = loc.slice(TARGET_RENDER.length) || '/';
            }
            proxyRes.headers['cache-control'] = 'no-store';
          });
        }
      }
    }
  }
});
