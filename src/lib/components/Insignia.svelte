<script>
  // Etiqueta de color: exito (verde), alerta (amarillo), peligro (rojo), info (azul)
  export let tipo = 'info';
</script>

<span class="insignia {tipo}"><slot /></span>

<style>
  .insignia {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  .exito { background: #dcfce7; color: #166534; }
  .alerta { background: #fef3c7; color: #92400e; }
  .peligro { background: #fee2e2; color: #991b1b; }
  .info { background: var(--azul-claro); color: var(--azul); }
</style>
