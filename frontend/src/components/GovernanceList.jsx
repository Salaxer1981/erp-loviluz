import React, { useEffect, useState } from "react";
import { Shield, User, X, Plus } from "lucide-react";

export default function GovernanceList() {
  const [users, setUsers] = useState([]);
  const currentUserRole = localStorage.getItem("userRole");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "comercial",
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/users/");
      setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId, newRole) => {
    if (currentUserRole !== "admin")
      return alert("Solo el Admin puede hacer esto.");
    await fetch(`http://127.0.0.1:8000/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (currentUserRole !== "admin") return;
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
        }),
      });
      if (res.ok) {
        alert("Usuario creado. Asígnale el rol correcto.");
        setIsModalOpen(false);
        setNewUser({ email: "", password: "", role: "comercial" });
        fetchUsers();
      } else {
        alert("Error: " + (await res.json()).detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Icono ROJO */}
          <div className="bg-red-100 p-2 rounded-lg text-red-700">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Gobernanza & Equipo
            </h2>
            <p className="text-xs text-slate-500">
              Gestiona accesos y permisos
            </p>
          </div>
        </div>
        {currentUserRole === "admin" && (
          // Botón ROJO
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
          >
            <Plus size={16} /> Crear Usuario
          </button>
        )}
      </div>

      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 uppercase font-semibold text-slate-500">
          <tr>
            <th className="px-6 py-4">Usuario</th>
            <th className="px-6 py-4">Rol Actual</th>
            <th className="px-6 py-4 text-right">Asignar Rol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-6 py-4 font-medium flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <User size={14} />
                </div>
                {u.email}
              </td>
              <td className="px-6 py-4">
                {/* Badge de Admin en ROJO */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold border 
                    ${
                      u.role === "admin"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : u.role === "contabilidad"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : u.role === "backoffice"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                >
                  {u.role.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {currentUserRole === "admin" ? (
                  <select
                    className="border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="admin">Admin (Total)</option>
                    <option value="comercial">Comercial</option>
                    <option value="contabilidad">Contabilidad</option>
                    <option value="backoffice">Backoffice</option>
                  </select>
                ) : (
                  <span className="text-xs text-slate-400">Sin permisos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Nuevo Empleado
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-400 hover:text-red-500" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">
                  Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">
                  Contraseña
                </label>
                <input
                  required
                  type="password"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>
              <button className="w-full bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700">
                Crear Usuario
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
