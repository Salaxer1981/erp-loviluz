import React, { useEffect, useState } from "react";
import { User, Building2, Mail, Phone, X, CreditCard } from "lucide-react";

export default function ClientsList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. AÑADIMOS 'iban' AL ESTADO INICIAL
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    iban: "",
  });

  const fetchClientes = () => {
    fetch("http://127.0.0.1:8000/clientes/")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error:", err));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/clientes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          nombre: "",
          empresa: "",
          email: "",
          telefono: "",
          iban: "",
        });
        fetchClientes();
        alert("¡Cliente creado con éxito!");
      } else {
        alert("Error al crear cliente. Revisa los datos.");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* CABECERA */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">
          Cartera de Clientes
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* TABLA DE CLIENTES */}
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
          <tr>
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Empresa</th>
            <th className="px-6 py-4">Contacto</th>
            <th className="px-6 py-4">Datos Bancarios</th> {/* Nueva Columna */}
            <th className="px-6 py-4">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clientes.map((cliente) => (
            <tr
              key={cliente.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                {cliente.nombre}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-400" />
                  {cliente.empresa}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} /> {cliente.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone size={12} /> {cliente.telefono}
                  </div>
                </div>
              </td>

              {/* 2. MOSTRAR IBAN EN LA TABLA */}
              <td className="px-6 py-4">
                {cliente.iban ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                    <CreditCard size={12} /> {cliente.iban}
                  </div>
                ) : (
                  <span className="text-xs text-orange-400">Falta IBAN</span>
                )}
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    cliente.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {cliente.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  name="empresa"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Iberdrola SA"
                  value={formData.empresa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="600 000 000"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* 3. CAMPO IBAN NUEVO */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  IBAN (Domiciliación)
                </label>
                <input
                  type="text"
                  name="iban"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  value={formData.iban}
                  onChange={handleInputChange}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Necesario para remesas SEPA.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
