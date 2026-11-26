<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Campo from '#lib/components/Campo.svelte';
  import Icono from '#lib/components/Icono.svelte';
  import { iniciarSesion, obtenerModulosPorPerfil } from '#lib/services/api_auth.js';
  import { asegurarPerfilesBase } from '#lib/services/api_perfil.js';
  import { RENDER_API_URL } from '#lib/services/api.js';
  import { sesion } from '#lib/stores/sesion.js';
  import { avisar } from '#lib/stores/avisos.js';

  let correo = '';
  let password = '';
  let mensaje = '';
  let cargando = false;

  let mostrarConfigMovil = false;
  let apiUrlPersonalizada = '';
  let expressUrlPersonalizada = '';

  onMount(() => {
    apiUrlPersonalizada = localStorage.getItem('asisgest_api_url') || RENDER_API_URL;
    expressUrlPersonalizada = localStorage.getItem('asisgest_express_url') || 'http://localhost:3000';
  });

  function guardarConfigMovil() {
    if (apiUrlPersonalizada.trim()) {
      localStorage.setItem('asisgest_api_url', apiUrlPersonalizada.trim());
    } else {
      localStorage.removeItem('asisgest_api_url');
    }
    if (expressUrlPersonalizada.trim()) {
      localStorage.setItem('asisgest_express_url', expressUrlPersonalizada.trim());
    } else {
      localStorage.removeItem('asisgest_express_url');
    }
    mostrarConfigMovil = false;
    avisar('Configuración de conexión guardada para el dispositivo', 'exito');
  }

  async function ingresar(evento) {
    evento.preventDefault();
    mensaje = '';
    cargando = true;
    try {
      const respuesta = await iniciarSesion(correo, password);
      sesion.set({ token: respuesta.access_token, usuario: respuesta.usuario, modulos: [] });
      let modulos = await obtenerModulosPorPerfil(respuesta.usuario.id_perfil);
      if (modulos.length === 0) {
        await asegurarPerfilesBase();
        modulos = await obtenerModulosPorPerfil(respuesta.usuario.id_perfil);
      }
      if (modulos.length === 0) {
        sesion.set(null);
        mensaje = 'Su perfil no tiene módulos asignados. Contacte al administrador.';
        cargando = false;
        return;
      }
      sesion.set({ token: respuesta.access_token, usuario: respuesta.usuario, modulos });
      goto(modulos[0].ruta_url);
    } catch (error) {
      mensaje = error.message;
    }
    cargando = false;
  }
</script>

<div class="pagina-login">
  <section class="presentacion">
    <div class="logo"><Icono nombre="reloj" tam={34} /></div>
    <h1>Control de llegadas tarde</h1>
    <p>Institución Educativa Técnica Comercial de Ponedera</p>
    <ul>
      <li>Registro rápido en la portería (Web y App Móvil Android)</li>
      <li>Dashboard Power BI con KPIs y gráficos interactivos</li>
      <li>Reportes corporativos en PDF, Excel y envío por correo SMTP</li>
    </ul>
  </section>

  <section class="formulario">
    <form on:submit={ingresar}>
      <h2>Iniciar sesión</h2>
      <p class="sub">Ingrese con su correo institucional</p>
      <Campo etiqueta="Correo" id="correo" tipo="email" bind:value={correo} requerido placeholder="usuario@colegio.edu.co" />
      <Campo etiqueta="Contraseña" id="password" tipo="password" bind:value={password} requerido />
      {#if mensaje}
        <p class="error" role="alert">{mensaje}</p>
      {/if}
      <button type="submit" class="btn btn-primario ancho" disabled={cargando}>
        {cargando ? 'Ingresando...' : 'Ingresar'}
      </button>

      <div class="config-movil">
        <button
          type="button"
          class="btn-link-movil"
          on:click={() => (mostrarConfigMovil = !mostrarConfigMovil)}
        >
          ⚙ Conexión de servidor (App Móvil / Red Local)
        </button>

        {#if mostrarConfigMovil}
          <div class="panel-movil">
            <Campo
              etiqueta="API Principal FastAPI (Render / IP Local)"
              id="cfg-api"
              bind:value={apiUrlPersonalizada}
              placeholder="https://api-colegio-he1h.onrender.com"
            />
            <Campo
              etiqueta="Servicio Auxiliar Express (Correo y PDF/Excel)"
              id="cfg-exp"
              bind:value={expressUrlPersonalizada}
              placeholder="http://192.168.1.10:3000"
            />
            <div class="botones-cfg">
              <button
                type="button"
                class="btn btn-claro"
                on:click={() => {
                  localStorage.removeItem('asisgest_api_url');
                  localStorage.removeItem('asisgest_express_url');
                  apiUrlPersonalizada = RENDER_API_URL;
                  expressUrlPersonalizada = 'http://localhost:3000';
                  mostrarConfigMovil = false;
                }}
              >
                Por defecto
              </button>
              <button type="button" class="btn btn-acento" on:click={guardarConfigMovil}>
                Guardar URL
              </button>
            </div>
          </div>
        {/if}
      </div>
    </form>
  </section>
</div>

<style>
  .pagina-login {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
  }
  .presentacion {
    background: linear-gradient(150deg, var(--azul) 0%, #172554 100%);
    color: white;
    padding: 48px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .logo {
    width: 64px; height: 64px; border-radius: 14px;
    background: var(--dorado); color: var(--azul);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .presentacion h1 { margin: 0 0 8px; font-size: 2.2rem; }
  .presentacion p { margin: 0 0 24px; opacity: 0.85; font-size: 1.1rem; }
  .presentacion ul { padding-left: 20px; line-height: 2; opacity: 0.9; }
  .formulario { display: flex; align-items: center; justify-content: center; padding: 32px 16px; }
  form {
    width: 100%; max-width: 400px;
    background: white; padding: 32px; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }
  h2 { margin: 0; color: var(--azul); }
  .sub { color: #6b7280; margin: 4px 0 20px; }
  .error { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 6px; }
  .ancho { width: 100%; padding: 12px; font-size: 1rem; }
  .config-movil {
    margin-top: 16px;
    border-top: 1px solid #f1f5f9;
    padding-top: 12px;
    text-align: center;
  }
  .btn-link-movil {
    background: none;
    border: none;
    color: #475569;
    font-size: 0.82rem;
    cursor: pointer;
    text-decoration: underline;
  }
  .panel-movil {
    margin-top: 10px;
    text-align: left;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
  }
  .botones-cfg {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  @media (max-width: 800px) {
    .pagina-login { grid-template-columns: 1fr; }
    .presentacion { padding: 28px 20px; }
    .presentacion h1 { font-size: 1.6rem; }
    .presentacion ul { display: none; }
    form { padding: 24px; }
  }
</style>
