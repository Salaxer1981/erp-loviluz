import React, { useState } from "react";
import {
  CloudUpload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function EnergyUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // Aquí guardaremos la respuesta de Azure

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null); // Limpiar resultados anteriores
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("factura", file); // 'factura' será el nombre clave para Python

    try {
      // Llamamos a nuestro Python, que hará de puente con Azure
      const response = await fetch(
        "http://127.0.0.1:8000/energia/analizar-factura",
        {
          method: "POST",
          body: formData, // No hace falta header Content-Type, el navegador lo pone solo
        }
      );

      const data = await response.json();
      setResult(data); // Aquí vendrá la comparativa de Dynamics
    } catch (error) {
      console.error("Error conectando con el servicio:", error);
      alert("Error al procesar la factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Sube la Factura Eléctrica
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Analizaremos los datos con Azure AI y buscaremos la mejor tarifa en
            Dynamics 365.
          </p>
        </div>

        {/* ZONA DE DROP (Simulada con input) */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors relative">
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {!file ? (
            <div className="text-slate-400">
              <p className="font-medium">Haz clic o arrastra el archivo aquí</p>
              <p className="text-xs mt-1">PDF, JPG o PNG</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
              <FileText size={20} />
              {file.name}
            </div>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full mt-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
            ${
              !file || loading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg"
            }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Procesando con
              IA...
            </>
          ) : (
            "Analizar y Comparar"
          )}
        </button>
      </div>

      {/* RESULTADOS (Simulación de lo que devolverá Dynamics) */}
      {result && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-green-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-4 text-green-700">
            <CheckCircle size={24} />
            <h3 className="font-bold text-lg">Análisis Completado</h3>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm">
            <p>
              <span className="font-bold text-slate-700">
                Consumo detectado:
              </span>{" "}
              {result.consumo} kWh
            </p>
            <p>
              <span className="font-bold text-slate-700">
                Potencia detectada:
              </span>{" "}
              {result.potencia} kW
            </p>
          </div>

          <h4 className="font-bold text-slate-800 mb-3">
            Mejores Tarifas Encontradas:
          </h4>
          <div className="space-y-3">
            {result.ofertas.map((oferta, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-900">{oferta.nombre}</p>
                  <p className="text-xs text-slate-500">{oferta.compania}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    {oferta.ahorro}
                  </p>
                  <p className="text-[10px] text-slate-400">Ahorro estimado</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
