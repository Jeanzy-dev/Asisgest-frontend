<script>
  export let titulo = 'Título';
  export let subtitulo = '';
</script>

<header class="encabezado">
  <div>
    <h1>{titulo}</h1>
    {#if subtitulo}
      <p>{subtitulo}</p>
    {/if}
  </div>
  <!-- Espacio para botones a la derecha del título (ej. "Nuevo") -->
  <div class="encabezado-acciones"><slot /></div>
</header>

<style>
  .encabezado {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .encabezado h1 { margin: 0; color: var(--azul); font-size: 1.6rem; }
  .encabezado p { margin: 4px 0 0 0; color: #555; }
  .encabezado-acciones { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
