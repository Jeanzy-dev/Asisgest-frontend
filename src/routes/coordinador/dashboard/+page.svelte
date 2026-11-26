<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import { avisar } from '#lib/stores/avisos.js';

  const URL_EMBED_LOCAL = '/tablero-embed';
  let urlPowerBiExterna = '';
  let usarUrlExterna = false;
  let modalConfig = false;

  onMount(() => {
    const guardada = localStorage.getItem('asisgest_powerbi_url') || import.meta.env.VITE_POWERBI_URL || '';
    if (guardada) {
      urlPowerBiExterna = guardada;
      usarUrlExterna = true;
    }
  });

  $: urlIframeActiva = usarUrlExterna && urlPowerBiExterna.trim()
    ? urlPowerBiExterna.trim()
    : URL_EMBED_LOCAL;

  function guardarUrlPowerBi(e) {
    e.preventDefault();
    if (urlPowerBiExterna.trim()) {
      localStorage.setItem('asisgest_powerbi_url', urlPowerBiExterna.trim());
      usarUrlExterna = true;
      avisar('URL de Power BI actualizada', 'exito');
    } else {
      localStorage.removeItem('asisgest_powerbi_url');
      usarUrlExterna = false;
      avisar('Usando tablero predeterminado');
    }
    modalConfig = false;
  }
</script>

<Header
  titulo="Dashboard"
  subtitulo="Indicadores y estadísticas de llegadas tarde en tiempo real"
>
  <div class="acciones-top">
    <button type="button" class="btn btn-primario" on:click={() => (modalConfig = true)}>
      Configurar URL Power BI
    </button>
  </div>
</Header>

<Card>
  {#if urlPowerBiExterna}
    <div class="barra-iframe">
      <div class="switch-origen">
        <button
          type="button"
          class="btn-mini"
          class:activo={!usarUrlExterna}
          on:click={() => (usarUrlExterna = false)}
        >
          Tablero local
        </button>
        <button
          type="button"
          class="btn-mini"
          class:activo={usarUrlExterna}
          on:click={() => (usarUrlExterna = true)}
        >
          Power BI Cloud
        </button>
      </div>
    </div>
  {/if}

  <div class="contenedor-iframe">
    <iframe
      title="Dashboard de Control de Llegadas Tarde"
      src={urlIframeActiva}
      frameborder="0"
      allowFullScreen={true}
      loading="lazy"
    ></iframe>
  </div>
</Card>

<Modal
  abierto={modalConfig}
  titulo="Configurar URL de Power BI"
  on:cerrar={() => (modalConfig = false)}
>
  <form on:submit={guardarUrlPowerBi}>
    <Campo
      etiqueta="URL de Power BI"
      id="pbi-url"
      bind:value={urlPowerBiExterna}
      placeholder="https://app.powerbi.com/view?r=..."
    />
    <div class="botones-formulario">
      <button
        type="button"
        class="btn btn-claro"
        on:click={() => {
          urlPowerBiExterna = '';
          usarUrlExterna = false;
          localStorage.removeItem('asisgest_powerbi_url');
          modalConfig = false;
        }}
      >
        Restablecer
      </button>
      <button type="submit" class="btn btn-primario">Guardar</button>
    </div>
  </form>
</Modal>

<style>
  .acciones-top {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .barra-iframe {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
  }
  .switch-origen {
    display: flex;
    gap: 6px;
  }
  .btn-mini {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #1e293b;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-mini.activo {
    background: #121023;
    color: #ffdf2d;
    border-color: #121023;
  }
  .contenedor-iframe {
    width: 100%;
    height: 820px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    background: #f1f5f9;
  }
  .contenedor-iframe iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
  @media (max-width: 768px) {
    .contenedor-iframe {
      height: 1150px;
    }
  }
</style>
