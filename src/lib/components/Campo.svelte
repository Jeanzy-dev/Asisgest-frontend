<script>
  // Etiqueta + caja de texto. Se usa en todos los formularios.
  export let etiqueta = '';
  export let id = '';
  export let tipo = 'text';
  export let value = '';
  export let placeholder = '';
  export let requerido = false;
  export let ayuda = '';
  export let min = undefined;
  export let max = undefined;
  export let maxlength = undefined;
  export let patron = undefined;
</script>

<div class="campo">
  <label for={id}>{etiqueta}{#if requerido}<span class="obligatorio">*</span>{/if}</label>
  {#if tipo === 'textarea'}
    <textarea {id} {placeholder} required={requerido} {maxlength} rows="3" bind:value></textarea>
  {:else}
    <input {id} type={tipo} {placeholder} required={requerido} {min} {max} {maxlength} pattern={patron} bind:value />
  {/if}
  {#if ayuda}<small>{ayuda}</small>{/if}
</div>

<style>
  .campo { display: flex; flex-direction: column; margin-bottom: 14px; }
  label { font-weight: bold; margin-bottom: 6px; font-size: 0.92rem; }
  .obligatorio { color: var(--rojo); margin-left: 3px; }
  input, textarea {
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }
  input:focus, textarea:focus { outline: none; border-color: var(--azul); box-shadow: 0 0 0 3px var(--azul-claro); }
  small { color: #666; margin-top: 4px; }
</style>
