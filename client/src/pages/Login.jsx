import { useState } from "react";
import api from "../api/api";
import { useAppContext } from "../context/AppContext";

function Login() {
  const { dispatch } = useAppContext();

  const [formLogin, setFormLogin] = useState({
    correo: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormLogin({
      ...formLogin,
      [name]: value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formLogin.correo || !formLogin.password) {
      setError("Debe ingresar correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/login", {
        correo: formLogin.correo.trim(),
        password: formLogin.password,
      });

        const usuario = response.data.usuario;

        dispatch({
        type: "SET_USUARIO_ACTIVO",
        payload: usuario,
        });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No fue posible iniciar sesión. Verifique sus credenciales."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <p className="label">ITOS Academy</p>
          <h1>Iniciar sesión</h1>
          <p>
            Ingresa con tu correo corporativo para acceder a tus cursos,
            avances y funcionalidades disponibles según tu rol.
          </p>
        </div>

        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field full-field">
            <label>Correo electrónico</label>
            <input
            type="email"
            name="correo"
            placeholder="correo@itos.com"
            value={formLogin.correo}
            onChange={handleChange}
            autoComplete="email"
            />
          </div>

          <div className="form-field full-field">
            <label>Contraseña</label>
            <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formLogin.password}
            onChange={handleChange}
            autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;