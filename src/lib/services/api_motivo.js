import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/motivos/';

// GET /motivos/  -> lista de registros activos
export async function obtenerMotivos() {
  return await getJSON(URL_BASE);
}

// GET /motivos/{id}  -> un registro
export async function obtenerMotivoPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /motivos/  -> crea un registro
export async function crearMotivo(motivo) {
  return await enviarJSON(URL_BASE, 'POST', motivo);
}

// PUT /motivos/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarMotivo(id, motivo) {
  return await enviarJSON(URL_BASE + id, 'PUT', motivo);
}

// DELETE /motivos/{id}  -> borrado lógico (estado = false)
export async function eliminarMotivo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
