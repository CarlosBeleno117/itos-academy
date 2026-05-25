import { useEffect, useState } from "react";
import api from "../api/api";
import { useAppContext } from "../context/AppContext";

function Usuarios() {
  const { state, dispatch } = useAppContext();

  const usuarioActivo = state.usuarioActivo;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [rolFiltroUsuario, setRolFiltroUsuario] = useState("all");
  const [areaFiltroUsuario, setAreaFiltroUsuario] = useState("all");
  const [estadoFiltroUsuario, setEstadoFiltroUsuario] = useState("all");

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [usuarioCambioEstado, setUsuarioCambioEstado] = useState(null);

  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    correo: "",
    password: "",
    rol: "Empleado",
    area: "BPO",
    cargo: "",
    pais: "Colombia",
    estado: "Activo",
    fecha_ingreso: "",
  });

  const puedeCrearUsuarios =
    usuarioActivo?.rol === "Super Admin" || usuarioActivo?.rol === "Admin";

  useEffect(() => {
    async function cargarUsuariosVisibles() {
      if (!usuarioActivo?.id) return;

      try {
        setError("");

        const response = await api.get(
          `/usuarios/visibles?viewerId=${usuarioActivo.id}`
        );

        dispatch({
          type: "SET_USUARIOS",
          payload: response.data,
        });
      } catch (error) {
        console.error(error);
        setError("No fue posible cargar los usuarios visibles.");
      }
    }

    cargarUsuariosVisibles();
  }, [usuarioActivo, dispatch]);

  async function recargarUsuarios() {
    if (!usuarioActivo?.id) return;

    const response = await api.get(
      `/usuarios/visibles?viewerId=${usuarioActivo.id}`
    );

    dispatch({
      type: "SET_USUARIOS",
      payload: response.data,
    });
  }

  function abrirModal() {
    setModalAbierto(true);
    setMensaje("");
    setError("");

    setFormUsuario({
      nombre: "",
      correo: "",
      password: "",
      rol: "Empleado",
      area: "BPO",
      cargo: "",
      pais: "Colombia",
      estado: "Activo",
      fecha_ingreso: "",
    });
  }

  function cerrarModal() {
    setModalAbierto(false);

    setFormUsuario({
      nombre: "",
      correo: "",
      password: "",
      rol: "Empleado",
      area: "BPO",
      cargo: "",
      pais: "Colombia",
      estado: "Activo",
      fecha_ingreso: "",
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormUsuario({
      ...formUsuario,
      [name]: value,
    });
  }

  function puedeEditarUsuario(usuario) {
    if (!usuarioActivo || !usuario) return false;

    if (usuarioActivo.rol === "Super Admin") return true;

    if (usuarioActivo.rol === "Admin") {
      return usuario.rol !== "Super Admin";
    }

    if (usuarioActivo.rol === "Supervisor") {
      return usuario.rol === "Empleado" && usuario.area === usuarioActivo.area;
    }

    return false;
  }

  function puedeCambiarEstadoUsuario(usuario) {
    if (!puedeEditarUsuario(usuario)) return false;

    if (Number(usuario.id) === Number(usuarioActivo.id)) {
      return false;
    }

    return true;
  }

  function obtenerClaseRol(rol) {
    if (rol === "Super Admin") return "badge badge-purple";
    if (rol === "Admin") return "badge badge-blue";
    if (rol === "Supervisor") return "badge badge-orange";
    if (rol === "Empleado") return "badge badge-gray";

    return "badge badge-gray";
  }

  function obtenerClaseEstadoUsuario(estado) {
    if (estado === "Activo") return "badge badge-green";
    if (estado === "Inactivo") return "badge badge-red";

    return "badge badge-gray";
  }

  function obtenerRolesCrear() {
    if (usuarioActivo?.rol === "Super Admin") {
      return ["Super Admin", "Admin", "Supervisor", "Empleado"];
    }

    if (usuarioActivo?.rol === "Admin") {
      return ["Admin", "Supervisor", "Empleado"];
    }

    return ["Empleado"];
  }

  function obtenerRolesEditar() {
    if (usuarioActivo?.rol === "Super Admin") {
      return ["Super Admin", "Admin", "Supervisor", "Empleado"];
    }

    if (usuarioActivo?.rol === "Admin") {
      return ["Admin", "Supervisor", "Empleado"];
    }

    return ["Empleado"];
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nombreLimpio = formUsuario.nombre.trim();
    const correoLimpio = formUsuario.correo.trim();

    if (
      !nombreLimpio ||
      !correoLimpio ||
      !formUsuario.password ||
      !formUsuario.rol ||
      !formUsuario.area
    ) {
      setError("Debe completar nombre, correo, contraseña, rol y área.");
      return;
    }

    if (usuarioActivo?.rol === "Admin" && formUsuario.rol === "Super Admin") {
      setError("Un administrador no puede crear usuarios Super Admin.");
      return;
    }

    try {
      setError("");
      setMensaje("");

      await api.post("/usuarios", {
        ...formUsuario,
        nombre: nombreLimpio,
        correo: correoLimpio,
      });

      await recargarUsuarios();

      setMensaje("Usuario creado correctamente.");
      cerrarModal();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No fue posible crear el usuario."
      );
    }
  }

  function abrirModalEditarUsuario(usuario) {
    setError("");
    setMensaje("");

    setUsuarioEditando({
      ...usuario,
      cargo: usuario.cargo || "",
      pais: usuario.pais || "Colombia",
      estado: usuario.estado || "Activo",
    });

    setModalEditarAbierto(true);
  }

  function cerrarModalEditarUsuario() {
    setModalEditarAbierto(false);
    setUsuarioEditando(null);
  }

  function handleChangeEditarUsuario(e) {
    const { name, value } = e.target;

    setUsuarioEditando({
      ...usuarioEditando,
      [name]: value,
    });
  }

  async function handleSubmitEditarUsuario(e) {
    e.preventDefault();

    if (!usuarioEditando) return;

    if (
      !usuarioEditando.nombre ||
      !usuarioEditando.correo ||
      !usuarioEditando.rol ||
      !usuarioEditando.area ||
      !usuarioEditando.estado
    ) {
      setError("Nombre, correo, rol, área y estado son obligatorios.");
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response = await api.put(`/usuarios/${usuarioEditando.id}`, {
        nombre: usuarioEditando.nombre.trim(),
        correo: usuarioEditando.correo.trim(),
        rol: usuarioEditando.rol,
        area: usuarioEditando.area,
        cargo: usuarioEditando.cargo,
        pais: usuarioEditando.pais,
        estado: usuarioEditando.estado,
        actualizado_por: usuarioActivo.id,
      });

      setMensaje(response.data.message || "Usuario actualizado correctamente.");

      cerrarModalEditarUsuario();
      await recargarUsuarios();

      if (Number(usuarioEditando.id) === Number(usuarioActivo.id)) {
        dispatch({
          type: "SET_USUARIO_ACTIVO",
          payload: {
            ...usuarioActivo,
            nombre: usuarioEditando.nombre.trim(),
            correo: usuarioEditando.correo.trim(),
            rol: usuarioEditando.rol,
            area: usuarioEditando.area,
            cargo: usuarioEditando.cargo,
            pais: usuarioEditando.pais,
            estado: usuarioEditando.estado,
          },
        });
      }
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No fue posible actualizar el usuario."
      );
    }
  }

  function abrirModalCambioEstado(usuario) {
    setError("");
    setMensaje("");
    setUsuarioCambioEstado(usuario);
    setModalEstadoAbierto(true);
  }

  function cerrarModalCambioEstado() {
    setModalEstadoAbierto(false);
    setUsuarioCambioEstado(null);
  }

  async function confirmarCambioEstado() {
    if (!usuarioCambioEstado || !usuarioActivo) return;

    const nuevoEstado =
      usuarioCambioEstado.estado === "Activo" ? "Inactivo" : "Activo";

    try {
      setError("");
      setMensaje("");

      const response = await api.patch(
        `/usuarios/${usuarioCambioEstado.id}/estado`,
        {
          estado: nuevoEstado,
          actualizado_por: usuarioActivo.id,
        }
      );

      setMensaje(response.data.message || "Estado actualizado correctamente.");

      cerrarModalCambioEstado();
      await recargarUsuarios();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible actualizar el estado del usuario."
      );
    }
  }

  const usuariosFiltrados = state.usuarios.filter((usuario) => {
    const texto = busquedaUsuario.toLowerCase().trim();

    const nombre = usuario.nombre || "";
    const correo = usuario.correo || "";
    const rol = usuario.rol || "";
    const area = usuario.area || "";
    const estado = usuario.estado || "";

    const coincideBusqueda =
      nombre.toLowerCase().includes(texto) ||
      correo.toLowerCase().includes(texto);

    const coincideRol = rolFiltroUsuario === "all" || rol === rolFiltroUsuario;

    const coincideArea =
      areaFiltroUsuario === "all" || area === areaFiltroUsuario;

    const coincideEstado =
      estadoFiltroUsuario === "all" || estado === estadoFiltroUsuario;

    return coincideBusqueda && coincideRol && coincideArea && coincideEstado;
  });

  const areasUsuariosDisponibles = [
    ...new Set(state.usuarios.map((usuario) => usuario.area).filter(Boolean)),
  ];

  function limpiarFiltrosUsuarios() {
    setBusquedaUsuario("");
    setRolFiltroUsuario("all");
    setAreaFiltroUsuario("all");
    setEstadoFiltroUsuario("all");
  }

  if (state.loading) {
    return <main className="page">Cargando usuarios...</main>;
  }

  return (
    <main className="page">
      <div className="section-title">
        <p className="label">Gestión de perfiles</p>
        <h2>Usuarios registrados</h2>
        <p>
          Consulta, filtra y administra los usuarios registrados en ITOS Academy
          según los permisos de tu perfil.
        </p>
      </div>

      {mensaje && <p className="success-message">{mensaje}</p>}
      {error && <p className="error-message">{error}</p>}

      <section className="course-filters-card">
        <div className="filter-field">
          <label>Buscar usuario</label>
          <input
            type="text"
            placeholder="Buscar por nombre o correo"
            value={busquedaUsuario}
            onChange={(e) => setBusquedaUsuario(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Rol</label>
          <select
            value={rolFiltroUsuario}
            onChange={(e) => setRolFiltroUsuario(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Empleado">Empleado</option>
          </select>
        </div>

        <div className="filter-field">
          <label>Área</label>
          <select
            value={areaFiltroUsuario}
            onChange={(e) => setAreaFiltroUsuario(e.target.value)}
          >
            <option value="all">Todas las áreas visibles</option>

            {areasUsuariosDisponibles.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Estado</label>
          <select
            value={estadoFiltroUsuario}
            onChange={(e) => setEstadoFiltroUsuario(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="course-filter-actions">
          <button
            type="button"
            className="clear-filters-button"
            onClick={limpiarFiltrosUsuarios}
          >
            Limpiar filtros
          </button>

          {puedeCrearUsuarios && (
            <button type="button" onClick={abrirModal}>
              Crear usuario
            </button>
          )}
        </div>
      </section>

      <p className="filter-results-text">
        Mostrando {usuariosFiltrados.length} de {state.usuarios.length} usuarios
        disponibles para tu perfil.
      </p>

      {usuariosFiltrados.length === 0 && (
        <div className="empty-chart">
          <div>
            <strong>Sin usuarios para mostrar</strong>
            <p>No hay usuarios que coincidan con los filtros seleccionados.</p>
          </div>
        </div>
      )}

      {usuariosFiltrados.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Cargo</th>
                <th>País</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr
                  key={usuario.id}
                  className={
                    Number(usuario.id) === Number(usuarioActivo?.id)
                      ? "current-user-row"
                      : ""
                  }
                >
                  <td>
                    {Number(usuario.id) === Number(usuarioActivo?.id) ? (
                      <span className="current-user-label">
                        Yo
                        <small>{usuario.nombre}</small>
                      </span>
                    ) : (
                      usuario.nombre
                    )}
                  </td>
                  <td>{usuario.correo}</td>
                  <td>
                    <span className={obtenerClaseRol(usuario.rol)}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td>{usuario.area}</td>
                  <td>{usuario.cargo || "Sin cargo"}</td>
                  <td>{usuario.pais || "No registrado"}</td>
                  <td>
                    <span className={obtenerClaseEstadoUsuario(usuario.estado)}>
                      {usuario.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {puedeEditarUsuario(usuario) && (
                        <button
                          className="secondary-edit-button"
                          onClick={() => abrirModalEditarUsuario(usuario)}
                        >
                          Editar
                        </button>
                      )}

                      {puedeCambiarEstadoUsuario(usuario) && (
                        <button
                          className={
                            usuario.estado === "Activo"
                              ? "danger-button"
                              : "assign-button"
                          }
                          onClick={() => abrirModalCambioEstado(usuario)}
                        >
                          {usuario.estado === "Activo"
                            ? "Inactivar"
                            : "Activar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear nuevo usuario</h3>
              <button className="close-button" onClick={cerrarModal}>
                X
              </button>
            </div>

            <form className="user-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ejemplo: María Torres"
                  value={formUsuario.nombre}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Correo corporativo</label>
                <input
                  type="email"
                  name="correo"
                  placeholder="correo@itos.com"
                  value={formUsuario.correo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña inicial"
                  value={formUsuario.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Rol</label>
                <select
                  name="rol"
                  value={formUsuario.rol}
                  onChange={handleChange}
                >
                  {obtenerRolesCrear().map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Área</label>
                <select
                  name="area"
                  value={formUsuario.area}
                  onChange={handleChange}
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
                <label>Cargo</label>
                <input
                  type="text"
                  name="cargo"
                  placeholder="Cargo"
                  value={formUsuario.cargo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>País</label>
                <input
                  type="text"
                  name="pais"
                  placeholder="País"
                  value={formUsuario.pais}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Estado</label>
                <select
                  name="estado"
                  value={formUsuario.estado}
                  onChange={handleChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="form-field">
                <label>Fecha de ingreso</label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formUsuario.fecha_ingreso}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit">Guardar usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEditarAbierto && usuarioEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar usuario</h3>
              <button
                className="close-button"
                onClick={cerrarModalEditarUsuario}
              >
                X
              </button>
            </div>

            <form className="user-form" onSubmit={handleSubmitEditarUsuario}>
              <div className="form-field">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={usuarioEditando.nombre}
                  onChange={handleChangeEditarUsuario}
                />
              </div>

              <div className="form-field">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={usuarioEditando.correo}
                  onChange={handleChangeEditarUsuario}
                />
              </div>

              <div className="form-field">
                <label>Rol</label>
                <select
                  name="rol"
                  value={usuarioEditando.rol}
                  onChange={handleChangeEditarUsuario}
                  disabled={usuarioActivo?.rol === "Supervisor"}
                >
                  {obtenerRolesEditar().map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Área</label>
                <select
                  name="area"
                  value={usuarioEditando.area}
                  onChange={handleChangeEditarUsuario}
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
                <label>Cargo</label>
                <input
                  type="text"
                  name="cargo"
                  value={usuarioEditando.cargo || ""}
                  onChange={handleChangeEditarUsuario}
                />
              </div>

              <div className="form-field">
                <label>País</label>
                <input
                  type="text"
                  name="pais"
                  value={usuarioEditando.pais || ""}
                  onChange={handleChangeEditarUsuario}
                />
              </div>

              <div className="form-field">
                <label>Estado</label>
                <select
                  name="estado"
                  value={usuarioEditando.estado}
                  onChange={handleChangeEditarUsuario}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cerrarModalEditarUsuario}
                >
                  Cancelar
                </button>

                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEstadoAbierto && usuarioCambioEstado && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h3>
                {usuarioCambioEstado.estado === "Activo"
                  ? "Confirmar inactivación"
                  : "Confirmar activación"}
              </h3>
              <button className="close-button" onClick={cerrarModalCambioEstado}>
                X
              </button>
            </div>

            <div className="confirm-body">
              <p>
                Vas a cambiar el estado del usuario{" "}
                <strong>{usuarioCambioEstado.nombre}</strong>.
              </p>

              <p className="warning-message">
                {usuarioCambioEstado.estado === "Activo"
                  ? "El usuario quedará inactivo y no debería usarse para gestionar cursos o avances."
                  : "El usuario volverá a quedar disponible para operar en la plataforma."}
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cerrarModalCambioEstado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  usuarioCambioEstado.estado === "Activo"
                    ? "danger-button"
                    : "assign-button"
                }
                onClick={confirmarCambioEstado}
              >
                {usuarioCambioEstado.estado === "Activo"
                  ? "Sí, inactivar"
                  : "Sí, activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Usuarios;