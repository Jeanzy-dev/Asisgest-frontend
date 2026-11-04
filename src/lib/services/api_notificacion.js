import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/notificaciones/';

// GET /notificaciones/  -> lista de registros activos
export async function obtenerNotificaciones() {
  return await getJSON(URL_BASE);
}

// GET /notificaciones/{id}  -> un registro
export async function obtenerNotificacionPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /notificaciones/  -> crea un registro
export async function crearNotificacion(notificacion) {
  return await enviarJSON(URL_BASE, 'POST', notificacion);
}

// PUT /notificaciones/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarNotificacion(id, notificacion) {
  return await enviarJSON(URL_BASE + id, 'PUT', notificacion);
}

// DELETE /notificaciones/{id}  -> borrado lógico (estado = false)
export async function eliminarNotificacion(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
