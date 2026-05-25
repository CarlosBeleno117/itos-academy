import { createContext, useContext, useEffect, useReducer } from "react";
import api from "../api/api";

const AppContext = createContext();

function obtenerUsuarioGuardado() {
  try {
    const usuarioGuardado = localStorage.getItem("itos_usuarioActivo");

    if (!usuarioGuardado) {
      return null;
    }

    return JSON.parse(usuarioGuardado);
  } catch (error) {
    localStorage.removeItem("itos_usuarioActivo");
    return null;
  }
}

const initialState = {
  usuarioActivo: obtenerUsuarioGuardado(),
  usuarios: [],
  cursos: [],
  loading: false,
  error: "",
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_USUARIOS":
      return {
        ...state,
        usuarios: action.payload,
        loading: false,
      };

    case "SET_CURSOS":
      return {
        ...state,
        cursos: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "SET_USUARIO_ACTIVO":
      localStorage.setItem("itos_usuarioActivo", JSON.stringify(action.payload));

      return {
        ...state,
        usuarioActivo: action.payload,
        loading: false,
      };

    case "CERRAR_SESION":
      localStorage.removeItem("itos_usuarioActivo");

      return {
        ...state,
        usuarioActivo: null,
        usuarios: [],
        cursos: [],
        loading: false,
        error: "",
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function cargarUsuarios() {
      if (!state.usuarioActivo?.id) {
        dispatch({
          type: "SET_USUARIOS",
          payload: [],
        });

        return;
      }

      try {
        dispatch({
          type: "SET_LOADING",
          payload: true,
        });

        const response = await api.get("/usuarios");

        dispatch({
          type: "SET_USUARIOS",
          payload: response.data,
        });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "No fue posible cargar los usuarios.",
        });
      }
    }

    cargarUsuarios();
  }, [state.usuarioActivo?.id]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}