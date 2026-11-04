<script>
  // FUNCIÓN PRINCIPAL DEL PROYECTO: registrar las llegadas tarde en la portería.
  import { onMount, onDestroy } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import BuscadorEstudiante from '#lib/components/BuscadorEstudiante.svelte';
  import Selector from '#lib/components/Selector.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Confirmar from '#lib/components/Confirmar.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import { obtenerEstudiantes } from '#lib/services/api_estudiante.js';
  import { obtenerMotivos } from '#lib/services/api_motivo.js';
  import { obtenerLlegadas, crearLlegada, actualizarLlegada, eliminarLlegada } from '#lib/services/api_asistencia.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, horaCorta, hoyISO, horaActual, nombreCurso } from '#lib/utils/formato.js';

  let estudiantes = [];
  let motivos = [];
  let llegadasHoy = [];
  let cargando = true;
  let guardando = false;

  // Formulario de registro
  let seleccionados = [];
  let idMotivo = '';
  let hora = horaActual();
  let fecha = hoyISO();
  let observaciones = '';
  let buscador;

  let ahora = new Date();
  const reloj = setInterval(() => (ahora = new Date()), 30000);
  onDestroy(() => clearInterval(reloj));
  $: fechaLarga = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  $: horaReloj = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  $: totalHoy = llegadasHoy.length;

  function etiquetaMinutos(minutos) {
    const clase = minutos > 30 ? 'peligro' : minutos > 10 ? 'alerta' : 'info';
    return `<span class="etiqueta ${clase}">${minutos ?? 0} min</span>`;
  }

  // Edición
  let editando = null;
  let porEliminar = null;

  $: opcionesMotivo = motivos.map((m) => ({
    valor: m.id_motivo,
    texto: m.descripcion + (m.es_justificable ? ' (justificable)' : '')
  }));

  const columnas = [
    { titulo: 'Hora', campo: 'hora_llegada', formato: (v) => `<strong>${horaCorta(v)}</strong>`, prioridad: 2 },
    {
      titulo: 'Estudiante', campo: 'estudiante', prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>${nombreCurso(f.grado, f.grupo)} · ${escapar(f.jornada)}</small></div>`
    },
    { titulo: 'Motivo', campo: 'motivo', formato: (v, f) => `<span class="etiqueta ${f.es_justificable ? 'exito' : 'alerta'}">${escapar(v)}</span>`, prioridad: 4, envolver: true },
    { titulo: 'Retraso', campo: 'minutos_tarde', formato: (v) => etiquetaMinutos(v), prioridad: 3 },
    { titulo: 'Observaciones', campo: 'observaciones', prioridad: 20 }
  ];

  async function cargarListas() {
    try {
      [estudiantes, motivos] = await Promise.all([obtenerEstudiantes(), obtenerMotivos()]);
    } catch (error) {
      avisar('No se pudieron cargar los datos: ' + error.message, 'error');
    }
  }

  async function cargarLlegadasHoy() {
    try {
      llegadasHoy = await obtenerLlegadas({ desde: hoyISO(), hasta: hoyISO() });
    } catch (error) {
      avisar('No se pudo cargar la lista de hoy: ' + error.message, 'error');
    }
  }

  onMount(async () => {
    await Promise.all([cargarListas(), cargarLlegadasHoy()]);
    cargando = false;
  });

  function agregar(evento) {
    seleccionados = [...seleccionados, evento.detail];
  }

  function quitar(id) {
    seleccionados = seleccionados.filter((e) => e.id_estudiante !== id);
  }

  async function registrar(evento) {
    evento.preventDefault();
    if (seleccionados.length === 0) {
      avisar('Busque y seleccione al menos un estudiante', 'alerta');
      return;
    }
    guardando = true;
    let correctos = 0;
    for (const estudiante of seleccionados) {
      try {
        const respuesta = await crearLlegada({
          id_estudiante: estudiante.id_estudiante,
          id_motivo: Number(idMotivo),
          fecha: fecha,
          hora_llegada: hora,
          observaciones: observaciones || null
        });
        correctos++;
        if (respuesta.alerta?.notificacion_creada) {
          avisar(`⚠ ${estudiante.nombres} completó ${respuesta.alerta.total_tardanzas} tardanzas: se generó alerta para el acudiente`, 'alerta', 8000);
        } else if (respuesta.alerta && !respuesta.alerta.notificacion_creada) {
          avisar(`⚠ ${estudiante.nombres} completó ${respuesta.alerta.total_tardanzas} tardanzas pero no tiene acudiente registrado`, 'alerta', 8000);
        }
      } catch (error) {
        avisar(`No se pudo registrar a ${estudiante.nombres}: ${error.message}`, 'error');
      }
    }
    if (correctos > 0) {
      avisar(correctos === 1 ? 'Llegada tarde registrada' : `${correctos} llegadas tarde registradas`);
    }
    seleccionados = [];
    observaciones = '';
    hora = horaActual();
    guardando = false;
    await Promise.all([cargarLlegadasHoy(), cargarListas()]);
    buscador?.enfocar();
  }

  function prepararEdicion(evento) {
    const r = evento.detail;
    editando = {
      id: r.id,
      id_estudiante: r.id_estudiante,
      estudiante: r.estudiante,
      id_motivo: r.id_motivo,
      fecha: r.fecha,
      hora_llegada: horaCorta(r.hora_llegada),
      observaciones: r.observaciones || ''
    };
  }

  async function guardarEdicion(evento) {
    evento.preventDefault();
    try {
      await actualizarLlegada(editando.id, {
        id_estudiante: editando.id_estudiante,
        id_motivo: Number(editando.id_motivo),
        fecha: editando.fecha,
        hora_llegada: editando.hora_llegada,
        observaciones: editando.observaciones || null
      });
      avisar('Registro actualizado');
      editando = null;
      await cargarLlegadasHoy();
    } catch (error) {
      avisar('No se pudo actualizar: ' + error.message, 'error');
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminarLlegada(porEliminar.id);
      avisar('Registro eliminado');
      porEliminar = null;
      await Promise.all([cargarLlegadasHoy(), cargarListas()]);
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }
</script>

<Header titulo="Registrar llegadas tarde" subtitulo="Busque al estudiante, selecciónelo con Enter o clic y registre. Puede agregar varios a la vez.">
  <div class="reloj" aria-label="Fecha y hora actual">
    <span class="reloj-hora">{horaReloj}</span>
    <span class="reloj-fecha">{fechaLarga}</span>
  </div>
</Header>

{#if cargando}
  <Cargando />
{:else}
  <div class="distribucion">
    <Card titulo="Registro rápido">
      <form on:submit={registrar}>
        <BuscadorEstudiante bind:this={buscador} {estudiantes} excluir={seleccionados.map((e) => e.id_estudiante)} on:seleccionar={agregar} />

        <div class="seleccionados">
          <span class="rotulo">Estudiantes seleccionados ({seleccionados.length})</span>
          {#if seleccionados.length === 0}
            <p class="vacio">Aún no ha seleccionado estudiantes.</p>
          {:else}
            <ul>
              {#each seleccionados as e (e.id_estudiante)}
                <li>
                  <span>
                    <strong>{e.nombres} {e.apellidos}</strong>
                    <small>{nombreCurso(e.grado, e.grupo)} · {e.total_tardanzas} tardanzas previas</small>
                  </span>
                  <button type="button" on:click={() => quitar(e.id_estudiante)} aria-label="Quitar">✕</button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <Selector etiqueta="Motivo" id="motivo" bind:value={idMotivo} opciones={opcionesMotivo} requerido />
        <div class="rejilla-2">
          <Campo etiqueta="Hora de llegada" id="hora" tipo="time" bind:value={hora} requerido ayuda="Los minutos tarde se calculan con el horario del grupo" />
          <Campo etiqueta="Fecha" id="fecha" tipo="date" bind:value={fecha} max={hoyISO()} requerido />
        </div>
        <Campo etiqueta="Observaciones" id="observaciones" tipo="textarea" bind:value={observaciones} maxlength={300} placeholder="Opcional" />

        <div class="botones-formulario">
          <button type="submit" class="btn btn-acento grande" disabled={guardando || seleccionados.length === 0}>
            {guardando ? 'Registrando...' : `Registrar ${seleccionados.length > 1 ? seleccionados.length + ' llegadas' : 'llegada'}`}
          </button>
        </div>
      </form>
    </Card>

    <Card titulo={`Llegadas tarde de hoy (${totalHoy})`}>
      <DataTable datos={llegadasHoy} {columnas} on:editar={prepararEdicion} on:eliminar={(e) => (porEliminar = e.detail)} />
    </Card>
  </div>
{/if}

<Modal abierto={editando !== null} titulo="Editar llegada tarde" on:cerrar={() => (editando = null)}>
  {#if editando}
    <form on:submit={guardarEdicion}>
      <p><strong>Estudiante:</strong> {editando.estudiante}</p>
      <Selector etiqueta="Motivo" id="ed-motivo" bind:value={editando.id_motivo} opciones={opcionesMotivo} requerido />
      <div class="rejilla-2">
        <Campo etiqueta="Fecha" id="ed-fecha" tipo="date" bind:value={editando.fecha} requerido />
        <Campo etiqueta="Hora de llegada" id="ed-hora" tipo="time" bind:value={editando.hora_llegada} requerido />
      </div>
      <Campo etiqueta="Observaciones" id="ed-obs" tipo="textarea" bind:value={editando.observaciones} maxlength={300} />
      <div class="botones-formulario">
        <button type="button" class="btn btn-gris" on:click={() => (editando = null)}>Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar cambios</button>
      </div>
    </form>
  {/if}
</Modal>

<Confirmar abierto={porEliminar !== null} mensaje={`¿Eliminar la llegada tarde de ${porEliminar?.estudiante} (${horaCorta(porEliminar?.hora_llegada)})?`}
  on:confirmar={confirmarEliminar} on:cancelar={() => (porEliminar = null)} />

<style>
  .distribucion { display: grid; grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); gap: 24px; align-items: start; }
  .distribucion > :global(*) { min-width: 0; }
  .reloj {
    display: flex; flex-direction: column; align-items: flex-end;
    background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  .reloj-hora { font-size: 1.5rem; font-weight: bold; color: var(--azul); font-variant-numeric: tabular-nums; line-height: 1.1; }
  .reloj-fecha { font-size: 0.82rem; color: #555; }
  .reloj-fecha::first-letter { text-transform: uppercase; }
  .seleccionados { margin-bottom: 14px; }
  .rotulo { font-weight: bold; font-size: 0.92rem; }
  .vacio { color: #6b7280; margin: 6px 0 0; font-size: 0.9rem; }
  ul { list-style: none; padding: 0; margin: 6px 0 0; display: flex; flex-direction: column; gap: 6px; }
  li {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--azul-claro); border-radius: 8px; padding: 8px 12px;
  }
  li strong { display: block; font-size: 0.95rem; }
  li small { color: #475569; }
  li button { background: none; border: none; cursor: pointer; color: var(--rojo); font-size: 1rem; padding: 4px 8px; }
  .grande { width: 100%; padding: 14px; font-size: 1.05rem; }
  @media (max-width: 980px) {
    .distribucion { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .reloj { flex-direction: row; align-items: baseline; gap: 8px; padding: 6px 12px; }
    .reloj-hora { font-size: 1.1rem; }
  }
</style>