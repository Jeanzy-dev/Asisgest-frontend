<script>
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Card from '#lib/components/Card.svelte';
  import Campo from '#lib/components/Campo.svelte';
  import Selector from '#lib/components/Selector.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import Confirmar from '#lib/components/Confirmar.svelte';
  import BuscadorEstudiante from '#lib/components/BuscadorEstudiante.svelte';
  import Cargando from '#lib/components/Cargando.svelte';
  import TarjetaDato from '#lib/components/TarjetaDato.svelte';
  import Icono from '#lib/components/Icono.svelte';

  import { asegurarPerfilesBase } from '#lib/services/api_perfil.js';
  import { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '#lib/services/api_usuario.js';
  import { obtenerCoordinadores, crearCoordinador, actualizarCoordinador, eliminarCoordinador } from '#lib/services/api_coordinador.js';
  import { obtenerEstudiantes, crearEstudiante, actualizarEstudiante, eliminarEstudiante } from '#lib/services/api_estudiante.js';
  import { obtenerAcudientes, crearAcudiente, actualizarAcudiente, eliminarAcudiente } from '#lib/services/api_acudiente.js';
  import { obtenerVinculos, crearVinculo, actualizarVinculo, eliminarVinculo } from '#lib/services/api_estudxacudiente.js';
  import { obtenerCursos, crearCurso } from '#lib/services/api_curso.js';
  import { avisar } from '#lib/stores/avisos.js';
  import { escapar, fechaHora, nombreCurso } from '#lib/utils/formato.js';

  export let pestanaInicial = 'TODOS';
  export let tituloPagina = 'Gestión de usuarios';
  export let subtituloPagina = 'Cree, modifique y actualice usuarios con rol de Administrador, Coordinador, Rector, Estudiante y Acudiente';

  let cargando = true;
  let guardando = false;
  let pestanaActiva = pestanaInicial;

  // Listas cargadas desde la API
  let perfiles = [];
  let usuarios = [];
  let coordinadores = [];
  let estudiantes = [];
  let acudientes = [];
  let vinculos = [];
  let cursos = [];

  // Estado del modal de creación/edición de usuario
  let modalAbierto = false;
  let modoEdicion = false;
  let rolSeleccionado = 'ESTUDIANTE';

  // Campos para Admin / Rector / Coordinador
  let idUsuarioEditando = null;
  let idCoordinadorEditando = null;
  let nombreCompleto = '';
  let correoUsuario = '';
  let passwordUsuario = '';
  let jornadaCoordinador = 'MAÑANA';
  let telefonoOficina = '';

  // Campos para Estudiante
  let idEstudianteEditando = null;
  let docEstudiante = '';
  let nombresEstudiante = '';
  let apellidosEstudiante = '';
  let idCursoSeleccionado = '';

  // Campos para Acudiente
  let idAcudienteEditando = null;
  let idVinculoEditando = null;
  let docAcudiente = '';
  let nombresAcudiente = '';
  let apellidosAcudiente = '';
  let telefonoAcudiente = '';
  let correoAcudiente = '';
  let estudianteVinculado = null;
  let idEstudianteSelect = '';
  let parentescoAcudiente = 'Madre';
  let esPrincipalAcudiente = true;

  // Modal secundario rápido para crear un nuevo salón si hace falta
  let modalSalonAbierto = false;
  let nuevoGrado = 10;
  let nuevoGrupo = 'A';
  let nuevaJornadaSalon = 'MAÑANA';

  // Confirmación de eliminación (borrado lógico)
  let porEliminar = null;

  const opcionesRol = [
    { valor: 'ADMINISTRADOR', texto: 'Administrador' },
    { valor: 'COORDINADOR', texto: 'Coordinador' },
    { valor: 'RECTOR', texto: 'Rector' },
    { valor: 'ESTUDIANTE', texto: 'Estudiante' },
    { valor: 'ACUDIENTE', texto: 'Acudiente' }
  ];

  const opcionesRolPersonal = [
    { valor: 'ADMINISTRADOR', texto: 'Administrador' },
    { valor: 'COORDINADOR', texto: 'Coordinador' },
    { valor: 'RECTOR', texto: 'Rector' }
  ];

  const opcionesJornada = [
    { valor: 'MAÑANA', texto: 'Mañana' },
    { valor: 'TARDE', texto: 'Tarde' },
    { valor: 'UNICA', texto: 'Única / Completa' }
  ];

  const opcionesParentesco = [
    { valor: 'Madre', texto: 'Madre' },
    { valor: 'Padre', texto: 'Padre' },
    { valor: 'Abuelo/a', texto: 'Abuelo/a' },
    { valor: 'Tío/a', texto: 'Tío/a' },
    { valor: 'Hermano/a', texto: 'Hermano/a' },
    { valor: 'Acudiente legal', texto: 'Acudiente legal' },
    { valor: 'Otro', texto: 'Otro' }
  ];

  // Opciones desplegables de salones existentes
  $: opcionesCursos = cursos.map((c) => ({
    valor: String(c.id_curso),
    texto: `${nombreCurso(c.grado, c.grupo)} — Jornada ${c.jornada}`
  }));

  $: cursoActualObjeto = cursos.find((c) => String(c.id_curso) === String(idCursoSeleccionado)) || null;

  // Opciones desplegables de estudiantes existentes para vincular con acudiente
  $: opcionesEstudiantes = estudiantes.map((e) => ({
    valor: String(e.id_estudiante),
    texto: `${e.apellidos} ${e.nombres} — ${nombreCurso(e.grado, e.grupo)} (Doc. ${e.documento})`
  }));

  function nombreLegibleRol(rolClave) {
    const mapa = {
      ADMINISTRADOR: 'Administrador',
      RECTOR: 'Rector',
      COORDINADOR: 'Coordinador',
      ESTUDIANTE: 'Estudiante',
      ACUDIENTE: 'Acudiente'
    };
    return mapa[rolClave] || rolClave;
  }

  // Enriquecer usuarios del sistema (Admin, Rector, Coordinador)
  $: listaPersonal = usuarios.map((u) => {
    const coord = coordinadores.find((c) => c.id_usuario === u.id_usuario);
    const rolNorm = normalizarRol(u.perfil);
    return {
      ...u,
      tipo_entidad: 'USUARIO',
      rol_clave: rolNorm,
      id_coordinador: coord?.id_coordinador ?? null,
      jornada_asignada: coord?.jornada_asignada ?? '',
      telefono_oficina: coord?.telefono_oficina ?? '',
      nombre_mostrar: u.nombre_completo,
      identificacion_mostrar: u.correo,
      // En la tabla de "Todos", la columna de detalle solo muestra el rol para Admin, Rector y Coordinador
      vinculo_mostrar: nombreLegibleRol(rolNorm)
    };
  });

  // Enriquecer estudiantes con nombre de salón
  $: listaEstudiantes = estudiantes.map((e) => ({
    ...e,
    tipo_entidad: 'ESTUDIANTE',
    rol_clave: 'ESTUDIANTE',
    nombre_mostrar: `${e.nombres} ${e.apellidos}`,
    identificacion_mostrar: `Doc. ${e.documento}`,
    salon_mostrar: `${nombreCurso(e.grado, e.grupo)} · ${e.jornada}`,
    vinculo_mostrar: `Salón ${nombreCurso(e.grado, e.grupo)} (${e.jornada})`
  }));

  // Enriquecer acudientes con sus estudiantes vinculados
  $: listaAcudientes = acudientes.map((a) => {
    const misVinculos = vinculos.filter((v) => v.id_acudiente === a.id_acudiente);
    const principal = misVinculos.find((v) => v.es_principal) || misVinculos[0] || null;
    const resumenVinculos =
      misVinculos.length > 0
        ? misVinculos
            .map((v) => `${v.estudiante} (${nombreCurso(v.grado, v.grupo)} · ${v.parentesco}${v.es_principal ? ' ★' : ''})`)
            .join(', ')
        : 'Sin estudiante vinculado';
    return {
      ...a,
      tipo_entidad: 'ACUDIENTE',
      rol_clave: 'ACUDIENTE',
      nombre_mostrar: `${a.nombres} ${a.apellidos}`,
      identificacion_mostrar: `Doc. ${a.documento} · ${a.correo}`,
      vinculos_lista: misVinculos,
      vinculo_principal: principal,
      vinculo_mostrar: resumenVinculos
    };
  });

  // Lista consolidada para la vista "TODOS"
  $: listaTodos = [...listaPersonal, ...listaEstudiantes, ...listaAcudientes];

  function normalizarRol(nombrePerfil) {
    const n = String(nombrePerfil || '').toUpperCase();
    if (n.includes('ADMIN')) return 'ADMINISTRADOR';
    if (n.includes('RECTOR')) return 'RECTOR';
    if (n.includes('COORD')) return 'COORDINADOR';
    return n || 'ADMINISTRADOR';
  }

  function insigniaRol(rol) {
    const mapa = {
      ADMINISTRADOR: { texto: 'Administrador', clase: 'info' },
      RECTOR: { texto: 'Rector', clase: 'exito' },
      COORDINADOR: { texto: 'Coordinador', clase: 'alerta' },
      ESTUDIANTE: { texto: 'Estudiante', clase: 'info' },
      ACUDIENTE: { texto: 'Acudiente', clase: 'exito' }
    };
    const item = mapa[rol] || { texto: rol, clase: 'info' };
    return `<span class="etiqueta ${item.clase}">${escapar(item.texto)}</span>`;
  }

  // Columnas según la pestaña activa
  const columnasTodos = [
    { titulo: 'Rol', campo: 'rol_clave', prioridad: 2, formato: (v) => insigniaRol(v) },
    {
      titulo: 'Nombre completo',
      campo: 'nombre_mostrar',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(v)}</strong><small>${escapar(f.identificacion_mostrar)}</small></div>`
    },
    { titulo: 'Salón / Estudiante vinculado / Detalle', campo: 'vinculo_mostrar', prioridad: 3, envolver: true },
    { titulo: 'Actualizado', campo: 'actualizado', prioridad: 5, formato: (v) => fechaHora(v) }
  ];

  const columnasPersonal = [
    { titulo: 'Rol', campo: 'rol_clave', prioridad: 2, formato: (v) => insigniaRol(v) },
    { titulo: 'Nombre completo', campo: 'nombre_completo', prioridad: 1, formato: (v) => `<strong>${escapar(v)}</strong>` },
    { titulo: 'Correo electrónico', campo: 'correo', prioridad: 3 },
    {
      titulo: 'Jornada asignada',
      campo: 'jornada_asignada',
      formato: (v, f) => (f.rol_clave === 'COORDINADOR' && v ? `<span class="etiqueta alerta">${escapar(v)}</span>` : '<span class="vacio">—</span>')
    },
    { titulo: 'Teléfono oficina', campo: 'telefono_oficina' },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  const columnasEstudiantes = [
    { titulo: 'Documento', campo: 'documento', prioridad: 2 },
    {
      titulo: 'Estudiante',
      campo: 'apellidos',
      prioridad: 1,
      formato: (v, f) => `<strong>${escapar(f.apellidos)} ${escapar(f.nombres)}</strong>`
    },
    {
      titulo: 'Salón / Curso',
      campo: 'grado',
      prioridad: 3,
      formato: (v, f) => `<span class="etiqueta info">${escapar(nombreCurso(f.grado, f.grupo))}</span>`
    },
    { titulo: 'Jornada', campo: 'jornada' },
    {
      titulo: 'Tardanzas',
      campo: 'total_tardanzas',
      formato: (v) => `<span class="etiqueta ${(v ?? 0) >= 3 ? 'peligro' : 'exito'}">${v ?? 0}</span>`
    },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  const columnasAcudientes = [
    { titulo: 'Documento', campo: 'documento', prioridad: 3 },
    {
      titulo: 'Acudiente',
      campo: 'apellidos',
      prioridad: 1,
      formato: (v, f) => `<div class="celda-doble"><strong>${escapar(f.apellidos)} ${escapar(f.nombres)}</strong><small>${escapar(f.correo)}</small></div>`
    },
    { titulo: 'Teléfono', campo: 'telefono', prioridad: 2 },
    { titulo: 'Estudiante vinculado (Parentesco)', campo: 'vinculo_mostrar', prioridad: 2, envolver: true },
    { titulo: 'Actualizado', campo: 'actualizado', formato: (v) => fechaHora(v) }
  ];

  $: datosTablaActual =
    pestanaActiva === 'PERSONAL'
      ? listaPersonal
      : pestanaActiva === 'ESTUDIANTE'
        ? listaEstudiantes
        : pestanaActiva === 'ACUDIENTE'
          ? listaAcudientes
          : listaTodos;

  $: columnasTablaActual =
    pestanaActiva === 'PERSONAL'
      ? columnasPersonal
      : pestanaActiva === 'ESTUDIANTE'
        ? columnasEstudiantes
        : pestanaActiva === 'ACUDIENTE'
          ? columnasAcudientes
          : columnasTodos;

  async function cargarTodo() {
    try {
      const [resPerfiles, resUsuarios, resCoordinadores, resEstudiantes, resAcudientes, resVinculos, resCursos] =
        await Promise.all([
          asegurarPerfilesBase(),
          obtenerUsuarios(),
          obtenerCoordinadores(),
          obtenerEstudiantes(),
          obtenerAcudientes(),
          obtenerVinculos(),
          obtenerCursos()
        ]);
      perfiles = resPerfiles;
      usuarios = resUsuarios;
      coordinadores = resCoordinadores;
      estudiantes = resEstudiantes;
      acudientes = resAcudientes;
      vinculos = resVinculos;
      cursos = resCursos;
    } catch (error) {
      avisar('Error al cargar los datos: ' + error.message, 'error');
    }
    cargando = false;
  }

  onMount(cargarTodo);

  function limpiarFormulario() {
    modoEdicion = false;
    idUsuarioEditando = null;
    idCoordinadorEditando = null;
    nombreCompleto = '';
    correoUsuario = '';
    passwordUsuario = '';
    jornadaCoordinador = 'MAÑANA';
    telefonoOficina = '';

    idEstudianteEditando = null;
    docEstudiante = '';
    nombresEstudiante = '';
    apellidosEstudiante = '';
    idCursoSeleccionado = cursos[0] ? String(cursos[0].id_curso) : '';

    idAcudienteEditando = null;
    idVinculoEditando = null;
    docAcudiente = '';
    nombresAcudiente = '';
    apellidosAcudiente = '';
    telefonoAcudiente = '';
    correoAcudiente = '';
    estudianteVinculado = null;
    idEstudianteSelect = '';
    parentescoAcudiente = 'Madre';
    esPrincipalAcudiente = true;
  }

  function abrirNuevo(rolPorDefecto = null) {
    limpiarFormulario();
    if (rolPorDefecto) {
      rolSeleccionado = rolPorDefecto;
    } else if (pestanaActiva === 'ESTUDIANTE') {
      rolSeleccionado = 'ESTUDIANTE';
    } else if (pestanaActiva === 'ACUDIENTE') {
      rolSeleccionado = 'ACUDIENTE';
    } else if (pestanaActiva === 'PERSONAL') {
      rolSeleccionado = 'COORDINADOR';
    } else {
      rolSeleccionado = 'ESTUDIANTE';
    }
    modalAbierto = true;
  }

  function prepararEdicion(evento) {
    const item = evento.detail;
    limpiarFormulario();
    modoEdicion = true;

    if (item.tipo_entidad === 'USUARIO') {
      rolSeleccionado = item.rol_clave;
      idUsuarioEditando = item.id_usuario;
      idCoordinadorEditando = item.id_coordinador;
      nombreCompleto = item.nombre_completo || '';
      correoUsuario = item.correo || '';
      passwordUsuario = '';
      jornadaCoordinador = item.jornada_asignada || 'MAÑANA';
      telefonoOficina = item.telefono_oficina || '';
    } else if (item.tipo_entidad === 'ESTUDIANTE') {
      rolSeleccionado = 'ESTUDIANTE';
      idEstudianteEditando = item.id_estudiante;
      docEstudiante = item.documento || '';
      nombresEstudiante = item.nombres || '';
      apellidosEstudiante = item.apellidos || '';
      const cursoMatch =
        cursos.find((c) => Number(c.grado) === Number(item.grado) && c.grupo === item.grupo && c.jornada === item.jornada) ||
        cursos.find((c) => Number(c.id_curso) === Number(item.id_curso));
      idCursoSeleccionado = cursoMatch ? String(cursoMatch.id_curso) : '';
    } else if (item.tipo_entidad === 'ACUDIENTE') {
      rolSeleccionado = 'ACUDIENTE';
      idAcudienteEditando = item.id_acudiente;
      docAcudiente = item.documento || '';
      nombresAcudiente = item.nombres || '';
      apellidosAcudiente = item.apellidos || '';
      telefonoAcudiente = item.telefono || '';
      correoAcudiente = item.correo || '';

      const vinc = item.vinculo_principal;
      if (vinc) {
        idVinculoEditando = vinc.id;
        parentescoAcudiente = vinc.parentesco || 'Madre';
        esPrincipalAcudiente = Boolean(vinc.es_principal);
        const estObj = estudiantes.find((e) => Number(e.id_estudiante) === Number(vinc.id_estudiante));
        estudianteVinculado = estObj || {
          id_estudiante: vinc.id_estudiante,
          nombres: vinc.estudiante,
          apellidos: '',
          documento: '',
          grado: vinc.grado,
          grupo: vinc.grupo,
          jornada: ''
        };
        idEstudianteSelect = String(vinc.id_estudiante);
      }
    }

    modalAbierto = true;
  }

  function alSeleccionarEstudianteBuscador(evento) {
    const est = evento.detail;
    estudianteVinculado = est;
    idEstudianteSelect = String(est.id_estudiante);
  }

  function alCambiarSelectEstudiante() {
    const est = estudiantes.find((e) => String(e.id_estudiante) === String(idEstudianteSelect));
    estudianteVinculado = est || null;
  }

  function obtenerIdPerfilPorRol(rol) {
    const buscado = rol.toUpperCase();
    const encontrado = perfiles.find((p) => {
      const n = p.nombre.toUpperCase();
      if (buscado === 'ADMINISTRADOR') return n.includes('ADMIN');
      if (buscado === 'RECTOR') return n.includes('RECTOR');
      if (buscado === 'COORDINADOR') return n.includes('COORD');
      return n === buscado;
    });
    return encontrado?.id_perfil ?? perfiles[0]?.id_perfil ?? 2;
  }

  async function guardarUsuario(evento) {
    evento.preventDefault();
    guardando = true;

    try {
      if (rolSeleccionado === 'ADMINISTRADOR' || rolSeleccionado === 'RECTOR' || rolSeleccionado === 'COORDINADOR') {
        const id_perfil = obtenerIdPerfilPorRol(rolSeleccionado);
        const payloadUsuario = {
          id_perfil: Number(id_perfil),
          nombre_completo: nombreCompleto.trim(),
          correo: correoUsuario.trim(),
          password: passwordUsuario.trim() ? passwordUsuario.trim() : null
        };

        if (!modoEdicion) {
          const creado = await crearUsuario(payloadUsuario);
          const nuevoIdUsuario = creado.id;
          if (rolSeleccionado === 'COORDINADOR') {
            await crearCoordinador({
              id_usuario: Number(nuevoIdUsuario),
              jornada_asignada: jornadaCoordinador,
              telefono_oficina: telefonoOficina.trim() || null
            });
          }
          avisar(`${nombreLegibleRol(rolSeleccionado)} registrado exitosamente`);
        } else {
          await actualizarUsuario(idUsuarioEditando, payloadUsuario);
          if (rolSeleccionado === 'COORDINADOR') {
            const datosCoord = {
              id_usuario: Number(idUsuarioEditando),
              jornada_asignada: jornadaCoordinador,
              telefono_oficina: telefonoOficina.trim() || null
            };
            if (idCoordinadorEditando) {
              await actualizarCoordinador(idCoordinadorEditando, datosCoord);
            } else {
              await crearCoordinador(datosCoord);
            }
          } else if (idCoordinadorEditando) {
            await eliminarCoordinador(idCoordinadorEditando);
          }
          avisar('Datos del usuario actualizados correctamente');
        }
      } else if (rolSeleccionado === 'ESTUDIANTE') {
        const salon = cursos.find((c) => String(c.id_curso) === String(idCursoSeleccionado));
        if (!salon) {
          avisar('Seleccione un salón existente para vincular al estudiante', 'alerta');
          guardando = false;
          return;
        }
        const payloadEstudiante = {
          documento: docEstudiante.trim(),
          nombres: nombresEstudiante.trim(),
          apellidos: apellidosEstudiante.trim(),
          grado: Number(salon.grado),
          grupo: salon.grupo,
          jornada: salon.jornada,
          id_curso: Number(salon.id_curso)
        };

        if (!modoEdicion) {
          await crearEstudiante(payloadEstudiante);
          avisar(`Estudiante registrado y vinculado al salón ${nombreCurso(salon.grado, salon.grupo)}`);
        } else {
          await actualizarEstudiante(idEstudianteEditando, payloadEstudiante);
          avisar('Estudiante actualizado correctamente');
        }
      } else if (rolSeleccionado === 'ACUDIENTE') {
        const idEstFinal = estudianteVinculado?.id_estudiante || (idEstudianteSelect ? Number(idEstudianteSelect) : null);
        if (!idEstFinal) {
          avisar('Debe seleccionar y vincular un estudiante existente para el acudiente', 'alerta');
          guardando = false;
          return;
        }

        const payloadAcudiente = {
          documento: docAcudiente.trim(),
          nombres: nombresAcudiente.trim(),
          apellidos: apellidosAcudiente.trim(),
          telefono: telefonoAcudiente.trim(),
          correo: correoAcudiente.trim()
        };

        if (!modoEdicion) {
          const creado = await crearAcudiente(payloadAcudiente);
          await crearVinculo({
            id_estudiante: Number(idEstFinal),
            id_acudiente: Number(creado.id),
            parentesco: parentescoAcudiente,
            es_principal: Boolean(esPrincipalAcudiente)
          });
          avisar('Acudiente registrado y vinculado al estudiante exitosamente');
        } else {
          await actualizarAcudiente(idAcudienteEditando, payloadAcudiente);
          const payloadVinculo = {
            id_estudiante: Number(idEstFinal),
            id_acudiente: Number(idAcudienteEditando),
            parentesco: parentescoAcudiente,
            es_principal: Boolean(esPrincipalAcudiente)
          };
          if (idVinculoEditando) {
            await actualizarVinculo(idVinculoEditando, payloadVinculo);
          } else {
            await crearVinculo(payloadVinculo);
          }
          avisar('Acudiente y vínculo actualizados correctamente');
        }
      }

      modalAbierto = false;
      limpiarFormulario();
      await cargarTodo();
    } catch (error) {
      avisar('No se pudo guardar: ' + error.message, 'error');
    }
    guardando = false;
  }

  async function guardarNuevoSalon(evento) {
    evento.preventDefault();
    try {
      const res = await crearCurso({
        grado: Number(nuevoGrado),
        grupo: nuevoGrupo.trim().toUpperCase(),
        jornada: nuevaJornadaSalon
      });
      avisar(`Salón ${nuevoGrado}°${nuevoGrupo.trim().toUpperCase()} (${nuevaJornadaSalon}) registrado`);
      cursos = await obtenerCursos();
      if (res?.id) idCursoSeleccionado = String(res.id);
      modalSalonAbierto = false;
    } catch (error) {
      avisar('No se pudo crear el salón: ' + error.message, 'error');
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    try {
      if (porEliminar.tipo_entidad === 'USUARIO') {
        if (porEliminar.id_coordinador) {
          await eliminarCoordinador(porEliminar.id_coordinador);
        }
        await eliminarUsuario(porEliminar.id_usuario);
        avisar('Usuario inactivado correctamente');
      } else if (porEliminar.tipo_entidad === 'ESTUDIANTE') {
        await eliminarEstudiante(porEliminar.id_estudiante);
        avisar('Estudiante inactivado correctamente');
      } else if (porEliminar.tipo_entidad === 'ACUDIENTE') {
        const vinculosAcudiente = vinculos.filter((v) => v.id_acudiente === porEliminar.id_acudiente);
        for (const v of vinculosAcudiente) {
          await eliminarVinculo(v.id);
        }
        await eliminarAcudiente(porEliminar.id_acudiente);
        avisar('Acudiente inactivado correctamente');
      }
      porEliminar = null;
      await cargarTodo();
    } catch (error) {
      avisar('No se pudo eliminar: ' + error.message, 'error');
    }
  }
</script>

<Header titulo={tituloPagina} subtitulo={subtituloPagina}>
  <button type="button" class="btn btn-claro" on:click={() => (modalSalonAbierto = true)}>
    <Icono nombre="mas" tam={17} /> Nuevo salón
  </button>
  <button type="button" class="btn btn-acento" on:click={() => abrirNuevo()}>
    <Icono nombre="mas" tam={18} /> Nuevo usuario
  </button>
</Header>

{#if cargando}
  <Cargando texto="Cargando usuarios..." />
{:else}
  <div class="rejilla-datos">
    <TarjetaDato
      titulo="Total usuarios activos"
      valor={listaTodos.length}
      detalle="Registros activos en el sistema"
      color="azul"
    />
    <TarjetaDato
      titulo="Admin, Rector y Coordinador"
      valor={listaPersonal.length}
      detalle={`${coordinadores.length} en coordinación`}
      color="rojo"
    />
    <TarjetaDato
      titulo="Estudiantes matriculados"
      valor={listaEstudiantes.length}
      detalle={`En ${cursos.length} salones registrados`}
      color="dorado"
    />
    <TarjetaDato
      titulo="Acudientes registrados"
      valor={listaAcudientes.length}
      detalle={`${vinculos.length} vínculos con estudiantes`}
      color="verde"
    />
  </div>

  <Card>
    <div class="barra-pestanas" role="tablist" aria-label="Filtrar por tipo de rol">
      <button
        type="button"
        class="pestana"
        class:activa={pestanaActiva === 'TODOS'}
        on:click={() => (pestanaActiva = 'TODOS')}
      >
        Todos ({listaTodos.length})
      </button>
      <button
        type="button"
        class="pestana"
        class:activa={pestanaActiva === 'PERSONAL'}
        on:click={() => (pestanaActiva = 'PERSONAL')}
      >
        Admin / Rector / Coordinador ({listaPersonal.length})
      </button>
      <button
        type="button"
        class="pestana"
        class:activa={pestanaActiva === 'ESTUDIANTE'}
        on:click={() => (pestanaActiva = 'ESTUDIANTE')}
      >
        Estudiantes ({listaEstudiantes.length})
      </button>
      <button
        type="button"
        class="pestana"
        class:activa={pestanaActiva === 'ACUDIENTE'}
        on:click={() => (pestanaActiva = 'ACUDIENTE')}
      >
        Acudientes ({listaAcudientes.length})
      </button>
    </div>

    {#key pestanaActiva}
      <DataTable
        datos={datosTablaActual}
        columnas={columnasTablaActual}
        on:editar={prepararEdicion}
        on:eliminar={(e) => (porEliminar = e.detail)}
      />
    {/key}
  </Card>
{/if}

<!-- Modal principal: Crear o Editar Usuario según Rol -->
<Modal
  abierto={modalAbierto}
  titulo={modoEdicion ? `Editar ${nombreLegibleRol(rolSeleccionado).toLowerCase()}` : 'Crear nuevo usuario'}
  on:cerrar={() => (modalAbierto = false)}
>
  <form on:submit={guardarUsuario}>
    {#if !modoEdicion}
      <Selector
        etiqueta="Seleccione el rol"
        id="rol-perfil"
        bind:value={rolSeleccionado}
        opciones={opcionesRol}
        requerido
        vacio="Seleccione un rol..."
      />
    {:else if rolSeleccionado === 'ADMINISTRADOR' || rolSeleccionado === 'COORDINADOR' || rolSeleccionado === 'RECTOR'}
      <Selector
        etiqueta="Rol del usuario"
        id="rol-perfil-ed"
        bind:value={rolSeleccionado}
        opciones={opcionesRolPersonal}
        requerido
      />
    {:else}
      <div class="banner-rol">
        <span>Rol del registro:</span>
        <strong>{nombreLegibleRol(rolSeleccionado)}</strong>
      </div>
    {/if}

    <!-- FORMULARIO PARA ADMIN, RECTOR Y COORDINADOR -->
    {#if rolSeleccionado === 'ADMINISTRADOR' || rolSeleccionado === 'RECTOR' || rolSeleccionado === 'COORDINADOR'}
      <div class="seccion-campos">
        <p class="subtitulo-seccion">Datos básicos de la cuenta</p>
        <Campo
          etiqueta="Nombre completo"
          id="u-nombre"
          bind:value={nombreCompleto}
          requerido
          maxlength={120}
          placeholder="Ej. Juan Fernando De la Hoz"
        />
        <Campo
          etiqueta="Correo institucional / electrónico"
          id="u-correo"
          tipo="email"
          bind:value={correoUsuario}
          requerido
          maxlength={120}
          placeholder="usuario@colegio.edu.co"
        />
        <Campo
          etiqueta={modoEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}
          id="u-password"
          tipo="password"
          bind:value={passwordUsuario}
          requerido={!modoEdicion}
          ayuda={modoEdicion
            ? 'Deje este campo vacío si desea mantener la contraseña actual'
            : 'La contraseña se encriptará automáticamente al guardar'}
        />
      </div>

      {#if rolSeleccionado === 'COORDINADOR'}
        <div class="seccion-campos bloque-destacado">
          <p class="subtitulo-seccion">Datos de coordinación</p>
          <div class="rejilla-2">
            <Selector
              etiqueta="Jornada asignada"
              id="c-jornada"
              bind:value={jornadaCoordinador}
              opciones={opcionesJornada}
              requerido
            />
            <Campo
              etiqueta="Teléfono de oficina"
              id="c-telefono"
              bind:value={telefonoOficina}
              maxlength={30}
              placeholder="Ej. 3001234567"
            />
          </div>
        </div>
      {/if}

    <!-- FORMULARIO PARA ESTUDIANTE (vincular a salón existente) -->
    {:else if rolSeleccionado === 'ESTUDIANTE'}
      <div class="seccion-campos">
        <p class="subtitulo-seccion">Datos básicos del estudiante</p>
        <Campo
          etiqueta="Documento de identidad"
          id="e-documento"
          bind:value={docEstudiante}
          requerido
          maxlength={30}
          placeholder="Ej. 1045001"
        />
        <div class="rejilla-2">
          <Campo
            etiqueta="Nombres"
            id="e-nombres"
            bind:value={nombresEstudiante}
            requerido
            maxlength={80}
            placeholder="Ej. Andrés Felipe"
          />
          <Campo
            etiqueta="Apellidos"
            id="e-apellidos"
            bind:value={apellidosEstudiante}
            requerido
            maxlength={80}
            placeholder="Ej. Rendón Martínez"
          />
        </div>
      </div>

      <div class="seccion-campos bloque-destacado">
        <div class="cabecera-vinculo">
          <p class="subtitulo-seccion">Vincular a un salón existente</p>
          <button type="button" class="btn-enlace" on:click={() => (modalSalonAbierto = true)}>
            + Crear salón
          </button>
        </div>
        <Selector
          etiqueta="Salón / Curso"
          id="e-curso"
          bind:value={idCursoSeleccionado}
          opciones={opcionesCursos}
          requerido
          vacio="Seleccione un salón existente..."
        />
        {#if cursoActualObjeto}
          <div class="resumen-seleccion">
            <span><strong>Grado:</strong> {cursoActualObjeto.grado}°</span>
            <span><strong>Grupo:</strong> {cursoActualObjeto.grupo}</span>
            <span><strong>Jornada:</strong> {cursoActualObjeto.jornada}</span>
          </div>
        {/if}
      </div>

    <!-- FORMULARIO PARA ACUDIENTE (vincular a estudiante existente) -->
    {:else if rolSeleccionado === 'ACUDIENTE'}
      <div class="seccion-campos">
        <p class="subtitulo-seccion">Datos básicos del acudiente</p>
        <div class="rejilla-2">
          <Campo
            etiqueta="Documento de identidad"
            id="a-documento"
            bind:value={docAcudiente}
            requerido
            maxlength={30}
            placeholder="Ej. 32001"
          />
          <Campo
            etiqueta="Teléfono / Celular"
            id="a-telefono"
            bind:value={telefonoAcudiente}
            requerido
            maxlength={30}
            placeholder="Ej. 3004567890"
          />
        </div>
        <div class="rejilla-2">
          <Campo
            etiqueta="Nombres"
            id="a-nombres"
            bind:value={nombresAcudiente}
            requerido
            maxlength={80}
            placeholder="Ej. Patricia Elena"
          />
          <Campo
            etiqueta="Apellidos"
            id="a-apellidos"
            bind:value={apellidosAcudiente}
            requerido
            maxlength={80}
            placeholder="Ej. Martínez Suárez"
          />
        </div>
        <Campo
          etiqueta="Correo electrónico (para recibir notificaciones)"
          id="a-correo"
          tipo="email"
          bind:value={correoAcudiente}
          requerido
          maxlength={120}
          placeholder="acudiente@gmail.com"
        />
      </div>

      <div class="seccion-campos bloque-destacado">
        <p class="subtitulo-seccion">Vincular a un estudiante existente</p>

        {#if estudianteVinculado}
          <div class="estudiante-elegido">
            <div>
              <strong>{estudianteVinculado.nombres} {estudianteVinculado.apellidos}</strong>
              <small>
                {#if estudianteVinculado.documento}Doc. {estudianteVinculado.documento} · {/if}
                Salón {nombreCurso(estudianteVinculado.grado, estudianteVinculado.grupo)}
                {#if estudianteVinculado.jornada} · {estudianteVinculado.jornada}{/if}
              </small>
            </div>
            <button
              type="button"
              class="btn btn-claro btn-pequeno"
              on:click={() => {
                estudianteVinculado = null;
                idEstudianteSelect = '';
              }}
            >
              Cambiar
            </button>
          </div>
        {:else}
          <BuscadorEstudiante
            {estudiantes}
            etiqueta="Buscar estudiante por nombre, documento o curso"
            on:seleccionar={alSeleccionarEstudianteBuscador}
          />
          <Selector
            etiqueta="O seleccione el estudiante de la lista"
            id="a-estudiante-select"
            bind:value={idEstudianteSelect}
            opciones={opcionesEstudiantes}
            on:change={alCambiarSelectEstudiante}
            vacio="Seleccione un estudiante existente..."
          />
        {/if}

        <div class="rejilla-2">
          <Selector
            etiqueta="Parentesco"
            id="a-parentesco"
            bind:value={parentescoAcudiente}
            opciones={opcionesParentesco}
            requerido
          />
          <div class="contenedor-casilla">
            <label class="casilla">
              <input type="checkbox" bind:checked={esPrincipalAcudiente} />
              <span>Es acudiente principal (recibe alertas)</span>
            </label>
          </div>
        </div>
      </div>
    {/if}

    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={() => (modalAbierto = false)}>Cancelar</button>
      <button type="submit" class="btn btn-primario" disabled={guardando}>
        {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Registrar usuario'}
      </button>
    </div>
  </form>
</Modal>

<!-- Modal secundario: Crear nuevo salón -->
<Modal abierto={modalSalonAbierto} titulo="Registrar nuevo salón" on:cerrar={() => (modalSalonAbierto = false)}>
  <form on:submit={guardarNuevoSalon}>
    <div class="rejilla-2">
      <Campo etiqueta="Grado (número)" id="s-grado" tipo="number" min={1} max={11} bind:value={nuevoGrado} requerido />
      <Campo etiqueta="Grupo (letra)" id="s-grupo" bind:value={nuevoGrupo} maxlength={5} placeholder="Ej. A, B, C" requerido />
    </div>
    <Selector etiqueta="Jornada" id="s-jornada" bind:value={nuevaJornadaSalon} opciones={opcionesJornada} requerido />
    <div class="botones-formulario">
      <button type="button" class="btn btn-gris" on:click={() => (modalSalonAbierto = false)}>Cancelar</button>
      <button type="submit" class="btn btn-primario">Crear salón</button>
    </div>
  </form>
</Modal>

<!-- Confirmar eliminación (borrado lógico) -->
<Confirmar
  abierto={porEliminar !== null}
  mensaje={`¿Desea inactivar a "${porEliminar?.nombre_mostrar}" (${nombreLegibleRol(porEliminar?.rol_clave)})?`}
  on:confirmar={confirmarEliminar}
  on:cancelar={() => (porEliminar = null)}
/>

<style>
  .barra-pestanas {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 12px;
    margin-bottom: 18px;
  }

  .pestana {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .pestana:hover {
    background: var(--azul-claro);
    color: var(--azul);
  }

  .pestana.activa {
    background: var(--azul);
    color: white;
    border-color: var(--azul);
  }

  .banner-rol {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--azul-claro);
    color: var(--azul);
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 14px;
    font-size: 0.92rem;
  }

  .seccion-campos {
    margin-bottom: 12px;
  }

  .bloque-destacado {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--dorado);
    border-radius: 8px;
    padding: 14px;
  }

  .subtitulo-seccion {
    margin: 0 0 10px 0;
    font-size: 0.88rem;
    font-weight: bold;
    color: var(--azul);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .cabecera-vinculo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .cabecera-vinculo .subtitulo-seccion {
    margin-bottom: 0;
  }

  .btn-enlace {
    background: none;
    border: none;
    color: var(--azul);
    font-weight: bold;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 2px 4px;
  }

  .resumen-seleccion {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    background: var(--azul-claro);
    color: var(--azul);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.88rem;
  }

  .estudiante-elegido {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    background: var(--azul-claro);
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 14px;
  }

  .estudiante-elegido strong {
    display: block;
    color: var(--azul);
    font-size: 0.96rem;
  }

  .estudiante-elegido small {
    color: #475569;
  }

  .btn-pequeno {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .contenedor-casilla {
    display: flex;
    align-items: center;
    padding-top: 18px;
  }

  .casilla {
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .casilla input {
    width: 18px;
    height: 18px;
  }
</style>
