<script>
  // Íconos simples en SVG. El nombre viene del campo "icono" de la tabla modulos.
  export let nombre = 'inicio';
  export let tam = 20;
  const trazos = {
    inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    historial: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 8v4l3 2',
    estudiantes: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
    acudientes: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    motivos: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
    horarios: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    notificaciones: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    salir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    menu: 'M3 6h18M3 12h18M3 18h18',
    cerrar: 'M18 6L6 18M6 6l12 12',
    buscar: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    mas: 'M12 5v14M5 12h14',
    reporte: 'M3 3v18h18M7 16l4-5 4 3 5-7'
  };
</script>

<svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={trazos[nombre] || trazos.inicio} />
</svg>
