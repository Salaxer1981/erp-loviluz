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
  ArrowUpRight,
} from "lucide-react";

// Datos simulados para el gráfico de barras (hasta que tengamos histórico real)
const dataBarras = [
  { name: "Lun", altas: 4 },
  { name: "Mar", altas: 3 },
  { name: "Mié", altas: 2 },
  { name: "Jue", altas: 6 },
  { name: "Vie", altas: 8 }, // Digamos que hoy es viernes y hubo movimiento
];

// Colores estilo Power BI
const COLORS = ["#3b82f6", "#e2e8f0"]; // Azul eléctrico y Gris suave

export default function DashboardHome({ stats }) {
  // Estado para la Lista de Tareas (Frontend temporal)
  const [tasks, setTasks] = useState([
    { id: 1, text: "Revisar facturas pendientes de Iberdrola", done: false },
    { id: 2, text: "Llamar al cliente Juan Pérez (Urgente)", done: true },
    { id: 3, text: "Actualizar tarifas de energía 2025", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // Datos para el gráfico circular (Power BI Style)
  const dataCircular = [
    { name: "Activos", value: stats.activos || 1 }, // Evitar 0 para que no se rompa el gráfico
    { name: "Bajas", value: stats.inactivos || 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. SECCIÓN DE TARJETAS SUPERIORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. POWER BI WIDGET (Círculo) */}
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
            {/* Texto Central del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">
                {stats.activos}
              </span>
              <span className="text-xs text-slate-400 uppercase">Activos</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Distribución de Cartera
          </p>
        </div>

        {/* 3. GRÁFICO DE BARRAS (Estadísticas de Altas) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Rendimiento Semanal</h3>
            <select className="text-xs border-none bg-slate-50 rounded-md p-1 text-slate-500 outline-none">
              <option>Últimos 7 días</option>
              <option>Este mes</option>
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

      {/* 4. LISTA DE TAREAS & ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tareas */}
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
                  className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center transition-colors
                    ${
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
                <button className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Módulos (Accesos Rápidos) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Acceso Rápido</h3>
            <p className="text-slate-400 text-sm mb-6">
              Gestiona tus módulos principales
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors group">
                <Users
                  className="mb-2 text-blue-400 group-hover:scale-110 transition-transform"
                  size={20}
                />
                <span className="text-xs font-bold">CRM</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors group">
                <Zap
                  className="mb-2 text-yellow-400 group-hover:scale-110 transition-transform"
                  size={20}
                />
                <span className="text-xs font-bold">Energía</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors group">
                <FileText
                  className="mb-2 text-purple-400 group-hover:scale-110 transition-transform"
                  size={20}
                />
                <span className="text-xs font-bold">Facturas</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors group">
                <ArrowUpRight
                  className="mb-2 text-green-400 group-hover:scale-110 transition-transform"
                  size={20}
                />
                <span className="text-xs font-bold">Reportes</span>
              </button>
            </div>
          </div>

          {/* Decoración de fondo */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente para las tarjetas pequeñas de arriba
function KpiCard({ title, value, icon: Icon, color, bg, trend }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {title}
          </p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
          {trend && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded mt-2 inline-block">
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
