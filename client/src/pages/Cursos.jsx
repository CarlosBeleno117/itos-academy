import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { useAppContext } from "../context/AppContext";

const SERVER_URL = "http://localhost:3001";

function Cursos() {
  const { state } = useAppContext();

  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [avanceCurso, setAvanceCurso] = useState(null);

  const [evaluacionActual, setEvaluacionActual] = useState(null);

  

  const [loading, setLoading] = useState(true);
  const [loadingMateriales, setLoadingMateriales] = useState(false);


  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");


  const [busquedaCurso, setBusquedaCurso] = useState("");
  const [areaFiltroCurso, setAreaFiltroCurso] = useState("all");
  const [estadoFiltroCurso, setEstadoFiltroCurso] = useState("all");
  const [avanceFiltroCurso, setAvanceFiltroCurso] = useState("all");



  const [formMaterial, setFormMaterial] = useState({
    titulo: "",
    descripcion: "",
    archivo: null,
  });

  const [modalCursoAbierto, setModalCursoAbierto] = useState(false);
  const [modoCurso, setModoCurso] = useState("crear");
  const [cursoEditando, setCursoEditando] = useState(null);
  const [modalAsignacionAbierto, setModalAsignacionAbierto] = useState(false);
  const [cursoAsignando, setCursoAsignando] = useState(null);
  const [usuarioAsignadoId, setUsuarioAsignadoId] = useState("");

  const [modalAprendizajeAbierto, setModalAprendizajeAbierto] = useState(false);
  const [cursoAprendizaje, setCursoAprendizaje] = useState(null);
  const [materialesAprendizaje, setMaterialesAprendizaje] = useState([]);
  const [avanceAprendizaje, setAvanceAprendizaje] = useState(null);
  const [resumenAprendizaje, setResumenAprendizaje] = useState(null);
  const [indiceMaterialActual, setIndiceMaterialActual] = useState(0);
  const [loadingAprendizaje, setLoadingAprendizaje] = useState(false);
  const [mensajeAprendizaje, setMensajeAprendizaje] = useState("");
  const [materialCompletandoId, setMaterialCompletandoId] = useState(null);

  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState(false);
  const [cursoEvaluacion, setCursoEvaluacion] = useState(null);
  const [evaluacionActiva, setEvaluacionActiva] = useState(null);

  const [modalEvaluacionAdminAbierto, setModalEvaluacionAdminAbierto] =
    useState(false);
  const [cursoEvaluacionAdmin, setCursoEvaluacionAdmin] = useState(null);
  const [evaluacionAdmin, setEvaluacionAdmin] = useState(null);
  const [preguntasAdmin, setPreguntasAdmin] = useState([]);
  const [loadingEvaluacionAdmin, setLoadingEvaluacionAdmin] = useState(false);
  const [guardandoEvaluacionAdmin, setGuardandoEvaluacionAdmin] = useState(false);
  const [formEvaluacionAdmin, setFormEvaluacionAdmin] = useState({
    titulo: "",
    puntaje_minimo: 70,
    estado: "Activa",
  });

  const [modoPreguntaAdmin, setModoPreguntaAdmin] = useState("crear");
  const [preguntaEditando, setPreguntaEditando] = useState(null);
  const [guardandoPreguntaAdmin, setGuardandoPreguntaAdmin] = useState(false);
  const [formPreguntaAdmin, setFormPreguntaAdmin] = useState({
    texto_pregunta: "",
    opcion_a: "",
    opcion_b: "",
    opcion_c: "",
    opcion_d: "",
    respuesta_correcta: "A",
    estado: "Activa",
    ponderacion: 1,
  });

  const [archivoCsvPreguntas, setArchivoCsvPreguntas] = useState(null);
  const [cargandoCsvPreguntas, setCargandoCsvPreguntas] = useState(false);
  const [erroresCsvPreguntas, setErroresCsvPreguntas] = useState([]);

  const [preguntasEvaluacion, setPreguntasEvaluacion] = useState([]);
  const [respuestasEvaluacion, setRespuestasEvaluacion] = useState({});
  const [loadingEvaluacion, setLoadingEvaluacion] = useState(false);
  const [enviandoEvaluacion, setEnviandoEvaluacion] = useState(false);
  const [mensajeEvaluacion, setMensajeEvaluacion] = useState("");
  const [resultadoEvaluacion, setResultadoEvaluacion] = useState(null);
  const [modalConfirmarReintentoAbierto, setModalConfirmarReintentoAbierto] =
  useState(false);
  const [asignacionReintento, setAsignacionReintento] = useState(null);
  const [loadingReintento, setLoadingReintento] = useState(false);

  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [loadingAsignados, setLoadingAsignados] = useState(false);
  const [modalDesasignarAbierto, setModalDesasignarAbierto] = useState(false);
  const [asignacionAEliminar, setAsignacionAEliminar] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("all");
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [avanceFiltro, setAvanceFiltro] = useState("all");
  const [vistaCursos, setVistaCursos] = useState("todos");

  const [tabDetalleCurso, setTabDetalleCurso] = useState("resumen");
  const [modalEliminarMaterialAbierto, setModalEliminarMaterialAbierto] =
    useState(false);
  const [materialAEliminar, setMaterialAEliminar] = useState(null);
  const [eliminandoMaterial, setEliminandoMaterial] = useState(false);

  const [formCurso, setFormCurso] = useState({
    titulo: "",
    descripcion: "",
    area: "BPO",
    duracion_horas: 1,
    responsable_id: "",
    estado: "Disponible",
  });

  const usuarioActivo = state.usuarioActivo;
  const detalleCursoRef = useRef(null);

  function obtenerTextoVistaCursos() {
    if (usuarioActivo?.rol === "Super Admin" || usuarioActivo?.rol === "Admin") {
      return "En esta sección se muestran todos los cursos registrados en la plataforma.";
    }

    if (usuarioActivo?.rol === "Supervisor") {
      return `En esta sección se muestran los cursos del área ${usuarioActivo.area}.`;
    }

    return "En esta sección se muestran únicamente los cursos asignados a tu usuario.";
  }

  useEffect(() => {
    async function cargarCursos() {
      if (!usuarioActivo?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/cursos?viewerId=${usuarioActivo.id}`);
        setCursos(response.data);

        // Limpia el detalle cuando cambia el usuario activo
        setCursoSeleccionado(null);
        setAvanceCurso(null);
        setMateriales([]);
        setEvaluacionActual(null);
        setPreguntasEvaluacion([]);
      } catch (error) {
        console.error(error);
        setError("No fue posible cargar los cursos.");
      } finally {
        setLoading(false);
      }
    }

    cargarCursos();
  }, [usuarioActivo]);



  async function verDetalleCurso(curso) {
    setCursoSeleccionado(curso);
    setTabDetalleCurso("resumen");
    setMensaje("");
    setError("");
    setResultadoEvaluacion(null);
    setRespuestasEvaluacion({});
    setMensajeEvaluacion("");
    setAvanceCurso(null);
    setUsuariosAsignados([]);

    await cargarMateriales(curso.id);
    await cargarEvaluacion(curso.id);
    await cargarAvanceCurso(curso.id);

    if (puedeVerAsignadosCurso(curso)) {
      await cargarUsuariosAsignados(curso.id);
    }
  }

  function puedeCrearCurso() {
  if (!usuarioActivo) return false;

  return (
    usuarioActivo.rol === "Super Admin" ||
    usuarioActivo.rol === "Admin" ||
    usuarioActivo.rol === "Supervisor"
  );
}

  function abrirModalCurso() {
    setError("");
    setMensaje("");
    setModoCurso("crear");
    setCursoEditando(null);

    setFormCurso({
      titulo: "",
      descripcion: "",
      area: usuarioActivo?.rol === "Supervisor" ? usuarioActivo.area : "BPO",
      duracion_horas: 1,
      responsable_id: "",
      estado: "Disponible",
    });

    setModalCursoAbierto(true);
  }

    function cerrarModalCurso() {
      setModalCursoAbierto(false);
      setModoCurso("crear");
      setCursoEditando(null);
    }

  function handleChangeCurso(e) {
    const { name, value } = e.target;

    setFormCurso({
      ...formCurso,
      [name]: value,
    });
  }

  async function recargarCursos() {
    const response = await api.get(`/cursos?viewerId=${usuarioActivo.id}`);
    setCursos(response.data);
  }

async function handleSubmitCurso(e) {
  e.preventDefault();

  const tituloLimpio = formCurso.titulo.trim();
  const descripcionLimpia = formCurso.descripcion.trim();

  if (!tituloLimpio || !descripcionLimpia) {
    setError("Debe ingresar título y descripción del curso.");
    return;
  }

  if (tituloLimpio.length < 5 || tituloLimpio.length > 150) {
    setError("El título debe tener entre 5 y 150 caracteres.");
    return;
  }

  if (descripcionLimpia.length < 15 || descripcionLimpia.length > 1000) {
    setError("La descripción debe tener entre 15 y 1000 caracteres.");
    return;
  }

  const duracion = Number(formCurso.duracion_horas);

  if (Number.isNaN(duracion) || duracion < 0.5 || duracion > 40) {
    setError("La duración debe estar entre 0.5 y 40 horas.");
    return;
  }

  const rolActivo = usuarioActivo?.rol?.trim();
  const areaActiva = usuarioActivo?.area?.trim();

  if (
    rolActivo === "Supervisor" &&
    formCurso.area !== areaActiva
  ) {
    setError("El supervisor solo puede gestionar cursos de su propia área.");
    return;
  }

  const payload = {
    titulo: tituloLimpio,
    descripcion: descripcionLimpia,
    area: formCurso.area,
    duracion_horas: duracion,
    responsable_id: formCurso.responsable_id || null,
    estado: formCurso.estado,
  };

  try {
    setError("");
    setMensaje("");

    if (modoCurso === "crear") {
      await api.post("/cursos", {
        ...payload,
        creado_por: usuarioActivo.id,
      });

      setMensaje("Curso creado correctamente.");
    } else {
      await api.put(`/cursos/${cursoEditando.id}`, {
        ...payload,
        actualizado_por: usuarioActivo.id,
      });

      setMensaje("Curso actualizado correctamente.");
    }

    await recargarCursos();
    cerrarModalCurso();
  } catch (error) {
    console.error(error);

    setError(
      error.response?.data?.message ||
        `No fue posible ${modoCurso === "crear" ? "crear" : "actualizar"} el curso.`
    );
  }
}

  function puedeEditarCurso(curso) {
    if (!usuarioActivo || !curso) return false;

    if (usuarioActivo.rol === "Super Admin") return true;
    if (usuarioActivo.rol === "Admin") return true;

    if (
      usuarioActivo.rol === "Supervisor" &&
      usuarioActivo.area === curso.area
    ) {
      return true;
    }

    return false;
  }

  function abrirModalEditarCurso(curso) {
    setError("");
    setMensaje("");
    setModoCurso("editar");
    setCursoEditando(curso);

    setFormCurso({
      titulo: curso.titulo || "",
      descripcion: curso.descripcion || "",
      area: curso.area || "BPO",
      duracion_horas: curso.duracion_horas || 1,
      responsable_id: curso.responsable_id || "",
      estado: curso.estado || "Disponible",
    });

    setModalCursoAbierto(true);
  }

  async function cargarMateriales(cursoId) {
    try {
      setLoadingMateriales(true);
      const response = await api.get(`/materiales/${cursoId}`);
      setMateriales(response.data);
    } catch (error) {
      console.error(error);
      setError("No fue posible cargar los materiales del curso.");
    } finally {
      setLoadingMateriales(false);
    }
  }

  async function cargarEvaluacion(cursoId) {
    try {
      setLoadingEvaluacion(true);
      setEvaluacionActual(null);
      setPreguntasEvaluacion([]);

      const response = await api.get(`/evaluaciones/curso/${cursoId}`);

      setEvaluacionActual(response.data.evaluacion);
      setPreguntasEvaluacion(response.data.preguntas);
    } catch (error) {
      console.error(error);
      setMensajeEvaluacion("Este curso aún no tiene evaluación activa.");
    } finally {
      setLoadingEvaluacion(false);
    }
  }

  function puedeAsignarCurso(curso) {
    if (!usuarioActivo || !curso) return false;

    if (usuarioActivo.rol === "Super Admin") return true;
    if (usuarioActivo.rol === "Admin") return true;

    if (
      usuarioActivo.rol === "Supervisor" &&
      usuarioActivo.area === curso.area
    ) {
      return true;
    }

    return false;
  }

  function obtenerUsuariosAsignables(curso) {
    if (!curso) return [];

    const idsAsignados = usuariosAsignados.map((item) =>
      Number(item.usuario_id)
    );

    return state.usuarios.filter((usuario) => {
      if (usuario.estado !== "Activo") return false;
      if (idsAsignados.includes(Number(usuario.id))) return false;

      if (usuarioActivo?.rol === "Super Admin" || usuarioActivo?.rol === "Admin") {
        return true;
      }

      if (usuarioActivo?.rol === "Supervisor") {
        return (
          usuario.rol === "Empleado" &&
          usuario.area === usuarioActivo.area &&
          curso.area === usuarioActivo.area
        );
      }

      return false;
    });
  }

  function puedeAbrirAprendizaje(curso) {
    if (!usuarioActivo || !curso) return false;

    // Solo se abre aprendizaje si el curso está asignado al usuario activo.
    return curso.estado_avance !== null && curso.estado_avance !== undefined;
  }

  function puedeAbrirEvaluacion(curso) {
    if (!usuarioActivo || !curso) return false;

    if (!curso.estado_avance) return false;

    if (curso.estado_avance === "Completado") return true;

    if (!curso.materiales_revisados) return false;

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      !curso.reintento_habilitado
    ) {
      return false;
    }

    return true;
  }

  function puedeGestionarEvaluacionCurso(curso) {
    if (!usuarioActivo || !curso) return false;

    if (usuarioActivo.rol === "Super Admin" || usuarioActivo.rol === "Admin") {
      return true;
    }

    if (usuarioActivo.rol === "Supervisor") {
      return curso.area === usuarioActivo.area;
    }

    return false;
  }

  function handleChangeEvaluacionAdmin(e) {
    const { name, value } = e.target;

    setFormEvaluacionAdmin({
      ...formEvaluacionAdmin,
      [name]: value,
    });
  }

  async function abrirModalEvaluacionAdmin(curso) {
    if (!usuarioActivo?.id || !curso) return;

    try {
      setError("");
      setMensaje("");
      setLoadingEvaluacionAdmin(true);

      setCursoEvaluacionAdmin(curso);
      setEvaluacionAdmin(null);
      setPreguntasAdmin([]);
      setFormEvaluacionAdmin({
        titulo: "",
        puntaje_minimo: 70,
        estado: "Activa",
      });

      setModalEvaluacionAdminAbierto(true);

      const response = await api.get(
        `/evaluaciones/admin/curso/${curso.id}?viewerId=${usuarioActivo.id}`
      );

      const evaluacion = response.data.evaluacion;

      setEvaluacionAdmin(evaluacion);
      setPreguntasAdmin(response.data.preguntas || []);

      if (evaluacion) {
        setFormEvaluacionAdmin({
          titulo: evaluacion.titulo || "",
          puntaje_minimo: evaluacion.puntaje_minimo || 70,
          estado: evaluacion.estado || "Activa",
        });
      }
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible consultar la evaluación del curso."
      );

      setModalEvaluacionAdminAbierto(false);
    } finally {
      setLoadingEvaluacionAdmin(false);
    }
  }

  function cerrarModalEvaluacionAdmin() {
    setModalEvaluacionAdminAbierto(false);
    setCursoEvaluacionAdmin(null);
    setEvaluacionAdmin(null);
    setPreguntasAdmin([]);
    setFormEvaluacionAdmin({
      titulo: "",
      puntaje_minimo: 70,
      estado: "Activa",
    });
    limpiarFormularioPreguntaAdmin();
  }

  async function guardarEvaluacionAdmin(e) {
    e.preventDefault();

    if (!cursoEvaluacionAdmin || !usuarioActivo?.id) {
      setError("No fue posible identificar el curso o el usuario activo.");
      return;
    }

    if (!formEvaluacionAdmin.titulo.trim()) {
      setError("El título de la evaluación es obligatorio.");
      return;
    }

    const puntaje = Number(formEvaluacionAdmin.puntaje_minimo);

    if (Number.isNaN(puntaje) || puntaje < 1 || puntaje > 100) {
      setError("El puntaje mínimo debe ser un número entre 1 y 100.");
      return;
    }

    try {
      setGuardandoEvaluacionAdmin(true);
      setError("");
      setMensaje("");

      if (evaluacionAdmin?.id) {
        const response = await api.put(`/evaluaciones/${evaluacionAdmin.id}`, {
          titulo: formEvaluacionAdmin.titulo,
          puntaje_minimo: puntaje,
          estado: formEvaluacionAdmin.estado,
          actualizado_por: usuarioActivo.id,
        });

        setMensaje(response.data.message || "Evaluación actualizada correctamente.");
      } else {
        const response = await api.post(
          `/evaluaciones/curso/${cursoEvaluacionAdmin.id}`,
          {
            titulo: formEvaluacionAdmin.titulo,
            puntaje_minimo: puntaje,
            estado: formEvaluacionAdmin.estado,
            creado_por: usuarioActivo.id,
          }
        );

        setMensaje(response.data.message || "Evaluación creada correctamente.");
      }

      await recargarCursos();

      if (cursoSeleccionado) {
        await verDetalleCurso(cursoSeleccionado);
      }

      cerrarModalEvaluacionAdmin();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible guardar la evaluación del curso."
      );
    } finally {
      setGuardandoEvaluacionAdmin(false);
    }
  }

  function limpiarFormularioPreguntaAdmin() {
    setModoPreguntaAdmin("crear");
    setPreguntaEditando(null);
    setFormPreguntaAdmin({
      texto_pregunta: "",
      opcion_a: "",
      opcion_b: "",
      opcion_c: "",
      opcion_d: "",
      respuesta_correcta: "A",
      estado: "Activa",
      ponderacion: 1,
    });
  }

  function handleChangePreguntaAdmin(e) {
    const { name, value } = e.target;

    setFormPreguntaAdmin({
      ...formPreguntaAdmin,
      [name]: value,
    });
  }

  function editarPreguntaAdmin(pregunta) {
    setModoPreguntaAdmin("editar");
    setPreguntaEditando(pregunta);

    setFormPreguntaAdmin({
      texto_pregunta: pregunta.texto_pregunta || "",
      opcion_a: pregunta.opcion_a || "",
      opcion_b: pregunta.opcion_b || "",
      opcion_c: pregunta.opcion_c || "",
      opcion_d: pregunta.opcion_d || "",
      respuesta_correcta: pregunta.respuesta_correcta || "A",
      estado: pregunta.estado || "Activa",
      ponderacion: pregunta.ponderacion || 1,
    });
  }

  async function recargarEvaluacionAdminActual() {
    if (!cursoEvaluacionAdmin?.id || !usuarioActivo?.id) return;

    const response = await api.get(
      `/evaluaciones/admin/curso/${cursoEvaluacionAdmin.id}?viewerId=${usuarioActivo.id}`
    );

    setEvaluacionAdmin(response.data.evaluacion);
    setPreguntasAdmin(response.data.preguntas || []);
  }

  async function guardarPreguntaAdmin(e) {
    e.preventDefault();

    if (!evaluacionAdmin?.id) {
      setError("Primero debes crear la evaluación antes de agregar preguntas.");
      return;
    }

    if (!formPreguntaAdmin.texto_pregunta.trim()) {
      setError("El texto de la pregunta es obligatorio.");
      return;
    }

    if (
      !formPreguntaAdmin.opcion_a.trim() ||
      !formPreguntaAdmin.opcion_b.trim() ||
      !formPreguntaAdmin.opcion_c.trim() ||
      !formPreguntaAdmin.opcion_d.trim()
    ) {
      setError("Debes diligenciar las cuatro opciones de respuesta.");
      return;
    }

    try {
      setGuardandoPreguntaAdmin(true);
      setError("");
      setMensaje("");

      const payload = {
        texto_pregunta: formPreguntaAdmin.texto_pregunta,
        opcion_a: formPreguntaAdmin.opcion_a,
        opcion_b: formPreguntaAdmin.opcion_b,
        opcion_c: formPreguntaAdmin.opcion_c,
        opcion_d: formPreguntaAdmin.opcion_d,
        respuesta_correcta: formPreguntaAdmin.respuesta_correcta,
        estado: formPreguntaAdmin.estado,
        ponderacion: Number(formPreguntaAdmin.ponderacion || 1),
      };

      if (modoPreguntaAdmin === "editar" && preguntaEditando?.id) {
        const response = await api.put(`/preguntas/${preguntaEditando.id}`, {
          ...payload,
          actualizado_por: usuarioActivo.id,
        });

        setMensaje(response.data.message || "Pregunta actualizada correctamente.");
      } else {
        const response = await api.post(
          `/evaluaciones/${evaluacionAdmin.id}/preguntas`,
          {
            ...payload,
            creado_por: usuarioActivo.id,
          }
        );

        setMensaje(response.data.message || "Pregunta creada correctamente.");
      }

      await recargarEvaluacionAdminActual();

      limpiarFormularioPreguntaAdmin();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible guardar la pregunta."
      );
    } finally {
      setGuardandoPreguntaAdmin(false);
    }
  }

  async function cambiarEstadoPreguntaAdmin(pregunta) {
    if (!pregunta?.id || !usuarioActivo?.id) return;

    const nuevoEstado = pregunta.estado === "Activa" ? "Inactiva" : "Activa";

    try {
      setError("");
      setMensaje("");

      const response = await api.patch(`/preguntas/${pregunta.id}/estado`, {
        estado: nuevoEstado,
        actualizado_por: usuarioActivo.id,
      });

      setMensaje(response.data.message || "Estado de pregunta actualizado.");

      await recargarEvaluacionAdminActual();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible actualizar el estado de la pregunta."
      );
    }
  }

  function handleArchivoCsvPreguntas(e) {
    const archivo = e.target.files[0];

    setArchivoCsvPreguntas(archivo || null);
    setErroresCsvPreguntas([]);
  }

  async function cargarPreguntasCsv() {
    if (!evaluacionAdmin?.id) {
      setError("Primero debes crear la evaluación antes de cargar preguntas.");
      return;
    }

    if (!archivoCsvPreguntas) {
      setError("Debes seleccionar un archivo CSV.");
      return;
    }

    try {
      setCargandoCsvPreguntas(true);
      setError("");
      setMensaje("");
      setErroresCsvPreguntas([]);

      const formData = new FormData();
      formData.append("archivo", archivoCsvPreguntas);
      formData.append("cargado_por", usuarioActivo.id);

      const response = await api.post(
        `/evaluaciones/${evaluacionAdmin.id}/preguntas/csv`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMensaje(
        `${response.data.message} Total cargadas: ${response.data.totalCargadas}.`
      );

      setArchivoCsvPreguntas(null);

      await recargarEvaluacionAdminActual();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible cargar las preguntas por CSV."
      );

      setErroresCsvPreguntas(error.response?.data?.errores || []);
    } finally {
      setCargandoCsvPreguntas(false);
    }
  }

  function obtenerTextoBotonEvaluacion(curso) {
    if (!curso.estado_avance) {
      return "Evaluación no disponible";
    }

    if (curso.estado_avance === "Completado") {
      return "Evaluación aprobada";
    }

    if (!curso.materiales_revisados) {
      return "Completa materiales";
    }

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      !curso.reintento_habilitado
    ) {
      return "Reintento bloqueado";
    }

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      curso.reintento_habilitado
    ) {
      return "Reintentar evaluación";
    }

    return "Presentar evaluación";
  }

  function obtenerClaseBotonEvaluacion(curso) {
    if (curso.estado_avance === "Completado") {
      return "evaluation-button evaluation-button-completed";
    }

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      !curso.reintento_habilitado
    ) {
      return "evaluation-button evaluation-button-locked";
    }

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      curso.reintento_habilitado
    ) {
      return "evaluation-button evaluation-button-retry";
    }

    if (!curso.materiales_revisados) {
      return "evaluation-button evaluation-button-disabled";
    }

    return "evaluation-button";
  }

  async function abrirModalEvaluacion(curso) {
    if (!usuarioActivo?.id || !curso) return;

    if (curso.estado_avance === "Completado") {
      setMensaje("Este curso ya se encuentra completado.");
      return;
    }

    if (!curso.materiales_revisados) {
      setMensaje(
        "Debes completar todos los materiales antes de presentar la evaluación."
      );
      return;
    }

    if (
      curso.estado_avance === "Evaluacion no aprobada" &&
      !curso.reintento_habilitado
    ) {
      setMensaje(
        "La evaluación no fue aprobada. Debes esperar a que un supervisor o administrador habilite un nuevo intento."
      );
      return;
    }

    try {
      setError("");
      setMensaje("");
      setMensajeEvaluacion("");
      setResultadoEvaluacion(null);
      setLoadingEvaluacion(true);

      setCursoEvaluacion(curso);
      setEvaluacionActiva(null);
      setPreguntasEvaluacion([]);
      setRespuestasEvaluacion({});
      setModalEvaluacionAbierto(true);

      const response = await api.get(`/evaluaciones/curso/${curso.id}`);

      setEvaluacionActiva(response.data.evaluacion);
      setPreguntasEvaluacion(response.data.preguntas || []);
    } catch (error) {
      console.error(error);

      setMensajeEvaluacion(
        error.response?.data?.message ||
          "No fue posible cargar la evaluación del curso."
      );
    } finally {
      setLoadingEvaluacion(false);
    }
  }

  function cerrarModalEvaluacion() {
    setModalEvaluacionAbierto(false);
    setCursoEvaluacion(null);
    setEvaluacionActiva(null);
    setPreguntasEvaluacion([]);
    setRespuestasEvaluacion({});
    setMensajeEvaluacion("");
    setResultadoEvaluacion(null);
  }

  function seleccionarRespuesta(preguntaId, respuesta) {
    setRespuestasEvaluacion({
      ...respuestasEvaluacion,
      [preguntaId]: respuesta,
    });
  }

  async function enviarEvaluacionModal() {
    if (!evaluacionActiva || !usuarioActivo?.id) {
      setMensajeEvaluacion("No fue posible identificar la evaluación.");
      return;
    }

    const preguntasSinResponder = preguntasEvaluacion.filter(
      (pregunta) => !respuestasEvaluacion[pregunta.id]
    );

    if (preguntasSinResponder.length > 0) {
      setMensajeEvaluacion("Debes responder todas las preguntas antes de enviar.");
      return;
    }

    try {
      setEnviandoEvaluacion(true);
      setMensajeEvaluacion("");
      setResultadoEvaluacion(null);

      const respuestas = preguntasEvaluacion.map((pregunta) => ({
        pregunta_id: pregunta.id,
        respuesta: respuestasEvaluacion[pregunta.id],
      }));

      const response = await api.post(
        `/evaluaciones/${evaluacionActiva.id}/responder`,
        {
          usuario_id: usuarioActivo.id,
          respuestas,
        }
      );

      setResultadoEvaluacion(response.data);

      if (response.data.estado === "Aprobado") {
        setMensajeEvaluacion(
          `Evaluación aprobada con puntaje de ${response.data.puntaje}%.`
        );
      } else {
        setMensajeEvaluacion(
          `Evaluación no aprobada. Puntaje: ${response.data.puntaje}%. Intentos fallidos: ${response.data.intentosFallidos}.`
        );
      }

      await recargarCursos();
    } catch (error) {
      console.error(error);

      setMensajeEvaluacion(
        error.response?.data?.message ||
          "No fue posible enviar la evaluación."
      );
    } finally {
      setEnviandoEvaluacion(false);
    }
  }

  function obtenerTextoBotonAprendizaje(curso) {
    if (!curso.estado_avance) {
      return "No asignado";
    }

    if (curso.estado_avance === "Completado") {
      return "Curso completado";
    }

    const materialesCompletados = Number(
      curso.materiales_completados_usuario || 0
    );

    const porcentajeAvance = Number(curso.porcentaje_avance || 0);

    if (porcentajeAvance === 0 && materialesCompletados === 0) {
      return "Empezar curso";
    }

    return "Continuar curso";
  }

  function obtenerUrlMaterial(material) {
    if (!material?.ruta_archivo) return "";

    return `${SERVER_URL}${material.ruta_archivo}`;
  }

  async function abrirModalAprendizaje(curso) {
    if (!usuarioActivo?.id) return;

    try {
      setError("");
      setMensaje("");
      setMensajeAprendizaje("");
      setLoadingAprendizaje(true);

      setCursoAprendizaje(curso);
      setMaterialesAprendizaje([]);
      setAvanceAprendizaje(null);
      setResumenAprendizaje(null);
      setIndiceMaterialActual(0);
      setModalAprendizajeAbierto(true);

      const response = await api.get(
        `/cursos/${curso.id}/aprendizaje?usuarioId=${usuarioActivo.id}`
      );

      const materiales = response.data.materiales || [];
      const resumen = response.data.resumen;

      setMaterialesAprendizaje(materiales);
      setAvanceAprendizaje(response.data.avance);
      setResumenAprendizaje(resumen);

      if (
        resumen?.siguientePendienteIndex !== null &&
        resumen?.siguientePendienteIndex !== undefined
      ) {
        setIndiceMaterialActual(resumen.siguientePendienteIndex);
      } else if (materiales.length > 0) {
        setIndiceMaterialActual(materiales.length - 1);
      }
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible abrir el aprendizaje del curso."
      );

      setModalAprendizajeAbierto(false);
    } finally {
      setLoadingAprendizaje(false);
    }
  }

  function cerrarModalAprendizaje() {
    setModalAprendizajeAbierto(false);
    setCursoAprendizaje(null);
    setMaterialesAprendizaje([]);
    setAvanceAprendizaje(null);
    setResumenAprendizaje(null);
    setIndiceMaterialActual(0);
    setMensajeAprendizaje("");
  }

  function irMaterialAnterior() {
    setMensajeAprendizaje("");

    setIndiceMaterialActual((indiceActual) =>
      indiceActual > 0 ? indiceActual - 1 : indiceActual
    );
  }

  function irMaterialSiguiente() {
    setMensajeAprendizaje("");

    setIndiceMaterialActual((indiceActual) =>
      indiceActual < materialesAprendizaje.length - 1
        ? indiceActual + 1
        : indiceActual
    );
  }

  async function marcarMaterialActualCompletado() {
    const materialActual = materialesAprendizaje[indiceMaterialActual];

    if (!materialActual || !cursoAprendizaje || !usuarioActivo) {
      setMensajeAprendizaje("No fue posible identificar el material actual.");
      return;
    }

    if (materialActual.completado || materialCompletandoId) {
      return;
    }

    try {
      setMaterialCompletandoId(materialActual.id);
      setMensajeAprendizaje("");

      const response = await api.post(`/materiales/${materialActual.id}/completar`, {
        usuario_id: usuarioActivo.id,
        curso_id: cursoAprendizaje.id,
      });

      const materialesActualizados = materialesAprendizaje.map((material) =>
        Number(material.id) === Number(materialActual.id)
          ? {
              ...material,
              completado: true,
              fecha_completado: new Date().toISOString(),
            }
          : material
      );

      const totalMateriales = materialesActualizados.length;
      const materialesCompletados = materialesActualizados.filter(
        (material) => material.completado
      ).length;

      const todosCompletados =
        totalMateriales > 0 && totalMateriales === materialesCompletados;

      const siguientePendienteIndex = materialesActualizados.findIndex(
        (material) => !material.completado
      );

      setMaterialesAprendizaje(materialesActualizados);

      setResumenAprendizaje({
        totalMateriales,
        materialesCompletados,
        porcentajeMateriales:
          totalMateriales === 0
            ? 0
            : Math.round((materialesCompletados / totalMateriales) * 100),
        siguientePendienteIndex:
          siguientePendienteIndex === -1 ? null : siguientePendienteIndex,
        todosCompletados,
      });

      if (todosCompletados || response.data.todosCompletados) {
        await recargarCursos();

        cerrarModalAprendizaje();

        setMensaje(
          "Completaste todos los materiales del curso. Tu avance se actualizó al 50%."
        );

        return;
      }

      setMensajeAprendizaje(
        response.data.message || "Material marcado como completado."
      );

      if (indiceMaterialActual < totalMateriales - 1) {
        setIndiceMaterialActual(indiceMaterialActual + 1);
      }

      await recargarCursos();
    } catch (error) {
      console.error(error);

      setMensajeAprendizaje(
        error.response?.data?.message ||
          "No fue posible marcar el material como completado."
      );
    } finally {
      setMaterialCompletandoId(null);
    }
  }

  async function abrirModalAsignacion(curso) {
    setError("");
    setMensaje("");
    setCursoAsignando(curso);
    setUsuarioAsignadoId("");
    setUsuariosAsignados([]);

    await cargarUsuariosAsignados(curso.id);

    setModalAsignacionAbierto(true);
  }

  function cerrarModalAsignacion() {
    setModalAsignacionAbierto(false);
    setCursoAsignando(null);
    setUsuarioAsignadoId("");
  }

  async function handleSubmitAsignacion(e) {
    e.preventDefault();

    if (!cursoAsignando || !usuarioAsignadoId || !usuarioActivo) {
      setError("Debe seleccionar un curso y un usuario para realizar la asignación.");
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response = await api.post(`/cursos/${cursoAsignando.id}/asignar`, {
        usuario_id: usuarioAsignadoId,
        asignado_por: usuarioActivo.id,
      });

      setMensaje(response.data.message || "Curso asignado correctamente.");
      cerrarModalAsignacion();

      await recargarCursos();
      await cargarUsuariosAsignados(cursoAsignando.id);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible asignar el curso seleccionado."
      );
    }
  }

  function puedeSubirMaterial() {
    if (!usuarioActivo || !cursoSeleccionado) return false;

    if (usuarioActivo.rol === "Super Admin") return true;
    if (usuarioActivo.rol === "Admin") return true;

    if (
      usuarioActivo.rol === "Supervisor" &&
      usuarioActivo.area === cursoSeleccionado.area
    ) {
      return true;
    }

    return false;
  }

  function puedeVerDetalleAdministrativo() {
    return cursoSeleccionado && puedeVerAsignadosCurso(cursoSeleccionado);
  }

  function cerrarDetalleCurso() {
    setCursoSeleccionado(null);
    setTabDetalleCurso("resumen");
  }

  function abrirModalEliminarMaterial(material) {
    setMaterialAEliminar(material);
    setModalEliminarMaterialAbierto(true);
  }

  function cerrarModalEliminarMaterial() {
    setMaterialAEliminar(null);
    setModalEliminarMaterialAbierto(false);
  }

  async function confirmarEliminarMaterial() {
    if (!materialAEliminar?.id || !usuarioActivo?.id || !cursoSeleccionado?.id) {
      setError("No fue posible identificar el material a eliminar.");
      return;
    }

    try {
      setEliminandoMaterial(true);
      setError("");
      setMensaje("");

      const response = await api.patch(
        `/materiales/${materialAEliminar.id}/estado`,
        {
          estado: "Inactivo",
          actualizado_por: usuarioActivo.id,
        }
      );

      setMensaje(response.data.message || "Material eliminado correctamente.");

      cerrarModalEliminarMaterial();

      await cargarMateriales(cursoSeleccionado.id);
      await recargarCursos();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible eliminar el material seleccionado."
      );
    } finally {
      setEliminandoMaterial(false);
    }
  }

  function obtenerClaseEstadoCurso(estado) {
    if (estado === "Disponible") return "badge badge-green";
    if (estado === "Inactivo") return "badge badge-gray";
    return "badge badge-blue";
  }

  function obtenerClaseAvance(estado) {
    if (estado === "Completado") return "badge badge-green";
    if (estado === "Evaluacion no aprobada") return "badge badge-red";
    if (estado === "En progreso") return "badge badge-blue";
    if (estado === "Pendiente") return "badge badge-gray";
    return "badge badge-yellow";
  }

  function puedeVerAsignadosCurso(curso) {
    if (!usuarioActivo || !curso) return false;

    if (usuarioActivo.rol === "Super Admin") return true;
    if (usuarioActivo.rol === "Admin") return true;

    return (
      usuarioActivo.rol === "Supervisor" &&
      usuarioActivo.area === curso.area
    );
  }

  async function cargarUsuariosAsignados(cursoId) {
    if (!usuarioActivo?.id) return;

    try {
      setLoadingAsignados(true);

      const response = await api.get(
        `/cursos/${cursoId}/asignados?viewerId=${usuarioActivo.id}`
      );

      setUsuariosAsignados(response.data);
    } catch (error) {
      console.error(error);
      setUsuariosAsignados([]);
    } finally {
      setLoadingAsignados(false);
    }
  }

  function puedeDesasignarUsuario(asignacion) {
    if (!usuarioActivo || !cursoSeleccionado || !asignacion) return false;

    if (asignacion.evaluacion_presentada || asignacion.estado === "Completado") {
      return false;
    }

    if (usuarioActivo.rol === "Super Admin") return true;
    if (usuarioActivo.rol === "Admin") return true;

    return (
      usuarioActivo.rol === "Supervisor" &&
      usuarioActivo.area === cursoSeleccionado.area &&
      asignacion.rol === "Empleado" &&
      asignacion.area === usuarioActivo.area
    );
  }

  function handleDesasignarUsuario(asignacion) {
    setAsignacionAEliminar(asignacion);
    setModalDesasignarAbierto(true);
  }

  function puedeHabilitarReintento(asignacion) {
    if (!usuarioActivo || !asignacion) return false;

    if (asignacion.estado !== "Evaluacion no aprobada") return false;

    if (asignacion.reintento_habilitado) return false;

    if (usuarioActivo.rol === "Super Admin" || usuarioActivo.rol === "Admin") {
      return true;
    }

    if (usuarioActivo.rol === "Supervisor") {
      return (
        asignacion.rol === "Empleado" &&
        asignacion.area === usuarioActivo.area
      );
    }

    return false;
  }

  function handleHabilitarReintento(asignacion) {
    setAsignacionReintento(asignacion);
    setModalConfirmarReintentoAbierto(true);
  }

  async function confirmarHabilitarReintento() {
    if (!asignacionReintento?.avance_id || !usuarioActivo?.id) return;

    try {
      setLoadingReintento(true);
      setError("");
      setMensaje("");

      const response = await api.patch(
        `/avances/${asignacionReintento.avance_id}/habilitar-reintento`,
        {
          habilitado_por: usuarioActivo.id,
        }
      );

      setUsuariosAsignados((asignadosActuales) =>
        asignadosActuales.map((item) =>
          Number(item.avance_id) === Number(asignacionReintento.avance_id)
            ? {
                ...item,
                reintento_habilitado: true,
              }
            : item
        )
      );

      await recargarCursos();

      setMensaje(
        response.data.message ||
          "Reintento de evaluación habilitado correctamente."
      );

      setModalConfirmarReintentoAbierto(false);
      setAsignacionReintento(null);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible habilitar el reintento."
      );
    } finally {
      setLoadingReintento(false);
    }
  }

  function cancelarHabilitarReintento() {
    setModalConfirmarReintentoAbierto(false);
    setAsignacionReintento(null);
  }

  function abrirModalDesasignacion(asignacion) {
    setError("");
    setMensaje("");
    setAsignacionAEliminar(asignacion);
    setModalDesasignarAbierto(true);
  }

  function cerrarModalDesasignacion() {
    setModalDesasignarAbierto(false);
    setAsignacionAEliminar(null);
  }

  async function confirmarDesasignacion() {
    if (!cursoSeleccionado || !asignacionAEliminar || !usuarioActivo) {
      setError("No fue posible identificar la asignación a eliminar.");
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response = await api.delete(
        `/cursos/${cursoSeleccionado.id}/asignar/${asignacionAEliminar.usuario_id}`,
        {
          data: {
            eliminado_por: usuarioActivo.id,
          },
        }
      );

      setMensaje(response.data.message || "Curso desasignado correctamente.");

      cerrarModalDesasignacion();

      await cargarUsuariosAsignados(cursoSeleccionado.id);
      await recargarCursos();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible desasignar el curso seleccionado."
      );
    }
  }

  function handleChangeMaterial(e) {
    const { name, value, files } = e.target;

    if (name === "archivo") {
      setFormMaterial({
        ...formMaterial,
        archivo: files[0],
      });
      return;
    }

    setFormMaterial({
      ...formMaterial,
      [name]: value,
    });
  }

  async function handleSubmitMaterial(e) {
    e.preventDefault();

    if (!cursoSeleccionado || !usuarioActivo) {
      setError("Debe existir un curso y un usuario activo.");
      return;
    }

    if (!formMaterial.titulo || !formMaterial.archivo) {
      setError("Debe ingresar un título y seleccionar un archivo.");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", formMaterial.titulo);
    formData.append("descripcion", formMaterial.descripcion);
    formData.append("archivo", formMaterial.archivo);
    formData.append("subido_por", usuarioActivo.id);

    try {
      setError("");
      setMensaje("");

      await api.post(`/materiales/${cursoSeleccionado.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMensaje("Material cargado correctamente.");

      setFormMaterial({
        titulo: "",
        descripcion: "",
        archivo: null,
      });

      e.target.reset();

      await cargarMateriales(cursoSeleccionado.id);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "No fue posible cargar el material seleccionado."
      );
    }
  }

  async function marcarMaterialesRevisados() {
    if (!usuarioActivo || !cursoSeleccionado) {
      setError("Debe existir un usuario activo y un curso seleccionado.");
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response = await api.post("/avances/materiales-revisados", {
        usuario_id: usuarioActivo.id,
        curso_id: cursoSeleccionado.id,
      });

      setMensaje(response.data.message || "Materiales marcados como revisados.");

      setAvanceCurso({
        ...avanceCurso,
        curso_id: cursoSeleccionado.id,
        porcentaje: Math.max(avanceCurso?.porcentaje || 0, 50),
        estado: avanceCurso?.porcentaje >= 80 ? avanceCurso.estado : "En progreso",
        materiales_revisados: 1,
      });
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "No fue posible actualizar el avance del curso."
      );
    }
  }

async function cargarAvanceCurso(cursoId) {
  if (!usuarioActivo) return;

  try {
    const response = await api.get(`/avances/usuario/${usuarioActivo.id}`);

    const avanceEncontrado = response.data.find(
      (avance) => Number(avance.curso_id) === Number(cursoId)
    );

    setAvanceCurso(avanceEncontrado || null);
  } catch (error) {
    console.error(error);
    setAvanceCurso(null);
  }
}

  function handleRespuesta(preguntaId, respuesta) {
    setRespuestasEvaluacion({
      ...respuestasEvaluacion,
      [preguntaId]: respuesta,
    });
  }

  async function handleSubmitEvaluacion(e) {
    e.preventDefault();

    if (!usuarioActivo) {
      setError("Debe seleccionar un usuario activo para presentar la evaluación.");
      return;
    }

    if (!evaluacionActual) {
      setError("No hay una evaluación activa para este curso.");
      return;
    }

    if (Object.keys(respuestasEvaluacion).length !== preguntasEvaluacion.length) {
      setError("Debe responder todas las preguntas antes de enviar la evaluación.");
      return;
    }

    const respuestas = Object.entries(respuestasEvaluacion).map(
      ([pregunta_id, respuesta]) => ({
        pregunta_id: Number(pregunta_id),
        respuesta,
      })
    );

    try {
      setError("");
      setResultadoEvaluacion(null);

      const response = await api.post(
        `/evaluaciones/${evaluacionActual.id}/responder`,
        {
          usuario_id: usuarioActivo.id,
          respuestas,
        }
      );

      setResultadoEvaluacion(response.data);
      setMensajeEvaluacion("Evaluación presentada correctamente.");
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "No fue posible presentar la evaluación."
      );
    }
  }

  function obtenerGrupoAvance(curso) {
    if (!curso.estado_avance) {
      return "sin_asignar";
    }

    if (curso.estado_avance === "Completado") {
      return "completado";
    }

    if (curso.estado_avance === "Evaluacion no aprobada") {
      return "no_aprobado";
    }

    return "pendiente_completar";
  }

  const cursosFiltrados = cursos.filter((curso) => {

    if (puedeCambiarVistaCursos() && vistaCursos === "mis" && !esCursoPropio(curso)) {
      return false;
    }

    const textoBusqueda = busquedaCurso.toLowerCase().trim();

    const coincideBusqueda =
      curso.titulo.toLowerCase().includes(textoBusqueda) ||
      curso.descripcion.toLowerCase().includes(textoBusqueda);

    const coincideArea =
      areaFiltroCurso === "all" || curso.area === areaFiltroCurso;

    const coincideEstado =
      estadoFiltroCurso === "all" || curso.estado === estadoFiltroCurso;

    const coincideAvance =
      avanceFiltroCurso === "all" ||
      obtenerGrupoAvance(curso) === avanceFiltroCurso;

    return coincideBusqueda && coincideArea && coincideEstado && coincideAvance;
  });

  useEffect(() => {
    if (!cursoSeleccionado) return;

    const cursoSigueVisible = cursosFiltrados.some(
      (curso) => Number(curso.id) === Number(cursoSeleccionado.id)
    );

    if (!cursoSigueVisible) {
      setCursoSeleccionado(null);
      setUsuariosAsignados([]);
      setMateriales([]);
      setAvanceCurso(null);
      setEvaluacionActual(null);
      setPreguntasEvaluacion([]);
      setResultadoEvaluacion(null);
    }
  }, [
    busquedaCurso,
    areaFiltroCurso,
    estadoFiltroCurso,
    avanceFiltroCurso,
    cursos,
    cursoSeleccionado,
  ]);

  const areasDisponibles = [...new Set(cursos.map((curso) => curso.area))];

  function limpiarFiltrosCursos() {
    setBusquedaCurso("");
    setAreaFiltroCurso("all");
    setEstadoFiltroCurso("all");
    setAvanceFiltroCurso("all");
    setVistaCursos("todos");
  }

  useEffect(() => {
    if (!cursoSeleccionado) return;

    setTimeout(() => {
      detalleCursoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, [cursoSeleccionado]);

  function obtenerPorcentajeDetalle() {
    if (avanceCurso?.porcentaje !== undefined && avanceCurso?.porcentaje !== null) {
      return Number(avanceCurso.porcentaje);
    }

    if (
      cursoSeleccionado?.porcentaje_avance !== undefined &&
      cursoSeleccionado?.porcentaje_avance !== null
    ) {
      return Number(cursoSeleccionado.porcentaje_avance);
    }

    return 0;
  }

  function obtenerEstadoDetalle() {
    if (avanceCurso?.estado) {
      return avanceCurso.estado;
    }

    if (cursoSeleccionado?.estado_avance) {
      return cursoSeleccionado.estado_avance;
    }

    return "Sin asignación";
  }

  function cursoEstaCompletado() {
    return obtenerEstadoDetalle() === "Completado" || obtenerPorcentajeDetalle() === 100;
  }

  function puedeCambiarVistaCursos() {
    return (
      usuarioActivo?.rol === "Super Admin" ||
      usuarioActivo?.rol === "Admin" ||
      usuarioActivo?.rol === "Supervisor"
    );
  }

  function esCursoPropio(curso) {
    if (!usuarioActivo || !curso) return false;

    const esResponsable =
      curso.responsable_id &&
      Number(curso.responsable_id) === Number(usuarioActivo.id);

    const estaAsignado =
      curso.estado_avance !== null && curso.estado_avance !== undefined;

    return esResponsable || estaAsignado;
  }

  if (loading) {
    return <main className="page">Cargando cursos...</main>;
  }

  return (
    <main className="page">
      <div className="section-title">
        <p className="label">Cursos</p>
        <h2>Cursos disponibles</h2>
        <p>{obtenerTextoVistaCursos()}</p>
      </div>



      {error && <p className="error-message">{error}</p>}
      {mensaje && <p className="success-message">{mensaje}</p>}

      {puedeCambiarVistaCursos() && (
        <section className="course-view-toggle-card">
          <div>
            <p className="label">Vista de cursos</p>
            <h3>Selecciona qué cursos deseas consultar</h3>
            <p>
              Puedes alternar entre todos los cursos visibles según tu rol o solo los
              cursos donde participas como responsable o estudiante.
            </p>
          </div>

          <div className="course-view-toggle">
            <button
              type="button"
              className={vistaCursos === "todos" ? "active" : ""}
              onClick={() => setVistaCursos("todos")}
            >
              Todos los cursos
            </button>

            <button
              type="button"
              className={vistaCursos === "mis" ? "active" : ""}
              onClick={() => setVistaCursos("mis")}
            >
              Mis cursos
            </button>
          </div>
        </section>
      )}

      <section className="course-filters-card">
        <div className="filter-field">
          <label>Buscar curso</label>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción"
            value={busquedaCurso}
            onChange={(e) => setBusquedaCurso(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Área</label>
          <select
            value={areaFiltroCurso}
            onChange={(e) => setAreaFiltroCurso(e.target.value)}
          >
            <option value="all">Todas las áreas visibles</option>

            {areasDisponibles.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Estado</label>
          <select
            value={estadoFiltroCurso}
            onChange={(e) => setEstadoFiltroCurso(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Avance del curso</label>
          <select
            value={avanceFiltroCurso}
            onChange={(e) => setAvanceFiltroCurso(e.target.value)}
          >
            <option value="all">Todos los avances</option>
            <option value="completado">Completados</option>
            <option value="pendiente_completar">Pendientes de completar</option>
            <option value="no_aprobado">Evaluación no aprobada</option>

            {usuarioActivo?.rol !== "Empleado" && (
              <option value="sin_asignar">Sin asignación para mí</option>
            )}
          </select>
        </div>

        <div className="course-filter-actions">
          <button
            type="button"
            className="clear-filters-button"
            onClick={limpiarFiltrosCursos}
          >
            Limpiar filtros
          </button>

          {puedeCrearCurso() && (
            <button type="button" onClick={abrirModalCurso}>
              Crear curso
            </button>
          )}
        </div>
      </section>

      <p className="filter-results-text">
        Mostrando {cursosFiltrados.length} de {cursos.length} cursos disponibles para tu perfil.
      </p>

      {cursosFiltrados.length === 0 && (
        <div className="empty-chart">
          <div>
            <strong>Sin cursos para mostrar</strong>
            <p>No hay cursos que coincidan con los filtros seleccionados.</p>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {cursosFiltrados.map((curso) => (
          <article className="course-card" key={curso.id}>
            <span className="tag">{curso.area}</span>

            <h3>{curso.titulo}</h3>

            <p>{curso.descripcion}</p>

            <small>Duración: {curso.duracion_horas} horas</small>
            <small>Responsable: {curso.responsable || "Sin asignar"}</small>
            <div className="badge-row">
              <span className={obtenerClaseEstadoCurso(curso.estado)}>
                {curso.estado}
              </span>

              {curso.estado_avance && (
                <span className={obtenerClaseAvance(curso.estado_avance)}>
                  {curso.estado_avance} · {curso.porcentaje_avance}%
                </span>
              )}
            </div>

            <div className="course-stats">
              <small>Asignados: {curso.total_asignados || 0}</small>
              <small>Completados: {curso.total_completados || 0}</small>
              <small>Pendientes: {curso.total_pendientes || 0}</small>
            </div>

            <small>
              Avance:{" "}
              {curso.estado_avance
                ? `${curso.estado_avance} · ${curso.porcentaje_avance}%`
                : "Sin asignación para este usuario"}
            </small>

            <button onClick={() => verDetalleCurso(curso)}>Ver detalle</button>

            {puedeAbrirAprendizaje(curso) && (
              <button
                type="button"
                className={
                  Number(curso.materiales_completados_usuario || 0) > 0 &&
                  curso.estado_avance !== "Completado"
                    ? "learning-button learning-button-progress"
                    : "learning-button"
                }
                onClick={() => abrirModalAprendizaje(curso)}
                disabled={curso.estado_avance === "Completado"}
              >
                {obtenerTextoBotonAprendizaje(curso)}
              </button>
            )}

            {curso.estado_avance && (
              <button
                type="button"
                className={obtenerClaseBotonEvaluacion(curso)}
                onClick={() => abrirModalEvaluacion(curso)}
                disabled={!puedeAbrirEvaluacion(curso) || curso.estado_avance === "Completado"}
              >
                {obtenerTextoBotonEvaluacion(curso)}
              </button>
            )}

            {puedeEditarCurso(curso) && (
              <button
                className="secondary-edit-button"
                onClick={() => abrirModalEditarCurso(curso)}
              >
                Editar curso
              </button>
            )}

            {puedeAsignarCurso(curso) && (
              <button
                className="assign-button"
                onClick={() => abrirModalAsignacion(curso)}
              >
                Asignar curso
              </button>
            )}

          </article>
        ))}
      </div>

      {cursoSeleccionado && (
        <section className="detail-box" ref={detalleCursoRef}>
          <div className="course-detail-header">
            <div>
              <p className="label">Detalle del curso</p>
              <h3>{cursoSeleccionado.titulo}</h3>
              <p>{cursoSeleccionado.descripcion}</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={cerrarDetalleCurso}
            >
              Cerrar detalle
            </button>
          </div>

          <section className="course-detail-grid">
            <div className="course-detail-card">
              <h3>Información general</h3>

              <p>
                <strong>Área:</strong> {cursoSeleccionado.area}
              </p>

              <p>
                <strong>Duración:</strong> {cursoSeleccionado.duracion_horas} horas
              </p>

              <p>
                <strong>Responsable:</strong>{" "}
                {cursoSeleccionado.responsable || "Sin asignar"}
              </p>

              <p>
                <strong>Estado del curso:</strong>{" "}
                <span className={obtenerClaseEstadoCurso(cursoSeleccionado.estado)}>
                  {cursoSeleccionado.estado}
                </span>
              </p>
            </div>

            <div className="course-detail-card">
              <h3>Mi avance en el curso</h3>

              <p>
                <strong>Estado:</strong>{" "}
                <span className={obtenerClaseAvance(obtenerEstadoDetalle())}>
                  {obtenerEstadoDetalle()}
                </span>
              </p>

              <p>
                <strong>Porcentaje:</strong> {obtenerPorcentajeDetalle()}%
              </p>

              <div className="detail-progress-bar">
                <div
                  style={{
                    width: `${obtenerPorcentajeDetalle()}%`,
                  }}
                />
              </div>

              {cursoEstaCompletado() && (
                <p className="success-message small-message">
                  Este curso ya se encuentra completado.
                </p>
              )}
            </div>
          </section>

          {puedeVerDetalleAdministrativo() && (
            <>
              <div className="course-detail-tabs">
                <button
                  type="button"
                  className={tabDetalleCurso === "resumen" ? "active" : ""}
                  onClick={() => setTabDetalleCurso("resumen")}
                >
                  Resumen
                </button>

                <button
                  type="button"
                  className={tabDetalleCurso === "materiales" ? "active" : ""}
                  onClick={() => setTabDetalleCurso("materiales")}
                >
                  Materiales
                </button>

                <button
                  type="button"
                  className={tabDetalleCurso === "evaluacion" ? "active" : ""}
                  onClick={() => setTabDetalleCurso("evaluacion")}
                >
                  Evaluación
                </button>
              </div>

              {tabDetalleCurso === "resumen" && (
                <section className="assigned-section">
                  <h3>Usuarios asignados al curso</h3>

                  {loadingAsignados && <p>Cargando usuarios asignados...</p>}

                  {!loadingAsignados && usuariosAsignados.length === 0 && (
                    <p className="info-message">
                      Este curso aún no tiene usuarios asignados.
                    </p>
                  )}

                  {!loadingAsignados && usuariosAsignados.length > 0 && (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Área</th>
                            <th>Avance</th>
                            <th>Estado</th>
                            <th>Intentos fallidos</th>
                            <th>Reintento</th>
                            <th>Acción</th>
                          </tr>
                        </thead>

                        <tbody>
                          {usuariosAsignados.map((asignacion) => (
                            <tr
                              key={asignacion.avance_id}
                              className={
                                Number(asignacion.usuario_id) === Number(usuarioActivo.id)
                                  ? "current-user-row"
                                  : ""
                              }
                            >
                              <td>
                                {Number(asignacion.usuario_id) === Number(usuarioActivo.id) ? (
                                  <span className="current-user-label">
                                    Yo
                                    <small>{asignacion.nombre}</small>
                                  </span>
                                ) : (
                                  asignacion.nombre
                                )}
                              </td>

                              <td>{asignacion.area}</td>
                              <td>{asignacion.porcentaje}%</td>

                              <td>
                                <span className={obtenerClaseAvance(asignacion.estado)}>
                                  {asignacion.estado}
                                </span>
                              </td>

                              <td>{asignacion.intentos_fallidos_evaluacion || 0}</td>

                              <td>
                                {asignacion.estado === "Evaluacion no aprobada" ? (
                                  asignacion.reintento_habilitado ? (
                                    <span className="badge badge-green">Habilitado</span>
                                  ) : (
                                    <span className="badge badge-red">Bloqueado</span>
                                  )
                                ) : (
                                  <span className="badge badge-gray">No aplica</span>
                                )}
                              </td>

                              <td>
                                <div className="table-actions">
                                  {puedeHabilitarReintento(asignacion) && (
                                    <button
                                      type="button"
                                      className="retry-button"
                                      onClick={() => handleHabilitarReintento(asignacion)}
                                    >
                                      Habilitar reintento
                                    </button>
                                  )}

                                  {puedeDesasignarUsuario(asignacion) && (
                                    <button
                                      type="button"
                                      className="danger-button"
                                      onClick={() => handleDesasignarUsuario(asignacion)}
                                    >
                                      Desasignar
                                    </button>
                                  )}

                                  {!puedeHabilitarReintento(asignacion) &&
                                    !puedeDesasignarUsuario(asignacion) && (
                                      <small>No disponible</small>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {tabDetalleCurso === "materiales" && (
                <section className="course-detail-card full-detail-card">
                  <h3>Materiales del curso</h3>

                  {loadingMateriales && <p>Cargando materiales...</p>}

                  {!loadingMateriales && materiales.length === 0 && (
                    <p>Este curso aún no tiene materiales cargados.</p>
                  )}

                  <div className="materials-list">
                    {materiales.map((material) => (
                      <div className="material-card material-card-admin" key={material.id}>
                        <div>
                          <h4>{material.titulo}</h4>
                          <p>{material.descripcion}</p>
                          <small>
                            Tipo: {material.tipo} | Subido por:{" "}
                            {material.subido_por_nombre || "No registrado"}
                          </small>
                        </div>

                        <div className="material-admin-actions">
                          {material.tipo === "PDF" && (
                            <a
                              className="material-link"
                              href={`http://localhost:3001${material.ruta_archivo}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir PDF
                            </a>
                          )}

                          {material.tipo === "VIDEO" && (
                            <video controls width="320">
                              <source
                                src={`http://localhost:3001${material.ruta_archivo}`}
                                type={material.mime_type}
                              />
                              Tu navegador no soporta la reproducción de video.
                            </video>
                          )}

                          {puedeSubirMaterial() && (
                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => abrirModalEliminarMaterial(material)}
                            >
                              Eliminar material
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {puedeSubirMaterial() && (
                    <form className="upload-form" onSubmit={handleSubmitMaterial}>
                      <h3>Cargar nuevo material</h3>

                      <input
                        type="text"
                        name="titulo"
                        placeholder="Título del material"
                        value={formMaterial.titulo}
                        onChange={handleChangeMaterial}
                      />

                      <textarea
                        name="descripcion"
                        placeholder="Descripción del material"
                        value={formMaterial.descripcion}
                        onChange={handleChangeMaterial}
                      />

                      <input
                        type="file"
                        name="archivo"
                        accept=".pdf,video/mp4,video/webm,video/quicktime"
                        onChange={handleChangeMaterial}
                      />

                      <button type="submit">Subir material</button>
                    </form>
                  )}
                </section>
              )}

              {tabDetalleCurso === "evaluacion" && (
                <section className="course-detail-card full-detail-card">
                  <h3>Evaluación del curso</h3>

                  {cursoSeleccionado && puedeGestionarEvaluacionCurso(cursoSeleccionado) && (
                    <div className="admin-evaluation-actions">
                      <button
                        type="button"
                        className="secondary-edit-button"
                        onClick={() => abrirModalEvaluacionAdmin(cursoSeleccionado)}
                      >
                        Gestionar evaluación
                      </button>
                    </div>
                  )}

                  {loadingEvaluacion && <p>Cargando evaluación...</p>}

                  {!loadingEvaluacion && evaluacionActual && (
                    <div className="evaluation-admin-summary">
                      <p>
                        <strong>Evaluación activa:</strong> {evaluacionActual.titulo}
                      </p>

                      <p>
                        <strong>Puntaje mínimo:</strong>{" "}
                        {evaluacionActual.puntaje_minimo}%
                      </p>

                      <p>
                        <strong>Preguntas activas:</strong>{" "}
                        {preguntasEvaluacion.length}
                      </p>
                    </div>
                  )}

                  {!loadingEvaluacion && !evaluacionActual && (
                    <p className="info-message">
                      Este curso aún no tiene evaluación activa.
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          <button type="button" onClick={cerrarDetalleCurso}>
            Cerrar
          </button>                

        </section>
      )}

      {modalEliminarMaterialAbierto && materialAEliminar && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <div>
                <p className="label">Confirmar eliminación</p>
                <h3>Eliminar material</h3>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={cerrarModalEliminarMaterial}
                disabled={eliminandoMaterial}
              >
                X
              </button>
            </div>

            <p className="confirm-text">
              ¿Deseas eliminar el material{" "}
              <strong>{materialAEliminar.titulo}</strong>?
            </p>

            <div className="confirm-summary">
              <p>
                <strong>Tipo:</strong> {materialAEliminar.tipo}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {materialAEliminar.descripcion || "Sin descripción"}
              </p>
            </div>

            <p className="warning-message">
              El material dejará de mostrarse en el curso y en el aprendizaje del
              usuario. No se eliminará físicamente del servidor.
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cerrarModalEliminarMaterial}
                disabled={eliminandoMaterial}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={confirmarEliminarMaterial}
                disabled={eliminandoMaterial}
              >
                {eliminandoMaterial ? "Eliminando..." : "Eliminar material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCursoAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modoCurso === "crear" ? "Crear nuevo curso" : "Editar curso"}</h3>
              <button className="close-button" onClick={cerrarModalCurso}>
                X
              </button>
            </div>

            <form className="user-form" onSubmit={handleSubmitCurso}>
              <div className="form-field">
                <label>Título del curso</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Ejemplo: Diligenciamiento de métricas"
                  maxLength="150"
                  value={formCurso.titulo}
                  onChange={handleChangeCurso}
                />
              </div>

              <div className="form-field full-field">
                <label>Descripción del curso</label>
                <textarea
                  name="descripcion"
                  placeholder="Explique brevemente el objetivo del curso"
                  maxLength="1000"
                  value={formCurso.descripcion}
                  onChange={handleChangeCurso}
                />
              </div>

              <div className="form-field">
                <label>Área del curso</label>
                <select
                  name="area"
                  value={formCurso.area}
                  onChange={handleChangeCurso}
                  disabled={usuarioActivo?.rol === "Supervisor"}
                >
                  <option value="IT">IT</option>
                  <option value="RRHH">RRHH</option>
                  <option value="BPO">BPO</option>
                  <option value="Billing">Billing</option>
                  <option value="PEO">PEO</option>
                  <option value="Implementacion">Implementación</option>
                </select>
              </div>

              <div className="form-field">
                <label>Duración estimada en horas</label>
                <input
                  type="number"
                  name="duracion_horas"
                  min="0.5"
                  max="40"
                  step="0.5"
                  value={formCurso.duracion_horas}
                  onChange={handleChangeCurso}
                />
              </div>

              <div className="form-field">
                <label>Responsable / mentor del curso</label>
                <select
                  name="responsable_id"
                  value={formCurso.responsable_id}
                  onChange={handleChangeCurso}
                >
                  <option value="">Sin responsable asignado</option>
                    {state.usuarios
                      .filter((usuario) => {
                        if (usuario.estado !== "Activo") return false;

                        if (usuario.rol === "Super Admin") return true;
                        if (usuario.rol === "Admin") return true;

                        if (
                          usuario.rol === "Supervisor" &&
                          usuario.area === formCurso.area
                        ) {
                          return true;
                        }

                        return false;
                      })
                      .map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} - {usuario.area}
                        </option>
                      ))}
                </select>
              </div>

              <div className="form-field">
                <label>Estado del curso</label>
                <select
                  name="estado"
                  value={formCurso.estado}
                  onChange={handleChangeCurso}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cerrarModalCurso}
                >
                  Cancelar
                </button>

                <button type="submit">
                  {modoCurso === "crear" ? "Guardar curso" : "Actualizar curso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAsignacionAbierto && cursoAsignando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Asignar curso</h3>
              <button className="close-button" onClick={cerrarModalAsignacion}>
                X
              </button>
            </div>

            <form className="user-form" onSubmit={handleSubmitAsignacion}>
              <div className="form-field full-field">
                <label>Curso seleccionado</label>
                <input
                  type="text"
                  value={`${cursoAsignando.titulo} - ${cursoAsignando.area}`}
                  disabled
                />
              </div>

              <div className="form-field full-field">
                <label>Usuario a asignar</label>
                <select
                  value={usuarioAsignadoId}
                  onChange={(e) => setUsuarioAsignadoId(e.target.value)}
                >
                  <option value="">Seleccione un usuario</option>

                  {obtenerUsuariosAsignables(cursoAsignando).map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} · {usuario.area}
                    </option>
                  ))}
                </select>
              </div>

              {obtenerUsuariosAsignables(cursoAsignando).length === 0 && (
                <p className="info-message full-field">
                  No hay usuarios disponibles para asignar este curso según tu perfil.
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cerrarModalAsignacion}
                >
                  Cancelar
                </button>

                <button type="submit">Asignar curso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDesasignarAbierto && asignacionAEliminar && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h3>Confirmar desasignación</h3>
              <button className="close-button" onClick={cerrarModalDesasignacion}>
                X
              </button>
            </div>

            <div className="confirm-body">
              <p>
                Estás a punto de desasignar el curso{" "}
                <strong>{cursoSeleccionado?.titulo}</strong> al usuario{" "}
                <strong>{asignacionAEliminar.nombre}</strong>.
              </p>

              <p className="warning-message">
                Esta acción eliminará el avance pendiente del usuario para este curso.
                No se podrá desasignar si ya presentó evaluación o si el curso está
                completado.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cerrarModalDesasignacion}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={confirmarDesasignacion}
              >
                Sí, desasignar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAprendizajeAbierto && cursoAprendizaje && (
        <div className="modal-overlay">
          <div className="modal-content learning-modal">
            <div className="modal-header">
              <div>
                <p className="label">Aprendizaje del curso</p>
                <h3>{cursoAprendizaje.titulo}</h3>
              </div>

              <button className="close-button" onClick={cerrarModalAprendizaje}>
                X
              </button>
            </div>

            {loadingAprendizaje && <p>Cargando materiales del curso...</p>}

            {!loadingAprendizaje && materialesAprendizaje.length === 0 && (
              <div className="empty-chart">
                <div>
                  <strong>Este curso no tiene materiales cargados</strong>
                  <p>
                    Para iniciar el aprendizaje, primero se deben cargar materiales al
                    curso.
                  </p>
                </div>
              </div>
            )}

            {!loadingAprendizaje && materialesAprendizaje.length > 0 && (
              <>
                <div className="learning-progress-summary">
                  <div>
                    <strong>
                      Material {indiceMaterialActual + 1} de{" "}
                      {materialesAprendizaje.length}
                    </strong>
                    <span>
                      Completados: {resumenAprendizaje?.materialesCompletados || 0} de{" "}
                      {resumenAprendizaje?.totalMateriales || materialesAprendizaje.length}
                    </span>
                  </div>

                  <div className="detail-progress-bar learning-progress-bar">
                    <div
                      style={{
                        width: `${resumenAprendizaje?.porcentajeMateriales || 0}%`,
                      }}
                    />
                  </div>
                </div>

                {mensajeAprendizaje && (
                  <p
                    className={
                      mensajeAprendizaje.includes("No fue posible")
                        ? "error-message"
                        : "success-message"
                    }
                  >
                    {mensajeAprendizaje}
                  </p>
                )}

                {(() => {
                  const materialActual =
                    materialesAprendizaje[indiceMaterialActual];

                  if (!materialActual) {
                    return null;
                  }

                  return (
                    <section className="learning-material-card">
                      <div className="learning-material-header">
                        <div>
                          <h3>{materialActual.titulo}</h3>
                          <p>
                            {materialActual.descripcion ||
                              "Material de apoyo del curso."}
                          </p>
                        </div>

                        <span
                          className={
                            materialActual.completado
                              ? "badge badge-green"
                              : "badge badge-gray"
                          }
                        >
                          {materialActual.completado ? "Completado" : "Pendiente"}
                        </span>
                      </div>

                      <div className="learning-viewer">
                        {materialActual.tipo === "PDF" && (
                          <iframe
                            title={materialActual.titulo}
                            src={obtenerUrlMaterial(materialActual)}
                          />
                        )}

                        {materialActual.tipo === "VIDEO" && (
                          <video controls>
                            <source
                              src={obtenerUrlMaterial(materialActual)}
                              type={materialActual.mime_type}
                            />
                            Tu navegador no soporta la reproducción de video.
                          </video>
                        )}

                        {materialActual.tipo !== "PDF" &&
                          materialActual.tipo !== "VIDEO" && (
                            <p>
                              Este tipo de material no se puede previsualizar en el
                              navegador.
                            </p>
                          )}
                      </div>
                    </section>
                  );
                })()}

                {resumenAprendizaje?.todosCompletados && (
                  <p className="success-message">
                    Ya completaste todos los materiales del curso. El avance del curso
                    queda actualizado al 50%.
                  </p>
                )}

                <div className="learning-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={irMaterialAnterior}
                    disabled={indiceMaterialActual === 0}
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={irMaterialSiguiente}
                    disabled={indiceMaterialActual === materialesAprendizaje.length - 1}
                  >
                    Siguiente
                  </button>

                  <button
                    type="button"
                    onClick={marcarMaterialActualCompletado}
                    disabled={
                      materialCompletandoId === materialesAprendizaje[indiceMaterialActual]?.id ||
                      materialesAprendizaje[indiceMaterialActual]?.completado ||
                      resumenAprendizaje?.todosCompletados
                    }
                  >
                    {materialCompletandoId === materialesAprendizaje[indiceMaterialActual]?.id
                      ? "Guardando..."
                      : materialesAprendizaje[indiceMaterialActual]?.completado
                      ? "Material completado"
                      : "Marcar como completado"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalEvaluacionAbierto && cursoEvaluacion && (
        <div className="modal-overlay">
          <div className="modal-content evaluation-modal">
            <div className="modal-header">
              <div>
                <p className="label">Evaluación del curso</p>
                <h3>{cursoEvaluacion.titulo}</h3>
              </div>

              <button className="close-button" onClick={cerrarModalEvaluacion}>
                X
              </button>
            </div>

            {loadingEvaluacion && <p>Cargando evaluación...</p>}

            {!loadingEvaluacion && mensajeEvaluacion && (
              <p
                className={
                  mensajeEvaluacion.includes("aprobada") &&
                  !mensajeEvaluacion.includes("no aprobada")
                    ? "success-message"
                    : "error-message"
                }
              >
                {mensajeEvaluacion}
              </p>
            )}

            {!loadingEvaluacion && !evaluacionActiva && (
              <div className="empty-chart">
                <div>
                  <strong>Este curso no tiene evaluación activa</strong>
                  <p>
                    Debe existir una evaluación activa para poder presentar esta
                    actividad.
                  </p>
                </div>
              </div>
            )}

            {!loadingEvaluacion && evaluacionActiva && (
              <>
                <section className="evaluation-summary-box">
                  <div>
                    <strong>{evaluacionActiva.titulo}</strong>
                    <span>
                      Puntaje mínimo para aprobar:{" "}
                      {evaluacionActiva.puntaje_minimo}%
                    </span>
                  </div>

                  {cursoEvaluacion.intentos_fallidos_evaluacion > 0 && (
                    <span className="badge badge-red">
                      Intentos fallidos:{" "}
                      {cursoEvaluacion.intentos_fallidos_evaluacion}
                    </span>
                  )}
                </section>

                {resultadoEvaluacion && (
                  <section
                    className={
                      resultadoEvaluacion.estado === "Aprobado"
                        ? "evaluation-result-card evaluation-result-approved"
                        : "evaluation-result-card evaluation-result-failed"
                    }
                  >
                    <h3>
                      {resultadoEvaluacion.estado === "Aprobado"
                        ? "Evaluación aprobada"
                        : "Evaluación no aprobada"}
                    </h3>

                    <p>
                      Puntaje obtenido: <strong>{resultadoEvaluacion.puntaje}%</strong>
                    </p>

                    <p>
                      Intento No. <strong>{resultadoEvaluacion.intento}</strong>
                    </p>

                    {resultadoEvaluacion.estado !== "Aprobado" && (
                      <p>
                        Para volver a presentar la evaluación, un supervisor o
                        administrador debe habilitar un nuevo intento.
                      </p>
                    )}
                  </section>
                )}

                {!resultadoEvaluacion && (
                  <form className="evaluation-form">
                    {preguntasEvaluacion.map((pregunta, index) => (
                      <div className="evaluation-question-card" key={pregunta.id}>
                        <h4>
                          {index + 1}. {pregunta.texto_pregunta}
                        </h4>

                        <label>
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value="A"
                            checked={respuestasEvaluacion[pregunta.id] === "A"}
                            onChange={() => seleccionarRespuesta(pregunta.id, "A")}
                          />
                          {pregunta.opcion_a}
                        </label>

                        <label>
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value="B"
                            checked={respuestasEvaluacion[pregunta.id] === "B"}
                            onChange={() => seleccionarRespuesta(pregunta.id, "B")}
                          />
                          {pregunta.opcion_b}
                        </label>

                        <label>
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value="C"
                            checked={respuestasEvaluacion[pregunta.id] === "C"}
                            onChange={() => seleccionarRespuesta(pregunta.id, "C")}
                          />
                          {pregunta.opcion_c}
                        </label>

                        <label>
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value="D"
                            checked={respuestasEvaluacion[pregunta.id] === "D"}
                            onChange={() => seleccionarRespuesta(pregunta.id, "D")}
                          />
                          {pregunta.opcion_d}
                        </label>
                      </div>
                    ))}

                    <div className="evaluation-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cerrarModalEvaluacion}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={enviarEvaluacionModal}
                        disabled={enviandoEvaluacion}
                      >
                        {enviandoEvaluacion ? "Enviando..." : "Enviar evaluación"}
                      </button>
                    </div>
                  </form>
                )}

                {resultadoEvaluacion && (
                  <div className="evaluation-actions">
                    <button type="button" onClick={cerrarModalEvaluacion}>
                      Cerrar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {modalConfirmarReintentoAbierto && asignacionReintento && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <div>
                <p className="label">Confirmar reintento</p>
                <h3>Habilitar nuevo intento</h3>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={cancelarHabilitarReintento}
                disabled={loadingReintento}
              >
                X
              </button>
            </div>

            <p className="confirm-text">
              ¿Deseas habilitar un nuevo intento de evaluación para{" "}
              <strong>{asignacionReintento.nombre}</strong>?
            </p>

            <div className="confirm-summary">
              <p>
                <strong>Estado actual:</strong> {asignacionReintento.estado}
              </p>
              <p>
                <strong>Intentos fallidos:</strong>{" "}
                {asignacionReintento.intentos_fallidos_evaluacion || 0}
              </p>
              <p>
                <strong>Área:</strong> {asignacionReintento.area}
              </p>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cancelarHabilitarReintento}
                disabled={loadingReintento}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="retry-button"
                onClick={confirmarHabilitarReintento}
                disabled={loadingReintento}
              >
                {loadingReintento ? "Habilitando..." : "Habilitar reintento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEvaluacionAdminAbierto && cursoEvaluacionAdmin && (
        <div className="modal-overlay">
          <div className="modal-content evaluation-admin-modal">
            <div className="modal-header">
              <div>
                <p className="label">Administración de evaluación</p>
                <h3>{cursoEvaluacionAdmin.titulo}</h3>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={cerrarModalEvaluacionAdmin}
                disabled={guardandoEvaluacionAdmin}
              >
                X
              </button>
            </div>

            {loadingEvaluacionAdmin && <p>Cargando evaluación...</p>}

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {mensaje && (
              <p className="success-message">
                {mensaje}
              </p>
            )}

            {!loadingEvaluacionAdmin && (
              <>
                <form className="evaluation-admin-form" onSubmit={guardarEvaluacionAdmin}>
                  <div className="form-field full-field">
                    <label>Título de la evaluación</label>
                    <input
                      type="text"
                      name="titulo"
                      value={formEvaluacionAdmin.titulo}
                      onChange={handleChangeEvaluacionAdmin}
                      placeholder="Ej: Evaluación de seguridad de la información"
                    />
                  </div>

                  <div className="form-field">
                    <label>Puntaje mínimo para aprobar</label>
                    <input
                      type="number"
                      name="puntaje_minimo"
                      min="1"
                      max="100"
                      value={formEvaluacionAdmin.puntaje_minimo}
                      onChange={handleChangeEvaluacionAdmin}
                    />
                  </div>

                  <div className="form-field">
                    <label>Estado</label>
                    <select
                      name="estado"
                      value={formEvaluacionAdmin.estado}
                      onChange={handleChangeEvaluacionAdmin}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>

                  <div className="evaluation-admin-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={cerrarModalEvaluacionAdmin}
                      disabled={guardandoEvaluacionAdmin}
                    >
                      Cancelar
                    </button>

                    <button type="submit" disabled={guardandoEvaluacionAdmin}>
                      {guardandoEvaluacionAdmin
                        ? "Guardando..."
                        : evaluacionAdmin
                        ? "Actualizar evaluación"
                        : "Crear evaluación"}
                    </button>
                  </div>
                </form>

                <section className="evaluation-admin-questions-preview">
                  <div className="questions-admin-header">
                    <div>
                      <h4>Preguntas registradas</h4>
                      <p>
                        Administra las preguntas que serán visibles para los usuarios al
                        presentar la evaluación.
                      </p>
                    </div>

                    {modoPreguntaAdmin === "editar" && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={limpiarFormularioPreguntaAdmin}
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>

                  {!evaluacionAdmin?.id && (
                    <p className="info-message">
                      Primero debes crear la evaluación para poder agregar preguntas.
                    </p>
                  )}

                  {evaluacionAdmin?.id && (
                    <form className="question-admin-form" onSubmit={guardarPreguntaAdmin}>
                      <div className="form-field full-field">
                        <label>Texto de la pregunta</label>
                        <textarea
                          name="texto_pregunta"
                          value={formPreguntaAdmin.texto_pregunta}
                          onChange={handleChangePreguntaAdmin}
                          placeholder="Escribe aquí la pregunta"
                          rows="3"
                        />
                      </div>

                      <div className="form-field">
                        <label>Opción A</label>
                        <input
                          type="text"
                          name="opcion_a"
                          value={formPreguntaAdmin.opcion_a}
                          onChange={handleChangePreguntaAdmin}
                        />
                      </div>

                      <div className="form-field">
                        <label>Opción B</label>
                        <input
                          type="text"
                          name="opcion_b"
                          value={formPreguntaAdmin.opcion_b}
                          onChange={handleChangePreguntaAdmin}
                        />
                      </div>

                      <div className="form-field">
                        <label>Opción C</label>
                        <input
                          type="text"
                          name="opcion_c"
                          value={formPreguntaAdmin.opcion_c}
                          onChange={handleChangePreguntaAdmin}
                        />
                      </div>

                      <div className="form-field">
                        <label>Opción D</label>
                        <input
                          type="text"
                          name="opcion_d"
                          value={formPreguntaAdmin.opcion_d}
                          onChange={handleChangePreguntaAdmin}
                        />
                      </div>

                      <div className="form-field">
                        <label>Respuesta correcta</label>
                        <select
                          name="respuesta_correcta"
                          value={formPreguntaAdmin.respuesta_correcta}
                          onChange={handleChangePreguntaAdmin}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Ponderación</label>
                        <input
                          type="number"
                          name="ponderacion"
                          min="0.1"
                          max="100"
                          step="0.1"
                          value={formPreguntaAdmin.ponderacion}
                          onChange={handleChangePreguntaAdmin}
                        />
                      </div>

                      <div className="form-field">
                        <label>Estado</label>
                        <select
                          name="estado"
                          value={formPreguntaAdmin.estado}
                          onChange={handleChangePreguntaAdmin}
                        >
                          <option value="Activa">Activa</option>
                          <option value="Inactiva">Inactiva</option>
                        </select>
                      </div>

                      <div className="question-admin-actions">
                        <button type="submit" disabled={guardandoPreguntaAdmin}>
                          {guardandoPreguntaAdmin
                            ? "Guardando..."
                            : modoPreguntaAdmin === "editar"
                            ? "Actualizar pregunta"
                            : "Agregar pregunta"}
                        </button>
                      </div>
                    </form>
                  )}

                  {evaluacionAdmin?.id && (
                    <section className="csv-upload-box">
                      <div>
                        <h4>Carga masiva por CSV</h4>
                        <p>
                          El archivo debe contener las columnas: texto_pregunta, opcion_a,
                          opcion_b, opcion_c, opcion_d, respuesta_correcta, estado y ponderacion.
                        </p>
                      </div>

                      <div className="csv-upload-actions">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleArchivoCsvPreguntas}
                        />

                        <button
                          type="button"
                          onClick={cargarPreguntasCsv}
                          disabled={cargandoCsvPreguntas || !archivoCsvPreguntas}
                        >
                          {cargandoCsvPreguntas ? "Cargando..." : "Cargar CSV"}
                        </button>
                      </div>

                      {erroresCsvPreguntas.length > 0 && (
                        <div className="csv-error-box">
                          <strong>Errores encontrados:</strong>
                          <ul>
                            {erroresCsvPreguntas.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}

                  {preguntasAdmin.length === 0 ? (
                    <p className="info-message">
                      Esta evaluación aún no tiene preguntas registradas.
                    </p>
                  ) : (
                    <div className="table-container questions-admin-table">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Pregunta</th>
                            <th>Respuesta correcta</th>
                            <th>Ponderación</th>
                            <th>Estado</th>
                            <th>Acción</th>
                          </tr>
                        </thead>

                        <tbody>
                          {preguntasAdmin.map((pregunta, index) => (
                            <tr key={pregunta.id}>
                              <td>{index + 1}</td>
                              <td>{pregunta.texto_pregunta}</td>
                              <td>
                                <span className="badge badge-green">
                                  {pregunta.respuesta_correcta}
                                </span>
                              </td>
                              <td>{pregunta.ponderacion || 1}</td>
                              <td>
                                <span
                                  className={
                                    pregunta.estado === "Activa"
                                      ? "badge badge-green"
                                      : "badge badge-gray"
                                  }
                                >
                                  {pregunta.estado}
                                </span>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="secondary-edit-button"
                                    onClick={() => editarPreguntaAdmin(pregunta)}
                                  >
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    className={
                                      pregunta.estado === "Activa"
                                        ? "danger-button"
                                        : "retry-button"
                                    }
                                    onClick={() => cambiarEstadoPreguntaAdmin(pregunta)}
                                  >
                                    {pregunta.estado === "Activa" ? "Inactivar" : "Activar"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>          
              </>
            )}
          </div>
        </div>
      )}

    </main>
  );
}

export default Cursos;