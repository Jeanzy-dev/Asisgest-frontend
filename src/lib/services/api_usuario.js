import { getJSON, enviarJSON } from './api.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/usuarios/';

// GET /usuarios/  -> lista de usuarios activos con el nombre de su perfil
export async function obtenerUsuarios() {
  return await getJSON(URL_BASE);
}

// GET /usuarios/{id}  -> un usuario
export async function obtenerUsuarioPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /usuarios/  -> crea un usuario (requiere password en texto plano)
export async function crearUsuario(usuario) {
  return await enviarJSON(URL_BASE, 'POST', usuario);
}

// PUT /usuarios/{id}  -> actualiza un usuario (password opcional)
export async function actualizarUsuario(id, usuario) {
  return await enviarJSON(URL_BASE + id, 'PUT', usuario);
}

// DELETE /usuarios/{id}  -> borrado lógico (estado = false)
export async function eliminarUsuario(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}
