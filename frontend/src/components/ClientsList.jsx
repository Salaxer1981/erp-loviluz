import React, { useEffect, useState } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  X,
  CreditCard,
  Plus,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle,
  Edit,
  Zap,
  UploadCloud,
  File as FileIcon,
} from "lucide-react";
import api from "../api/api";

// Componente Helper para Inputs
const Input = ({
  label,
  name,
  val,
  onChange,
  type = "text",
  className = "",
  error = "",
}) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={val}
      onChange={onChange}
      className={`w-full bg-slate-950 border ${
        error ? "border-red-500" : "border-slate-800"
      } rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all`}
    />
    {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
  </div>
);

export default function ClientsList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(""); // Para mostrar qué está haciendo

  // Archivos
  const [files, setFiles] = useState({ dni: null, factura: null });

  const [formData, setFormData] = useState({
    nombre: "",
    nif_cif: "",
    persona_contacto: "",
    email: "",
    telefono: "",
    iban: "",
    cups: "",
    direccion: "",
    codigo_postal: "",
    provincia: "",
    tarifa_acceso: "2.0TD",
    distribuidora: "",
    comercializadora: "",
    producto: "",
    fecha_inicio: "",
    fecha_fin: "",
    p1: 0,
    p2: 0,
    p3: 0,
    p4: 0,
    p5: 0,
    p6: 0,
  });

  const [errors, setErrors] = useState({});

  const fetchClientes = () => {
    api
      .get("/clientes/")
      .then((res) => {
        setClientes(res.data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const validateStep = () => {
    let newErrors = {};
    let isValid = true;
    if (currentStep === 1) {
      if (!formData.nif_cif) newErrors.nif_cif = "Requerido";
      if (!formData.nombre) newErrors.nombre = "Requerido";
    }
    if (currentStep === 2) {
      // Validación laxa para pruebas, en prod usar Regex real
      if (!formData.cups || formData.cups.length < 20) {
        newErrors.cups = "CUPS inválido (mín 20 chars)";
        isValid = false;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // --- FUNCIÓN PARA SUBIR ARCHIVO AL BACKEND ---
  const uploadFileToBackend = async (fileObject, tipo, clienteId) => {
    // 1. Subir el archivo físico (Endpoint que creamos antes /upload/)
    const data = new FormData();
    data.append("file", fileObject);

    const resUpload = await api.post("/upload/", data);
    const uploadData = resUpload.data;

    // 2. Registrar en base de datos (Tabla Documentos)
    const docPayload = {
      tipo: tipo,
      nombre_archivo: fileObject.name,
      url_archivo: uploadData.url || "ruta/simulada",
      cliente_id: clienteId,
    };

    await api.post("/documentos/", docPayload);
  };

  // --- PROCESO FINAL DE ALTA ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. CREAR CLIENTE
      setSubmitStatus("Registrando Cliente...");
      const resCliente = await api.post("/clientes/", {
        nombre: formData.nombre,
        nif_cif: formData.nif_cif,
        persona_contacto: formData.persona_contacto,
        email: formData.email,
        telefono: formData.telefono,
        iban: formData.iban,
      });
      if (resCliente.status !== 200 && resCliente.status !== 201)
        throw new Error("Error creando Cliente (¿NIF duplicado?)");
      const clienteCreado = resCliente.data;

      // 2. SUBIR DOCUMENTOS (En paralelo)
      setSubmitStatus("Subiendo Documentos...");
      if (files.dni)
        await uploadFileToBackend(files.dni, "DNI", clienteCreado.id);
      if (files.factura)
        await uploadFileToBackend(files.factura, "FACTURA", clienteCreado.id);

      // 3. CREAR CUPS
      setSubmitStatus("Registrando Suministro...");
      const resCups = await api.post("/puntos-suministro/", {
        cups: formData.cups,
        direccion: formData.direccion,
        codigo_postal: formData.codigo_postal,
        provincia: formData.provincia,
        tarifa_acceso: formData.tarifa_acceso,
        distribuidora: formData.distribuidora,
        cliente_id: clienteCreado.id,
      });
      const cupsCreado = resCups.data;

      // 4. CREAR CONTRATO
      setSubmitStatus("Generando Contrato...");
      const resContrato = await api.post("/contratos/", {
        punto_suministro_id: cupsCreado.id,
        comercializadora: formData.comercializadora,
        producto: formData.producto,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        p1: parseFloat(formData.p1),
        p2: parseFloat(formData.p2),
        p3: parseFloat(formData.p3),
        p4: parseFloat(formData.p4),
        p5: parseFloat(formData.p5),
        p6: parseFloat(formData.p6),
        estado: "Borrador",
      });
      const contratoCreado = resContrato.data;

      // 5. INICIAR ATR (Switching)
      setSubmitStatus("Solicitando ATR...");
      // Usamos el endpoint nuevo de Claude o el que definimos antes
      await api.post("/procesos-atr/", {
        tipo: "C1", // Alta
        codigo_solicitud: `SOL-${Date.now()}`, // Generamos un código temp
        estado_atr: "01-Solicitado",
        contrato_id: contratoCreado.id,
      });

      alert("✅ ALTA EXITOSA: Cliente, Contrato y ATR generados.");
      setIsModalOpen(false);
      setCurrentStep(1);
      fetchClientes();
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Cargando sistema...
      </div>
    );

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[600px]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Cartera de Clientes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión integral de suministros
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Alta
        </button>
      </div>

      {/* LISTA VISUAL */}
      <div className="relative z-10 p-4 grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
        {clientes.length === 0 && (
          <div className="text-slate-500 text-center p-10">
            No hay clientes.
          </div>
        )}
        {clientes.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                {c.nombre ? c.nombre.charAt(0) : "?"}
              </div>
              <div>
                <h4 className="font-bold text-slate-200">{c.nombre}</h4>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <FileText size={10} /> {c.nif_cif}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={10} /> {c.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                ACTIVO
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- WIZARD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Alta de Suministro
                </h3>
                <p className="text-xs text-slate-400">
                  Paso {currentStep} de 4:{" "}
                  {currentStep === 1
                    ? "Titular"
                    : currentStep === 2
                    ? "Suministro"
                    : currentStep === 3
                    ? "Contrato"
                    : "Documentación"}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-500 hover:text-white" />
              </button>
            </div>

            <div className="h-1 w-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* PASO 1 */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-4">
                    1. Datos del Titular
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Razón Social / Nombre"
                      name="nombre"
                      val={formData.nombre}
                      onChange={handleChange}
                      error={errors.nombre}
                    />
                    <Input
                      label="NIF / CIF"
                      name="nif_cif"
                      val={formData.nif_cif}
                      onChange={handleChange}
                      error={errors.nif_cif}
                    />
                    <Input
                      label="Email"
                      name="email"
                      val={formData.email}
                      onChange={handleChange}
                    />
                    <Input
                      label="Teléfono"
                      name="telefono"
                      val={formData.telefono}
                      onChange={handleChange}
                    />
                    <Input
                      label="IBAN (SEPA)"
                      name="iban"
                      val={formData.iban}
                      onChange={handleChange}
                      className="col-span-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2 */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-4">
                    2. Datos del Suministro
                  </h4>
                  <Input
                    label="Código CUPS (ES...)"
                    name="cups"
                    val={formData.cups}
                    onChange={handleChange}
                    error={errors.cups}
                    className="font-mono text-lg"
                  />
                  <Input
                    label="Dirección Suministro"
                    name="direccion"
                    val={formData.direccion}
                    onChange={handleChange}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="C. Postal"
                      name="codigo_postal"
                      val={formData.codigo_postal}
                      onChange={handleChange}
                    />
                    <div className="col-span-2">
                      <Input
                        label="Provincia"
                        name="provincia"
                        val={formData.provincia}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3 */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-green-400 font-bold uppercase text-xs tracking-wider mb-4">
                    3. Condiciones del Contrato
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Comercializadora"
                      name="comercializadora"
                      val={formData.comercializadora}
                      onChange={handleChange}
                    />
                    <Input
                      label="Producto"
                      name="producto"
                      val={formData.producto}
                      onChange={handleChange}
                    />
                  </div>
                  <h5 className="text-xs font-bold text-slate-500 mt-4 mb-2">
                    Potencias (kW)
                  </h5>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((p) => (
                      <div key={p}>
                        <label className="block text-[10px] text-slate-500 text-center mb-1">
                          P{p}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name={`p${p}`}
                          value={formData[`p${p}`]}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-white text-sm focus:border-green-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PASO 4 */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <h4 className="text-purple-400 font-bold uppercase text-xs tracking-wider mb-4">
                    4. Documentación Obligatoria
                  </h4>

                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 hover:bg-white/5 transition-colors text-center cursor-pointer relative group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) =>
                        setFiles({ ...files, dni: e.target.files[0] })
                      }
                    />
                    <div className="pointer-events-none">
                      <UploadCloud className="mx-auto text-slate-500 mb-2 group-hover:text-purple-400 transition-colors" />
                      <p className="text-sm text-slate-300 font-medium">
                        {files.dni ? files.dni.name : "Subir DNI / CIF"}
                      </p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 hover:bg-white/5 transition-colors text-center cursor-pointer relative group">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) =>
                        setFiles({ ...files, factura: e.target.files[0] })
                      }
                    />
                    <div className="pointer-events-none">
                      <FileIcon className="mx-auto text-slate-500 mb-2 group-hover:text-purple-400 transition-colors" />
                      <p className="text-sm text-slate-300 font-medium">
                        {files.factura
                          ? files.factura.name
                          : "Subir Factura Anterior"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-white/5 font-bold"
                >
                  Atrás
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold flex items-center gap-2"
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-green-600 text-white hover:bg-green-500 font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      {submitStatus || "Procesando..."}
                    </span>
                  ) : (
                    <>
                      Firmar y Activar <CheckCircle size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
