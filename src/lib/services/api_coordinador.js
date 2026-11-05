import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/coordinador/';

// GET /coordinador/  -> lista de coordinadores activos (con nombre_completo y correo)
export async function obtenerCoordinadores() {
  return await getJSON(URL_BASE);
}

// GET /coordinador/{id}  -> un coordinador
export async function obtenerCoordinadorPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /coordinador/  -> crea un registro de coordinador vinculado a id_usuario
export async function crearCoordinador(coordinador) {
  return await enviarJSON(URL_BASE, 'POST', coordinador);
}

// PUT /coordinador/{id}  -> actualiza un coordinador
export async function actualizarCoordinador(id, coordinador) {
  return await enviarJSON(URL_BASE + id, 'PUT', coordinador);
}

// DELETE /coordinador/{id}  -> borrado lógico (estado = false)
export async function eliminarCoordinador(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
