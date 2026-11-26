import { obtenerToken, cerrarSesion } from '#lib/stores/sesion.js';

export const RENDER_API_URL = 'https://api-colegio-he1h.onrender.com';

export function esEntornoMovilONube() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor !== undefined) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') return true;
  return window.location.port !== '5173';
}

export function obtenerUrlApi() {
  if (typeof window !== 'undefined') {
    const personalizada = localStorage.getItem('asisgest_api_url');
    if (personalizada && personalizada.trim()) {
      return personalizada.trim().replace(/\/+$/, '');
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/+$/, '');
  }

  if (esEntornoMovilONube()) {
    return RENDER_API_URL;
  }
  return '';
}

export const API = obtenerUrlApi();

export function cabeceras() {
  const token = obtenerToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

export async function procesarRespuesta(respuesta) {
  if (respuesta.status === 401 && !respuesta.url.includes('/auth/login')) {
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

    }
    throw new Error(detalle || `Error HTTP ${respuesta.status}`);
  }
  return await respuesta.json();
}

export async function getJSON(ruta) {
  const base = obtenerUrlApi();
  let respuesta;
  try {
    respuesta = await fetch(base + ruta, {
      method: 'GET',
      headers: cabeceras(),
      cache: 'no-store'
    });
  } catch (err) {
    if (base !== RENDER_API_URL) {
      respuesta = await fetch(RENDER_API_URL + ruta, {
        method: 'GET',
        headers: cabeceras(),
        cache: 'no-store'
      });
    } else {
      throw err;
    }
  }
  return await procesarRespuesta(respuesta);
}

export async function enviarJSON(ruta, metodo, datos) {
  const base = obtenerUrlApi();
  const opciones = {
    method: metodo,
    headers: cabeceras(),
    cache: 'no-store',
    body: datos === undefined ? undefined : JSON.stringify(datos)
  };
  let respuesta;
  try {
    respuesta = await fetch(base + ruta, opciones);
  } catch (err) {
    if (base !== RENDER_API_URL) {
      respuesta = await fetch(RENDER_API_URL + ruta, opciones);
    } else {
      throw err;
    }
  }
  return await procesarRespuesta(respuesta);
}
