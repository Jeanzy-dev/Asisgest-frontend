<script>
  // Confirmación antes de eliminar (reemplaza el confirm() del navegador)
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  export let abierto = false;
  export let mensaje = '¿Está seguro?';
  export let textoBoton = 'Eliminar';

  const dispatch = createEventDispatcher();
</script>

<Modal {abierto} titulo="Confirmar" on:cerrar={() => dispatch('cancelar')}>
  <p class="mensaje">{mensaje}</p>
  <p class="nota">El registro no se borra de la base de datos: queda inactivo (estado = false).</p>
  <div class="botones">
    <button class="btn btn-gris" on:click={() => dispatch('cancelar')}>Cancelar</button>
    <button class="btn btn-borrar" on:click={() => dispatch('confirmar')}>{textoBoton}</button>
  </div>
</Modal>

<style>
  .mensaje { font-size: 1.05rem; margin-top: 0; }
  .nota { color: #6b7280; font-size: 0.85rem; }
  .botones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
</style>
