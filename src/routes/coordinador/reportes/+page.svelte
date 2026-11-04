<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import TarjetaDato from '#lib/components/TarjetaDato.svelte';
  import Grafico from '#lib/components/Grafico.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import { obtenerResumen } from '#lib/services/api_reporte.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { hoyISO, fechaCorta } from '#lib/utils/formato.js';

  let desde = hoyISO(30);
  let hasta = hoyISO();
  let resumen = null;
  let hoy = null;
  let cargando = true;

  const columnasEstudiantes = [
    { titulo: 'Estudiante', campo: 'estudiante', prioridad: 1 },
    { titulo: 'Curso', campo: 'curso' },
    { titulo: 'Tardanzas', campo: 'total', prioridad: 2 }
  ];
  const columnasCursos = [
    { titulo: 'Curso', campo: 'curso', prioridad: 1 },
    { titulo: 'Llegadas tarde', campo: 'total', prioridad: 2 }
  ];

  async function cargarResumen() {
    if (desde > hasta) {
      avisar('La fecha "Desde" no puede ser posterior a "Hasta"', 'alerta');
      return;
    }
    cargando = true;
    try {
      [resumen, hoy] = await Promise.all([obtenerResumen(desde, hasta), obtenerResumen(hoyISO(), hoyISO())]);
    } catch (error) {
      avisar('No se pudo cargar el reporte: ' + error.message, 'error');
    }
    cargando = false;
  }

  onMount(cargarResumen);

  function rapido(dias) {
    desde = hoyISO(dias);
    hasta = hoyISO();
    cargarResumen();
  }
</script>

<Header titulo="Reportes de llegadas tarde" subtitulo="Seguimiento por periodo, curso, motivo y estudiante" />

<Card>
  <form class="filtros" on:submit|preventDefault={cargarResumen}>
    <Campo etiqueta="Desde" id="desde" tipo="date" bind:value={desde} max={hasta} />
    <Campo etiqueta="Hasta" id="hasta" tipo="date" bind:value={hasta} max={hoyISO()} />
    <button type="submit" class="btn btn-primario">Consultar</button>
    <div class="rapidos">
      <button type="button" class="btn btn-claro" on:click={() => rapido(6)}>Últimos 7 días</button>
      <button type="button" class="btn btn-claro" on:click={() => rapido(29)}>Últimos 30 días</button>
    </div>
  </form>
</Card>

{#if cargando && !resumen}
  <Cargando />
{:else if resumen}
  <div class="rejilla-datos">
    <TarjetaDato titulo="Llegadas tarde hoy" valor={hoy?.totales.total_tardanzas ?? 0} detalle={fechaCorta(hoyISO())} />
    <TarjetaDato titulo="En el periodo" valor={resumen.totales.total_tardanzas}
      detalle={`${fechaCorta(resumen.desde)} a ${fechaCorta(resumen.hasta)}`} color="dorado" />
    <TarjetaDato titulo="Estudiantes distintos" valor={resumen.totales.estudiantes_distintos}
      detalle={`${resumen.totales.justificadas} con motivo justificable`} color="verde" />
    <TarjetaDato titulo="Promedio de retraso" valor={`${resumen.totales.promedio_minutos} min`} detalle="Minutos después del timbre" color="rojo" />
  </div>

  <div class="graficos">
    <Card titulo="Llegadas tarde por día">
      <Grafico tipo="line" etiquetas={resumen.por_dia.map((d) => fechaCorta(d.fecha).slice(0, 5))} valores={resumen.por_dia.map((d) => d.total)} />
    </Card>
    <Card titulo="Por motivo">
      <Grafico tipo="doughnut" etiquetas={resumen.por_motivo.map((m) => m.motivo)} valores={resumen.por_motivo.map((m) => m.total)} />
    </Card>
  </div>

  <div class="graficos">
    <Card titulo="Estudiantes con más tardanzas">
      <DataTable datos={resumen.top_estudiantes} columnas={columnasEstudiantes} acciones={[]} filasPorPagina={5} />
    </Card>
    <Card titulo="Llegadas tarde por curso">
      <DataTable datos={resumen.por_curso} columnas={columnasCursos} acciones={[]} filasPorPagina={5} />
    </Card>
  </div>
{/if}

<style>
  .filtros { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .filtros :global(.campo) { min-width: 160px; }
  .filtros > .btn, .rapidos { margin-bottom: 14px; }
  .rapidos { display: flex; gap: 8px; flex-wrap: wrap; }
  .graficos { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
  .graficos > :global(*) { min-width: 0; }
  @media (max-width: 900px) {
    .graficos { grid-template-columns: 1fr; gap: 0; }
  }
</style>
