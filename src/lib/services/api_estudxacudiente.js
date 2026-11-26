import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/estudxacudiente/';

export async function obtenerVinculos() {
  return await getJSON(URL_BASE);
}

export async function obtenerVinculoPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearVinculo(vinculo) {
  return await enviarJSON(URL_BASE, 'POST', vinculo);
}

export async function actualizarVinculo(id, vinculo) {
  return await enviarJSON(URL_BASE + id, 'PUT', vinculo);
}

export async function eliminarVinculo(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
