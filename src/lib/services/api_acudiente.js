import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/acudientes/';

// GET /acudientes/  -> lista de registros activos
export async function obtenerAcudientes() {
  return await getJSON(URL_BASE);
}

// GET /acudientes/{id}  -> un registro
export async function obtenerAcudientePorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /acudientes/  -> crea un registro
export async function crearAcudiente(acudiente) {
  return await enviarJSON(URL_BASE, 'POST', acudiente);
}

// PUT /acudientes/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarAcudiente(id, acudiente) {
  return await enviarJSON(URL_BASE + id, 'PUT', acudiente);
}

// DELETE /acudientes/{id}  -> borrado lógico (estado = false)
export async function eliminarAcudiente(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
