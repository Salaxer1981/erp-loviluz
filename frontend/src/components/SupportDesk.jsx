import React, { useEffect, useState, useRef } from "react";
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Send,
  Plus,
  X,
  Search,
  Lock,
} from "lucide-react";
import api from "../api/api";

export default function SupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]); // Para el desplegable de crear ticket
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false); // Nota interna

  // Modal Nuevo Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    asunto: "",
    descripcion: "",
    prioridad: "Media",
    cliente_id: "",
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Cargar Tickets Iniciales
    const fetchTickets = async () => {
      try {
        const res = await api.get("/tickets/");
        setTickets(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    // Cargar Clientes (para poder abrir ticket a alguien)
    const fetchClients = async () => {
      const res = await api.get("/clientes/");
      setClients(res.data);
    };

    fetchTickets();
    fetchClients();
  }, []);

  // Cargar Mensajes al seleccionar un ticket
  useEffect(() => {
    if (selectedTicket) {
      api
        .get(`/tickets/${selectedTicket.id}/mensajes`)
        .then((res) => setMessages(res.data));
    }
  }, [selectedTicket]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar Mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await api.post("/tickets/mensaje", {
      texto: newMessage,
      es_interno: isInternal,
      ticket_id: selectedTicket.id,
      autor: "Agente", // Aquí podrías poner el nombre del usuario logueado
    });

    // Recargar mensajes
    const res = await api.get(`/tickets/${selectedTicket.id}/mensajes`);
    setMessages(res.data);
    setNewMessage("");
  };

  // Crear Ticket Nuevo
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    await api.post("/tickets/", {
      ...newTicket,
      cliente_id: parseInt(newTicket.cliente_id),
    });
    setIsModalOpen(false);
    // Recargar tickets
    const res = await api.get("/tickets/");
    setTickets(res.data);
    alert("Ticket creado correctamente");
  };

  // Cambiar Estado
  const changeStatus = async (status) => {
    await api.put(`/tickets/${selectedTicket.id}/estado?estado=${status}`);
    const updated = { ...selectedTicket, estado: status };
    setSelectedTicket(updated);
    // Actualizar lista general
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* --- COLUMNA IZQUIERDA: LISTA DE TICKETS --- */}
      <div className="w-1/3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm flex justify-between items-center">
          <h2 className="text-white font-bold flex items-center gap-2">
            <LifeBuoy className="text-blue-400" /> Soporte
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/5 ${
                selectedTicket?.id === t.id
                  ? "bg-blue-900/20 border-blue-500/50"
                  : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.prioridad === "Urgente"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {t.prioridad}
                </span>
                <span className="text-slate-500 text-xs">
                  {new Date(t.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-slate-200 font-bold text-sm truncate">
                {t.asunto}
              </h4>
              <p className="text-slate-400 text-xs truncate mt-1">
                ID Cliente: {t.cliente_id}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: CHAT Y DETALLES --- */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl relative">
        {selectedTicket ? (
          <>
            {/* Header del Chat */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedTicket.asunto}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span
                    className={`flex items-center gap-1 ${
                      selectedTicket.estado === "Resuelto"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {selectedTicket.estado === "Resuelto" ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Clock size={12} />
                    )}{" "}
                    {selectedTicket.estado}
                  </span>
                  <span>• Ticket #{selectedTicket.id}</span>
                </div>
              </div>

              {/* Acciones de Estado */}
              <div className="flex gap-2">
                <button
                  onClick={() => changeStatus("En Proceso")}
                  className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20"
                >
                  En Proceso
                </button>
                <button
                  onClick={() => changeStatus("Resuelto")}
                  className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20"
                >
                  Resolver
                </button>
              </div>
            </div>

            {/* Área de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50 custom-scrollbar">
              {/* Descripción inicial */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
                <p className="text-xs text-slate-500 uppercase mb-2">
                  Descripción del problema
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedTicket.descripcion}
                </p>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.es_interno
                      ? "items-center"
                      : m.autor === "Agente"
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {m.es_interno && (
                    <span className="text-[10px] text-yellow-500/70 mb-1 flex items-center gap-1">
                      <Lock size={8} /> NOTA INTERNA
                    </span>
                  )}

                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      m.es_interno
                        ? "bg-yellow-900/20 border border-yellow-700/30 text-yellow-200"
                        : m.autor === "Agente"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                    }`}
                  >
                    {m.texto}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1">
                    {new Date(m.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-slate-950 border-t border-slate-800"
            >
              <div className="flex gap-2 items-center mb-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-yellow-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 accent-yellow-500"
                  />
                  <Lock size={12} /> Nota Interna (Solo equipo)
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  className={`flex-1 bg-slate-900 border ${
                    isInternal
                      ? "border-yellow-700/50 focus:border-yellow-500"
                      : "border-slate-700 focus:border-blue-500"
                  } rounded-xl px-4 py-3 text-white outline-none transition-all`}
                  placeholder={
                    isInternal
                      ? "Escribir nota interna..."
                      : "Escribir respuesta al cliente..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className={`p-3 rounded-xl text-white transition-colors ${
                    isInternal
                      ? "bg-yellow-600 hover:bg-yellow-500"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Selecciona un ticket para ver la conversación</p>
          </div>
        )}
      </div>

      {/* --- MODAL NUEVO TICKET --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Nueva Incidencia</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-500 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Cliente Afectado
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, cliente_id: e.target.value })
                  }
                >
                  <option value="">Seleccionar...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Asunto
                </label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  placeholder="Ej: Error en factura marzo"
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, asunto: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Prioridad
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, prioridad: e.target.value })
                  }
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm h-32"
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, descripcion: e.target.value })
                  }
                />
              </div>
              <button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-500">
                Crear Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
