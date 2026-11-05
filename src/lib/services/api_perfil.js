import { getJSON, enviarJSON } from './api.js';
import { obtenerModulos, crearModulo, actualizarModulo } from './api_modulo.js';
import { obtenerModulosDePerfil, crearModuloXRol } from './api_moduloxrol.js';

// Dirección base del recurso en la API
const URL_BASE = '/api/perfiles/';

// GET /perfiles/  -> lista de perfiles activos
export async function obtenerPerfiles() {
  return await getJSON(URL_BASE);
}

// GET /perfiles/{id}  -> un perfil
export async function obtenerPerfilPorId(id) {
  return await getJSON(URL_BASE + id);
}

// POST /perfiles/  -> crea un perfil
export async function crearPerfil(perfil) {
  return await enviarJSON(URL_BASE, 'POST', perfil);
}

// PUT /perfiles/{id}  -> actualiza un perfil
export async function actualizarPerfil(id, perfil) {
  return await enviarJSON(URL_BASE + id, 'PUT', perfil);
}

// DELETE /perfiles/{id}  -> borrado lógico (estado = false)
export async function eliminarPerfil(id) {
  return await enviarJSON(URL_BASE + id, 'DELETE');
}

// Garantiza que los perfiles base (ADMINISTRADOR, COORDINADOR, RECTOR) y sus módulos existan en la BD
export async function asegurarPerfilesBase() {
  let perfiles = await obtenerPerfiles();
  const requeridos = [
    { nombre: 'ADMINISTRADOR', descripcion: 'Administración general de usuarios y configuración del sistema' },
    { nombre: 'COORDINADOR', descripcion: 'Gestión de convivencia y reportes' },
    { nombre: 'RECTOR', descripcion: 'Dirección institucional y consulta de indicadores' }
  ];

  let huboCambios = false;
  for (const req of requeridos) {
    const existe = perfiles.some((p) => p.nombre.toUpperCase() === req.nombre);
    if (!existe) {
      try {
        await crearPerfil(req);
        huboCambios = true;
      } catch {
        // Ignorar si ya existe
      }
    }
  }

  if (huboCambios) {
    perfiles = await obtenerPerfiles();
  }

  // Asegurar que para ADMINISTRADOR solo estén asignados: Usuarios, Horarios y Notificaciones
  try {
    let modulos = await obtenerModulos();
    const modUsuarios = modulos.find((m) => m.ruta_url === '/admin/usuarios');
    if (!modUsuarios) {
      await crearModulo({ nombre: 'Usuarios', ruta_url: '/admin/usuarios', icono: 'usuarios' });
      modulos = await obtenerModulos();
    } else if (modUsuarios.nombre !== 'Usuarios') {
      await actualizarModulo(modUsuarios.id_modulo, {
        nombre: 'Usuarios',
        ruta_url: '/admin/usuarios',
        icono: 'usuarios'
      });
      modulos = await obtenerModulos();
    }

    const perfilAdmin = perfiles.find((p) => p.nombre.toUpperCase().includes('ADMIN'));
    if (perfilAdmin) {
      const modulosAdmin = await obtenerModulosDePerfil(perfilAdmin.id_perfil);
      const rutasDeseadas = ['/admin/usuarios', '/admin/horarios', '/admin/notificaciones'];
      for (const ruta of rutasDeseadas) {
        const mod = modulos.find((m) => m.ruta_url === ruta);
        if (mod && !modulosAdmin.some((ma) => ma.ruta_url === ruta)) {
          await crearModuloXRol({ id_perfil: perfilAdmin.id_perfil, id_modulo: mod.id_modulo });
        }
      }
    }

    const perfilRector = perfiles.find((p) => p.nombre.toUpperCase().includes('RECTOR'));
    if (perfilRector) {
      const modulosRector = await obtenerModulosDePerfil(perfilRector.id_perfil);
      if (modulosRector.length === 0) {
        for (const ruta of ['/coordinador/reportes', '/coordinador/historial']) {
          const mod = modulos.find((m) => m.ruta_url === ruta);
          if (mod) {
            await crearModuloXRol({ id_perfil: perfilRector.id_perfil, id_modulo: mod.id_modulo });
          }
        }
      }
    }
  } catch {
    // Si falla la sincronización de módulos, devolver perfiles igualmente
  }

  return perfiles;
}
