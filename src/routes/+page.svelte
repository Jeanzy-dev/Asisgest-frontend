<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { sesion } from '#lib/stores/sesion.js';
  import Cargando from '#lib/components/Cargando.svelte';

  onMount(() => {
    const primero = $sesion?.modulos?.[0]?.ruta_url;
    goto(primero || '/login', { replaceState: true });
  });
</script>

<Cargando texto="Redirigiendo..." />
