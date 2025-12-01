import React, { useState } from "react";
import { Mail, Lock, Rocket } from "lucide-react"; // Añadí Rocket para tu marca

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isRegistering ? "/register" : "/login";

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userRole", data.role); // <--- GUARDAMOS EL ROL

        onLoginSuccess();
      } else {
        setError(data.detail || "Error de autenticación");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 relative">
        {/* CABECERA CON LOGO LOVILUZ */}
        <div className="bg-white p-8 text-center border-b border-slate-100">
          {/* Aquí cargamos el logo que pusiste en la carpeta public.
             Si no lo has puesto aún, se verá un texto alternativo.
          */}
          <img
            src="/logo.jpg"
            alt="Loviluz Logo"
            className="h-16 mx-auto mb-4 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }} // Si falla, se oculta
          />
          {/* Texto de respaldo por si no carga la imagen */}
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Gestión Energética Integral
          </p>
        </div>

        <div className="p-8 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">
            {isRegistering
              ? "Crear Cuenta Administrativa"
              : "Acceso a Plataforma"}
          </h3>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="usuario@loviluz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg mt-2"
            >
              {isRegistering ? "Registrar Usuario" : "Ingresar al Sistema"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegistering
                ? "Volver al Login"
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>

        {/* PIE DE PÁGINA - TU FIRMA DIGITAL */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
            Desarrollado por
            {/* Logo de Crazy Digital */}
            <img
              src="/crazy-logo.jpg"
              alt="Crazy Digital"
              className="h-12 object-contain mt-1 hover:opacity-80 transition-opacity"
            />
          </p>
        </div>
      </div>{" "}
      {/* Fin de la tarjeta blanca */}
      {/* Copyright (fuera de la tarjeta) */}
      <p className="text-slate-500 text-xs mt-8 z-10">
        © 2025 Loviluz Energía. Todos los derechos reservados.
      </p>
    </div>
  );
}
