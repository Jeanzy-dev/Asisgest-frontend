import { getJSON, enviarJSON } from './api.js';

export async function iniciarSesion(correo, password) {
  return await enviarJSON('/api/auth/login', 'POST', { correo, password });
}

export async function obtenerModulosPorPerfil(idPerfil) {
  return await getJSON('/api/moduloxrol/perfil/' + idPerfil);
}
