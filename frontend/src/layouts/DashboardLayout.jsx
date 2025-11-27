import React from "react";
import {
  LayoutDashboard,
  Users,
  Zap,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

// CAMBIO CLAVE: Usamos 'props' en lugar de desestructurar
const SidebarItem = (props) => {
  // Sacamos el Icono manualmente a una variable con Mayúscula
  const Icon = props.Icon;
  const label = props.label;
  const active = props.active;
  const onClick = props.onClick;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 
      ${
        active
          ? "bg-slate-800 text-white shadow-md"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
      }`}
    >
      {/* Ahora el editor sabe exactamente de dónde viene Icon */}
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default function DashboardLayout({
  children,
  activeModule,
  setActiveModule,
  onLogout,
  currentUser,
}) {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        {/* 1. ZONA DEL LOGO (MÁS GRANDE) */}
        {/* Cambiamos h-16 por h-24 para darle más espacio vertical */}
        <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-slate-900">
          {/* Caja blanca más amplia */}
          <div className="bg-white px-4 py-3 rounded-xl w-full flex justify-center shadow-lg">
            <img
              src="/logo.jpg"
              alt="Loviluz"
              // Cambiamos h-6 por h-10 o h-12 para que crezca
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Principal
          </div>

          <SidebarItem
            Icon={LayoutDashboard}
            label="Dashboard"
            active={activeModule === "Dashboard"}
            onClick={() => setActiveModule("Dashboard")}
          />

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">
            Módulos
          </div>

          <SidebarItem
            Icon={Users}
            label="CRM & Clientes"
            active={activeModule === "CRM"}
            onClick={() => setActiveModule("CRM")}
          />
          <SidebarItem
            Icon={Zap}
            label="Energía & Tarifas"
            active={activeModule === "Energía"}
            onClick={() => setActiveModule("Energía")}
          />
          <SidebarItem
            Icon={FileText}
            label="Facturación"
            active={activeModule === "Facturación"}
            onClick={() => setActiveModule("Facturación")}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <SidebarItem Icon={Settings} label="Configuración" />

          {/* Botón de Salir */}
          <SidebarItem Icon={LogOut} label="Cerrar Sesión" onClick={onLogout} />

          {/* --- AQUÍ VA TU FIRMA (NUEVO) --- */}
          <div className="pt-6 pb-2 text-center opacity-40 hover:opacity-100 transition-opacity cursor-default">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
              Power by
            </p>
            <p className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-1">
              🚀 CRAZY DIGITAL
            </p>
          </div>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            {activeModule}
          </h2>

          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden md:block">
              {/* Usamos el email real aquí */}
              <p className="font-medium text-slate-900">Usuario Conectado</p>
              <p className="text-xs text-slate-500">{currentUser}</p>
            </div>

            {/* Círculo con la inicial del usuario */}
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full border border-blue-200 flex items-center justify-center font-bold text-lg">
              {currentUser ? currentUser.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
