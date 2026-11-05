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
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, fechaHora, nombreCurso } from '#lib/utils/formato.js';

  let notificaciones = [];
  let estudiantes = [];
  let cargando = true;

  let formulario = null;
  let porEliminar = null;

  const opcionesEstado = [
    { valor: 'PENDIENTE', texto: 'Pendiente' },
    { valor: 'ENVIADO', texto: 'Enviado' },
    { valor: 'FALLIDO', texto: 'Fallido' }
  ];

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

  async function cargarDatos() {
    try {
      [notificaciones, estudiantes] = await Promise.all([obtenerNotificaciones(), obtenerEstudiantes()]);
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
      asunto: 'Alerta por acumulación de llegadas tarde',
      estado_envio: 'PENDIENTE'
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
      estado_envio: n.estado_envio || 'PENDIENTE'
    };
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
        await crearNotificacion(datos);
        avisar('Notificación registrada');
      } else {
        await actualizarNotificacion(formulario.id_notificacion, datos);
        avisar('Notificación actualizada');
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

<Header titulo="Registro de notificaciones" subtitulo="Seguimiento de alertas generadas a los acudientes por acumulación de llegadas tarde">
  <button class="btn btn-primario" on:click={nueva}><Icono nombre="mas" tam={18} /> Nueva notificación</button>
</Header>

<Card>
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

<Modal
  abierto={formulario !== null}
  titulo={formulario?.id_notificacion === null ? 'Nueva notificación' : 'Editar notificación'}
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
          on:seleccionar={(e) => {
            formulario.estudianteObj = e.detail;
            formulario.total_tardanzas = e.detail.total_tardanzas || 3;
          }}
        />
      {/if}
      <Campo etiqueta="Correo destinatario" id="n-correo" tipo="email" bind:value={formulario.correo_destinatario} requerido />
      <Campo etiqueta="Asunto" id="n-asunto" bind:value={formulario.asunto} requerido maxlength={180} />
      <div class="rejilla-2">
        <Campo etiqueta="Total tardanzas" id="n-total" tipo="number" min={1} bind:value={formulario.total_tardanzas} requerido />
        <Selector etiqueta="Estado de envío" id="n-estado" bind:value={formulario.estado_envio} opciones={opcionesEstado} requerido />
      </div>
      <div class="botones-formulario">
        <button type="button" class="btn btn-gris" on:click={() => (formulario = null)}>Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar</button>
      </div>
    </form>
  {/if}
</Modal>

<Confirmar
  abierto={porEliminar !== null}
  mensaje={`¿Eliminar la notificación de ${porEliminar?.estudiante}?`}
  on:confirmar={confirmarEliminar}
  on:cancelar={() => (porEliminar = null)}
/>

<style>
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
</style>
