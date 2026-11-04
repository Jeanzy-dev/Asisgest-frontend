<script>
  // Ventana emergente para los formularios de crear/editar
  import { createEventDispatcher } from 'svelte';
  import Icono from './Icono.svelte';

  export let abierto = false;
  export let titulo = '';

  const dispatch = createEventDispatcher();

  function cerrar() {
    dispatch('cerrar');
  }

  function teclado(evento) {
    if (abierto && evento.key === 'Escape') cerrar();
  }
</script>

<svelte:window on:keydown={teclado} />

{#if abierto}
  <div class="fondo" on:click|self={cerrar} role="presentation">
    <div class="ventana" role="dialog" aria-modal="true" aria-label={titulo}>
      <div class="ventana-cabecera">
        <h2>{titulo}</h2>
        <button class="cerrar" on:click={cerrar} aria-label="Cerrar"><Icono nombre="cerrar" /></button>
      </div>
      <div class="ventana-cuerpo">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .fondo {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    z-index: 100;
  }
  .ventana {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  }
  .ventana-cabecera {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    position: sticky; top: 0; background: white;
  }
  h2 { margin: 0; color: var(--azul); font-size: 1.2rem; }
  .cerrar { background: none; border: none; cursor: pointer; color: #555; padding: 4px; display: flex; }
  .ventana-cuerpo { padding: 20px; }
</style>
