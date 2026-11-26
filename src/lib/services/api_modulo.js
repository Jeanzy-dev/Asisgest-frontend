import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/modulos/';

export async function obtenerModulos() {
  return await getJSON(URL_BASE);
}

export async function obtenerModuloPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearModulo(modulo) {
  return await enviarJSON(URL_BASE, 'POST', modulo);
}

export async function actualizarModulo(id, modulo) {
  return await enviarJSON(URL_BASE + id, 'PUT', modulo);
}

export async function eliminarModulo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
