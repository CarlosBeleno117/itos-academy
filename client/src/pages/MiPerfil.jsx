import { useState } from "react";
import api from "../api/api";
import { useAppContext } from "../context/AppContext";

function MiPerfil() {
  const { state, dispatch } = useAppContext();
  const usuarioActivo = state.usuarioActivo;

  const [pais, setPais] = useState(usuarioActivo?.pais || "Colombia");

  const [formPassword, setFormPassword] = useState({
    password_actual: "",
    password_nueva: "",
    confirmar_password: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  function handleChangePassword(e) {
    const { name, value } = e.target;

    setFormPassword({
      ...formPassword,
      [name]: value,
    });
  }

  async function handleActualizarPerfil(e) {
    e.preventDefault();

    if (!pais.trim()) {
      setError("El país no puede estar vacío.");
      return;
    }

    try {
      setLoadingPerfil(true);
      setMensaje("");
      setError("");

      const response = await api.patch(`/perfil/${usuarioActivo.id}`, {
        pais,
        actualizado_por: usuarioActivo.id,
      });

      dispatch({
        type: "SET_USUARIO_ACTIVO",
        payload: response.data.usuario,
      });

      setMensaje(response.data.message || "Perfil actualizado correctamente.");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible actualizar el perfil."
      );
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function handleCambiarPassword(e) {
    e.preventDefault();

    if (
      !formPassword.password_actual ||
      !formPassword.password_nueva ||
      !formPassword.confirmar_password
    ) {
      setError("Debe completar todos los campos de contraseña.");
      return;
    }

    if (formPassword.password_nueva !== formPassword.confirmar_password) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (formPassword.password_nueva.length < 6) {
      setError("La nueva contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    try {
      setLoadingPassword(true);
      setMensaje("");
      setError("");

      const response = await api.patch(`/perfil/${usuarioActivo.id}/password`, {
        password_actual: formPassword.password_actual,
        password_nueva: formPassword.password_nueva,
        actualizado_por: usuarioActivo.id,
      });

      setMensaje(response.data.message || "Contraseña actualizada correctamente.");

      setFormPassword({
        password_actual: "",
        password_nueva: "",
        confirmar_password: "",
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible actualizar la contraseña."
      );
    } finally {
      setLoadingPassword(false);
    }
  }

  if (!usuarioActivo) {
    return <main className="page">No hay usuario autenticado.</main>;
  }

  return (
    <main className="page">
      <div className="section-title">
        <p className="label">Cuenta personal</p>
        <h2>Mi perfil</h2>
        <p>
          Consulta tu información de usuario y actualiza los datos permitidos de
          tu cuenta.
        </p>
      </div>

      {mensaje && <p className="success-message">{mensaje}</p>}
      {error && <p className="error-message">{error}</p>}

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Información de la cuenta</h3>

          <div className="profile-info-list">
            <div>
              <span>Nombre</span>
              <strong>{usuarioActivo.nombre}</strong>
            </div>

            <div>
              <span>Correo</span>
              <strong>{usuarioActivo.correo}</strong>
            </div>

            <div>
              <span>Rol</span>
              <strong>{usuarioActivo.rol}</strong>
            </div>

            <div>
              <span>Área</span>
              <strong>{usuarioActivo.area}</strong>
            </div>

            <div>
              <span>Cargo</span>
              <strong>{usuarioActivo.cargo || "Sin cargo registrado"}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{usuarioActivo.estado}</strong>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h3>Actualizar país</h3>

          <form className="profile-form" onSubmit={handleActualizarPerfil}>
            <div className="form-field full-field">
              <label>País</label>
              <input
                type="text"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loadingPerfil}>
              {loadingPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>

        <div className="profile-card full-profile-card">
          <h3>Cambiar contraseña</h3>

          <form className="profile-password-grid" onSubmit={handleCambiarPassword}>
            <div className="form-field">
              <label>Contraseña actual</label>
              <input
                type="password"
                name="password_actual"
                value={formPassword.password_actual}
                onChange={handleChangePassword}
                autoComplete="current-password"
              />
            </div>

            <div className="form-field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="password_nueva"
                value={formPassword.password_nueva}
                onChange={handleChangePassword}
                autoComplete="new-password"
              />
            </div>

            <div className="form-field">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirmar_password"
                value={formPassword.confirmar_password}
                onChange={handleChangePassword}
                autoComplete="new-password"
              />
            </div>

            <div className="profile-actions">
              <button type="submit" disabled={loadingPassword}>
                {loadingPassword ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default MiPerfil;