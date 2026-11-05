import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/moduloxrol/';

// GET /moduloxrol/  -> lista de asignaciones módulo x rol
export async function obtenerModulosXRol() {
  return await getJSON(URL_BASE);
}

// GET /moduloxrol/perfil/{id}  -> módulos de un perfil
export async function obtenerModulosDePerfil(idPerfil) {
  return await getJSON(URL_BASE + 'perfil/' + idPerfil);
}

// POST /moduloxrol/  -> asigna un módulo a un perfil
export async function crearModuloXRol(asignacion) {
  return await enviarJSON(URL_BASE, 'POST', asignacion);
}

// PUT /moduloxrol/{id}  -> actualiza una asignación
export async function actualizarModuloXRol(id, asignacion) {
  return await enviarJSON(URL_BASE + id, 'PUT', asignacion);
}

// DELETE /moduloxrol/{id}  -> borrado lógico (estado = false)
export async function eliminarModuloXRol(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
