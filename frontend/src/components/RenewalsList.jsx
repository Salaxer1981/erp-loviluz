import React, { useEffect, useState } from "react";
import {
  Timer,
  Phone,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function RenewalsList() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRenovaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/renovaciones/pendientes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setContratos(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRenovaciones();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Escaneando cartera...
      </div>
    );

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[600px]">
      {/* Fondo de Alerta Suave */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* CABECERA */}
      <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500 border border-orange-500/30">
            <Timer size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Próximos Vencimientos
            </h2>
            <p className="text-xs text-slate-400">
              Contratos que caducan en &lt; 45 días
            </p>
          </div>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="text-white font-bold text-lg mr-1">
            {contratos.length}
          </span>{" "}
          en riesgo
        </div>
      </div>

      {/* LISTA DE URGENCIA */}
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Suministro</th>
              <th className="px-6 py-4">Compañía</th>
              <th className="px-6 py-4">Vence el</th>
              <th className="px-6 py-4 text-right">Urgencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contratos.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 font-medium text-slate-200">
                  {c.cliente}
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 group-hover:text-blue-400 cursor-pointer">
                    <Phone size={10} /> {c.telefono || "Sin teléfono"}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{c.cups}</td>
                <td className="px-6 py-4">{c.comercializadora}</td>
                <td className="px-6 py-4 text-white font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    {c.fecha_fin}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {c.dias_restantes <= 15 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 animate-pulse">
                      <AlertTriangle size={12} /> {c.dias_restantes} días
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
                      {c.dias_restantes} días
                    </span>
                  )}
                </td>

                {/* Botón de Acción Rápida (Oculto, aparece en hover) */}
                <td className="w-10 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                    title="Renovar"
                  >
                    <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contratos.length === 0 && (
          <div className="p-16 text-center flex flex-col items-center text-slate-600">
            <CheckCircle size={48} className="mb-4 text-green-500/20" />
            <p className="text-green-400/50">
              ¡Todo en orden! No hay vencimientos próximos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
