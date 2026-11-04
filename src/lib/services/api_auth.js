import { getJSON, enviarJSON } from './api.js';

// POST /auth/login  -> token + datos del usuario (incluye el perfil)
export async function iniciarSesion(correo, password) {
  return await enviarJSON('/api/auth/login', 'POST', { correo, password });
}

// GET /moduloxrol/perfil/{id}  -> módulos permitidos para el perfil (arma el menú)
export async function obtenerModulosPorPerfil(idPerfil) {
  return await getJSON('/api/moduloxrol/perfil/' + idPerfil);
}
