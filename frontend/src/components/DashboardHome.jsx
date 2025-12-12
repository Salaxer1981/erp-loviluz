import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckSquare,
  Plus,
  MoreHorizontal,
  Zap,
  FileText,
  Users,
  Sparkles,
  Shield,
  Timer,
  AlertTriangle,
} from "lucide-react";

const dataBarras = [
  { name: "Lun", altas: 4 },
  { name: "Mar", altas: 3 },
  { name: "Mié", altas: 2 },
  { name: "Jue", altas: 6 },
  { name: "Vie", altas: 8 },
];

const COLORS = ["#3b82f6", "#e2e8f0"];

export default function DashboardHome({ stats, setActiveModule }) {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Revisar facturas pendientes de Iberdrola", done: false },
    { id: 2, text: "Llamar al cliente Juan Pérez (Urgente)", done: true },
    { id: 3, text: "Actualizar tarifas de energía 2025", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const dataCircular = [
    { name: "Activos", value: stats.activos || 1 },
    { name: "Bajas", value: stats.inactivos || 0 },
  ];

  const userRole = localStorage.getItem("userRole") || "comercial";

  // DEFINICIÓN DE BOTONES CON EL NUEVO COLOR ROJO PARA FACTURAS
  const quickActions = [
    {
      label: "CRM",
      module: "CRM",
      icon: Users,
      color: "text-blue-400",
      bg: "group-hover:bg-blue-500/20",
      border: "group-hover:border-blue-500/50",
      roles: ["admin", "comercial", "backoffice"],
    },
    {
      label: "Energía",
      module: "Energía",
      icon: Zap,
      color: "text-yellow-400",
      bg: "group-hover:bg-yellow-500/20",
      border: "group-hover:border-yellow-500/50",
      roles: ["admin", "comercial", "backoffice"],
    },
    {
      label: "Renovaciones",
      module: "Renovaciones",
      icon: Timer,
      color: "text-orange-400",
      bg: "group-hover:bg-orange-500/20",
      border: "group-hover:border-orange-500/50",
      roles: ["admin", "comercial", "backoffice"],
      badge: stats.por_vencer || 0,
    },
    {
      label: "Facturas",
      module: "Facturación",
      icon: FileText,
      color: "text-red-400", // ROJO LOVILUZ
      bg: "group-hover:bg-red-500/20",
      border: "group-hover:border-red-500/50",
      roles: ["admin", "contabilidad", "backoffice"],
    },
    {
      label: "Asistente IA",
      module: "Asistente",
      icon: Sparkles,
      color: "text-pink-400",
      bg: "group-hover:bg-pink-500/20",
      border: "group-hover:border-pink-500/50",
      roles: ["admin", "comercial", "backoffice"],
    },
    {
      label: "Gobernanza",
      module: "Gobernanza",
      icon: Shield,
      color: "text-green-400",
      bg: "group-hover:bg-green-500/20",
      border: "group-hover:border-green-500/50",
      roles: ["admin"],
    },
  ];

  const allowedActions = quickActions.filter((action) =>
    action.roles.includes(userRole)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. KPIs (CON ROJO EN FACTURAS) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KpiCard
          title="Ingresos Totales"
          value={`${stats.total_dinero} €`}
          icon={FileText}
          color="text-green-600"
          bg="bg-green-50"
          trend="+12%"
        />
        <KpiCard
          title="Cartera Activa"
          value={stats.activos}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          trend="+5"
        />
        <KpiCard
          title="Altas Hoy"
          value={stats.nuevos_hoy}
          icon={Zap}
          color="text-yellow-600"
          bg="bg-yellow-50"
          trend="Nuevo"
        />
        <KpiCard
          title="Facturas Emitidas"
          value={stats.total_facturas}
          icon={FileText}
          color="text-red-600"
          bg="bg-red-50"
        />
        <KpiCard
          title="⚠️ Renovaciones"
          value={stats.por_vencer || 0}
          icon={Timer}
          color="text-orange-600"
          bg="bg-orange-50"
          trend="Próximos 45 días"
          onClick={() => setActiveModule("Renovaciones")}
          clickable={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. POWER BI WIDGET */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
              Power BI Analytics
            </h3>
            <button className="text-xs text-blue-600 font-medium hover:underline">
              Ver Reporte
            </button>
          </div>

          <div className="flex-1 min-h-[200px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dataCircular}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataCircular.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">
                {stats.activos}
              </span>
              <span className="text-xs text-slate-400 uppercase">
                Activos : {stats.total_clientes}
              </span>
            </div>
          </div>
        </div>

        {/* 3. GRÁFICO BARRAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Rendimiento Semanal</h3>
            <select className="text-xs border-none bg-slate-50 rounded-md p-1 text-slate-500 outline-none">
              <option>Últimos 7 días</option>
            </select>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarras}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="altas"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. TAREAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Lista de Tareas</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 group">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center transition-colors ${
                    task.done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 hover:border-blue-400"
                  }`}
                >
                  {task.done && <CheckSquare size={12} />}
                </button>
                <span
                  className={`text-sm ${
                    task.done ? "text-slate-400 line-through" : "text-slate-600"
                  }`}
                >
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. CENTRO DE MANDO (DISEÑO RADIAL CON ROJO LOVILUZ) */}
        <div className="relative p-8 rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-center shadow-2xl border border-slate-800 min-h-[400px]">
          {/* Fondo Radial con tonos Rojos */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>

          {/* NÚCLEO CENTRAL ILUMINADO */}
          <div className="relative z-20 flex flex-col items-center mb-8 text-center">
            <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.4)] backdrop-blur-md mb-3 animate-[pulse_3s_infinite]">
              <Zap
                size={32}
                className="text-yellow-300 fill-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
              />
            </div>
            <h3 className="font-bold text-2xl tracking-tight">
              Centro de Mando
            </h3>
            <p className="text-slate-400 text-xs">
              Sistema Operativo Energético
            </p>
          </div>

          {/* GRID RADIAL DE BOTONES */}
          <div className="relative z-10 flex flex-wrap justify-center gap-4 max-w-lg">
            {allowedActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveModule(action.module)}
                className={`
                    group relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl transition-all duration-300
                    bg-white/5 border border-white/10 hover:scale-105 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
                    backdrop-blur-sm
                    ${action.border}
                  `}
              >
                {/* Badge de contador si existe */}
                {action.badge && action.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse border-2 border-slate-950">
                    {action.badge}
                  </div>
                )}

                <div
                  className={`p-2 rounded-full mb-2 bg-slate-900/50 ${action.color} group-hover:scale-110 transition-transform`}
                >
                  <action.icon size={28} />
                </div>
                <span className="text-xs font-bold tracking-wide">
                  {action.label}
                </span>

                {/* Luz inferior del color del botón */}
                <div
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${action.color.replace(
                    "text-",
                    "bg-"
                  )}`}
                ></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  trend,
  onClick,
  clickable,
}) {
  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all ${
        clickable
          ? "cursor-pointer hover:scale-105 hover:border-orange-300"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {title}
          </p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
          {trend && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded mt-2 inline-block ${
                clickable
                  ? "text-orange-600 bg-orange-50"
                  : "text-green-600 bg-green-50"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
