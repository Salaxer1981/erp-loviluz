import axios from "axios";

// La URL base de tu backend. Asegúrate de que apunte a tu servidor de FastAPI.
const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
});

// Interceptor: Añade el token de autenticación a TODAS las peticiones salientes
api.interceptors.request.use(
  (config) => {
    // Obtener el token del almacenamiento local
    const token = localStorage.getItem("token");

    // Si el token existe, lo adjuntamos al encabezado Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Petición a ${config.url} con token`);
    } else {
      console.warn(`[API] Petición a ${config.url} SIN token`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("[API] Error 401 Unauthorized:", error.config.url);
      // Aquí podrías redirigir al login si es necesario
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
