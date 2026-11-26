import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/primera-clase/';

export async function obtenerHorarios() {
  return await getJSON(URL_BASE);
}

export async function obtenerHorarioPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearHorario(horario) {
  return await enviarJSON(URL_BASE, 'POST', horario);
}

export async function actualizarHorario(id, horario) {
  return await enviarJSON(URL_BASE + id, 'PUT', horario);
}

export async function eliminarHorario(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
