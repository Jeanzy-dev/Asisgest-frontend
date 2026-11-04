import { obtenerToken, cerrarSesion } from '#lib/stores/sesion.js';

// En local queda vacío: las rutas '/api/...' las reenvía el proxy de Vite a FastAPI.
// En la nube (Vercel/Netlify): variable VITE_API_URL con la dirección de la API en Render.
export const API = import.meta.env.VITE_API_URL || '';

// Cabeceras comunes: JSON + token JWT de la sesión
function cabeceras() {
  const token = obtenerToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// Revisa la respuesta y la convierte a objeto JavaScript
export async function procesarRespuesta(respuesta) {
  if (respuesta.status === 401 && !respuesta.url.includes('/auth/login')) {
    // Token vencido o inválido: se cierra la sesión y se vuelve al login
    cerrarSesion();
    window.location.href = '/login';
    throw new Error('La sesión expiró, ingrese de nuevo');
  }
  if (!respuesta.ok) {
    let detalle = respuesta.statusText;
    try {
      const cuerpo = await respuesta.json();
      if (typeof cuerpo.detail === 'string') detalle = cuerpo.detail;
      else if (Array.isArray(cuerpo.detail)) detalle = 'Revise los datos del formulario';
    } catch {
      // la respuesta no traía JSON
    }
    throw new Error(detalle);
  }
  return await respuesta.json();
}

// Funciones genéricas que usan todos los servicios
export async function getJSON(ruta) {
  const respuesta = await fetch(API + ruta, { headers: cabeceras() });
  return await procesarRespuesta(respuesta);
}

export async function enviarJSON(ruta, metodo, datos) {
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: cabeceras(),
    body: datos === undefined ? undefined : JSON.stringify(datos)
  });
  return await procesarRespuesta(respuesta);
}
