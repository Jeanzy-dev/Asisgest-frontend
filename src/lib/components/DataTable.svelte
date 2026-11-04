<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import 'datatables.net-dt/css/dataTables.dataTables.css';
  import 'datatables.net-responsive-dt/css/responsive.dataTables.css';
  import { escapar } from '#lib/utils/formato.js';

  export let datos = [];
  export let columnas = [];
  export let acciones = [
    { accion: 'editar', texto: 'Editar', clase: 'editar' },
    { accion: 'eliminar', texto: 'Eliminar', clase: 'borrar' }
  ];
  export let filasPorPagina = 10;

  const dispatch = createEventDispatcher();
  let elementoTabla;
  let contenedor;
  let tabla = null;
  let observador = null;

  const idioma = {
    decimal: ',', thousands: '.',
    emptyTable: 'No hay registros para mostrar',
    info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
    infoEmpty: 'Mostrando 0 registros',
    infoFiltered: '(filtrado de _MAX_ registros)',
    lengthMenu: 'Mostrar _MENU_ registros',
    loadingRecords: 'Cargando...',
    search: 'Buscar:',
    zeroRecords: 'No se encontraron coincidencias',
    paginate: { first: '«', last: '»', next: '›', previous: '‹' }
  };

  function definirColumnas() {
    const lista = columnas.map((c) => ({
      title: c.titulo,
      data: c.campo ?? null,
      width: c.ancho,
      responsivePriority: c.prioridad ?? 10,
      className: c.envolver ? 'envolver' : undefined,
      defaultContent: '',
      render: (valor, tipo, fila) => {
        if (tipo !== 'display') return valor ?? '';
        if (c.formato) return c.formato(valor, fila);
        return valor === null || valor === undefined || valor === '' ? '<span class="vacio">—</span>' : escapar(valor);
      }
    }));
    if (acciones.length > 0) {
      lista.push({
        title: 'Acciones',
        data: null,
        orderable: false,
        searchable: false,
        className: 'all',
        render: () =>
          '<div class="acciones-tabla">' +
          acciones.map((a) => `<button type="button" class="btn-tabla ${a.clase}" data-accion="${a.accion}">${a.texto}</button>`).join('') +
          '</div>'
      });
    }
    return lista;
  }

  function alHacerClick(evento) {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton || !tabla) return;
    let fila = boton.closest('tr');
    if (fila.classList.contains('child')) fila = fila.previousElementSibling;
    const registro = tabla.row(fila).data();
    if (registro) dispatch(boton.dataset.accion, registro);
  }

  onMount(async () => {
    const DataTable = (await import('datatables.net-dt')).default;
    await import('datatables.net-responsive-dt');
    if (!elementoTabla) return;
    tabla = new DataTable(elementoTabla, {
      data: datos,
      columns: definirColumnas(),
      language: idioma,
      responsive: true,
      pageLength: filasPorPagina,
      lengthMenu: [...new Set([filasPorPagina, 10, 25, 50, 100])].sort((a, b) => a - b),
      order: [],
      autoWidth: false
    });
    elementoTabla.addEventListener('click', alHacerClick);
    observador = new ResizeObserver(() => ajustar());
    observador.observe(contenedor);
  });

  function ajustar() {
    if (!tabla) return;
    tabla.columns.adjust();
    tabla.responsive.recalc();
  }

  $: if (tabla) {
    tabla.clear();
    tabla.rows.add(datos);
    tabla.draw(false);
    ajustar();
  }

  onDestroy(() => {
    observador?.disconnect();
    if (tabla) tabla.destroy();
  });
</script>

<div class="contenedor-tabla" bind:this={contenedor}>
  <table bind:this={elementoTabla} class="display nowrap" style="width:100%"></table>
</div>

<style>
  .contenedor-tabla { width: 100%; min-width: 0; }
  .contenedor-tabla :global(.vacio) { color: #9ca3af; }
  .contenedor-tabla :global(td.envolver) { white-space: normal; min-width: 140px; }
  .contenedor-tabla :global(td.envolver .etiqueta) { white-space: normal; line-height: 1.3; }
  .contenedor-tabla :global(.celda-doble strong) { display: block; font-weight: 600; }
  .contenedor-tabla :global(.celda-doble small) { color: #6b7280; }
  .contenedor-tabla :global(table.dataTable tbody td) { vertical-align: middle; }
  .contenedor-tabla :global(table.dataTable tbody tr:hover > *) { background-color: #f8fafc; }
  .contenedor-tabla :global(.acciones-tabla) { display: flex; gap: 6px; flex-wrap: nowrap; }
  .contenedor-tabla :global(.btn-tabla) {
    border: none; border-radius: 6px; padding: 6px 10px;
    color: white; cursor: pointer; font-size: 0.82rem;
  }
  .contenedor-tabla :global(.btn-tabla.editar) { background: var(--dorado); color: var(--azul); font-weight: bold; }
  .contenedor-tabla :global(.btn-tabla.editar:hover) { background: var(--dorado-oscuro); }
  .contenedor-tabla :global(.btn-tabla.borrar) { background: var(--rojo); }
  .contenedor-tabla :global(.btn-tabla.borrar:hover) { background: #b91c1c; }
  .contenedor-tabla :global(.btn-tabla.principal) { background: var(--azul); }
  .contenedor-tabla :global(.btn-tabla.exito) { background: var(--verde); }
  .contenedor-tabla :global(table.dataTable thead th) { background: #f3f4f6; color: #1f2937; }
  .contenedor-tabla :global(.dt-search input), .contenedor-tabla :global(.dt-length select) {
    border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px;
  }
  .contenedor-tabla :global(div.dt-container .dt-paging .dt-paging-button.current),
  .contenedor-tabla :global(div.dt-container .dt-paging .dt-paging-button.current:hover) {
    background: var(--azul) !important; color: white !important; border-color: var(--azul) !important;
  }
</style>
