<script>
  // Lista desplegable. "opciones" = [{ valor, texto }].
  // Así el usuario escoge por nombre y nunca escribe un ID.
  export let etiqueta = '';
  export let id = '';
  export let value = '';
  export let opciones = [];
  export let requerido = false;
  export let vacio = 'Seleccione...';
</script>

<div class="campo">
  {#if etiqueta}
    <label for={id}>{etiqueta}{#if requerido}<span class="obligatorio">*</span>{/if}</label>
  {/if}
  <select {id} required={requerido} bind:value on:change>
    <option value="">{vacio}</option>
    {#each opciones as opcion (opcion.valor)}
      <option value={opcion.valor}>{opcion.texto}</option>
    {/each}
  </select>
</div>

<style>
  .campo { display: flex; flex-direction: column; margin-bottom: 14px; }
  label { font-weight: bold; margin-bottom: 6px; font-size: 0.92rem; }
  .obligatorio { color: var(--rojo); margin-left: 3px; }
  select {
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 1rem;
    background: white;
    font-family: inherit;
    width: 100%;
  }
  select:focus { outline: none; border-color: var(--azul); box-shadow: 0 0 0 3px var(--azul-claro); }
</style>
