<script>
  import { onMount, onDestroy } from 'svelte';

  export let tipo = 'bar';
  export let etiquetas = [];
  export let valores = [];
  export let nombreSerie = 'Llegadas tarde';
  export let alto = 260;
  export let horizontal = false;

  const colores = ['#121023', '#ffdf2d', '#15803d', '#dc2626', '#6d68b8', '#0891b2', '#db2777', '#65a30d'];
  let lienzo;
  let grafico = null;

  onMount(async () => {
    const { default: Chart } = await import('chart.js/auto');
    if (!lienzo) return;
    grafico = new Chart(lienzo, {
      type: tipo,
      data: {
        labels: etiquetas,
        datasets: [{
          label: nombreSerie,
          data: valores,
          backgroundColor: tipo === 'doughnut' ? colores : '#121023',
          borderColor: tipo === 'line' ? '#121023' : undefined,
          borderRadius: tipo === 'bar' ? 4 : 0,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: { legend: { display: tipo === 'doughnut', position: 'bottom' } },
        scales: tipo === 'doughnut' ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { precision: 0 } } }
      }
    });
  });

  // Si llegan datos nuevos, se actualiza el gráfico
  $: if (grafico) {
    grafico.data.labels = etiquetas;
    grafico.data.datasets[0].data = valores;
    grafico.update();
  }

  onDestroy(() => grafico?.destroy());
</script>

<div class="grafico" style="height: {alto}px">
  {#if valores.length === 0}
    <p class="vacio">Sin datos en el periodo.</p>
  {/if}
  <canvas bind:this={lienzo}></canvas>
</div>

<style>
  .grafico { position: relative; width: 100%; }
  .vacio { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #6b7280; margin: 0; }
</style>
