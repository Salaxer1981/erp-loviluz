import React from "react";
import {
  LayoutDashboard,
  Users,
  Zap,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  Shield,
} from "lucide-react";

// --- COMPONENTE DE BOTÓN MEJORADO ---
const SidebarItem = (props) => {
  const Icon = props.Icon;
  const label = props.label;
  const active = props.active;
  const onClick = props.onClick;

  // Color de acento según la sección (para el efecto glow)
  // Si no se pasa color, usa azul por defecto
  const glowColor = props.glowColor || "blue";

  // Mapeo de colores para Tailwind (necesitamos clases completas para que PurgeCSS no las borre)
  const activeClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-l-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    yellow:
      "bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
    purple:
      "bg-purple-500/10 text-purple-400 border-l-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    pink: "bg-pink-500/10 text-pink-400 border-l-4 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
    green:
      "bg-green-500/10 text-green-400 border-l-4 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    slate: "bg-slate-700 text-white border-l-4 border-slate-500", // Default dashboard
  };

  const currentActiveStyle = activeClasses[glowColor] || activeClasses["slate"];

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center space-x-3 px-4 py-3 rounded-r-xl transition-all duration-300 group
        ${
          active
            ? currentActiveStyle
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-4 border-transparent hover:border-slate-600 hover:pl-5"
        }
      `}
    >
      <Icon
        size={20}
        className={`transition-transform duration-300 ${
          active ? "scale-110" : "group-hover:scale-110"
        }`}
      />
      <span className="font-medium tracking-wide text-sm">{label}</span>

      {/* Luz ambiental sutil al hacer hover */}
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
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
  const userRole = localStorage.getItem("userRole") || "comercial";

  const canView = (module) => {
    if (userRole === "admin") return true;
    const permissions = {
      comercial: ["Dashboard", "CRM", "Energía", "Asistente"],
      contabilidad: ["Dashboard", "Facturación"],
      backoffice: ["Dashboard", "CRM", "Energía", "Facturación", "Asistente"],
    };
    return permissions[userRole]?.includes(module);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* --- SIDEBAR REDISEÑADA --- */}
      <aside className="w-72 bg-[#0B1120] text-white flex flex-col shadow-2xl relative z-20">
        {/* Fondo sutil con degradado para dar profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#0B1120] to-black pointer-events-none"></div>

        {/* 1. ZONA DEL LOGO (Cristal) */}
        <div className="relative z-10 h-28 flex items-center justify-center px-6 border-b border-white/5">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-xl w-full flex justify-center group hover:bg-white/15 transition-all duration-500">
            <img
              src="/logo.jpg"
              alt="Loviluz"
              className="h-12 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* 2. MENÚ DE NAVEGACIÓN */}
        <nav className="relative z-10 flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">
            Principal
          </p>
          <SidebarItem
            Icon={LayoutDashboard}
            label="Dashboard"
            active={activeModule === "Dashboard"}
            onClick={() => setActiveModule("Dashboard")}
            glowColor="slate"
          />

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6">
            Operaciones
          </p>

          {canView("CRM") && (
            <SidebarItem
              Icon={Users}
              label="CRM & Clientes"
              active={activeModule === "CRM"}
              onClick={() => setActiveModule("CRM")}
              glowColor="blue"
            />
          )}

          {canView("Energía") && (
            <SidebarItem
              Icon={Zap}
              label="Energía & Tarifas"
              active={activeModule === "Energía"}
              onClick={() => setActiveModule("Energía")}
              glowColor="yellow"
            />
          )}

          {canView("Facturación") && (
            <SidebarItem
              Icon={FileText}
              label="Facturación"
              active={activeModule === "Facturación"}
              onClick={() => setActiveModule("Facturación")}
              glowColor="purple"
            />
          )}

          {canView("Asistente") && (
            <SidebarItem
              Icon={Sparkles}
              label="Asistente IA"
              active={activeModule === "Asistente"}
              onClick={() => setActiveModule("Asistente")}
              glowColor="pink"
            />
          )}
        </nav>

        {/* 3. PIE DE PÁGINA (Configuración + Firma) */}
        <div className="relative z-10 p-4 border-t border-white/5 bg-[#0B1120]/50 backdrop-blur-sm space-y-1">
          {userRole === "admin" && (
            <SidebarItem
              Icon={Shield}
              label="Gobernanza"
              active={activeModule === "Gobernanza"}
              onClick={() => setActiveModule("Gobernanza")}
              glowColor="green"
            />
          )}

          <SidebarItem Icon={Settings} label="Configuración" />
          <SidebarItem Icon={LogOut} label="Cerrar Sesión" onClick={onLogout} />

          {/* FIRMA CRAZY DIGITAL - ESTILO CRISTAL OSCURO */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center group cursor-default">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] mb-3 group-hover:text-slate-400 transition-colors">
              Powered by
            </p>
            <div className="bg-white/5 rounded-xl p-2 inline-block border border-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-300">
              <div className="flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <img
                  src="/crazy-logo.jpg"
                  alt="Crazy Digital"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-[10px] font-bold text-white tracking-wider">
                  CRAZY DIGITAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL (Igual que antes) --- */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {activeModule}
          </h2>

          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden md:block leading-tight">
              <p className="font-bold text-slate-900">{currentUser}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {userRole}
              </p>
            </div>

            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center font-bold text-xl border-2 border-white">
              {currentUser ? currentUser.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {/* Fondo decorativo sutil en el área principal */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>
          {children}
        </div>
      </main>
    </div>
  );
}
