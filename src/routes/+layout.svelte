<script>

  import { page } from '$app/state';
  import { goto, afterNavigate } from '$app/navigation';
  import Navbar from '#lib/components/Navbar.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Card from '#lib/components/Card.svelte';
  import Avisos from '#lib/components/Avisos.svelte';
  import { sesion, cerrarSesion } from '#lib/stores/sesion.js';
  import favicon from '#lib/assets/favicon.svg';

  let ruta = page.url.pathname;
  afterNavigate(() => (ruta = page.url.pathname));
  $: esLogin = ruta === '/login';
  $: esEmbed = ruta === '/tablero-embed';

  $: esAdmin =
    String($sesion?.usuario?.perfil || '').toUpperCase().includes('ADMIN') ||
    ($sesion?.modulos || []).some((m) => m.ruta_url?.startsWith('/admin'));

  function construirMenu(esAdm, listaBase = []) {
    if (esAdm) {
      return [
        { id_modulo: 18, nombre: 'Usuarios', ruta_url: '/admin/usuarios', icono: 'usuarios' },
        { id_modulo: 16, nombre: 'Horarios', ruta_url: '/admin/horarios', icono: 'horarios' },
        { id_modulo: 17, nombre: 'Notificaciones', ruta_url: '/admin/notificaciones', icono: 'notificaciones' },
        { id_modulo: 19, nombre: 'Dashboard', ruta_url: '/coordinador/dashboard', icono: 'reportes' },
        { id_modulo: 20, nombre: 'Reportes', ruta_url: '/coordinador/reportes', icono: 'reportes' }
      ];
    }
    const copia = [...listaBase];
    if (!copia.some((m) => m.ruta_url === '/coordinador/dashboard')) {
      copia.push({ id_modulo: 99, nombre: 'Dashboard', ruta_url: '/coordinador/dashboard', icono: 'reportes' });
    }
    if (!copia.some((m) => m.ruta_url === '/coordinador/reportes')) {
      copia.push({ id_modulo: 98, nombre: 'Reportes', ruta_url: '/coordinador/reportes', icono: 'reportes' });
    }
    return copia;
  }

  $: modulos = construirMenu(esAdmin, $sesion?.modulos || []);

  $: permitido =
    ruta === '/' ||
    ruta === '/tablero-embed' ||
    ruta === '/coordinador/dashboard' ||
    ruta === '/coordinador/reportes' ||
    ruta === '/admin' ||
    (esAdmin && ruta.startsWith('/admin/')) ||
    modulos.some((m) => m.ruta_url === ruta);

  $: if (!esLogin && !esEmbed && !$sesion?.token) goto('/login');

  function salir() {
    cerrarSesion();
    goto('/login');
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if esLogin || esEmbed}
  <slot />
{:else if $sesion?.token}
  <div class="contenedor-app">
    <Navbar {modulos} {ruta} usuario={$sesion.usuario} on:salir={salir} />
    <main class="contenido">
      {#if permitido}
        <slot />
      {:else}
        <Card titulo="Acceso no permitido">
          <p>Su perfil no tiene asignado este módulo. Use el menú para ir a un módulo permitido.</p>
        </Card>
      {/if}
    </main>
    <Footer />
  </div>
{/if}

<Avisos />

<style>

  :global(:root) {
    --azul: #121023;
    --azul-medio: #2a2650;
    --azul-claro: #ecebf5;
    --dorado: #ffdf2d;
    --dorado-oscuro: #f0cc00;
    --verde: #15803d;
    --rojo: #dc2626;
    --gris: #6b7280;
    --fondo: #f5f5f8;
  }

  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', system-ui, Arial, Helvetica, sans-serif;
    background-color: var(--fondo);
    color: #1f2937;
    -webkit-tap-highlight-color: transparent;
  }

  .contenedor-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .contenido {
    flex: 1;
    width: 100%;
    max-width: 1680px;
    margin: 24px auto;
    padding: 0 32px;
    box-sizing: border-box;
  }

  @media (max-width: 600px) {
    .contenido { padding: 0 14px; margin: 14px auto; }
  }

  :global(.btn) {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 0.95rem;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
  }
  :global(.btn:disabled) { opacity: 0.6; cursor: not-allowed; }
  :global(.btn-primario) { background-color: var(--azul); }
  :global(.btn-primario:hover:not(:disabled)) { background-color: var(--azul-medio); }
  :global(.btn-acento) { background-color: var(--dorado); color: var(--azul); font-weight: bold; }
  :global(.btn-acento:hover:not(:disabled)) { background-color: var(--dorado-oscuro); }
  :global(.btn-gris) { background-color: var(--gris); }
  :global(.btn-gris:hover) { background-color: #4b5563; }
  :global(.btn-exito) { background-color: var(--verde); }
  :global(.btn-exito:hover:not(:disabled)) { background-color: #166534; }
  :global(.btn-borrar) { background-color: var(--rojo); }
  :global(.btn-borrar:hover) { background-color: #b91c1c; }
  :global(.btn-claro) { background: white; color: var(--azul); border: 1px solid #cbd5e1; }
  :global(.btn-claro:hover) { background: var(--azul-claro); }

  :global(.botones-formulario) { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
  :global(.rejilla-2) { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  :global(.rejilla-datos) { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 600px) {
    :global(.rejilla-2) { grid-template-columns: 1fr; }
  }

  :global(.etiqueta) { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: bold; }
  :global(.etiqueta.exito) { background: #dcfce7; color: #166534; }
  :global(.etiqueta.alerta) { background: #fef3c7; color: #92400e; }
  :global(.etiqueta.peligro) { background: #fee2e2; color: #991b1b; }
  :global(.etiqueta.info) { background: var(--azul-claro); color: var(--azul); }
</style>
