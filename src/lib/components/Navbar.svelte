<script>
  // Barra de navegación. Los enlaces NO están escritos a mano:
  // llegan en "modulos", que sale de la tabla moduloxrol según el perfil.
  import { createEventDispatcher } from 'svelte';
  import Icono from './Icono.svelte';

  export let modulos = [];
  export let usuario = null;
  export let ruta = '';   // ruta actual (la envía el layout)

  const dispatch = createEventDispatcher();
  let menuAbierto = false;

  function estaActivo(ruta, actual) {
    return actual === ruta;
  }
</script>

<nav class="navbar">
  <div class="navbar-superior">
    <a href={modulos[0]?.ruta_url || '/'} class="navbar-logo">
      <span class="logo-icono"><Icono nombre="reloj" tam={18} /></span>
      <span>
        <strong>Llegadas Tarde</strong>
        <small>I.E. Técnica Comercial de Ponedera</small>
      </span>
    </a>

    <div class="navbar-usuario">
      {#if usuario}
        <span class="usuario-datos">
          <strong>{usuario.nombre_completo}</strong>
          <small>{usuario.perfil}</small>
        </span>
      {/if}
      <button class="btn-salir" on:click={() => dispatch('salir')} title="Cerrar sesión">
        <Icono nombre="salir" tam={18} /> <span class="ocultar-movil">Salir</span>
      </button>
      <button class="btn-menu" on:click={() => (menuAbierto = !menuAbierto)} aria-label="Abrir menú">
        <Icono nombre={menuAbierto ? 'cerrar' : 'menu'} />
      </button>
    </div>
  </div>

  <div class="navbar-links" class:abierto={menuAbierto}>
    {#each modulos as modulo (modulo.ruta_url)}
      <a href={modulo.ruta_url} class:activo={estaActivo(modulo.ruta_url, ruta)}
        on:click={() => (menuAbierto = false)}>
        <Icono nombre={modulo.icono} tam={17} />
        {modulo.nombre}
      </a>
    {/each}
  </div>
</nav>

<style>
  .navbar {
    background-color: var(--azul);
    color: white;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .navbar-superior {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 32px;
    max-width: 1680px;
    margin: 0 auto;
  }
  .navbar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    text-decoration: none;
  }
  .navbar-logo strong { display: block; font-size: 1.1rem; }
  .navbar-logo small { display: block; opacity: 0.8; font-size: 0.75rem; }
  .logo-icono {
    background: var(--dorado);
    color: var(--azul);
    border-radius: 8px;
    padding: 6px;
    display: flex;
  }
  .navbar-usuario { display: flex; align-items: center; gap: 12px; }
  .usuario-datos { text-align: right; line-height: 1.2; }
  .usuario-datos small { display: block; opacity: 0.8; font-size: 0.75rem; }
  .btn-salir, .btn-menu {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255, 255, 255, 0.12);
    color: white; border: none; border-radius: 6px;
    padding: 8px 12px; cursor: pointer; font-size: 0.9rem;
  }
  .btn-salir:hover, .btn-menu:hover { background: rgba(255, 255, 255, 0.25); }
  .btn-menu { display: none; }

  .navbar-links {
    display: flex;
    gap: 4px;
    padding: 0 32px;
    max-width: 1680px;
    margin: 0 auto;
    overflow-x: auto;
  }
  .navbar-links a {
    display: flex; align-items: center; gap: 6px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    padding: 10px 12px;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
    font-size: 0.92rem;
  }
  .navbar-links a:hover { color: white; background: rgba(255, 255, 255, 0.08); }
  .navbar-links a.activo { color: white; border-bottom-color: var(--dorado); font-weight: bold; }

  @media (max-width: 860px) {
    .navbar-superior { padding: 10px 16px; }
    .usuario-datos, .ocultar-movil { display: none; }
    .btn-menu { display: flex; }
    .navbar-links {
      display: none;
      flex-direction: column;
      padding: 0 8px 10px;
    }
    .navbar-links.abierto { display: flex; }
    .navbar-links a { border-bottom: none; border-left: 3px solid transparent; border-radius: 4px; }
    .navbar-links a.activo { border-left-color: var(--dorado); background: rgba(255, 255, 255, 0.1); }
  }
</style>
