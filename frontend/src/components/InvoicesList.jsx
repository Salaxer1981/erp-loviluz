import React, { useEffect, useState } from "react";
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  X,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";

export default function InvoicesList() {
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // NUEVO: Estado para selección múltiple
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
          fetch("http://127.0.0.1:8000/facturas/"),
          fetch("http://127.0.0.1:8000/clientes/"),
        ]);
        setFacturas(await resFacturas.json());
        setClientes(await resClientes.json());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadData();
  }, [reloadKey]);

  // Manejar selección de checkboxes
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Función para descargar la Remesa SEPA
  const handleDownloadSepa = async () => {
    if (selectedIds.length === 0)
      return alert("Selecciona al menos una factura");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/facturas/generar-remesa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedIds),
        }
      );

      if (response.ok) {
        // Truco para descargar archivo desde respuesta blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Remesa_SEPA_${new Date().toISOString().slice(0, 10)}.xml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        alert("¡Archivo SEPA generado! Súbelo a tu banco.");
        setSelectedIds([]); // Limpiar selección
      } else {
        alert("Error: Asegúrate que los clientes tengan IBAN válido.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  // ... (La función handleSubmit es igual que antes, la omito para ahorrar espacio pero debe estar aquí) ...
  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (Lógica de crear factura igual que antes) ...
    // Asegúrate de copiarla o mantenerla del archivo anterior
    try {
      const payload = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id),
      };
      const res = await fetch("http://127.0.0.1:8000/facturas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setReloadKey((p) => p + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Facturación</h2>
          <p className="text-xs text-slate-500">
            {selectedIds.length} facturas seleccionadas para cobro
          </p>
        </div>

        <div className="flex gap-2">
          {/* BOTÓN SEPA (Solo aparece si seleccionas algo) */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDownloadSepa}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 animate-in fade-in"
            >
              <Download size={16} /> Generar Remesa XML
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText size={16} /> Nueva Factura
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {facturas.map((factura) => (
          <div
            key={factura.id}
            className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
              selectedIds.includes(factura.id) ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              {/* CHECKBOX DE SELECCIÓN */}
              <button
                onClick={() => toggleSelect(factura.id)}
                className="text-slate-400 hover:text-blue-600"
              >
                {selectedIds.includes(factura.id) ? (
                  <CheckSquare size={20} className="text-blue-600" />
                ) : (
                  <Square size={20} />
                )}
              </button>

              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{factura.concepto}</p>
                <p className="text-xs text-slate-500">
                  Cliente ID: {factura.cliente_id}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900 text-lg">
                {factura.monto} €
              </p>
              <div className="flex gap-2 justify-end mt-1">
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {factura.estado}
                </span>
                {/* Botón PDF Individual */}
                <a
                  href={`http://127.0.0.1:8000/facturas/${factura.id}/pdf`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download size={10} /> PDF
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ... (El MODAL DE CREAR FACTURA SIGUE IGUAL AQUÍ ABAJO) ... */}
      {/* Copia el mismo bloque del modal que tenías antes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-2xl m-4">
            <h3 className="mb-4 font-bold">Nueva Factura</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* (Mismos inputs que antes: Cliente, Concepto, Monto) */}
              <input
                className="w-full border p-2 rounded"
                placeholder="Monto"
                type="number"
                onChange={(e) =>
                  setFormData({ ...formData, monto: e.target.value })
                }
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Concepto"
                onChange={(e) =>
                  setFormData({ ...formData, concepto: e.target.value })
                }
              />
              <select
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setFormData({ ...formData, cliente_id: e.target.value })
                }
              >
                <option>Cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border p-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-2 rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
