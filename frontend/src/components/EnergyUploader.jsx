import React, { useState } from "react";
import {
  CloudUpload,
  FileText,
  CheckCircle,
  Loader2,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function EnergyUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("factura", file);

    try {
      // Llamamos a tu Backend Python (que a su vez llama a Claude)
      const response = await fetch(
        "http://127.0.0.1:8000/energia/analizar-factura",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al analizar la factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 1. ZONA DE CARGA */}
      <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Sube tu Factura de Luz
          </h2>
          <p className="text-slate-500 mt-2">
            Nuestra IA leerá el PDF, extraerá tu consumo y buscará la mejor
            tarifa.
          </p>
        </div>

        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-10 hover:bg-slate-50 transition-colors group cursor-pointer">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {!file ? (
            <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
              <p className="font-medium text-lg">Arrastra tu factura aquí</p>
              <p className="text-sm mt-1">o haz clic para buscar</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-blue-600 font-bold text-lg">
              <FileText size={24} />
              {file.name}
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full mt-8 py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all shadow-lg
            ${
              !file || loading
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-1"
            }`}
        >
          {loading ? (
            <>
              <Loader2 size={24} className="animate-spin" /> Analizando con
              IA...
            </>
          ) : (
            <>
              Analizar y Comparar <Zap size={20} fill="currentColor" />
            </>
          )}
        </button>
      </div>

      {/* 2. RESULTADOS (Solo se muestra si hay datos) */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          {/* Resumen de Datos Extraídos */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-full text-green-400">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Análisis Completado</h3>
                <p className="text-slate-400 text-sm">
                  Datos extraídos de tu factura
                </p>
              </div>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Consumo
                </p>
                <p className="text-2xl font-mono font-bold">
                  {result.consumo} <span className="text-sm">kWh</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Potencia
                </p>
                <p className="text-2xl font-mono font-bold">
                  {result.potencia} <span className="text-sm">kW</span>
                </p>
              </div>
            </div>
          </div>

          {/* Comparativa de Ofertas */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              Mejores Tarifas para ti
            </h3>
            <div className="space-y-4">
              {result.ofertas.map((oferta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                      {oferta.nombre}
                    </h4>
                    <p className="text-slate-500">{oferta.compania}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-bold text-xl">
                      {oferta.ahorro}
                    </p>
                    <p className="text-xs text-slate-400">Ahorro estimado</p>
                  </div>
                  <button className="bg-slate-100 text-slate-600 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowRight size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
