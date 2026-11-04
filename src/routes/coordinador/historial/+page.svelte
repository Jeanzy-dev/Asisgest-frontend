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
  import { obtenerLlegadas, crearLlegada, actualizarLlegada, eliminarLlegada } from '#lib/services/api_asistencia.js';
  import { obtenerEstudiantes } from '#lib/services/api_estudiante.js';
  import { obtenerMotivos } from '#lib/services/api_motivo.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, fechaCorta, horaCorta, hoyISO, horaActual, nombreCurso } from '#lib/utils/formato.js';

  let registros = [];
  let estudiantes = [];
  let motivos = [];
  let cargando = true;
  let desde = hoyISO(30);
  let hasta = hoyISO();

  let formulario = null;
  let porEliminar = null;

  $: opcionesMotivo = motivos.map((m) => ({ valor: m.id_motivo, texto: m.descripcion }));

  const columnas = [
    { titulo: 'Fecha', campo: 'fecha', formato: (v) => fechaCorta(v) },
    { titulo: 'Hora', campo: 'hora_llegada', formato: (v) => horaCorta(v) },
    { titulo: 'Estudiante', campo: 'estudiante', prioridad: 1 },
    { titulo: 'Documento', campo: 'documento' },
    { titulo: 'Curso', campo: 'grado', formato: (v, f) => nombreCurso(f.grado, f.grupo) },
    { titulo: 'Motivo', campo: 'motivo', formato: (v, f) => `<span class="etiqueta ${f.es_justificable ? 'exito' : 'alerta'}">${escapar(v)}</span>` },
    { titulo: 'Min.', campo: 'minutos_tarde' },
    { titulo: 'Registró', campo: 'registrado_por' },
    { titulo: 'Observaciones', campo: 'observaciones' }
  ];

  async function cargarRegistros() {
    try {
      registros = await obtenerLlegadas({ desde, hasta });
    } catch (error) {
      avisar('No se pudo cargar el historial: ' + error.message, 'error');
    }
  }

  onMount(async () => {
    try {
      [estudiantes, motivos] = await Promise.all([obtenerEstudiantes(), obtenerMotivos()]);
    } catch (error) {
      avisar(error.message, 'error');
    }
    await cargarRegistros();
    cargando = false;
  });

  function nuevo() {
    formulario = { id: null, estudiante: null, id_motivo: '', fecha: hoyISO(), hora_llegada: horaActual(), observaciones: '' };
  }

  function prepararEdicion(evento) {
    const r = evento.detail;
    formulario = {
      id: r.id,
      estudiante: { id_estudiante: r.id_estudiante, nombres: r.estudiante, apellidos: '', grado: r.grado, grupo: r.grupo },
      id_motivo: r.id_motivo,
      fecha: r.fecha,
      hora_llegada: horaCorta(r.hora_llegada),
      observaciones: r.observaciones || ''
    };
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (!formulario.estudiante) {
      avisar('Seleccione el estudiante', 'alerta');
      return;
    }
    const datos = {
      id_estudiante: formulario.estudiante.id_estudiante,
      id_motivo: Number(formulario.id_motivo),
      fecha: formulario.fecha,
      hora_llegada: formulario.hora_llegada,
      observaciones: formulario.observaciones || null
    };
    try {
      if (formulario.id === null) {
        const r = await crearLlegada(datos);
        avisar(`Llegada registrada (${r.minutos_tarde} min tarde)`);
        if (r.alerta?.notificacion_creada) avisar('Se generó una alerta para el acudiente', 'alerta', 7000);
      } else {
        await actualizarLlegada(formulario.id, datos);
        avisar('Registro actualizado');
      }
      formulario = null;
      await cargarRegistros();
    } catch (error) {
      avisar('No se pudo guardar: ' + error.message, 'error');
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminarLlegada(porEliminar.id);
      avisar('Registro eliminado');
      porEliminar = null;
      await cargarRegistros();
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }
</script>

<Header titulo="Historial de llegadas tarde" subtitulo="Consulte, corrija o registre llegadas de días anteriores">
  <button class="btn btn-primario" on:click={nuevo}><Icono nombre="mas" tam={18} /> Nuevo registro</button>
</Header>

<Card>
  <form class="filtros" on:submit|preventDefault={cargarRegistros}>
    <Campo etiqueta="Desde" id="desde" tipo="date" bind:value={desde} />
    <Campo etiqueta="Hasta" id="hasta" tipo="date" bind:value={hasta} />
    <button type="submit" class="btn btn-primario">Filtrar</button>
  </form>
  {#if cargando}
    <Cargando />
  {:else}
    <DataTable datos={registros} {columnas} on:editar={prepararEdicion} on:eliminar={(e) => (porEliminar = e.detail)} />
  {/if}
</Card>

<Modal abierto={formulario !== null} titulo={formulario?.id === null ? 'Registrar llegada tarde' : 'Editar llegada tarde'} on:cerrar={() => (formulario = null)}>
  {#if formulario}
    <form on:submit={guardar}>
      {#if formulario.estudiante}
        <div class="elegido">
          <span><strong>{formulario.estudiante.nombres} {formulario.estudiante.apellidos}</strong> · {nombreCurso(formulario.estudiante.grado, formulario.estudiante.grupo)}</span>
          {#if formulario.id === null}
            <button type="button" class="btn btn-claro" on:click={() => (formulario.estudiante = null)}>Cambiar</button>
          {/if}
        </div>
      {:else}
        <BuscadorEstudiante {estudiantes} on:seleccionar={(e) => (formulario.estudiante = e.detail)} />
      {/if}
      <Selector etiqueta="Motivo" id="h-motivo" bind:value={formulario.id_motivo} opciones={opcionesMotivo} requerido />
      <div class="rejilla-2">
        <Campo etiqueta="Fecha" id="h-fecha" tipo="date" bind:value={formulario.fecha} max={hoyISO()} requerido />
        <Campo etiqueta="Hora de llegada" id="h-hora" tipo="time" bind:value={formulario.hora_llegada} requerido />
      </div>
      <Campo etiqueta="Observaciones" id="h-obs" tipo="textarea" bind:value={formulario.observaciones} maxlength={300} />
      <div class="botones-formulario">
        <button type="button" class="btn btn-gris" on:click={() => (formulario = null)}>Cancelar</button>
        <button type="submit" class="btn btn-primario">{formulario.id === null ? 'Registrar' : 'Guardar cambios'}</button>
      </div>
    </form>
  {/if}
</Modal>

<Confirmar abierto={porEliminar !== null}
  mensaje={`¿Eliminar la llegada tarde de ${porEliminar?.estudiante} del ${fechaCorta(porEliminar?.fecha)}?`}
  on:confirmar={confirmarEliminar} on:cancelar={() => (porEliminar = null)} />

<style>
  .filtros { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 8px; }
  .filtros :global(.campo) { min-width: 160px; }
  .filtros .btn { margin-bottom: 14px; }
  .elegido {
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
    background: var(--azul-claro); padding: 10px 12px; border-radius: 8px; margin-bottom: 14px;
  }
</style>
