import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/modulos/';

// GET /modulos/  -> lista de módulos activos
export async function obtenerModulos() {
  return await getJSON(URL_BASE);
}

// GET /modulos/{id}  -> un módulo
export async function obtenerModuloPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /modulos/  -> crea un módulo
export async function crearModulo(modulo) {
  return await enviarJSON(URL_BASE, 'POST', modulo);
}

// PUT /modulos/{id}  -> actualiza un módulo
export async function actualizarModulo(id, modulo) {
  return await enviarJSON(URL_BASE + id, 'PUT', modulo);
}

// DELETE /modulos/{id}  -> borrado lógico (estado = false)
export async function eliminarModulo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
