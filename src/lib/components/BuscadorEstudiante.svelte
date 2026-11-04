<script>
  // Busca estudiantes por nombre, documento o curso mientras se escribe.
  // Se reutiliza en: registrar llegadas (varios a la vez), vínculos de acudientes y notificaciones.
  import { createEventDispatcher } from 'svelte';
  import Icono from './Icono.svelte';
  import { nombreCurso } from '#lib/utils/formato.js';

  export let estudiantes = [];
  export let etiqueta = 'Buscar estudiante';
  export let excluir = [];        // ids ya seleccionados (no se repiten)
  export let limite = 8;

  const dispatch = createEventDispatcher();
  let texto = '';
  let entrada;

  function normalizar(valor) {
    return String(valor ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  $: busqueda = normalizar(texto.trim());
  $: resultados = busqueda.length < 2 ? [] : estudiantes
    .filter((e) => !excluir.includes(e.id_estudiante))
    .filter((e) => {
      const curso = nombreCurso(e.grado, e.grupo);
      return normalizar(`${e.nombres} ${e.apellidos} ${e.documento} ${curso}`).includes(busqueda);
    })
    .slice(0, limite);

  function elegir(estudiante) {
    dispatch('seleccionar', estudiante);
    texto = '';
    entrada?.focus();
  }

  function teclado(evento) {
    // Enter elige el primer resultado: registro rápido sin usar el mouse
    if (evento.key === 'Enter' && resultados.length > 0) {
      evento.preventDefault();
      elegir(resultados[0]);
    }
  }

  export function enfocar() {
    entrada?.focus();
  }
</script>

<div class="buscador">
  <label for="buscar-estudiante">{etiqueta}</label>
  <div class="caja">
    <Icono nombre="buscar" tam={18} />
    <input id="buscar-estudiante" bind:this={entrada} bind:value={texto} on:keydown={teclado}
      placeholder="Nombre, apellido, documento o curso (ej. 10°A)" autocomplete="off" />
  </div>
  {#if resultados.length > 0}
    <ul class="resultados">
      {#each resultados as e (e.id_estudiante)}
        <li>
          <button type="button" on:click={() => elegir(e)}>
            <span>
              <strong>{e.apellidos} {e.nombres}</strong>
              <small>Doc. {e.documento} · {nombreCurso(e.grado, e.grupo)} · {e.jornada}</small>
            </span>
            {#if e.total_tardanzas !== undefined}
              <span class="conteo" class:alto={e.total_tardanzas >= 3}>{e.total_tardanzas} tardanzas</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else if busqueda.length >= 2}
    <p class="vacio">No se encontró ningún estudiante con "{texto}".</p>
  {/if}
</div>

<style>
  .buscador { margin-bottom: 14px; position: relative; }
  label { font-weight: bold; display: block; margin-bottom: 6px; font-size: 0.92rem; }
  .caja {
    display: flex; align-items: center; gap: 8px;
    border: 2px solid var(--azul); border-radius: 8px;
    padding: 0 12px; background: white; color: var(--azul);
  }
  input { border: none; outline: none; padding: 12px 0; font-size: 1.05rem; width: 100%; font-family: inherit; }
  .resultados {
    list-style: none; margin: 6px 0 0; padding: 0;
    border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
  .resultados li + li { border-top: 1px solid #f1f5f9; }
  .resultados button {
    width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px;
    background: white; border: none; padding: 10px 14px; cursor: pointer; text-align: left; font-family: inherit;
  }
  .resultados button:hover { background: var(--azul-claro); }
  .resultados strong { display: block; color: #111827; }
  .resultados small { color: #6b7280; }
  .conteo { font-size: 0.78rem; background: #f3f4f6; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
  .conteo.alto { background: #fee2e2; color: #991b1b; font-weight: bold; }
  .vacio { color: #6b7280; margin: 8px 0 0; }
</style>
