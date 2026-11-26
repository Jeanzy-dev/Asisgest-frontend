import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/motivos/';

export async function obtenerMotivos() {
  return await getJSON(URL_BASE);
}

export async function obtenerMotivoPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearMotivo(motivo) {
  return await enviarJSON(URL_BASE, 'POST', motivo);
}

export async function actualizarMotivo(id, motivo) {
  return await enviarJSON(URL_BASE + id, 'PUT', motivo);
}

export async function eliminarMotivo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
