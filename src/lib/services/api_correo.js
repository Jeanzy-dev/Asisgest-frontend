import { obtenerEstudiantePorId } from './api_estudiante.js';
import { obtenerVinculos } from './api_estudxacudiente.js';
import { obtenerLlegadas } from './api_asistencia.js';
import { obtenerNotificaciones, actualizarNotificacion } from './api_notificacion.js';

const URL_EXTERNA = (import.meta.env.VITE_EMAIL_API_URL || '').trim();

async function peticionExpress(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' }
  };
  if (cuerpo !== null) {
    opciones.body = JSON.stringify(cuerpo);
  }

  const candidatos = URL_EXTERNA
    ? [`${URL_EXTERNA}${ruta}`, `/api-correo${ruta}`, `http://127.0.0.1:3000${ruta}`]
    : [`/api-correo${ruta}`, `${ruta}`, `http://127.0.0.1:3000${ruta}`, `http://localhost:3000${ruta}`];

  let ultimaRespuesta = null;
  let ultimoError = null;

  for (const url of candidatos) {
    try {
      const r = await fetch(url, opciones);
      ultimaRespuesta = r;
      if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 404)) {
        break;
      }
    } catch (err) {
      ultimoError = err;
    }
  }

  if (!ultimaRespuesta) {
    throw new Error(
      ultimoError?.message || 'No se pudo conectar con el servicio de correos (backend-express en puerto 3000)'
    );
  }

  let datos = null;
  try {
    datos = await ultimaRespuesta.json();
  } catch {
    datos = null;
  }
  if (!ultimaRespuesta.ok) {
    throw new Error(datos?.detail || datos?.error || datos?.mensaje || `Error HTTP ${ultimaRespuesta.status}`);
  }
  return datos;
}

export async function enviarCorreoAlerta(payload) {
  return await peticionExpress('/api/correos/enviar-alerta', 'POST', payload);
}

export async function obtenerVistaPreviaCorreo(payload) {
  return await peticionExpress('/api/correos/vista-previa', 'POST', payload);
}

export async function obtenerPlantillasCorreo() {
  return await peticionExpress('/api/plantillas', 'GET');
}

export async function obtenerEnviosCorreo() {
  return await peticionExpress('/api/envios', 'GET');
}

export async function obtenerLogsCorreo() {
  return await peticionExpress('/api/logs', 'GET');
}

/**
 * Recopila la información del estudiante, su acudiente principal y sus últimas 5 llegadas tarde,
 * envía el correo con el template institucional mediante backend-express y actualiza el estado
 * de la notificación en FastAPI a ENVIADO (o FALLIDO).
 */
export async function despacharAlertaPorEstudiante({
  id_estudiante,
  total_tardanzas = null,
  id_notificacion = null,
  correo_destinatario = null,
  asunto = null
}) {
  const [estudiante, vinculos, llegadas, notificaciones] = await Promise.all([
    obtenerEstudiantePorId(id_estudiante).catch(() => null),
    obtenerVinculos().catch(() => []),
    obtenerLlegadas({ id_estudiante }).catch(() => []),
    obtenerNotificaciones().catch(() => [])
  ]);

  // Buscar el acudiente vinculado al estudiante (priorizando es_principal)
  const vinculosEst = vinculos.filter((v) => Number(v.id_estudiante) === Number(id_estudiante));
  const vinculoPrincipal = vinculosEst.find((v) => v.es_principal) || vinculosEst[0] || null;

  const correoFinal = (correo_destinatario || vinculoPrincipal?.correo || '').trim();
  if (!correoFinal) {
    throw new Error('El estudiante no tiene un acudiente con correo electrónico registrado');
  }

  const nombreAcudiente = vinculoPrincipal?.acudiente || 'Padre de Familia / Acudiente';
  const nombreEstudiante = estudiante
    ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim()
    : (vinculoPrincipal?.estudiante || 'Estudiante');
  const documentoEstudiante = estudiante?.documento || '000000';
  const grado = estudiante?.grado ?? vinculoPrincipal?.grado ?? '';
  const grupo = estudiante?.grupo ?? vinculoPrincipal?.grupo ?? '';
  const jornada = estudiante?.jornada || 'Mañana';
  const totalFinal = Number(total_tardanzas || llegadas.length || estudiante?.total_tardanzas || 3);

  const ultimosRegistros = llegadas.slice(0, 5).map((r) => ({
    fecha: r.fecha,
    hora_llegada: r.hora_llegada,
    minutos_tarde: r.minutos_tarde,
    motivo: r.motivo
  }));

  const payload = {
    correo_destinatario: correoFinal,
    nombre_acudiente: nombreAcudiente,
    documento_estudiante: documentoEstudiante,
    nombre_estudiante: nombreEstudiante,
    grado,
    grupo,
    jornada,
    total_tardanzas: totalFinal,
    asunto: asunto || `Alerta por acumulación de ${totalFinal} llegadas tarde - ${nombreEstudiante}`,
    ultimos_registros: ultimosRegistros
  };

  // Llamar a la API externa en Express para enviar el correo con el template institucional
  const resultadoCorreo = await enviarCorreoAlerta(payload);

  // Localizar la notificación en FastAPI para marcarla como ENVIADO
  let notifObjetivo = null;
  if (id_notificacion) {
    notifObjetivo = notificaciones.find((n) => Number(n.id_notificacion) === Number(id_notificacion));
  } else {
    notifObjetivo = notificaciones.find(
      (n) => Number(n.id_estudiante) === Number(id_estudiante) && n.estado_envio === 'PENDIENTE'
    );
  }

  if (notifObjetivo) {
    await actualizarNotificacion(notifObjetivo.id_notificacion, {
      id_estudiante: Number(id_estudiante),
      total_tardanzas: totalFinal,
      correo_destinatario: correoFinal,
      asunto: notifObjetivo.asunto || payload.asunto,
      estado_envio: resultadoCorreo.ok ? 'ENVIADO' : 'FALLIDO'
    }).catch(() => null);
  }

  return resultadoCorreo;
}

/**
 * Construye la vista previa HTML del correo para un estudiante dado sin despachar el correo
 */
export async function construirVistaPreviaEstudiante({
  id_estudiante,
  total_tardanzas = null,
  correo_destinatario = null,
  asunto = null
}) {
  const [estudiante, vinculos, llegadas] = await Promise.all([
    obtenerEstudiantePorId(id_estudiante).catch(() => null),
    obtenerVinculos().catch(() => []),
    obtenerLlegadas({ id_estudiante }).catch(() => [])
  ]);

  const vinculosEst = vinculos.filter((v) => Number(v.id_estudiante) === Number(id_estudiante));
  const vinculoPrincipal = vinculosEst.find((v) => v.es_principal) || vinculosEst[0] || null;

  const nombreAcudiente = vinculoPrincipal?.acudiente || 'Padre de Familia / Acudiente';
  const nombreEstudiante = estudiante
    ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim()
    : (vinculoPrincipal?.estudiante || 'Estudiante');
  const grado = estudiante?.grado ?? vinculoPrincipal?.grado ?? '';
  const grupo = estudiante?.grupo ?? vinculoPrincipal?.grupo ?? '';
  const jornada = estudiante?.jornada || 'Mañana';
  const totalFinal = Number(total_tardanzas || llegadas.length || estudiante?.total_tardanzas || 3);

  const ultimosRegistros = llegadas.slice(0, 5).map((r) => ({
    fecha: r.fecha,
    hora_llegada: r.hora_llegada,
    minutos_tarde: r.minutos_tarde,
    motivo: r.motivo
  }));

  return await obtenerVistaPreviaCorreo({
    correo_destinatario: correo_destinatario || vinculoPrincipal?.correo || 'acudiente@ejemplo.com',
    nombre_acudiente: nombreAcudiente,
    nombre_estudiante: nombreEstudiante,
    grado,
    grupo,
    jornada,
    total_tardanzas: totalFinal,
    asunto,
    ultimos_registros: ultimosRegistros
  });
}
