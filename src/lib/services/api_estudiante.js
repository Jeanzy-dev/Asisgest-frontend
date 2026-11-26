import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/estudiantes/';

export async function obtenerEstudiantes() {
  return await getJSON(URL_BASE);
}

export async function obtenerEstudiantePorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearEstudiante(estudiante) {
  return await enviarJSON(URL_BASE, 'POST', estudiante);
}

export async function actualizarEstudiante(id, estudiante) {
  return await enviarJSON(URL_BASE + id, 'PUT', estudiante);
}

export async function eliminarEstudiante(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
