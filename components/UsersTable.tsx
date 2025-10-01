"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type Role = {
  id: number;
  nombre: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar usuarios
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/list");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        console.error("Error cargando usuarios:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar roles
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles/list"); // ✅ corregido
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles);
      } else {
        console.error("Error cargando roles:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Eliminar usuario
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const data = await res.json();
        alert("Error eliminando: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cambiar rol
  const handleRoleChange = async (id: string, newRoleId: number) => {
    try {
      const res = await fetch("/api/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, roleId: newRoleId }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, role: roles.find((r) => r.id === newRoleId)?.nombre || u.role }
              : u
          )
        );
      } else {
        const data = await res.json();
        alert("Error actualizando rol: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-3">Usuarios</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="input"
                    value={roles.find((r) => r.nombre === u.role)?.id ?? ""} // ✅ más seguro
                    onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                  >
                    <option value="">— Selecciona —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="btn text-red-400 border-red-600 hover:bg-red-600/20"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
