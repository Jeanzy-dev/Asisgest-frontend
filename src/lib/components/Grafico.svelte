<script>
  import { onMount, onDestroy } from 'svelte';

  export let tipo = 'bar';
  export let etiquetas = [];
  export let valores = [];
  export let nombreSerie = 'Llegadas tarde';
  export let alto = 240;
  export let horizontal = false;
  export let multicolor = false;
  export let colorBarra = '#121023';

  const colores = ['#121023', '#ffdf2d', '#15803d', '#dc2626', '#6d68b8', '#0891b2', '#db2777', '#65a30d'];
  let lienzo;
  let grafico = null;

  $: esCircular = tipo === 'doughnut' || tipo === 'pie';

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
          backgroundColor: esCircular || multicolor ? colores : colorBarra,
          borderColor: esCircular ? '#ffffff' : (tipo === 'line' ? '#121023' : undefined),
          borderWidth: esCircular ? 2 : 0,
          borderRadius: tipo === 'bar' ? 5 : 0,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: {
            display: esCircular,
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        },
        scales: esCircular
          ? {}
          : {
              y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } } },
              x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } } }
            }
      }
    });
  });

  $: if (grafico) {
    grafico.data.labels = etiquetas;
    grafico.data.datasets[0].data = valores;
    grafico.update();
  }

  onDestroy(() => grafico?.destroy());
</script>

<div class="grafico" style="height: {alto}px">
  {#if valores.length === 0 || valores.every((v) => Number(v) === 0)}
    <p class="vacio">Sin datos en el periodo seleccionado.</p>
  {/if}
  <canvas bind:this={lienzo}></canvas>
</div>

<style>
  .grafico { position: relative; width: 100%; }
  .vacio { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #6b7280; margin: 0; font-size: 0.88rem; }
</style>
