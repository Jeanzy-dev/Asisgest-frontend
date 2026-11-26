import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/moduloxrol/';

export async function obtenerModulosXRol() {
  return await getJSON(URL_BASE);
}

export async function obtenerModulosDePerfil(idPerfil) {
  return await getJSON(URL_BASE + 'perfil/' + idPerfil);
}

export async function crearModuloXRol(asignacion) {
  return await enviarJSON(URL_BASE, 'POST', asignacion);
}

export async function actualizarModuloXRol(id, asignacion) {
  return await enviarJSON(URL_BASE + id, 'PUT', asignacion);
}

export async function eliminarModuloXRol(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
