"use client";

import { useState, useEffect } from "react";

type Role = {
  id: number;
  nombre: string;
};

export default function AddUserForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<number | "">("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"success" | "error" | "">("");

  // Toast se oculta automáticamente
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje("");
        setTipoMensaje("");
      }, 4000); // 4s y desaparece
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Cargar roles
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles/list");
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles);
        if (data.roles.length > 0) {
          setRol(data.roles[0].id);
        }
      } else {
        console.error("Error cargando roles:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rol) {
      setMensaje("Debes seleccionar un rol");
      setTipoMensaje("error");
      return;
    }

    setLoading(true);
    setMensaje("");
    setTipoMensaje("");

    try {
      const res = await fetch("/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, rol }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("Usuario creado con éxito ✅");
        setTipoMensaje("success");
        setNombre("");
        setEmail("");
        setPassword("");
        setRol(roles.length > 0 ? roles[0].id : "");
      } else {
        setMensaje("Error: " + data.error);
        setTipoMensaje("error");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error en la petición");
      setTipoMensaje("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {mensaje && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white transition
          ${tipoMensaje === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {mensaje}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card p-4 space-y-3 max-w-lg mx-auto"
      >
        <h2 className="text-xl font-semibold">Añadir Usuario</h2>

        <div>
          <label className="label">Nombre completo</label>
          <input
            type="text"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Rol</label>
          <select
            className="input"
            value={rol}
            onChange={(e) => setRol(Number(e.target.value))}
            required
          >
            {roles.length === 0 && <option value="">Cargando roles...</option>}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? "Creando..." : "Guardar"}
        </button>
      </form>
    </>
  );
}
