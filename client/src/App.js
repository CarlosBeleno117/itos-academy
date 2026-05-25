import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { AppProvider, useAppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cursos from "./pages/Cursos";
import Usuarios from "./pages/Usuarios";
import Avances from "./pages/Avances";
import MiPerfil from "./pages/MiPerfil";
import "./App.css";

function AppContent() {
  const { state, dispatch } = useAppContext();

  const usuarioActivo = state.usuarioActivo;

  const puedeVerUsuarios =
    usuarioActivo?.rol === "Super Admin" || usuarioActivo?.rol === "Admin";

  function cerrarSesion() {
    dispatch({
      type: "CERRAR_SESION",
    });
  }

  if (!usuarioActivo) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Navbar
        puedeVerUsuarios={puedeVerUsuarios}
        cerrarSesion={cerrarSesion}
      />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/avances" element={<Avances />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />

        <Route
          path="/usuarios"
          element={puedeVerUsuarios ? <Usuarios /> : <Navigate to="/" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;