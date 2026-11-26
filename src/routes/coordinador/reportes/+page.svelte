<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import Selector from '#lib/components/Selector.svelte';
  import TarjetaDato from '#lib/components/TarjetaDato.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import {
    consultarReporteMulticriterio,
    exportarReporteServidor,
    enviarReportePorCorreoServidor
  } from '#lib/services/api_reporte.js';
  import { obtenerMotivos } from '#lib/services/api_motivo.js';
  import { sesion } from '#lib/stores/sesion.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { hoyISO, fechaCorta, escapar } from '#lib/utils/formato.js';

  let desde = hoyISO(30);
  let hasta = hoyISO();
  let jornada = 'TODAS';
  let grado = 'TODOS';
  let motivo = 'TODOS';
  let tipoMotivo = 'TODOS';
  let busqueda = '';

  let listaMotivos = [];
  let resultado = null;
  let cargando = true;
  let exportando = false;

  let modalCorreo = false;
  let correoDestino = '';
  let asuntoCorreo = '';
  let formatoAdjunto = 'ambos';
  let enviandoCorreo = false;
  let ultimoEnvioCorreo = null;

  $: usuarioActual = $sesion?.usuario?.nombre_completo || 'Coordinación';
  $: rolActual = $sesion?.usuario?.perfil || 'COORDINADOR';

  const opcionesJornada = [
    { valor: 'TODAS', texto: 'Todas las jornadas' },
    { valor: 'MAÑANA', texto: 'Jornada Mañana' },
    { valor: 'TARDE', texto: 'Jornada Tarde' }
  ];

  const opcionesGrado = [
    { valor: 'TODOS', texto: 'Todos los grados' },
    { valor: '9', texto: 'Grado 9°' },
    { valor: '10', texto: 'Grado 10°' },
    { valor: '11', texto: 'Grado 11°' }
  ];

  const opcionesTipoMotivo = [
    { valor: 'TODOS', texto: 'Todos' },
    { valor: 'JUSTIFICABLE', texto: 'Solo justificables' },
    { valor: 'NO_JUSTIFICABLE', texto: 'Solo no justificables' }
  ];

  $: opcionesMotivo = [
    { valor: 'TODOS', texto: 'Todos los motivos' },
    ...listaMotivos.map((m) => ({ valor: m.descripcion, texto: m.descripcion }))
  ];

  const columnasReporte = [
    {
      titulo: 'Código',
      campo: 'codigo_registro',
      prioridad: 2,
      formato: (v) => `<code>${escapar(v)}</code>`
    },
    {
      titulo: 'Fecha / Hora',
      campo: 'fecha',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${fechaCorta(v)}</strong><small>${escapar(f.hora_llegada)} (Timbre ${escapar(f.hora_timbre)})</small></div>`
    },
    {
      titulo: 'Estudiante',
      campo: 'estudiante',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>Doc: ${escapar(f.documento_estudiante)}</small></div>`
    },
    {
      titulo: 'Curso / Jornada',
      campo: 'curso',
      prioridad: 3,
      formato: (v, f) => `<strong>${escapar(v)}</strong> · ${escapar(f.jornada)}`
    },
    {
      titulo: 'Motivo',
      campo: 'motivo',
      prioridad: 2,
      envolver: true,
      formato: (v, f) => {
        const clase = f.caracter === 'Justificada' ? 'exito' : 'alerta';
        return `<div class="celda-doble"><strong>${escapar(v)}</strong><span class="etiqueta ${clase}">${escapar(f.caracter)}</span></div>`;
      }
    },
    {
      titulo: 'Retraso',
      campo: 'minutos_tarde',
      prioridad: 2,
      formato: (v) => `<span class="etiqueta peligro">${v ?? 0} min</span>`
    },
    {
      titulo: 'Acudiente',
      campo: 'acudiente',
      prioridad: 5,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>${escapar(f.telefono_acudiente)}</small></div>`
    },
    {
      titulo: 'Registrado por',
      campo: 'registrado_por',
      prioridad: 6
    }
  ];

  async function consultar() {
    if (desde > hasta) {
      avisar('La fecha "Desde" no puede ser mayor que "Hasta"', 'alerta');
      return;
    }
    cargando = true;
    try {
      resultado = await consultarReporteMulticriterio({
        desde,
        hasta,
        jornada,
        grado,
        motivo,
        tipo_motivo: tipoMotivo,
        busqueda
      });
    } catch (error) {
      avisar('No se pudo generar la consulta: ' + error.message, 'error');
    }
    cargando = false;
  }

  onMount(async () => {
    correoDestino = $sesion?.usuario?.correo || '';
    try {
      listaMotivos = await obtenerMotivos();
    } catch {
      listaMotivos = [];
    }
    await consultar();
  });

  function rapido(dias) {
    desde = hoyISO(dias);
    hasta = hoyISO();
    consultar();
  }

  function limpiarCriterios() {
    desde = hoyISO(30);
    hasta = hoyISO();
    jornada = 'TODAS';
    grado = 'TODOS';
    motivo = 'TODOS';
    tipoMotivo = 'TODOS';
    busqueda = '';
    consultar();
  }

  function armarPayloadExportacion() {
    return {
      solicitante: usuarioActual,
      rol_solicitante: rolActual,
      criterios: resultado?.criterios || { desde, hasta, jornada, grado, motivo, tipo_motivo: tipoMotivo, busqueda },
      registros: resultado?.registros || []
    };
  }

  async function descargar(formato) {
    if (!resultado || resultado.registros.length === 0) {
      avisar('Realice una consulta con registros antes de exportar', 'alerta');
      return;
    }
    exportando = true;
    try {
      const archivo = await exportarReporteServidor(formato, armarPayloadExportacion());
      avisar(`Archivo ${archivo} generado con éxito`, 'exito');
    } catch (error) {
      avisar(error.message, 'error');
    }
    exportando = false;
  }

  function abrirModalCorreo() {
    if (!resultado || resultado.registros.length === 0) {
      avisar('No hay registros en el reporte actual para enviar por correo', 'alerta');
      return;
    }
    asuntoCorreo = `Informe de Llegadas Tarde (${fechaCorta(desde)} a ${fechaCorta(hasta)}) - IETCP`;
    ultimoEnvioCorreo = null;
    modalCorreo = true;
  }

  async function confirmarEnvioCorreo(e) {
    e.preventDefault();
    enviandoCorreo = true;
    try {
      const res = await enviarReportePorCorreoServidor({
        ...armarPayloadExportacion(),
        correo_destinatario: correoDestino,
        asunto: asuntoCorreo,
        formato: formatoAdjunto
      });
      ultimoEnvioCorreo = res;
      avisar(`✉ ${res.mensaje}`, 'exito', 8000);
    } catch (error) {
      avisar('No se pudo enviar el correo: ' + error.message, 'error');
    }
    enviandoCorreo = false;
  }
</script>

<Header
  titulo="Reportes de llegadas tarde"
  subtitulo="Consulta, exportación a PDF y Excel, y envío de informes por correo electrónico"
/>

<Card titulo="Filtros de búsqueda">
  <form on:submit|preventDefault={consultar}>
    <div class="rejilla-criterios">
      <Campo etiqueta="Desde" id="rep-desde" tipo="date" bind:value={desde} max={hasta} requerido />
      <Campo etiqueta="Hasta" id="rep-hasta" tipo="date" bind:value={hasta} max={hoyISO()} requerido />
      <Selector etiqueta="Jornada" id="rep-jornada" bind:value={jornada} opciones={opcionesJornada} />
      <Selector etiqueta="Grado" id="rep-grado" bind:value={grado} opciones={opcionesGrado} />
      <Selector etiqueta="Motivo" id="rep-motivo" bind:value={motivo} opciones={opcionesMotivo} />
      <Selector etiqueta="Tipo de motivo" id="rep-tipo" bind:value={tipoMotivo} opciones={opcionesTipoMotivo} />
    </div>

    <div class="fila-busqueda-acciones">
      <div class="busqueda-estudiante">
        <Campo
          etiqueta="Estudiante o documento"
          id="rep-busqueda"
          bind:value={busqueda}
          placeholder="Buscar por nombre, apellido o documento..."
        />
      </div>
      <div class="botones-criterios">
        <button type="submit" class="btn btn-primario" disabled={cargando}>
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
        <button type="button" class="btn btn-claro" on:click={() => rapido(7)}>7 días</button>
        <button type="button" class="btn btn-claro" on:click={() => rapido(30)}>30 días</button>
        <button type="button" class="btn btn-claro" on:click={limpiarCriterios}>Limpiar</button>
      </div>
    </div>
  </form>
</Card>

{#if cargando && !resultado}
  <Cargando />
{:else if resultado}
  <div class="rejilla-datos">
    <TarjetaDato
      titulo="Registros encontrados"
      valor={resultado.metricas.total_registros}
      detalle={`${fechaCorta(desde)} a ${fechaCorta(hasta)}`}
    />
    <TarjetaDato
      titulo="Tardanzas justificadas"
      valor={resultado.metricas.justificadas}
      detalle={`${resultado.metricas.no_justificadas} no justificadas`}
      color="verde"
    />
    <TarjetaDato
      titulo="Promedio de retraso"
      valor={`${resultado.metricas.promedio_minutos} min`}
      detalle="Minutos después del timbre"
      color="rojo"
    />
  </div>

  <Card titulo={`Listado de llegadas tarde (${resultado.registros.length})`}>
    <div class="barra-exportacion">
      <div class="botones-exportacion">
        <button type="button" class="btn btn-primario" on:click={() => descargar('pdf')} disabled={exportando}>
          Exportar PDF
        </button>
        <button type="button" class="btn btn-exito" on:click={() => descargar('excel')} disabled={exportando}>
          Exportar Excel
        </button>
        <button type="button" class="btn btn-acento" on:click={abrirModalCorreo} disabled={exportando}>
          Enviar por correo
        </button>
      </div>
    </div>

    <DataTable
      datos={resultado.registros}
      columnas={columnasReporte}
      acciones={[]}
      filasPorPagina={10}
    />
  </Card>
{/if}

<Modal
  abierto={modalCorreo}
  titulo="Enviar reporte por correo electrónico"
  on:cerrar={() => (modalCorreo = false)}
>
  <form on:submit={confirmarEnvioCorreo}>
    <Campo
      etiqueta="Correo destinatario"
      id="rep-correo-dest"
      tipo="email"
      bind:value={correoDestino}
      requerido
      placeholder="correo@ejemplo.com"
    />
    <Campo
      etiqueta="Asunto"
      id="rep-correo-asunto"
      bind:value={asuntoCorreo}
      requerido
    />
    <Selector
      etiqueta="Formato adjunto"
      id="rep-correo-formato"
      bind:value={formatoAdjunto}
      opciones={[
        { valor: 'ambos', texto: 'PDF y Excel (.xlsx)' },
        { valor: 'pdf', texto: 'Solo PDF (.pdf)' },
        { valor: 'excel', texto: 'Solo Excel (.xlsx)' }
      ]}
    />

    {#if ultimoEnvioCorreo}
      <div class="resultado-envio">
        <p><strong>✔ {ultimoEnvioCorreo.mensaje}</strong></p>
        {#if ultimoEnvioCorreo.preview_url}
          <p>
            <a href={ultimoEnvioCorreo.preview_url} target="_blank" rel="noopener noreferrer">
              Ver correo enviado ↗
            </a>
          </p>
        {/if}
      </div>
    {/if}

    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={() => (modalCorreo = false)}>Cerrar</button>
      <button type="submit" class="btn btn-primario" disabled={enviandoCorreo}>
        {enviandoCorreo ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  </form>
</Modal>

<style>
  .rejilla-criterios {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 0 14px;
  }
  .fila-busqueda-acciones {
    display: flex;
    gap: 14px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .busqueda-estudiante {
    flex: 1;
    min-width: 240px;
  }
  .botones-criterios {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .barra-exportacion {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }
  .botones-exportacion {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .resultado-envio {
    background: #dcfce7;
    border: 1px solid #86efac;
    color: #166534;
    padding: 10px 14px;
    border-radius: 8px;
    margin: 12px 0;
    font-size: 0.88rem;
  }
  .resultado-envio p {
    margin: 4px 0;
  }
  .resultado-envio a {
    color: #121023;
    font-weight: 700;
  }
</style>
