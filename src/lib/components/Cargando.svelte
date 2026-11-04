<script>
  export let texto = 'Cargando...';
</script>

<div class="cargando" role="status">
  <span class="giro"></span>
  {texto}
</div>

<style>
  .cargando { display: flex; align-items: center; gap: 10px; color: #555; padding: 16px 0; }
  .giro {
    width: 18px; height: 18px;
    border: 3px solid var(--azul-claro);
    border-top-color: var(--azul);
    border-radius: 50%;
    animation: girar 0.8s linear infinite;
  }
  @keyframes girar { to { transform: rotate(360deg); } }
</style>
