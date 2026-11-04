<script>
  export let titulo = '';
</script>

<div class="tarjeta">
  {#if titulo}<h2>{titulo}</h2>{/if}
  <slot />
</div>

<style>
  .tarjeta {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    min-width: 0;
  }
  h2 { margin: 0 0 14px; color: var(--azul); font-size: 1.15rem; }
  @media (max-width: 600px) {
    .tarjeta { padding: 14px; }
  }
</style>
