import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/asistencia/';

// GET /asistencia/?desde=AAAA-MM-DD&hasta=AAAA-MM-DD  -> llegadas tarde (filtros opcionales)
export async function obtenerLlegadas(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) parametros.set(clave, valor);
  }
  const consulta = parametros.toString();
  return await getJSON(URL_BASE + (consulta ? '?' + consulta : ''));
}

// GET /asistencia/{id}  -> un registro
export async function obtenerLlegadaPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /asistencia/  -> crea un registro
export async function crearLlegada(llegada) {
  return await enviarJSON(URL_BASE, 'POST', llegada);
}

// PUT /asistencia/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarLlegada(id, llegada) {
  return await enviarJSON(URL_BASE + id, 'PUT', llegada);
}

// DELETE /asistencia/{id}  -> borrado lógico (estado = false)
export async function eliminarLlegada(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
