import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/acudientes/';

export async function obtenerAcudientes() {
  return await getJSON(URL_BASE);
}

export async function obtenerAcudientePorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearAcudiente(acudiente) {
  return await enviarJSON(URL_BASE, 'POST', acudiente);
}

export async function actualizarAcudiente(id, acudiente) {
  return await enviarJSON(URL_BASE + id, 'PUT', acudiente);
}

export async function eliminarAcudiente(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
