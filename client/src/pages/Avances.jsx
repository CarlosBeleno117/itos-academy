import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useAppContext } from "../context/AppContext";

function Avances() {
  const { state } = useAppContext();
  const usuarioActivo = state.usuarioActivo;

  const [avances, setAvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("all");
  const [areaFiltro, setAreaFiltro] = useState("all");
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [porcentajeFiltro, setPorcentajeFiltro] = useState("all");

  useEffect(() => {
    async function cargarAvances() {
      if (!usuarioActivo?.id) return;

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/avances/visibles?viewerId=${usuarioActivo.id}`
        );

        setAvances(response.data);
      } catch (error) {
        console.error(error);
        setError("No fue posible cargar los avances.");
      } finally {
        setLoading(false);
      }
    }

    cargarAvances();
  }, [usuarioActivo]);

  function obtenerClaseAvance(estado) {
    if (estado === "Completado") return "badge badge-green";
    if (estado === "Evaluacion no aprobada") return "badge badge-red";
    if (estado === "En progreso") return "badge badge-blue";
    if (estado === "Pendiente") return "badge badge-gray";
    if (estado === "Evaluacion presentada") return "badge badge-yellow";

    return "badge badge-gray";
  }

  function obtenerTextoVista() {
    if (usuarioActivo?.rol === "Super Admin" || usuarioActivo?.rol === "Admin") {
      return "Consulta el avance general de capacitación de todos los usuarios registrados.";
    }

    if (usuarioActivo?.rol === "Supervisor") {
      return `Consulta tus avances y los avances del equipo del área ${usuarioActivo.area}.`;
    }

    return "Consulta el avance de los cursos asignados a tu usuario.";
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function coincidePorcentaje(avance) {
    const porcentaje = Number(avance.porcentaje);

    if (porcentajeFiltro === "all") return true;
    if (porcentajeFiltro === "0") return porcentaje === 0;
    if (porcentajeFiltro === "50") return porcentaje === 50;
    if (porcentajeFiltro === "80") return porcentaje === 80;
    if (porcentajeFiltro === "100") return porcentaje === 100;

    return true;
  }

  const usuariosDisponibles = useMemo(() => {
    const mapa = new Map();

    avances.forEach((avance) => {
      if (!mapa.has(avance.usuario_id)) {
        mapa.set(avance.usuario_id, {
          id: avance.usuario_id,
          nombre: avance.usuario,
          area: avance.usuario_area,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [avances]);

  const areasDisponibles = useMemo(() => {
    return [
      ...new Set(avances.map((avance) => avance.curso_area).filter(Boolean)),
    ].sort();
  }, [avances]);

  const avancesFiltrados = avances.filter((avance) => {
    const texto = busqueda.toLowerCase().trim();

    const coincideBusqueda =
      avance.usuario?.toLowerCase().includes(texto) ||
      avance.correo?.toLowerCase().includes(texto) ||
      avance.curso?.toLowerCase().includes(texto) ||
      avance.curso_area?.toLowerCase().includes(texto);

    const coincideUsuario =
      usuarioFiltro === "all" ||
      Number(avance.usuario_id) === Number(usuarioFiltro);

    const coincideArea =
      areaFiltro === "all" || avance.curso_area === areaFiltro;

    const coincideEstado =
      estadoFiltro === "all" || avance.estado === estadoFiltro;

    return (
      coincideBusqueda &&
      coincideUsuario &&
      coincideArea &&
      coincideEstado &&
      coincidePorcentaje(avance)
    );
  });

  const resumen = useMemo(() => {
    const total = avancesFiltrados.length;

    const completados = avancesFiltrados.filter(
      (avance) => avance.estado === "Completado"
    ).length;

    const enProgreso = avancesFiltrados.filter(
      (avance) => avance.estado === "En progreso"
    ).length;

    const noAprobados = avancesFiltrados.filter(
      (avance) => avance.estado === "Evaluacion no aprobada"
    ).length;

    const pendientes = avancesFiltrados.filter(
      (avance) => avance.estado === "Pendiente"
    ).length;

    const promedio =
      total === 0
        ? 0
        : avancesFiltrados.reduce(
            (suma, avance) => suma + Number(avance.porcentaje || 0),
            0
          ) / total;

    return {
      total,
      completados,
      enProgreso,
      noAprobados,
      pendientes,
      promedio: Number(promedio.toFixed(2)),
    };
  }, [avancesFiltrados]);

  function limpiarFiltros() {
    setBusqueda("");
    setUsuarioFiltro("all");
    setAreaFiltro("all");
    setEstadoFiltro("all");
    setPorcentajeFiltro("all");
  }

  if (loading) {
    return <main className="page">Cargando avances...</main>;
  }

  return (
    <main className="page">
      <div className="section-title">
        <p className="label">Seguimiento de capacitación</p>
        <h2>Avances</h2>
        <p>{obtenerTextoVista()}</p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <section className="cards-grid">
        <div className="card">
          <h3>Total avances</h3>
          <p className="number">{resumen.total}</p>
          <span>Registros visibles según tu perfil</span>
        </div>

        <div className="card">
          <h3>Completados</h3>
          <p className="number">{resumen.completados}</p>
          <span>Cursos finalizados correctamente</span>
        </div>

        <div className="card">
          <h3>En progreso</h3>
          <p className="number">{resumen.enProgreso}</p>
          <span>Cursos con materiales revisados</span>
        </div>

        <div className="card">
          <h3>No aprobados</h3>
          <p className="number">{resumen.noAprobados}</p>
          <span>Evaluaciones que requieren nuevo intento</span>
        </div>

        <div className="card">
          <h3>Pendientes</h3>
          <p className="number">{resumen.pendientes}</p>
          <span>Cursos asignados sin avance</span>
        </div>

        <div className="card">
          <h3>Promedio avance</h3>
          <p className="number">{resumen.promedio}%</p>
          <span>Promedio de los registros filtrados</span>
        </div>
      </section>

      <section className="course-filters-card avances-filters">
        <div className="filter-field">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por usuario, correo, curso o área"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Usuario</label>
          <select
            value={usuarioFiltro}
            onChange={(e) => setUsuarioFiltro(e.target.value)}
          >
            <option value="all">Todos los usuarios visibles</option>

            {usuariosDisponibles.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {Number(usuario.id) === Number(usuarioActivo?.id)
                  ? `Yo · ${usuario.area}`
                  : `${usuario.nombre} · ${usuario.area}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Área del curso</label>
          <select
            value={areaFiltro}
            onChange={(e) => setAreaFiltro(e.target.value)}
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
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En progreso">En progreso</option>
            <option value="Evaluacion no aprobada">
              Evaluación no aprobada
            </option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Porcentaje</label>
          <select
            value={porcentajeFiltro}
            onChange={(e) => setPorcentajeFiltro(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="0">0% - Pendiente</option>
            <option value="50">50% - Materiales revisados</option>
            <option value="80">80% - Evaluación presentada</option>
            <option value="100">100% - Completado</option>
          </select>
        </div>

        <div className="course-filter-actions">
          <button
            type="button"
            className="clear-filters-button"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <p className="filter-results-text">
        Mostrando {avancesFiltrados.length} de {avances.length} avances
        disponibles para tu perfil.
      </p>

      {avancesFiltrados.length === 0 && (
        <div className="empty-chart">
          <div>
            <strong>Sin avances para mostrar</strong>
            <p>No hay avances que coincidan con los filtros seleccionados.</p>
          </div>
        </div>
      )}

      {avancesFiltrados.length > 0 && (
        <div className="table-container avances-table-container">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Curso</th>
                <th>Área curso</th>
                <th>Estado</th>
                <th>Avance</th>
                <th>Materiales</th>
                <th>Evaluación</th>
                <th>Actualización</th>
              </tr>
            </thead>

            <tbody>
              {avancesFiltrados.map((avance) => (
                <tr key={avance.id}>
                  <td>
                    {Number(avance.usuario_id) === Number(usuarioActivo?.id) ? (
                      <span className="current-user-label">
                        Yo
                        <small>{avance.usuario}</small>
                      </span>
                    ) : (
                      <>
                        <strong>{avance.usuario}</strong>
                        <br />
                        <small>{avance.usuario_area}</small>
                      </>
                    )}
                  </td>

                  <td>
                    <strong>{avance.curso}</strong>
                    <br />
                    <small>{avance.duracion_horas} horas</small>
                  </td>

                  <td>{avance.curso_area}</td>

                  <td>
                    <span className={obtenerClaseAvance(avance.estado)}>
                      {avance.estado}
                    </span>
                  </td>

                  <td>
                    <div className="avance-progress-cell">
                      <span>{avance.porcentaje}%</span>

                      <div className="table-progress-bar">
                        <div
                          style={{
                            width: `${avance.porcentaje}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={
                        avance.materiales_revisados
                          ? "badge badge-green"
                          : "badge badge-gray"
                      }
                    >
                      {avance.materiales_revisados ? "Sí" : "No"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        avance.evaluacion_presentada
                          ? "badge badge-green"
                          : "badge badge-gray"
                      }
                    >
                      {avance.evaluacion_presentada ? "Sí" : "No"}
                    </span>
                  </td>

                  <td>{formatearFecha(avance.fecha_actualizacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Avances;