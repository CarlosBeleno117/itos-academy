import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Navbar({ puedeVerUsuarios, cerrarSesion }) {
  const { state } = useAppContext();
  const usuarioActivo = state.usuarioActivo;

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        ITOS Academy
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/cursos">Cursos</NavLink>
        <NavLink to="/avances">Avances</NavLink>
        <NavLink to="/mi-perfil">Mi perfil</NavLink>

        {puedeVerUsuarios && <NavLink to="/usuarios">Usuarios</NavLink>}
      </nav>

      {usuarioActivo && (
        <div className="user-info">
          <div className="user-session-text">
            <strong>{usuarioActivo.nombre}</strong>
            <small>
              {usuarioActivo.rol} · {usuarioActivo.area}
            </small>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;