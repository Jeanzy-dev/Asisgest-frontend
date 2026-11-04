import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/estudiantes/';

// GET /estudiantes/  -> lista de registros activos
export async function obtenerEstudiantes() {
  return await getJSON(URL_BASE);
}

// GET /estudiantes/{id}  -> un registro
export async function obtenerEstudiantePorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /estudiantes/  -> crea un registro
export async function crearEstudiante(estudiante) {
  return await enviarJSON(URL_BASE, 'POST', estudiante);
}

// PUT /estudiantes/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarEstudiante(id, estudiante) {
  return await enviarJSON(URL_BASE + id, 'PUT', estudiante);
}

// DELETE /estudiantes/{id}  -> borrado lógico (estado = false)
export async function eliminarEstudiante(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
