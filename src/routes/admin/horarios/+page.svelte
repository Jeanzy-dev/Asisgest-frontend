<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import Selector from '#lib/components/Selector.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Confirmar from '#lib/components/Confirmar.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import Icono from '#lib/components/Icono.svelte';
  import { obtenerHorarios, crearHorario, actualizarHorario, eliminarHorario } from '#lib/services/api_horario.js';
  import { obtenerCursos, crearCurso, actualizarCurso, eliminarCurso } from '#lib/services/api_curso.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, horaCorta, fechaHora, nombreCurso } from '#lib/utils/formato.js';

  let horarios = [];
  let cursos = [];
  let cargando = true;

  // Modal de horario
  let modalHorario = false;
  let idHorarioEditando = null;
  let idCursoElegido = '';
  let horaInicioTimbre = '06:45';
  let horaCierrePorton = '07:00';
  let toleranciaMinutos = 10;

  // Modal de salón
  let modalCurso = false;
  let idCursoEditando = null;
  let gradoCurso = 10;
  let grupoCurso = 'A';
  let jornadaCurso = 'MAÑANA';

  let porEliminarHorario = null;
  let porEliminarCurso = null;

  const opcionesJornada = [
    { valor: 'MAÑANA', texto: 'Mañana' },
    { valor: 'TARDE', texto: 'Tarde' },
    { valor: 'UNICA', texto: 'Única / Completa' }
  ];

  $: opcionesCursos = cursos.map((c) => ({
    valor: String(c.id_curso),
    texto: `${nombreCurso(c.grado, c.grupo)} — Jornada ${c.jornada}`
  }));

  const columnasHorarios = [
    {
      titulo: 'Salón / Grupo',
      campo: 'grado',
      prioridad: 1,
      formato: (v, f) => `<strong>${escapar(nombreCurso(f.grado, f.grupo))}</strong>`
    },
    { titulo: 'Jornada', campo: 'jornada', prioridad: 2 },
    {
      titulo: 'Hora timbre',
      campo: 'hora_inicio_timbre',
      formato: (v) => `<span class="etiqueta info">${horaCorta(v)}</span>`
    },
    {
      titulo: 'Cierre portón',
      campo: 'hora_cierre_porton',
      formato: (v) => `<span class="etiqueta alerta">${horaCorta(v)}</span>`
    },
    {
      titulo: 'Tolerancia',
      campo: 'tolerancia_minutos',
      formato: (v) => `${v ?? 0} min`
    },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  const columnasCursos = [
    {
      titulo: 'Salón',
      campo: 'grado',
      prioridad: 1,
      formato: (v, f) => `<strong>${escapar(nombreCurso(f.grado, f.grupo))}</strong>`
    },
    { titulo: 'Grado', campo: 'grado' },
    { titulo: 'Grupo', campo: 'grupo' },
    { titulo: 'Jornada', campo: 'jornada' },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  async function cargarDatos() {
    try {
      [horarios, cursos] = await Promise.all([obtenerHorarios(), obtenerCursos()]);
    } catch (error) {
      avisar('Error al cargar horarios y salones: ' + error.message, 'error');
    }
    cargando = false;
  }

  onMount(cargarDatos);

  function nuevoHorario() {
    idHorarioEditando = null;
    idCursoElegido = cursos[0] ? String(cursos[0].id_curso) : '';
    horaInicioTimbre = '06:45';
    horaCierrePorton = '07:00';
    toleranciaMinutos = 10;
    modalHorario = true;
  }

  function prepararEdicionHorario(evento) {
    const h = evento.detail;
    idHorarioEditando = h.id_clase_grupo;
    const cursoMatch =
      cursos.find((c) => Number(c.grado) === Number(h.grado) && c.grupo === h.grupo && c.jornada === h.jornada) ||
      cursos.find((c) => Number(c.id_curso) === Number(h.id_curso));
    idCursoElegido = cursoMatch ? String(cursoMatch.id_curso) : '';
    horaInicioTimbre = horaCorta(h.hora_inicio_timbre) || '06:45';
    horaCierrePorton = horaCorta(h.hora_cierre_porton) || '07:00';
    toleranciaMinutos = h.tolerancia_minutos ?? 10;
    modalHorario = true;
  }

  async function guardarHorario(evento) {
    evento.preventDefault();
    const salon = cursos.find((c) => String(c.id_curso) === String(idCursoElegido));
    if (!salon) {
      avisar('Seleccione un salón existente', 'alerta');
      return;
    }
    const datos = {
      grado: Number(salon.grado),
      grupo: salon.grupo,
      jornada: salon.jornada,
      hora_inicio_timbre: horaInicioTimbre,
      hora_cierre_porton: horaCierrePorton,
      tolerancia_minutos: Number(toleranciaMinutos)
    };
    try {
      if (idHorarioEditando === null) {
        await crearHorario(datos);
        avisar('Horario registrado correctamente');
      } else {
        await actualizarHorario(idHorarioEditando, datos);
        avisar('Horario actualizado correctamente');
      }
      modalHorario = false;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo guardar el horario: ' + error.message, 'error');
    }
  }

  async function confirmarEliminarHorario() {
    try {
      await eliminarHorario(porEliminarHorario.id_clase_grupo);
      avisar('Horario eliminado');
      porEliminarHorario = null;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }

  function nuevoCurso() {
    idCursoEditando = null;
    gradoCurso = 10;
    grupoCurso = 'A';
    jornadaCurso = 'MAÑANA';
    modalCurso = true;
  }

  function prepararEdicionCurso(evento) {
    const c = evento.detail;
    idCursoEditando = c.id_curso;
    gradoCurso = c.grado;
    grupoCurso = c.grupo;
    jornadaCurso = c.jornada;
    modalCurso = true;
  }

  async function guardarCurso(evento) {
    evento.preventDefault();
    const datos = {
      grado: Number(gradoCurso),
      grupo: grupoCurso.trim().toUpperCase(),
      jornada: jornadaCurso
    };
    try {
      if (idCursoEditando === null) {
        await crearCurso(datos);
        avisar('Salón registrado exitosamente');
      } else {
        await actualizarCurso(idCursoEditando, datos);
        avisar('Salón actualizado exitosamente');
      }
      modalCurso = false;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo guardar el salón: ' + error.message, 'error');
    }
  }

  async function confirmarEliminarCurso() {
    try {
      await eliminarCurso(porEliminarCurso.id_curso);
      avisar('Salón inactivado');
      porEliminarCurso = null;
      await cargarDatos();
    } catch (error) {
      avisar('No se pudo eliminar el salón: ' + error.message, 'error');
    }
  }
</script>

<Header titulo="Horarios y salones" subtitulo="Configure los salones y la hora de inicio de primera clase por grupo">
  <button class="btn btn-claro" on:click={nuevoCurso}><Icono nombre="mas" tam={18} /> Nuevo salón</button>
  <button class="btn btn-primario" on:click={nuevoHorario}><Icono nombre="mas" tam={18} /> Nuevo horario</button>
</Header>

{#if cargando}
  <Cargando />
{:else}
  <Card titulo="Horarios de primera clase por grupo">
    <DataTable
      datos={horarios}
      columnas={columnasHorarios}
      on:editar={prepararEdicionHorario}
      on:eliminar={(e) => (porEliminarHorario = e.detail)}
    />
  </Card>

  <Card titulo="Salones existentes">
    <DataTable
      datos={cursos}
      columnas={columnasCursos}
      on:editar={prepararEdicionCurso}
      on:eliminar={(e) => (porEliminarCurso = e.detail)}
    />
  </Card>
{/if}

<Modal abierto={modalHorario} titulo={idHorarioEditando === null ? 'Nuevo horario por salón' : 'Editar horario'} on:cerrar={() => (modalHorario = false)}>
  <form on:submit={guardarHorario}>
    <Selector etiqueta="Salón existente" id="h-curso" bind:value={idCursoElegido} opciones={opcionesCursos} requerido />
    <div class="rejilla-2">
      <Campo etiqueta="Hora inicio timbre" id="h-timbre" tipo="time" bind:value={horaInicioTimbre} requerido />
      <Campo etiqueta="Hora cierre portón" id="h-porton" tipo="time" bind:value={horaCierrePorton} requerido />
    </div>
    <Campo etiqueta="Tolerancia (minutos)" id="h-tol" tipo="number" min={0} max={60} bind:value={toleranciaMinutos} requerido />
    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={() => (modalHorario = false)}>Cancelar</button>
      <button type="submit" class="btn btn-primario">{idHorarioEditando === null ? 'Registrar' : 'Guardar cambios'}</button>
    </div>
  </form>
</Modal>

<Modal abierto={modalCurso} titulo={idCursoEditando === null ? 'Nuevo salón' : 'Editar salón'} on:cerrar={() => (modalCurso = false)}>
  <form on:submit={guardarCurso}>
    <div class="rejilla-2">
      <Campo etiqueta="Grado" id="c-grado" tipo="number" min={1} max={11} bind:value={gradoCurso} requerido />
      <Campo etiqueta="Grupo" id="c-grupo" bind:value={grupoCurso} maxlength={5} placeholder="Ej. A, B" requerido />
    </div>
    <Selector etiqueta="Jornada" id="c-jornada" bind:value={jornadaCurso} opciones={opcionesJornada} requerido />
    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={() => (modalCurso = false)}>Cancelar</button>
      <button type="submit" class="btn btn-primario">{idCursoEditando === null ? 'Crear salón' : 'Guardar cambios'}</button>
    </div>
  </form>
</Modal>

<Confirmar
  abierto={porEliminarHorario !== null}
  mensaje={`¿Eliminar el horario del salón ${porEliminarHorario ? nombreCurso(porEliminarHorario.grado, porEliminarHorario.grupo) : ''}?`}
  on:confirmar={confirmarEliminarHorario}
  on:cancelar={() => (porEliminarHorario = null)}
/>

<Confirmar
  abierto={porEliminarCurso !== null}
  mensaje={`¿Eliminar el salón ${porEliminarCurso ? nombreCurso(porEliminarCurso.grado, porEliminarCurso.grupo) : ''}?`}
  on:confirmar={confirmarEliminarCurso}
  on:cancelar={() => (porEliminarCurso = null)}
/>
