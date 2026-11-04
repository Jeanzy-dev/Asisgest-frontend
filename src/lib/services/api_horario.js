import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/primera-clase/';

// GET /primera-clase/  -> lista de registros activos
export async function obtenerHorarios() {
  return await getJSON(URL_BASE);
}

// GET /primera-clase/{id}  -> un registro
export async function obtenerHorarioPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /primera-clase/  -> crea un registro
export async function crearHorario(horario) {
  return await enviarJSON(URL_BASE, 'POST', horario);
}

// PUT /primera-clase/{id}  -> actualiza un registro (y su campo "actualizado")
export async function actualizarHorario(id, horario) {
  return await enviarJSON(URL_BASE + id, 'PUT', horario);
}

// DELETE /primera-clase/{id}  -> borrado lógico (estado = false)
export async function eliminarHorario(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
