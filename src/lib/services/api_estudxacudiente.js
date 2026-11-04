import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/estudxacudiente/';

// GET /estudxacudiente/  -> lista de registros activos
export async function obtenerVinculos() {
  return await getJSON(URL_BASE);
}

// GET /estudxacudiente/{id}  -> un registro
export async function obtenerVinculoPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /estudxacudiente/  -> crea un registro
export async function crearVinculo(vinculo) {
  return await enviarJSON(URL_BASE, 'POST', vinculo);
}

// PUT /estudxacudiente/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarVinculo(id, vinculo) {
  return await enviarJSON(URL_BASE + id, 'PUT', vinculo);
}

// DELETE /estudxacudiente/{id}  -> borrado lógico (estado = false)
export async function eliminarVinculo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
