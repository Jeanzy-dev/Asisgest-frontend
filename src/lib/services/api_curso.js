import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/cursos/';

// GET /cursos/  -> lista de registros activos
export async function obtenerCursos() {
  return await getJSON(URL_BASE);
}

// GET /cursos/{id}  -> un registro
export async function obtenerCursoPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /cursos/  -> crea un registro
export async function crearCurso(curso) {
  return await enviarJSON(URL_BASE, 'POST', curso);
}

// PUT /cursos/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarCurso(id, curso) {
  return await enviarJSON(URL_BASE + id, 'PUT', curso);
}

// DELETE /cursos/{id}  -> borrado lógico (estado = false)
export async function eliminarCurso(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
