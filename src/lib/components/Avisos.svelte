<script>
  import { avisos, quitarAviso } from '#lib/stores/avisos.js';
</script>

<div class="avisos" aria-live="polite">
  {#each $avisos as aviso (aviso.id)}
    <button class="aviso {aviso.tipo}" on:click={() => quitarAviso(aviso.id)}>{aviso.texto}</button>
  {/each}
</div>

<style>
  .avisos {
    position: fixed; right: 16px; bottom: 16px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 200;
    max-width: min(420px, calc(100vw - 32px));
  }
  .aviso {
    text-align: left;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    animation: entrar 0.2s ease-out;
  }
  .exito { background: var(--verde); }
  .error { background: var(--rojo); }
  .alerta { background: #b45309; }
  .info { background: var(--azul); }
  @keyframes entrar { from { transform: translateY(10px); opacity: 0; } }
</style>
