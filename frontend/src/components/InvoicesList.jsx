import React, { useEffect, useState } from "react";
import {
  FileText,
  DollarSign,
  X,
  Download,
  CheckSquare,
  Square,
  Plus,
} from "lucide-react";
import api from "../api/api";

export default function InvoicesList() {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    concepto: "",
    monto: "",
    cliente_id: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resFacturas, resClientes] = await Promise.all([
          api.get("/facturas/"),
          api.get("/clientes/"),
        ]);
        setFacturas(resFacturas.data);
        setClientes(resClientes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadData();
  }, [reloadKey]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id))
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleDownloadSepa = async () => {
    if (selectedIds.length === 0)
      return alert("Selecciona al menos una factura");
    try {
      const response = await api.post("/facturas/generar-remesa", selectedIds, {
        responseType: "blob",
      });
      if (response.status === 200) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Remesa_SEPA_${new Date().toISOString().slice(0, 10)}.xml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        alert("¡Archivo SEPA generado!");
        setSelectedIds([]);
      } else {
        alert("Error generando SEPA.");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id),
      };
      const res = await api.post("/facturas/", payload);
      if (res.status === 200 || res.status === 201) {
        setIsModalOpen(false);
        setReloadKey((p) => p + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Cargando sistema financiero...
      </div>
    );

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[600px]">
      {/* Fondo Decorativo ROJO */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestión de Facturación
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {selectedIds.length} documentos seleccionados
          </p>
        </div>

        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDownloadSepa}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              <Download size={16} /> Generar Remesa XML
            </button>
          )}

          {/* Botón Nueva Factura ROJO */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Factura
          </button>
        </div>
      </div>

      <div className="relative z-10 divide-y divide-white/5">
        {facturas.map((factura) => (
          // Selección en ROJO
          <div
            key={factura.id}
            className={`p-5 flex items-center justify-between hover:bg-white/5 transition-colors group ${
              selectedIds.includes(factura.id) ? "bg-red-500/10" : ""
            }`}
          >
            <div className="flex items-center gap-5">
              <button
                onClick={() => toggleSelect(factura.id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                {selectedIds.includes(factura.id) ? (
                  <CheckSquare size={22} className="text-red-500" />
                ) : (
                  <Square size={22} />
                )}
              </button>

              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-red-500/30 transition-colors">
                <FileText size={24} className="text-red-400" />
              </div>
              <div>
                <p className="font-bold text-slate-200">{factura.concepto}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID Cliente: {factura.cliente_id}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-2">
              <p className="font-bold text-white text-lg tracking-tight">
                {factura.monto} €
              </p>
              <div className="flex gap-3 items-center">
                <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full font-bold uppercase tracking-wider">
                  {factura.estado}
                </span>
                <a
                  href={`http://127.0.0.1:8000/facturas/${factura.id}/pdf`}
                  target="_blank"
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <Download size={12} /> PDF
                </a>
              </div>
            </div>
          </div>
        ))}

        {facturas.length === 0 && (
          <div className="p-12 text-center text-slate-600">
            No hay facturas registradas.
          </div>
        )}
      </div>

      {/* MODAL DARK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-2xl shadow-2xl border border-slate-800 m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Emitir Factura</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-500 hover:text-white" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Cliente
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_id: e.target.value })
                  }
                >
                  <option>Seleccionar...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Concepto
                </label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Ej: Consultoría"
                  onChange={(e) =>
                    setFormData({ ...formData, concepto: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Importe
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-9 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="0.00"
                    onChange={(e) =>
                      setFormData({ ...formData, monto: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-700 rounded-xl text-slate-300 hover:bg-white/5 font-bold text-sm"
                >
                  Cancelar
                </button>
                {/* Botón Emitir ROJO */}
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 font-bold text-sm shadow-lg shadow-red-900/20"
                >
                  Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
