import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/notificaciones/';

export async function obtenerNotificaciones() {
  return await getJSON(URL_BASE);
}

export async function obtenerNotificacionPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearNotificacion(notificacion) {
  return await enviarJSON(URL_BASE, 'POST', notificacion);
}

export async function actualizarNotificacion(id, notificacion) {
  return await enviarJSON(URL_BASE + id, 'PUT', notificacion);
}

export async function eliminarNotificacion(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
