import React, { useEffect, useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import ClientsList from "./components/ClientsList";
import InvoicesList from "./components/InvoicesList";
import LoginPage from "./components/LoginPage";
import EnergyUploader from "./components/EnergyUploader";
import DashboardHome from "./components/DashboardHome";
import AiAssistant from "./components/AiAssistant";
import GovernanceList from "./components/GovernanceList";

function App() {
  // 1. ESTADO DE SEGURIDAD
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

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

  const [backendStatus, setBackendStatus] = useState("Desconectado 🔴");
  const [loading, setLoading] = useState(true);

  // Función de Salir
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setActiveModule("Dashboard");
  };

  // 2. CARGAR DATOS
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboard = async () => {
      try {
        const resHealth = await fetch("http://127.0.0.1:8000/");
        const dataHealth = await resHealth.json();
        setBackendStatus(dataHealth.estado);

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
      currentUser={userEmail}
    >
      {/* VISTA DASHBOARD */}
      {activeModule === "Dashboard" && (
        <DashboardHome
          stats={stats}
          backendStatus={backendStatus}
          loading={loading}
          setActiveModule={setActiveModule}
        />
      )}

      {/* RESTO DE MÓDULOS */}
      {activeModule === "CRM" && <ClientsList />}

      {activeModule === "Facturación" && <InvoicesList />}

      {activeModule === "Energía" && <EnergyUploader />}

      {activeModule === "Gobernanza" && <GovernanceList />}

      {/* --- CORRECCIÓN: PÉGALO AQUÍ, ANTES DEL CIERRE --- */}
      {activeModule === "Asistente" && <AiAssistant />}
    </DashboardLayout>
  );
}

export default App;
