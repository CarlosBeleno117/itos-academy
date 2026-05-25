import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import api from "../api/api";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
} from "chart.js";

import { Doughnut, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartDataLabels
);

function Dashboard() {
  const { state } = useAppContext();
  const usuarioActivo = state.usuarioActivo;

  const [dashboard, setDashboard] = useState(null);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState("all");

  const areasSistema = [
  "all",
  "IT",
  "RRHH",
  "BPO",
  "Billing",
  "PEO",
  "Implementacion",
];

  const rolActivo = usuarioActivo?.rol?.trim();

  const esVistaGestion =
    rolActivo === "Super Admin" ||
    rolActivo === "Admin" ||
    rolActivo === "Supervisor";

  useEffect(() => {
    if (usuarioActivo?.id) {
      setUsuarioSeleccionadoId(usuarioActivo.id);
    }
  }, [usuarioActivo]);

    const usuariosDisponibles = state.usuarios.filter((usuario) => {
      if (usuario.estado !== "Activo") return false;

      if (rolActivo === "Super Admin" || rolActivo === "Admin") {
        if (areaSeleccionada !== "all") {
          return usuario.area === areaSeleccionada;
        }

        return true;
      }

      if (rolActivo === "Supervisor") {
        const esYo = Number(usuario.id) === Number(usuarioActivo.id);
        const esEmpleadoDeMiArea =
          usuario.rol === "Empleado" && usuario.area === usuarioActivo.area;

        return esYo || esEmpleadoDeMiArea;
      }

      return Number(usuario.id) === Number(usuarioActivo?.id);
    });

    const consultaTodos = usuarioSeleccionadoId === "all";

    const usuarioDashboard = consultaTodos
      ? null
      : state.usuarios.find(
          (usuario) => Number(usuario.id) === Number(usuarioSeleccionadoId)
        ) || usuarioActivo;

  useEffect(() => {
    async function cargarDashboard() {
      if (!usuarioSeleccionadoId) return;

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/dashboard/resumen/${usuarioSeleccionadoId}?viewerId=${usuarioActivo.id}&area=${areaSeleccionada}`
        );

        setDashboard(response.data);
      } catch (error) {
        console.error(error);
        setError("No fue posible cargar la información del dashboard.");
      } finally {
        setLoading(false);
      }
    }

    cargarDashboard();
  }, [usuarioSeleccionadoId, areaSeleccionada, usuarioActivo]);

  if (loading) {
    return <main className="page">Cargando dashboard...</main>;
  }

  if (error) {
    return (
      <main className="page">
        <p className="error-message">{error}</p>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="page">
        <p>No hay información disponible.</p>
      </main>
    );
  }

  const avancesPorEstado = dashboard.avancesUsuarioPorEstado || [];
  const cursosPorArea = dashboard.cursosPorArea || [];
  const usuariosPorRol = dashboard.usuariosPorRol || [];
  const avancePorCurso = dashboard.avanceUsuarioPorCurso || [];
  const tendenciaMensual = dashboard.tendenciaMensualCompletados || [];
  const tieneEstadosUsuario = avancesPorEstado.length > 0;
  const tieneCursosPorArea = cursosPorArea.length > 0;
  const tieneUsuariosPorRol = usuariosPorRol.length > 0;
  const tieneAvancePorCurso = avancePorCurso.length > 0;
  const tieneTendenciaMensual = tendenciaMensual.length > 0;

  function EmptyChart({ text = "Sin datos para mostrar" }) {
    return (
      <div className="empty-chart">
        <div>
          <strong>{text}</strong>
          <p>No hay información registrada para este usuario o indicador.</p>
        </div>
      </div>
    );
  }


    const cursosCompletados =
      avancesPorEstado.find((item) => item.estado === "Completado")?.total || 0;

    const evaluacionesNoAprobadas =
      avancesPorEstado.find((item) => item.estado === "Evaluacion no aprobada")?.total || 0;

    const cursosPendientesOEnProceso = avancesPorEstado
      .filter(
        (item) =>
          item.estado === "Pendiente" ||
          item.estado === "En progreso" ||
          item.estado === "Evaluacion presentada"
      )
      .reduce((total, item) => total + Number(item.total), 0);

  const cursosPendientes = avancesPorEstado
    .filter((item) => item.estado !== "Completado")
    .reduce((total, item) => total + Number(item.total), 0);

  const coloresEstados = {
    Pendiente: "#94a3b8",
    "En progreso": "#60a5fa",
    "Evaluacion presentada": "#f59e0b",
    "Evaluacion no aprobada": "#ef4444",
    Completado: "#22c55e",
  };

  const doughnutAvancesData = {
    labels: avancesPorEstado.map((item) => item.estado),
    datasets: [
      {
        label: "Cursos",
        data: avancesPorEstado.map((item) => item.total),
        backgroundColor: avancesPorEstado.map(
          (item) => coloresEstados[item.estado] || "#64748b"
        ),
        borderWidth: 1,
      },
    ],
  };

    const coloresAreas = [
      "#2563eb",
      "#0f766e",
      "#f97316",
      "#7c3aed",
      "#0891b2",
      "#dc2626",
    ];

    const barCursosAreaData = {
      labels: cursosPorArea.map((item) => item.area),
      datasets: [
        {
          label: "Cursos por área",
          data: cursosPorArea.map((item) => item.total),
          backgroundColor: cursosPorArea.map(
            (_, index) => coloresAreas[index % coloresAreas.length]
          ),
        },
      ],
    };

  const doughnutUsuariosRolData = {
    labels: usuariosPorRol.map((item) => item.rol),
    datasets: [
      {
        label: "Usuarios",
        data: usuariosPorRol.map((item) => item.total),
        backgroundColor: ["#0ea5e9", "#14b8a6", "#f97316", "#8b5cf6"],
        borderWidth: 1,
      },
    ],
  };

  function obtenerColorPorPorcentaje(porcentaje) {
    if (porcentaje === 100) return "#22c55e";
    if (porcentaje >= 80) return "#ef4444";
    if (porcentaje >= 50) return "#60a5fa";
    return "#94a3b8";
  }

  const avancePorCursoData = {
    labels: avancePorCurso.map((item) => item.curso),
    datasets: [
      {
        label: consultaTodos ? "Promedio de avance %" : "Avance %",
        data: avancePorCurso.map((item) => item.porcentaje),
        backgroundColor: avancePorCurso.map((item) =>
          consultaTodos
            ? obtenerColorPorPorcentaje(Number(item.porcentaje))
            : coloresEstados[item.estado] || "#0f766e"
        ),
      },
    ],
  };

  const tendenciaMensualData = {
    labels: tendenciaMensual.map((item) => item.mes),
    datasets: [
      {
        label: "Usuarios que completaron cursos",
        data: tendenciaMensual.map((item) => item.usuarios_completaron),
        borderColor: "#2563eb",
        backgroundColor: "#93c5fd",
        tension: 0.35,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      datalabels: {
        color: "#111827",
        font: {
          weight: "bold",
          size: 13,
        },
        formatter: (value) => (value > 0 ? value : ""),
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: "top",
        color: "#111827",
        font: {
          weight: "bold",
        },
        formatter: (value) => value,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const horizontalBarOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return value >= 95 ? "start" : "right";
        },
        color: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return value >= 95 ? "#ffffff" : "#111827";
        },
        font: {
          weight: "bold",
        },
        formatter: (value) => `${value}%`,
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: "top",
        color: "#111827",
        font: {
          weight: "bold",
        },
        formatter: (value) => value,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  function obtenerTextoVistaConsolidada() {
    if (rolActivo === "Supervisor") {
      return `Vista consolidada de mi equipo · ${usuarioActivo.area}`;
    }

    if (areaSeleccionada !== "all") {
      return `Vista consolidada del área ${areaSeleccionada}`;
    }

    return "Todos los usuarios del filtro actual";
  }

  function limpiarFiltros() {
    setAreaSeleccionada("all");
    setUsuarioSeleccionadoId("all");
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="label">Panel principal</p>
          <h1>Dashboard de ITOS Academy</h1>
          <p>
            Vista general del sistema de capacitación con indicadores, avance de
            cursos y seguimiento por usuario.
          </p>

            {consultaTodos ? (
              <div className="dashboard-user-summary">
                <p>
                  <strong>Estás consultando el avance consolidado</strong>
                </p>
                <p>Vista general de usuarios permitidos según tu rol.</p>
              </div>
            ) : (
              usuarioDashboard && (
                <div className="dashboard-user-summary">
                  <p>
                    <strong>
                      {Number(usuarioDashboard.id) === Number(usuarioActivo.id)
                        ? "Estás consultando tu propio avance"
                        : `Estás consultando el avance de ${usuarioDashboard.nombre}`}
                    </strong>
                  </p>

                  <p>Área: {usuarioDashboard.area}</p>
                </div>
              )
            )}
        </div>
      </section>

      {esVistaGestion && (
        <section className="dashboard-filter-card">
          <div>
            <p className="label">Filtros del dashboard</p>
            <h3>Consultar avance de capacitación</h3>
            <p>
              Puedes consultar un usuario específico o una vista consolidada según tu rol.
            </p>

            {consultaTodos && (
              <p className="filter-note">
                La vista consolidada muestra promedios y totales de los usuarios que puedes consultar.
              </p>
            )}
          </div>

          <div className="dashboard-filters">
            {(rolActivo === "Super Admin" || rolActivo === "Admin") && (
              <div className="filter-field">
                <label>Área</label>
                <select
                  value={areaSeleccionada}
                  onChange={(e) => {
                    setAreaSeleccionada(e.target.value);
                    setUsuarioSeleccionadoId("all");
                  }}
                >
                  <option value="all">Todas las áreas</option>
                  <option value="IT">IT</option>
                  <option value="RRHH">RRHH</option>
                  <option value="BPO">BPO</option>
                  <option value="Billing">Billing</option>
                  <option value="PEO">PEO</option>
                  <option value="Implementacion">Implementación</option>
                </select>
              </div>
            )}

            {rolActivo === "Supervisor" && (
              <div className="filter-field">
                <label>Área</label>
                <select value={usuarioActivo.area} disabled>
                  <option>{usuarioActivo.area}</option>
                </select>
              </div>
            )}

            <div className="filter-field">
              <label>Usuario</label>
              <select
                value={usuarioSeleccionadoId}
                onChange={(e) => setUsuarioSeleccionadoId(e.target.value)}
              >
                <option value="all">{obtenerTextoVistaConsolidada()}</option>

                {usuariosDisponibles.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {Number(usuario.id) === Number(usuarioActivo.id)
                      ? `Yo · ${usuario.area}`
                      : `${usuario.nombre} · ${usuario.area}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="clear-filters-button"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </section>
      )}

  <section className="cards-grid">
        {esVistaGestion && (
          <>
            <div className="card">
              <h3>Total usuarios</h3>
              <p className="number">{dashboard.kpis.totalUsuarios}</p>
              <span>Usuarios activos en el sistema</span>
            </div>

            <div className="card">
              <h3>Total cursos</h3>
              <p className="number">{dashboard.kpis.totalCursos}</p>
              <span>Cursos registrados</span>
            </div>

            <div className="card">
              <h3>Total materiales</h3>
              <p className="number">{dashboard.kpis.totalMateriales}</p>
              <span>PDFs y videos cargados</span>
            </div>
          </>
        )}

        <div className="card">
          <h3>Promedio de avance</h3>
          <p className="number">{dashboard.kpis.promedioAvanceUsuario}%</p>
          <span>
            {consultaTodos
              ? "Promedio de la vista consolidada"
              : "Promedio del usuario visualizado"}
          </span>
        </div>

        <div className="card">
          <h3>Cursos completados</h3>
          <p className="number">{cursosCompletados}</p>
          <span>Cursos finalizados correctamente</span>
        </div>

        <div className="card">
          <h3>Evaluaciones no aprobadas</h3>
          <p className="number">{evaluacionesNoAprobadas}</p>
          <span>Requieren refuerzo o nuevo intento</span>
        </div>

        <div className="card">
          <h3>Pendientes / en progreso</h3>
          <p className="number">{cursosPendientesOEnProceso}</p>
          <span>Cursos aún no completados</span>
        </div>

        {!esVistaGestion && (
          <div className="card">
            <h3>Mis cursos asignados</h3>
            <p className="number">{dashboard.kpis.cursosAsignadosUsuario}</p>
            <span>Cursos relacionados con mi usuario</span>
          </div>
        )}
      </section>

      {esVistaGestion ? (
        <>
          <section className="dashboard-analytics-grid">
            <div className="chart-card chart-small">
              <h3>Usuarios por rol</h3>
              <div className="chart-wrapper small-chart">
                {tieneUsuariosPorRol ? (
                  <Doughnut
                    data={doughnutUsuariosRolData}
                    options={doughnutOptions}
                  />
                ) : (
                  <EmptyChart />
                )}
              </div>
            </div>

            <div className="chart-card chart-wide">
              <h3>Cursos por área</h3>
              <div className="chart-wrapper wide-chart">
                {tieneCursosPorArea ? (
                  <Bar data={barCursosAreaData} options={barOptions} />
                ) : (
                  <EmptyChart />
                )}
              </div>
            </div>

            <div className="chart-card chart-small">
              <h3>
                {consultaTodos
                  ? "Estado de cursos consolidado"
                  : "Estado de cursos del usuario"}
              </h3>
              <div className="chart-wrapper small-chart">
                {tieneEstadosUsuario ? (
                  <Doughnut
                    data={doughnutAvancesData}
                    options={doughnutOptions}
                  />
                ) : (
                  <EmptyChart />
                )}
              </div>
            </div>

            <div className="chart-card chart-wide">
              <h3>
                {consultaTodos
                  ? "Promedio de avance por curso"
                  : "Avance por curso del usuario"}
              </h3>
              <div className="chart-wrapper wide-chart">
                {tieneAvancePorCurso ? (
                  <Bar
                    data={avancePorCursoData}
                    options={horizontalBarOptions}
                  />
                ) : (
                  <EmptyChart />
                )}
              </div>
            </div>
          </section>

          <section className="trend-section">
            <div className="chart-card">
              <h3>Tendencia mensual de usuarios que completaron cursos</h3>
              <div className="chart-wrapper trend-chart">
                {tieneTendenciaMensual ? (
                  <Line data={tendenciaMensualData} options={lineOptions} />
                ) : (
                  <EmptyChart text="Sin tendencia mensual para mostrar" />
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="employee-dashboard-grid">
          <div className="chart-card chart-small">
            <h3>Estado de mis cursos</h3>
            <div className="chart-wrapper small-chart">
              {tieneEstadosUsuario ? (
                <Doughnut data={doughnutAvancesData} options={doughnutOptions} />
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          <div className="chart-card chart-wide">
            <h3>Mi avance por curso</h3>
            <div className="chart-wrapper wide-chart">
              {tieneAvancePorCurso ? (
                <Bar data={avancePorCursoData} options={horizontalBarOptions} />
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-table-section">
        <div className="chart-card">
          <h3>
            {consultaTodos
              ? "Resumen promedio por curso"
              : "Detalle de avance por curso"}
          </h3>

          {avancePorCurso.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Avance</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {avancePorCurso.map((item, index) => (
                    <tr key={index}>
                      <td>{item.curso}</td>
                      <td>{item.porcentaje}%</td>
                      <td>{item.estado || "Según promedio"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;