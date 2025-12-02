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
} from "lucide-react";

// Componente Helper para Inputs
const Input = ({
  label,
  name,
  val,
  onChange,
  type = "text",
  className = "",
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
      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
    />
  </div>
);

export default function ClientsList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchClientes = () => {
    fetch("http://127.0.0.1:8000/clientes/")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Cliente
      const resCliente = await fetch("http://127.0.0.1:8000/clientes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          nif_cif: formData.nif_cif,
          persona_contacto: formData.persona_contacto,
          email: formData.email,
          telefono: formData.telefono,
          iban: formData.iban,
          tipo_cliente: "PYME",
        }),
      });
      if (!resCliente.ok) throw new Error("Error creando Cliente");
      const clienteCreado = await resCliente.json();

      // 2. CUPS
      const resCups = await fetch("http://127.0.0.1:8000/puntos-suministro/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cups: formData.cups,
          direccion: formData.direccion,
          codigo_postal: formData.codigo_postal,
          provincia: formData.provincia,
          tarifa_acceso: formData.tarifa_acceso,
          distribuidora: formData.distribuidora,
          cliente_id: clienteCreado.id,
        }),
      });
      if (!resCups.ok) throw new Error("Error creando CUPS");
      const cupsCreado = await resCups.json();

      // 3. Contrato
      const resContrato = await fetch("http://127.0.0.1:8000/contratos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          estado: "Activo",
        }),
      });

      if (resContrato.ok) {
        alert("✅ Alta completada con éxito");
        setIsModalOpen(false);
        setCurrentStep(1);
        setFormData({
          nombre: "",
          nif_cif: "",
          email: "",
          cups: "",
          p1: 0,
          p2: 0,
          p3: 0,
          p4: 0,
          p5: 0,
          p6: 0,
        });
        fetchClientes();
      }
    } catch (error) {
      alert("❌ Falló el proceso: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-slate-400 animate-pulse">
        Cargando cartera...
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Alta
        </button>
      </div>

      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Datos</th>
              <th className="px-6 py-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-400">
                    <User size={18} />
                  </div>
                  {cliente.nombre}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {cliente.empresa || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="flex items-center gap-1">
                      <Mail size={10} /> {cliente.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {cliente.telefono}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <CreditCard size={10} /> {cliente.iban || "Sin IBAN"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                    ACTIVO
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Alta de Suministro
                </h3>
                <p className="text-xs text-slate-400">
                  Paso {currentStep} de 3
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-500 hover:text-white" />
              </button>
            </div>

            <div className="h-1 w-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {currentStep === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-4">
                    Datos del Titular
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Razón Social / Nombre"
                      name="nombre"
                      val={formData.nombre}
                      onChange={handleChange}
                    />
                    <Input
                      label="NIF / CIF"
                      name="nif_cif"
                      val={formData.nif_cif}
                      onChange={handleChange}
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

              {currentStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-4">
                    Datos del Suministro
                  </h4>
                  <Input
                    label="Código CUPS"
                    name="cups"
                    val={formData.cups}
                    onChange={handleChange}
                    className="font-mono text-lg"
                  />
                  <Input
                    label="Dirección"
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
                    <Input
                      label="Provincia"
                      name="provincia"
                      val={formData.provincia}
                      onChange={handleChange}
                    />
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Tarifa
                      </label>
                      <select
                        name="tarifa_acceso"
                        value={formData.tarifa_acceso}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none"
                      >
                        <option>2.0TD</option>
                        <option>3.0TD</option>
                        <option>6.1TD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-green-400 font-bold uppercase text-xs tracking-wider mb-4">
                    Condiciones
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
                    <Input
                      type="date"
                      label="Fecha Inicio"
                      name="fecha_inicio"
                      val={formData.fecha_inicio}
                      onChange={handleChange}
                    />
                    <Input
                      type="date"
                      label="Fecha Fin"
                      name="fecha_fin"
                      val={formData.fecha_fin}
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
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-white/5 font-bold"
                >
                  Atrás
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
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
                  className="px-8 py-3 rounded-xl bg-green-600 text-white hover:bg-green-500 font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
                >
                  {isSubmitting ? "Guardando..." : "Finalizar Alta"}{" "}
                  <CheckCircle size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
