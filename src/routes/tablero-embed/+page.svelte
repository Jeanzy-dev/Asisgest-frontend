<script>
  import { onMount } from 'svelte';
  import Grafico from '#lib/components/Grafico.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import { obtenerResumen } from '#lib/services/api_reporte.js';
  import { hoyISO, fechaCorta } from '#lib/utils/formato.js';

  let jornada = 'TODAS';
  let desde = hoyISO(90);
  let hasta = hoyISO();
  let grado = 'TODOS';
  let tipoMotivo = 'TODOS';

  let datos = null;
  let cargando = true;
  let ultimaActualizacion = '';

  async function cargarTablero() {
    cargando = true;
    try {
      datos = await obtenerResumen(desde, hasta, {
        jornada,
        grado,
        tipo_motivo: tipoMotivo
      });
      ultimaActualizacion = new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (err) {
      console.error(err);
    }
    cargando = false;
  }

  onMount(cargarTablero);

  function seleccionarJornada(valor) {
    jornada = valor;
    cargarTablero();
  }

  function seleccionarGrado(valor) {
    grado = valor;
    cargarTablero();
  }

  function seleccionarTipoMotivo(valor) {
    tipoMotivo = valor;
    cargarTablero();
  }

  function periodoRapido(dias) {
    desde = hoyISO(dias);
    hasta = hoyISO();
    cargarTablero();
  }

  function limpiarFiltros() {
    jornada = 'TODAS';
    grado = 'TODOS';
    tipoMotivo = 'TODOS';
    desde = hoyISO(90);
    hasta = hoyISO();
    cargarTablero();
  }
</script>

<div class="pbi-lienzo">
  <header class="pbi-barra">
    <div class="pbi-marca">
      <span class="pbi-insignia">I.E. Técnica Comercial de Ponedera</span>
      <h1>Tablero de Control de Llegadas Tarde</h1>
    </div>
    <div class="pbi-meta">
      <span>Periodo: <strong>{fechaCorta(desde)} – {fechaCorta(hasta)}</strong></span>
      <span>Actualizado: <strong>{ultimaActualizacion || 'Ahora'}</strong></span>
      <button type="button" class="btn-refrescar" on:click={cargarTablero}>↻ Actualizar</button>
    </div>
  </header>

  {#if cargando && !datos}
    <Cargando />
  {:else if datos}
    <div class="pbi-estructura">
      <div class="pbi-zona-principal">
        <section class="pbi-fila-kpis" aria-label="Indicadores principales">
          <article class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-etiqueta">Total llegadas tarde</span>
            </div>
            <div class="kpi-valor">{datos.totales.total_tardanzas ?? 0}</div>
            <div class="kpi-detalle">
              <small>{datos.totales.estudiantes_distintos ?? 0} estudiantes registrados</small>
            </div>
          </article>

          <article class="kpi-card dorado">
            <div class="kpi-top">
              <span class="kpi-etiqueta">Tasa de justificación</span>
            </div>
            <div class="kpi-valor">{datos.totales.tasa_justificadas ?? 0}%</div>
            <div class="kpi-detalle">
              <small>{datos.totales.justificadas ?? 0} tardanzas justificadas</small>
            </div>
          </article>

          <article class="kpi-card rojo">
            <div class="kpi-top">
              <span class="kpi-etiqueta">Promedio de retraso</span>
            </div>
            <div class="kpi-valor">{datos.totales.promedio_minutos ?? 0} <small>min</small></div>
            <div class="kpi-detalle">
              <small>Minutos después del timbre</small>
            </div>
          </article>

          <article class="kpi-card verde">
            <div class="kpi-top">
              <span class="kpi-etiqueta">Estudiantes reincidentes</span>
            </div>
            <div class="kpi-valor">{datos.totales.estudiantes_reincidentes ?? 0}</div>
            <div class="kpi-detalle">
              <small>Con 3 o más llegadas tarde</small>
            </div>
          </article>
        </section>

        <section class="pbi-rejilla-graficos" aria-label="Gráficos del tablero">
          <article class="grafico-card">
            <header>
              <h3>Tardanzas por curso y jornada</h3>
            </header>
            <Grafico
              tipo="bar"
              alto={205}
              multicolor={true}
              etiquetas={(datos.por_curso || []).slice(0, 7).map((c) => c.curso)}
              valores={(datos.por_curso || []).slice(0, 7).map((c) => c.total)}
            />
          </article>

          <article class="grafico-card">
            <header>
              <h3>Distribución por motivo</h3>
            </header>
            <Grafico
              tipo="doughnut"
              alto={205}
              etiquetas={(datos.por_motivo || []).map((m) => m.motivo)}
              valores={(datos.por_motivo || []).map((m) => m.total)}
            />
          </article>

          <article class="grafico-card">
            <header>
              <h3>Justificadas vs. no justificadas</h3>
            </header>
            <Grafico
              tipo="pie"
              alto={205}
              etiquetas={(datos.por_justificacion || []).map((j) => j.categoria)}
              valores={(datos.por_justificacion || []).map((j) => j.total)}
            />
          </article>

          <article class="grafico-card">
            <header>
              <h3>Comparativa por jornada</h3>
            </header>
            <Grafico
              tipo="bar"
              alto={205}
              multicolor={true}
              etiquetas={(datos.por_jornada || []).map((j) => j.jornada)}
              valores={(datos.por_jornada || []).map((j) => j.total)}
            />
          </article>

          <article class="grafico-card">
            <header>
              <h3>Estudiantes con más tardanzas</h3>
            </header>
            <Grafico
              tipo="bar"
              horizontal={true}
              alto={205}
              colorBarra="#2a2650"
              etiquetas={(datos.top_estudiantes || []).slice(0, 5).map((e) => `${e.estudiante.split(' ')[0]} (${e.curso})`)}
              valores={(datos.top_estudiantes || []).slice(0, 5).map((e) => e.total)}
            />
          </article>

          <article class="grafico-card">
            <header>
              <h3>Incidencia por grado escolar</h3>
            </header>
            <Grafico
              tipo="bar"
              alto={205}
              multicolor={true}
              etiquetas={(datos.por_grado || []).map((g) => g.grado)}
              valores={(datos.por_grado || []).map((g) => g.total)}
            />
          </article>
        </section>
      </div>

      <aside class="pbi-columna-filtros" aria-label="Filtros del tablero">
        <section class="slicer-card">
          <div class="slicer-header">
            <h4>Jornada y periodo</h4>
          </div>

          <div class="slicer-grupo">
            <span class="slicer-label">Jornada escolar</span>
            <div class="slicer-botones">
              <button type="button" class:activo={jornada === 'TODAS'} on:click={() => seleccionarJornada('TODAS')}>Todas</button>
              <button type="button" class:activo={jornada === 'MAÑANA'} on:click={() => seleccionarJornada('MAÑANA')}>Mañana</button>
              <button type="button" class:activo={jornada === 'TARDE'} on:click={() => seleccionarJornada('TARDE')}>Tarde</button>
            </div>
          </div>

          <div class="slicer-grupo">
            <span class="slicer-label">Rango de fechas</span>
            <label class="slicer-fecha">
              <span>Desde:</span>
              <input type="date" bind:value={desde} max={hasta} on:change={cargarTablero} />
            </label>
            <label class="slicer-fecha">
              <span>Hasta:</span>
              <input type="date" bind:value={hasta} max={hoyISO()} on:change={cargarTablero} />
            </label>
            <div class="slicer-rapidos">
              <button type="button" on:click={() => periodoRapido(7)}>7 días</button>
              <button type="button" on:click={() => periodoRapido(30)}>30 días</button>
              <button type="button" on:click={() => periodoRapido(180)}>Semestre</button>
            </div>
          </div>
        </section>

        <section class="slicer-card">
          <div class="slicer-header">
            <h4>Grado y motivo</h4>
          </div>

          <div class="slicer-grupo">
            <span class="slicer-label">Grado académico</span>
            <div class="slicer-botones">
              <button type="button" class:activo={grado === 'TODOS'} on:click={() => seleccionarGrado('TODOS')}>Todos</button>
              <button type="button" class:activo={grado === '9'} on:click={() => seleccionarGrado('9')}>9°</button>
              <button type="button" class:activo={grado === '10'} on:click={() => seleccionarGrado('10')}>10°</button>
              <button type="button" class:activo={grado === '11'} on:click={() => seleccionarGrado('11')}>11°</button>
            </div>
          </div>

          <div class="slicer-grupo">
            <span class="slicer-label">Tipo de motivo</span>
            <div class="slicer-lista">
              <button type="button" class:activo={tipoMotivo === 'TODOS'} on:click={() => seleccionarTipoMotivo('TODOS')}>
                Todos los motivos
              </button>
              <button type="button" class:activo={tipoMotivo === 'JUSTIFICABLE'} on:click={() => seleccionarTipoMotivo('JUSTIFICABLE')}>
                Solo justificables
              </button>
              <button type="button" class:activo={tipoMotivo === 'NO_JUSTIFICABLE'} on:click={() => seleccionarTipoMotivo('NO_JUSTIFICABLE')}>
                Solo no justificables
              </button>
            </div>
          </div>

          <button type="button" class="btn-limpiar-slicers" on:click={limpiarFiltros}>
            Restablecer filtros
          </button>
        </section>
      </aside>
    </div>
  {/if}
</div>

<style>
  .pbi-lienzo {
    background: #f1f5f9;
    min-height: 100vh;
    padding: 14px 18px;
    box-sizing: border-box;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  .pbi-barra {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    background: #121023;
    color: white;
    padding: 12px 18px;
    border-radius: 10px;
    margin-bottom: 14px;
    border-bottom: 3px solid #ffdf2d;
  }
  .pbi-insignia {
    display: inline-block;
    background: #ffdf2d;
    color: #121023;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .pbi-marca h1 {
    margin: 4px 0 0;
    font-size: 1.15rem;
  }
  .pbi-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 0.82rem;
    flex-wrap: wrap;
  }
  .btn-refrescar {
    background: #ffdf2d;
    color: #121023;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .pbi-estructura {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 14px;
    align-items: start;
  }
  .pbi-fila-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }
  .kpi-card {
    background: white;
    border-radius: 10px;
    padding: 12px 14px;
    border-top: 4px solid #121023;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  .kpi-card.dorado { border-top-color: #eab308; }
  .kpi-card.rojo { border-top-color: #dc2626; }
  .kpi-card.verde { border-top-color: #15803d; }

  .kpi-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .kpi-etiqueta {
    font-size: 0.82rem;
    font-weight: 700;
    color: #334155;
  }
  .kpi-valor {
    font-size: 1.85rem;
    font-weight: 800;
    color: #121023;
    margin: 8px 0 4px;
    line-height: 1.1;
  }
  .kpi-valor small {
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
  }
  .kpi-detalle small {
    font-size: 0.78rem;
    color: #64748b;
  }
  .pbi-rejilla-graficos {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .grafico-card {
    background: white;
    border-radius: 10px;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
  }
  .grafico-card header {
    margin-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 6px;
  }
  .grafico-card h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #121023;
  }
  .pbi-columna-filtros {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .slicer-card {
    background: white;
    border-radius: 10px;
    padding: 14px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  .slicer-header {
    margin-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
  }
  .slicer-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #121023;
  }
  .slicer-grupo {
    margin-bottom: 12px;
  }
  .slicer-label {
    display: block;
    font-size: 0.76rem;
    font-weight: 700;
    color: #475569;
    margin-bottom: 6px;
  }
  .slicer-botones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
    gap: 5px;
  }
  .slicer-botones button,
  .slicer-rapidos button {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
  }
  .slicer-botones button.activo,
  .slicer-lista button.activo {
    background: #121023;
    color: #ffdf2d;
    border-color: #121023;
  }
  .slicer-fecha {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.76rem;
    margin-bottom: 6px;
    color: #334155;
  }
  .slicer-fecha input {
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 4px 6px;
    font-size: 0.76rem;
    width: 135px;
  }
  .slicer-rapidos {
    display: flex;
    gap: 5px;
    margin-top: 6px;
  }
  .slicer-rapidos button {
    flex: 1;
    font-size: 0.72rem;
    padding: 4px;
  }
  .slicer-lista {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .slicer-lista button {
    text-align: left;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
  }
  .btn-limpiar-slicers {
    width: 100%;
    background: #f1f5f9;
    color: #121023;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 1200px) {
    .pbi-estructura {
      grid-template-columns: 1fr;
    }
    .pbi-columna-filtros {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .pbi-fila-kpis {
      grid-template-columns: repeat(2, 1fr);
    }
    .pbi-rejilla-graficos {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .pbi-columna-filtros,
    .pbi-fila-kpis,
    .pbi-rejilla-graficos {
      grid-template-columns: 1fr;
    }
  }
</style>
