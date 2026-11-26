import { getJSON, RENDER_API_URL } from './api.js';
import { obtenerLlegadas } from './api_asistencia.js';
import { obtenerEstudiantes } from './api_estudiante.js';
import { obtenerVinculos } from './api_estudxacudiente.js';
import { obtenerHorarios } from './api_horario.js';

export function obtenerUrlExpress() {
  if (typeof window !== 'undefined') {
    const guardada = localStorage.getItem('asisgest_express_url');
    if (guardada && guardada.trim()) {
      return guardada.trim().replace(/\/+$/, '');
    }
  }
  return import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3000';
}

export function obtenerUrlDatasetPowerBI() {
  return `${RENDER_API_URL}/api/reportes/powerbi-dataset?formato=csv`;
}

export async function obtenerResumen(desde, hasta, filtros = {}) {
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  if (filtros.jornada && filtros.jornada !== 'TODAS') parametros.set('jornada', filtros.jornada);
  if (filtros.grado && filtros.grado !== 'TODOS') parametros.set('grado', filtros.grado);
  if (filtros.tipo_motivo && filtros.tipo_motivo !== 'TODOS') parametros.set('tipo_motivo', filtros.tipo_motivo);

  const [resBase, consulta] = await Promise.all([
    getJSON('/api/reportes/resumen?' + parametros.toString()).catch(() => null),
    consultarReporteMulticriterio({
      desde,
      hasta,
      jornada: filtros.jornada,
      grado: filtros.grado,
      tipo_motivo: filtros.tipo_motivo
    }).catch(() => null)
  ]);

  if (resBase && resBase.por_justificacion && resBase.por_jornada && resBase.por_grado) {
    return resBase;
  }

  const filas = consulta?.registros || [];
  const totalTardanzas = filas.length;
  const justificadas = filas.filter((f) => f.caracter === 'Justificada').length;
  const noJustificadas = totalTardanzas - justificadas;
  const totalMinutos = filas.reduce((acc, f) => acc + Number(f.minutos_tarde || 0), 0);
  const promedioMinutos = totalTardanzas > 0 ? Number((totalMinutos / totalTardanzas).toFixed(1)) : 0;
  const tasaJustificadas = totalTardanzas > 0 ? Number(((justificadas / totalTardanzas) * 100).toFixed(1)) : 0;

  const conteoPorEst = new Map();
  const conteoPorCurso = new Map();
  const conteoPorMotivo = new Map();
  const conteoPorJornada = new Map();
  const conteoPorGrado = new Map();
  const conteoPorDia = new Map();

  for (const r of filas) {
    const claveEst = `${r.estudiante}||${r.curso}`;
    conteoPorEst.set(claveEst, (conteoPorEst.get(claveEst) || 0) + 1);

    const claveCurso = `${r.curso} ${r.jornada}`;
    conteoPorCurso.set(claveCurso, (conteoPorCurso.get(claveCurso) || 0) + 1);

    conteoPorMotivo.set(r.motivo, (conteoPorMotivo.get(r.motivo) || 0) + 1);
    conteoPorJornada.set(r.jornada, (conteoPorJornada.get(r.jornada) || 0) + 1);

    const gradoStr = `Grado ${String(r.curso).split('°')[0]}°`;
    conteoPorGrado.set(gradoStr, (conteoPorGrado.get(gradoStr) || 0) + 1);

    conteoPorDia.set(r.fecha, (conteoPorDia.get(r.fecha) || 0) + 1);
  }

  const estudiantesDistintos = conteoPorEst.size;
  let reincidentes = 0;
  for (const c of conteoPorEst.values()) {
    if (c >= 3) reincidentes++;
  }

  const porCurso = Array.from(conteoPorCurso.entries())
    .map(([curso, total]) => ({ curso, total }))
    .sort((a, b) => b.total - a.total);

  const porMotivo = Array.from(conteoPorMotivo.entries())
    .map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total);

  const porJornada = Array.from(conteoPorJornada.entries())
    .map(([jornada, total]) => ({ jornada, total }))
    .sort((a, b) => b.total - a.total);

  const porGrado = Array.from(conteoPorGrado.entries())
    .map(([grado, total]) => ({ grado, total }))
    .sort((a, b) => a.grado.localeCompare(b.grado));

  const porDia = Array.from(conteoPorDia.entries())
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const topEstudiantes = Array.from(conteoPorEst.entries())
    .map(([clave, total]) => {
      const [estudiante, curso] = clave.split('||');
      return { estudiante, curso, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    desde,
    hasta,
    totales: {
      total_tardanzas: totalTardanzas,
      estudiantes_distintos: estudiantesDistintos,
      estudiantes_reincidentes: reincidentes,
      promedio_minutos: promedioMinutos,
      total_minutos: totalMinutos,
      justificadas,
      no_justificadas: noJustificadas,
      tasa_justificadas: tasaJustificadas
    },
    notificaciones_pendientes: resBase?.notificaciones_pendientes ?? 0,
    por_curso: porCurso,
    por_motivo: porMotivo,
    por_justificacion: [
      { categoria: 'Justificadas', total: justificadas },
      { categoria: 'No justificadas', total: noJustificadas }
    ],
    por_jornada: porJornada,
    por_grado: porGrado,
    por_dia: porDia,
    top_estudiantes: topEstudiantes
  };
}

export async function consultarReporteMulticriterio(criterios = {}) {
  const inicio = performance.now();
  const parametros = new URLSearchParams();
  if (criterios.desde) parametros.set('desde', criterios.desde);
  if (criterios.hasta) parametros.set('hasta', criterios.hasta);
  if (criterios.jornada && criterios.jornada !== 'TODAS') parametros.set('jornada', criterios.jornada);
  if (criterios.grado && criterios.grado !== 'TODOS') parametros.set('grado', criterios.grado);
  if (criterios.grupo && criterios.grupo !== 'TODOS') parametros.set('grupo', criterios.grupo);
  if (criterios.motivo && criterios.motivo !== 'TODOS') parametros.set('motivo', criterios.motivo);
  if (criterios.tipo_motivo && criterios.tipo_motivo !== 'TODOS') parametros.set('tipo_motivo', criterios.tipo_motivo);
  if (criterios.busqueda && criterios.busqueda.trim()) parametros.set('busqueda', criterios.busqueda.trim());

  try {
    const respuesta = await getJSON('/api/reportes/consulta?' + parametros.toString());
    if (respuesta && Array.isArray(respuesta.registros)) {
      return respuesta;
    }
  } catch {

  }

  const [llegadas, estudiantes, vinculos, horarios] = await Promise.all([
    obtenerLlegadas({ desde: criterios.desde, hasta: criterios.hasta }),
    obtenerEstudiantes().catch(() => []),
    obtenerVinculos().catch(() => []),
    obtenerHorarios().catch(() => [])
  ]);

  const mapaEstudiantes = new Map(estudiantes.map((e) => [Number(e.id_estudiante), e]));
  const mapaAcudientes = new Map();
  for (const v of vinculos) {
    const idEst = Number(v.id_estudiante);
    if (!mapaAcudientes.has(idEst) || v.es_principal) {
      mapaAcudientes.set(idEst, v);
    }
  }
  const mapaHorarios = new Map();
  for (const h of horarios) {
    const clave = `${h.grado}-${String(h.grupo).toUpperCase()}-${String(h.jornada).toUpperCase()}`;
    mapaHorarios.set(clave, h);
  }

  let filtradas = llegadas.filter((r) => {
    const est = mapaEstudiantes.get(Number(r.id_estudiante));
    const jornadaFila = String(r.jornada || est?.jornada || '').toUpperCase();
    const gradoFila = String(r.grado ?? est?.grado ?? '');
    const grupoFila = String(r.grupo ?? est?.grupo ?? '').toUpperCase();
    const motivoFila = String(r.motivo || '').toLowerCase();
    const esJust = Boolean(r.es_justificable);

    if (criterios.jornada && criterios.jornada !== 'TODAS') {
      if (jornadaFila !== String(criterios.jornada).toUpperCase()) return false;
    }
    if (criterios.grado && criterios.grado !== 'TODOS') {
      if (gradoFila !== String(criterios.grado)) return false;
    }
    if (criterios.grupo && criterios.grupo !== 'TODOS') {
      if (grupoFila !== String(criterios.grupo).toUpperCase()) return false;
    }
    if (criterios.motivo && criterios.motivo !== 'TODOS') {
      if (motivoFila !== String(criterios.motivo).toLowerCase()) return false;
    }
    if (criterios.tipo_motivo === 'JUSTIFICABLE' && !esJust) return false;
    if (criterios.tipo_motivo === 'NO_JUSTIFICABLE' && esJust) return false;

    if (criterios.busqueda && criterios.busqueda.trim()) {
      const q = criterios.busqueda.trim().toLowerCase();
      const nombre = String(r.estudiante || '').toLowerCase();
      const doc = String(r.documento || est?.documento || '').toLowerCase();
      if (!nombre.includes(q) && !doc.includes(q)) return false;
    }
    return true;
  });

  const registros = filtradas.map((r, idx) => {
    const est = mapaEstudiantes.get(Number(r.id_estudiante));
    const acud = mapaAcudientes.get(Number(r.id_estudiante));
    const grado = r.grado ?? est?.grado ?? '';
    const grupo = r.grupo ?? est?.grupo ?? '';
    const jornadaRaw = r.jornada || est?.jornada || 'Mañana';
    const jornada = jornadaRaw.charAt(0).toUpperCase() + jornadaRaw.slice(1).toLowerCase();
    const claveHorario = `${grado}-${String(grupo).toUpperCase()}-${String(jornadaRaw).toUpperCase()}`;
    const horario = mapaHorarios.get(claveHorario);
    const fechaLimpia = String(r.fecha || '').replace(/-/g, '').slice(0, 8) || '20261104';

    return {
      codigo_registro: `REG-${fechaLimpia}-${String(idx + 1).padStart(3, '0')}`,
      fecha: r.fecha,
      hora_llegada: String(r.hora_llegada || '').slice(0, 5),
      hora_timbre: String(horario?.hora_inicio_timbre || '06:30').slice(0, 5),
      documento_estudiante: r.documento || est?.documento || '—',
      estudiante: r.estudiante || `${est?.nombres || ''} ${est?.apellidos || ''}`.trim(),
      curso: `${grado}°${grupo}`,
      jornada,
      motivo: r.motivo || 'Sin especificar',
      caracter: r.es_justificable ? 'Justificada' : 'No justificada',
      minutos_tarde: Number(r.minutos_tarde ?? 0),
      acudiente: acud?.acudiente || 'Sin acudiente vinculado',
      telefono_acudiente: acud?.telefono || '—',
      registrado_por: r.registrado_por || 'Coordinación de Convivencia',
      observaciones: r.observaciones || 'Sin observaciones'
    };
  });

  const tiempoMs = Number((performance.now() - inicio).toFixed(1));
  const total = registros.length;
  const justificadas = registros.filter((x) => x.caracter === 'Justificada').length;
  const promedioMin = total > 0
    ? Number((registros.reduce((a, b) => a + b.minutos_tarde, 0) / total).toFixed(1))
    : 0;

  return {
    criterios: {
      desde: criterios.desde,
      hasta: criterios.hasta,
      jornada: criterios.jornada || 'Todas',
      grado: criterios.grado || 'Todos',
      grupo: criterios.grupo || 'Todos',
      motivo: criterios.motivo || 'Todos',
      tipo_motivo: criterios.tipo_motivo || 'Todos',
      busqueda: criterios.busqueda || ''
    },
    metricas: {
      total_registros: total,
      justificadas,
      no_justificadas: total - justificadas,
      promedio_minutos: promedioMin,
      tiempo_consulta_ms: tiempoMs,
      tamano_estimado_kb: Number(((total * 0.38) + 4.2).toFixed(2))
    },
    registros
  };
}

async function guardarOCompartirArchivo(blob, filename, mimeType) {

  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = String(reader.result || '');
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const archivoGuardado = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: filename,
        text: 'Informe Corporativo de Llegadas Tarde - I.E. Técnica Comercial de Ponedera',
        url: archivoGuardado.uri,
        dialogTitle: 'Abrir o compartir reporte'
      });
      return true;
    } catch (errCap) {
      console.warn('Respaldo descarga WebView:', errCap);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
  return true;
}

export async function exportarReporteServidor(formato, payload) {
  const ruta = formato === 'pdf' ? '/api/reportes-doc/pdf' : '/api/reportes-doc/excel';
  const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
  const mime = formato === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const nombreArchivo = `Reporte_Llegadas_Tarde_IETCP_${new Date().toISOString().slice(0, 10)}.${ext}`;

  const baseExpress = obtenerUrlExpress();
  let respuesta;
  try {
    respuesta = await fetch(`${baseExpress}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    respuesta = await fetch(`/api-correo${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  if (!respuesta.ok) {
    throw new Error(`No se pudo generar el archivo ${formato.toUpperCase()} en el servidor Express`);
  }

  const blob = await respuesta.blob();
  await guardarOCompartirArchivo(blob, nombreArchivo, mime);
  return nombreArchivo;
}

export async function enviarReportePorCorreoServidor(payload) {
  const baseExpress = obtenerUrlExpress();
  let respuesta;
  try {
    respuesta = await fetch(`${baseExpress}/api/reportes-doc/enviar-correo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    respuesta = await fetch('/api-correo/api/reportes-doc/enviar-correo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(datos?.detail || datos?.error || datos?.mensaje || 'Error al enviar reporte por correo');
  }
  return datos;
}
