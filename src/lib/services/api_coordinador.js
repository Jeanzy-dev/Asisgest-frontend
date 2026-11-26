import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/coordinador/';

export async function obtenerCoordinadores() {
  return await getJSON(URL_BASE);
}

export async function obtenerCoordinadorPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearCoordinador(coordinador) {
  return await enviarJSON(URL_BASE, 'POST', coordinador);
}

export async function actualizarCoordinador(id, coordinador) {
  return await enviarJSON(URL_BASE + id, 'PUT', coordinador);
}

export async function eliminarCoordinador(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
