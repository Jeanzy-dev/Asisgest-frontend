import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/cursos/';

export async function obtenerCursos() {
  return await getJSON(URL_BASE);
}

export async function obtenerCursoPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearCurso(curso) {
  return await enviarJSON(URL_BASE, 'POST', curso);
}

export async function actualizarCurso(id, curso) {
  return await enviarJSON(URL_BASE + id, 'PUT', curso);
}

export async function eliminarCurso(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
