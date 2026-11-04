# Asisgest – Frontend (SvelteKit 3)

Sistema web para el control de llegadas tarde y alertas escolares
I.E. Técnica Comercial de Ponedera — Briyit Muñoz y Jean de la Hoz

## Ejecutar
1. Tener la API FastAPI corriendo en http://localhost:8000 (`python -m uvicorn main:app --reload`).
2. En esta carpeta:
   ```
   npm install
   npm run dev
   ```
3. Abrir http://localhost:5173

## Estructura (la del profesor: alias `#lib`)
```
src/
├── app.html
├── lib/
│   ├── index.js
│   ├── assets/favicon.svg
│   ├── components/   componentes reutilizables (compartidos por todos los roles)
│   ├── services/     un api_*.js por tabla, URL_BASE = '/api/...'
│   ├── stores/       sesion.js (token, usuario, módulos) y avisos.js
│   └── utils/        formato.js
└── routes/
    ├── +layout.svelte     menú desde moduloxrol y protección de rutas
    ├── login/
    ├── coordinador/       ROL COORDINADOR (Briyit)
    │   ├── llegadas/  historial/  motivos/  reportes/
    ├── admin/             ROL ADMINISTRADOR (Jean)        ← por hacer
    └── rector/            ROL RECTOR (juntos)             ← por hacer
```

## Para agregar las páginas de otro rol
- Crear la carpeta en `src/routes/` (ej. `admin/estudiantes/+page.svelte`).
- La ruta debe coincidir con `ruta_url` de la tabla `modulos` y estar asignada al perfil en `moduloxrol`.
- Reutilizar los componentes de `#lib/components` y los servicios de `#lib/services`.
