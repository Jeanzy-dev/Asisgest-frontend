<script>
  // Tarjeta pequeña con un número importante (indicador)
  export let titulo = '';
  export let valor = 0;
  export let detalle = '';
  export let color = 'azul';
</script>

<div class="dato {color}">
  <span class="titulo">{titulo}</span>
  <strong>{valor}</strong>
  {#if detalle}<small>{detalle}</small>{/if}
</div>

<style>
  .dato {
    background: white;
    border-radius: 10px;
    padding: 16px 18px;
    border: 1px solid #e5e7eb;
    border-left: 5px solid var(--azul);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    display: flex; flex-direction: column; gap: 4px;
  }
  .titulo { color: #555; font-size: 0.88rem; }
  strong { font-size: 1.9rem; color: #111827; line-height: 1.1; }
  small { color: #6b7280; }
  .dorado { border-left-color: var(--dorado); }
  .verde { border-left-color: var(--verde); }
  .rojo { border-left-color: var(--rojo); }
</style>
