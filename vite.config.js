import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const TARGET_RENDER = 'https://api-colegio-he1h.onrender.com';

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
  plugins: [
    limpiarCacheRedirecciones,
    sveltekit({
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: 'index.html',
        precompress: false,
        strict: false
      })
    })
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api-correo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-correo/, '')
      },
      '/api': {
        target: TARGET_RENDER,
        changeOrigin: true,
        secure: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
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
