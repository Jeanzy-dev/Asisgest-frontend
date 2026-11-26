import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/asistencia/';

export async function obtenerLlegadas(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(clave, valor);
  }
  const consulta = parametros.toString();
  return await getJSON(URL_BASE + (consulta ? '?' + consulta : ''));
}

export async function obtenerLlegadaPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearLlegada(llegada) {
  return await enviarJSON(URL_BASE, 'POST', llegada);
}

export async function actualizarLlegada(id, llegada) {
  return await enviarJSON(URL_BASE + id, 'PUT', llegada);
}

export async function eliminarLlegada(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
