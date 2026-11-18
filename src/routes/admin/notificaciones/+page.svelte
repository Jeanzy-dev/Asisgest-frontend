<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import Selector from '#lib/components/Selector.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Confirmar from '#lib/components/Confirmar.svelte';
  import BuscadorEstudiante from '#lib/components/BuscadorEstudiante.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import Icono from '#lib/components/Icono.svelte';
  import { obtenerNotificaciones, crearNotificacion, actualizarNotificacion, eliminarNotificacion } from '#lib/services/api_notificacion.js';
  import { obtenerEstudiantes } from '#lib/services/api_estudiante.js';
  import { obtenerVinculos } from '#lib/services/api_estudxacudiente.js';
  import {
    despacharAlertaPorEstudiante,
    construirVistaPreviaEstudiante,
    obtenerEnviosCorreo,
    obtenerLogsCorreo
  } from '#lib/services/api_correo.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, fechaHora, nombreCurso } from '#lib/utils/formato.js';

  let notificaciones = [];
  let estudiantes = [];
  let vinculos = [];
  let enviosExpress = [];
  let logsExpress = [];
  let cargando = true;
  let despachando = false;

  let formulario = null;
  let porEliminar = null;
  let vistaPrevia = null;

  const opcionesEstado = [
    { valor: 'PENDIENTE', texto: 'Pendiente' },
    { valor: 'ENVIADO', texto: 'Enviado' },
    { valor: 'FALLIDO', texto: 'Fallido' }
  ];

  $: pendientesCount = notificaciones.filter((n) => n.estado_envio === 'PENDIENTE').length;

  const columnas = [
    {
      titulo: 'Estudiante',
      campo: 'estudiante',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>${nombreCurso(f.grado, f.grupo)}</small></div>`
    },
    {
      titulo: 'Tardanzas',
      campo: 'total_tardanzas',
      formato: (v) => `<span class="etiqueta peligro">${v ?? 0}</span>`
    },
    { titulo: 'Correo destinatario', campo: 'correo_destinatario', prioridad: 2 },
    { titulo: 'Asunto', campo: 'asunto', envolver: true },
    {
      titulo: 'Estado envío',
      campo: 'estado_envio',
      formato: (v) => {
        const clase = v === 'ENVIADO' ? 'exito' : v === 'FALLIDO' ? 'peligro' : 'alerta';
        return `<span class="etiqueta ${clase}">${escapar(v)}</span>`;
      }
    },
    { titulo: 'Fecha', campo: 'creado', formato: (v) => fechaHora(v) }
  ];

  const columnasExpress = [
    { titulo: 'ID Envío', campo: 'id_envio' },
    {
      titulo: 'Estudiante',
      campo: 'nombre_estudiante',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>Doc: ${escapar(f.documento_estudiante || '—')}</small></div>`
    },
    { titulo: 'Correo destinatario', campo: 'correo_destinatario', prioridad: 2 },
    {
      titulo: 'Tardanzas',
      campo: 'total_tardanzas',
      formato: (v) => `<span class="etiqueta peligro">${v ?? 0}</span>`
    },
    { titulo: 'Código seguimiento', campo: 'codigo_seguimiento' },
    {
      titulo: 'Estado BD Express',
      campo: 'estado_despacho',
      formato: (v) => {
        const clase = v === 'ENVIADO' ? 'exito' : v === 'FALLIDO' ? 'peligro' : 'alerta';
        return `<span class="etiqueta ${clase}">${escapar(v)}</span>`;
      }
    },
    { titulo: 'Proveedor SMTP', campo: 'proveedor_smtp' }
  ];

  $: enviosConLog = enviosExpress.map((e) => {
    const log = logsExpress.find((l) => Number(l.id_envio) === Number(e.id_envio));
    return {
      ...e,
      proveedor_smtp: log?.proveedor_smtp || '—',
      detalle_respuesta: log?.detalle_respuesta || ''
    };
  });

  async function cargarDatos() {
    try {
      [notificaciones, estudiantes, vinculos, enviosExpress, logsExpress] = await Promise.all([
        obtenerNotificaciones(),
        obtenerEstudiantes(),
        obtenerVinculos().catch(() => []),
        obtenerEnviosCorreo().catch(() => []),
        obtenerLogsCorreo().catch(() => [])
      ]);
    } catch (error) {
      avisar('No se pudieron cargar las notificaciones: ' + error.message, 'error');
    }
    cargando = false;
  }

  onMount(cargarDatos);

  function nueva() {
    formulario = {
      id_notificacion: null,
      estudianteObj: null,
      total_tardanzas: 3,
      correo_destinatario: '',
      asunto: 'Alerta de llegadas tarde - I.E. Técnica Comercial de Ponedera',
      estado_envio: 'PENDIENTE',
      enviar_ahora: true
    };
  }

  function prepararEdicion(evento) {
    const n = evento.detail;
    formulario = {
      id_notificacion: n.id_notificacion,
      estudianteObj: {
        id_estudiante: n.id_estudiante,
        nombres: n.estudiante,
        apellidos: '',
        grado: n.grado,
        grupo: n.grupo
      },
      total_tardanzas: n.total_tardanzas,
      correo_destinatario: n.correo_destinatario,
      asunto: n.asunto,
      estado_envio: n.estado_envio || 'PENDIENTE',
      enviar_ahora: false
    };
  }

  function alSeleccionarEstudiante(e) {
    const est = e.detail;
    formulario.estudianteObj = est;
    formulario.total_tardanzas = Math.max(Number(est.total_tardanzas || 3), 3);
    const vinc = vinculos.find((v) => Number(v.id_estudiante) === Number(est.id_estudiante) && v.es_principal)
      || vinculos.find((v) => Number(v.id_estudiante) === Number(est.id_estudiante));
    if (vinc?.correo) {
      formulario.correo_destinatario = vinc.correo;
    }
  }

  async function verPlantillaModal() {
    if (!formulario?.estudianteObj) {
      avisar('Seleccione primero un estudiante para generar la vista previa', 'alerta');
      return;
    }
    try {
      vistaPrevia = await construirVistaPreviaEstudiante({
        id_estudiante: formulario.estudianteObj.id_estudiante,
        total_tardanzas: formulario.total_tardanzas,
        correo_destinatario: formulario.correo_destinatario,
        asunto: formulario.asunto
      });
    } catch (err) {
      avisar('No se pudo generar la vista previa: ' + err.message, 'error');
    }
  }

  async function despacharDesdeModal() {
    if (!formulario?.estudianteObj) {
      avisar('Seleccione un estudiante', 'alerta');
      return;
    }
    despachando = true;
    try {
      const resultado = await despacharAlertaPorEstudiante({
        id_estudiante: formulario.estudianteObj.id_estudiante,
        total_tardanzas: formulario.total_tardanzas,
        id_notificacion: formulario.id_notificacion,
        correo_destinatario: formulario.correo_destinatario,
        asunto: formulario.asunto
      });
      formulario.estado_envio = 'ENVIADO';
      avisar(`✉ Correo enviado a ${resultado.correo_destinatario} (${resultado.proveedor})`, 'exito', 7000);
      vistaPrevia = resultado;
      await cargarDatos();
    } catch (error) {
      avisar('Error al enviar correo: ' + error.message, 'error');
    }
    despachando = false;
  }

  async function enviarPendientes() {
    const pendientes = notificaciones.filter((n) => n.estado_envio === 'PENDIENTE');
    if (pendientes.length === 0) {
      avisar('No hay notificaciones pendientes por enviar', 'alerta');
      return;
    }
    despachando = true;
    let enviados = 0;
    for (const n of pendientes) {
      try {
        await despacharAlertaPorEstudiante({
          id_estudiante: n.id_estudiante,
          total_tardanzas: n.total_tardanzas,
          id_notificacion: n.id_notificacion,
          correo_destinatario: n.correo_destinatario,
          asunto: n.asunto
        });
        enviados++;
      } catch (err) {
        console.error(err);
      }
    }
    despachando = false;
    await cargarDatos();
    avisar(`Se despacharon ${enviados} de ${pendientes.length} correos pendientes`, enviados > 0 ? 'exito' : 'alerta');
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (!formulario.estudianteObj) {
      avisar('Seleccione un estudiante', 'alerta');
      return;
    }
    const datos = {
      id_estudiante: Number(formulario.estudianteObj.id_estudiante),
      total_tardanzas: Number(formulario.total_tardanzas),
      correo_destinatario: formulario.correo_destinatario.trim(),
      asunto: formulario.asunto.trim(),
      estado_envio: formulario.estado_envio
    };
    try {
      if (formulario.id_notificacion === null) {
        const res = await crearNotificacion(datos);
        if (formulario.enviar_ahora) {
          const envio = await despacharAlertaPorEstudiante({
            id_estudiante: datos.id_estudiante,
            total_tardanzas: datos.total_tardanzas,
            id_notificacion: res?.id,
            correo_destinatario: datos.correo_destinatario,
            asunto: datos.asunto
          });
          avisar(`Notificación creada y correo enviado a ${envio.correo_destinatario}`);
        } else {
          avisar('Notificación registrada');
        }
      } else {
        await actualizarNotificacion(formulario.id_notificacion, datos);
        if (formulario.enviar_ahora) {
          const envio = await despacharAlertaPorEstudiante({
            id_estudiante: datos.id_estudiante,
            total_tardanzas: datos.total_tardanzas,
            id_notificacion: formulario.id_notificacion,
            correo_destinatario: datos.correo_destinatario,
            asunto: datos.asunto
          });
          avisar(`Notificación actualizada y correo enviado a ${envio.correo_destinatario}`);
        } else {
          avisar('Notificación actualizada');
        }
      }
      formulario = null;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo guardar: ' + error.message, 'error');
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminarNotificacion(porEliminar.id_notificacion);
      avisar('Notificación eliminada');
      porEliminar = null;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }
</script>

<Header titulo="Registro de notificaciones" subtitulo="Seguimiento y despacho de correos a acudientes por acumulación de 3 o más llegadas tarde">
  <div class="acciones-header">
    {#if pendientesCount > 0}
      <button class="btn btn-acento" on:click={enviarPendientes} disabled={despachando}>
        <Icono nombre="campana" tam={18} />
        {despachando ? 'Enviando correos...' : `Enviar pendientes (${pendientesCount})`}
      </button>
    {/if}
    <button class="btn btn-primario" on:click={nueva}><Icono nombre="mas" tam={18} /> Nueva notificación</button>
  </div>
</Header>

<Card titulo="Notificaciones del sistema">
  {#if cargando}
    <Cargando />
  {:else}
    <DataTable
      datos={notificaciones}
      {columnas}
      on:editar={prepararEdicion}
      on:eliminar={(e) => (porEliminar = e.detail)}
    />
  {/if}
</Card>

<div style="margin-top: 20px;">
  <Card titulo={`Envíos registrados en Base de Datos de Correos (Express MySQL: ${enviosConLog.length})`}>
    {#if cargando}
      <Cargando />
    {:else}
      <DataTable
        datos={enviosConLog}
        columnas={columnasExpress}
        acciones={false}
      />
    {/if}
  </Card>
</div>

<Modal
  abierto={formulario !== null}
  titulo={formulario?.id_notificacion === null ? 'Nueva notificación por correo' : 'Gestionar notificación'}
  on:cerrar={() => (formulario = null)}
>
  {#if formulario}
    <form on:submit={guardar}>
      {#if formulario.estudianteObj}
        <div class="elegido">
          <span>
            <strong>{formulario.estudianteObj.nombres} {formulario.estudianteObj.apellidos}</strong> ·
            {nombreCurso(formulario.estudianteObj.grado, formulario.estudianteObj.grupo)}
          </span>
          <button type="button" class="btn btn-claro" on:click={() => (formulario.estudianteObj = null)}>Cambiar</button>
        </div>
      {:else}
        <BuscadorEstudiante
          {estudiantes}
          on:seleccionar={alSeleccionarEstudiante}
        />
      {/if}
      <Campo etiqueta="Correo destinatario (Acudiente)" id="n-correo" tipo="email" bind:value={formulario.correo_destinatario} requerido />
      <Campo etiqueta="Asunto" id="n-asunto" bind:value={formulario.asunto} requerido maxlength={180} />
      <div class="rejilla-2">
        <Campo etiqueta="Total tardanzas" id="n-total" tipo="number" min={1} bind:value={formulario.total_tardanzas} requerido />
        <Selector etiqueta="Estado de envío" id="n-estado" bind:value={formulario.estado_envio} opciones={opcionesEstado} requerido />
      </div>

      <label class="check-envio">
        <input type="checkbox" bind:checked={formulario.enviar_ahora} />
        <span>Enviar correo electrónico al acudiente al guardar (vía Express)</span>
      </label>

      <div class="acciones-correo">
        <button type="button" class="btn btn-claro" on:click={verPlantillaModal}>
          Ver vista previa del correo
        </button>
        {#if formulario.id_notificacion !== null}
          <button type="button" class="btn btn-acento" on:click={despacharDesdeModal} disabled={despachando}>
            {despachando ? 'Enviando...' : 'Enviar / Reenviar correo ahora'}
          </button>
        {/if}
      </div>

      <div class="botones-formulario">
        <button type="button" class="btn btn-gris" on:click={() => (formulario = null)}>Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar</button>
      </div>
    </form>
  {/if}
</Modal>

<Modal
  abierto={vistaPrevia !== null}
  titulo="Vista previa del correo de alerta"
  ancho="680px"
  on:cerrar={() => (vistaPrevia = null)}
>
  {#if vistaPrevia}
    <div class="info-previa">
      <p><strong>Para:</strong> {vistaPrevia.correo_destinatario}</p>
      <p><strong>Asunto:</strong> {vistaPrevia.asunto}</p>
      {#if vistaPrevia.preview_url}
        <p>
          <strong>Buzón SMTP de prueba:</strong>
          <a href={vistaPrevia.preview_url} target="_blank" rel="noopener noreferrer">Abrir correo en Ethereal Mail ↗</a>
        </p>
      {/if}
    </div>
    <div class="marco-html">
      {@html vistaPrevia.html}
    </div>
  {/if}
</Modal>

<Confirmar
  abierto={porEliminar !== null}
  mensaje={`¿Eliminar la notificación de ${porEliminar?.estudiante}?`}
  on:confirmar={confirmarEliminar}
  on:cancelar={() => (porEliminar = null)}
/>

<style>
  .acciones-header {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .elegido {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    background: var(--azul-claro);
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 14px;
  }
  .check-envio {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
    font-size: 0.92rem;
    cursor: pointer;
  }
  .acciones-correo {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .info-previa {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
  .info-previa p {
    margin: 4px 0;
  }
  .marco-html {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    max-height: 65vh;
    overflow-y: auto;
  }
</style>
