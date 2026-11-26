import { getJSON, enviarJSON } from './api.js';

const URL_BASE = '/api/usuarios/';

export async function obtenerUsuarios() {
  return await getJSON(URL_BASE);
}

export async function obtenerUsuarioPorId(id) {
  return await getJSON(URL_BASE + id);
}

export async function crearUsuario(usuario) {
  return await enviarJSON(URL_BASE, 'POST', usuario);
}

export async function actualizarUsuario(id, usuario) {
  return await enviarJSON(URL_BASE + id, 'PUT', usuario);
}

export async function eliminarUsuario(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
