import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText,
} from "lucide-react";

export default function AtrOperations() {
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProcesos = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/procesos-atr/");
      if (res.ok) {
        const data = await res.json();
        setProcesos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesos();
  }, []);

  // Función para dar color al estado (Semáforo)
  const getStatusStyle = (estado) => {
    if (estado.includes("02") || estado.toLowerCase().includes("activad"))
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (estado.includes("03") || estado.toLowerCase().includes("rechaz"))
      return "bg-red-500/20 text-red-400 border-red-500/30";
    // Por defecto (01 - Solicitado)
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[600px]">
      {/* Fondo Decorativo Eléctrico */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* CABECERA */}
      <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400 border border-cyan-500/30">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Operaciones ATR
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seguimiento de Switching y Altas (SCTD)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchProcesos}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Refrescar"
          >
            <RefreshCw size={18} />
          </button>
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* TABLA DE OPERACIONES */}
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">ID Solicitud</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Cliente / CUPS</th>
              <th className="px-6 py-4">Fecha Solicitud</th>
              <th className="px-6 py-4 text-right">Estado Distribuidora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center animate-pulse">
                  Conectando con distribuidora...
                </td>
              </tr>
            ) : procesos.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-16 text-center">
                  <div className="flex flex-col items-center text-slate-600">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>No hay procesos de alta en curso.</p>
                  </div>
                </td>
              </tr>
            ) : (
              procesos.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                    {p.codigo}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded text-xs">
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-medium">
                        {p.cliente}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {p.cups}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(p.fecha).toLocaleDateString()}{" "}
                    <span className="text-slate-600">
                      {new Date(p.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit ml-auto ${getStatusStyle(
                        p.estado
                      )}`}
                    >
                      {/* Icono dinámico según estado */}
                      {p.estado.includes("01") && (
                        <Clock size={12} className="animate-pulse" />
                      )}
                      {p.estado.includes("02") && <CheckCircle size={12} />}
                      {p.estado.includes("03") && <XCircle size={12} />}
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
