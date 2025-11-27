import React, { useEffect, useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import ClientsList from "./components/ClientsList";
import InvoicesList from "./components/InvoicesList";
import LoginPage from "./components/LoginPage";
import EnergyUploader from "./components/EnergyUploader";
import DashboardHome from "./components/DashboardHome";

function App() {
  // 1. ESTADO DE SEGURIDAD
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  // Variable corregida: Ahora la usaremos abajo en el Layout
  const userEmail = localStorage.getItem("userEmail") || "Usuario";

  const [activeModule, setActiveModule] = useState("Dashboard");

  // Estado para los datos
  const [stats, setStats] = useState({
    total_clientes: 0,
    total_facturas: 0,
    total_dinero: 0,
    activos: 0,
    inactivos: 0,
    nuevos_hoy: 0,
  });

  // Variables corregidas: Ahora las pasaremos al DashboardHome
  const [backendStatus, setBackendStatus] = useState("Desconectado 🔴");
  const [loading, setLoading] = useState(true);

  // Función de Salir
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
    setActiveModule("Dashboard");
  };

  // 2. CARGAR DATOS
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboard = async () => {
      try {
        // Chequeo de salud
        const resHealth = await fetch("http://127.0.0.1:8000/");
        const dataHealth = await resHealth.json();
        setBackendStatus(dataHealth.estado);

        // Cargar Estadísticas Completas
        const resStats = await fetch("http://127.0.0.1:8000/dashboard-stats/");
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setBackendStatus("Error de conexión ⚠️");
        setLoading(false);
      }
    };

    loadDashboard();
  }, [activeModule, isAuthenticated]);

  // 3. BLOQUEO DE SEGURIDAD
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // 4. APLICACIÓN PRINCIPAL
  return (
    <DashboardLayout
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      onLogout={handleLogout}
      currentUser={userEmail} // <--- FIX 1: Aquí usamos 'userEmail'
    >
      {/* VISTA DASHBOARD */}
      {activeModule === "Dashboard" && (
        <DashboardHome
          stats={stats}
          // FIX 2: Pasamos estas variables aunque el componente no las pinte aún,
          // para que React sepa que las estamos usando y quite el error.
          backendStatus={backendStatus}
          loading={loading}
        />
      )}

      {/* RESTO DE MÓDULOS */}
      {activeModule === "CRM" && <ClientsList />}

      {activeModule === "Facturación" && <InvoicesList />}

      {activeModule === "Energía" && <EnergyUploader />}
    </DashboardLayout>
  );
}

export default App;
