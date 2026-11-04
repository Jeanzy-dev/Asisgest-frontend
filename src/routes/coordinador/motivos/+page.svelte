<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Confirmar from '#lib/components/Confirmar.svelte';
  import Icono from '#lib/components/Icono.svelte';
  import { obtenerMotivos, crearMotivo, actualizarMotivo, eliminarMotivo } from '#lib/services/api_motivo.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { fechaHora } from '#lib/utils/formato.js';

  let motivos = [];
  let modalAbierto = false;
  let idEditando = null;
  let descripcion = '';
  let esJustificable = false;
  let porEliminar = null;

  const columnas = [
    { titulo: 'Descripción', campo: 'descripcion', prioridad: 1 },
    {
      titulo: 'Tipo', campo: 'es_justificable',
      formato: (v) => (v ? '<span class="etiqueta exito">Justificable</span>' : '<span class="etiqueta alerta">No justificable</span>')
    },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  async function cargarMotivos() {
    try {
      motivos = await obtenerMotivos();
    } catch (error) {
      avisar('No se pudo cargar la lista: ' + error.message, 'error');
    }
  }

  onMount(cargarMotivos);

  function limpiarFormulario() {
    idEditando = null;
    descripcion = '';
    esJustificable = false;
    modalAbierto = false;
  }

  function nuevo() {
    limpiarFormulario();
    modalAbierto = true;
  }

  function prepararEdicion(evento) {
    const m = evento.detail;
    idEditando = m.id_motivo;
    descripcion = m.descripcion;
    esJustificable = m.es_justificable;
    modalAbierto = true;
  }

  async function guardarMotivo(evento) {
    evento.preventDefault();
    const datos = { descripcion: descripcion.trim(), es_justificable: esJustificable };
    try {
      if (idEditando === null) {
        await crearMotivo(datos);
        avisar('Motivo registrado');
      } else {
        await actualizarMotivo(idEditando, datos);
        avisar('Motivo actualizado');
      }
      limpiarFormulario();
      await cargarMotivos();
    } catch (error) {
      avisar('No se pudo guardar: ' + error.message, 'error');
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminarMotivo(porEliminar.id_motivo);
      avisar('Motivo eliminado');
      porEliminar = null;
      await cargarMotivos();
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }
</script>

<Header titulo="Motivos de tardanza" subtitulo="Catálogo de motivos que se eligen al registrar una llegada tarde">
  <button class="btn btn-primario" on:click={nuevo}><Icono nombre="mas" tam={18} /> Nuevo motivo</button>
</Header>

<Card>
  <DataTable datos={motivos} {columnas} on:editar={prepararEdicion} on:eliminar={(e) => (porEliminar = e.detail)} />
</Card>

<Modal abierto={modalAbierto} titulo={idEditando === null ? 'Nuevo motivo' : 'Editar motivo'} on:cerrar={limpiarFormulario}>
  <form on:submit={guardarMotivo}>
    <Campo etiqueta="Descripción" id="descripcion" bind:value={descripcion} requerido maxlength={100} placeholder="Ej. Problemas de transporte" />
    <label class="casilla">
      <input type="checkbox" bind:checked={esJustificable} />
      Es justificable (por ejemplo, cita médica con soporte)
    </label>
    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={limpiarFormulario}>Cancelar</button>
      <button type="submit" class="btn btn-primario">{idEditando === null ? 'Registrar' : 'Guardar cambios'}</button>
    </div>
  </form>
</Modal>

<Confirmar abierto={porEliminar !== null} mensaje={`¿Eliminar el motivo "${porEliminar?.descripcion}"?`}
  on:confirmar={confirmarEliminar} on:cancelar={() => (porEliminar = null)} />

<style>
  .casilla { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; cursor: pointer; }
  .casilla input { width: 18px; height: 18px; }
</style>
