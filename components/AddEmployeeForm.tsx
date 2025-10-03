"use client";
import { useState } from "react";

export type NewEmployee = {
  nombre_completo: string;
  alias: string;
  email: string;
  telefono: string;
  area: string;
  activo: boolean;
};

type Props = {
  // El padre hace la llamada a la API y refresca/actualiza la lista.
  onAdd: (emp: NewEmployee) => Promise<void>;
};

export default function AddEmployeeForm({ onAdd }: Props) {
  const [nombre, setNombre] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [area, setArea] = useState("");
  const [activo, setActivo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const nuevo: NewEmployee = {
      nombre_completo: nombre.trim(),
      alias: alias.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      area: area.trim(),
      activo,
    };

    if (!nuevo.nombre_completo) {
      setErr("El nombre es obligatorio.");
      return;
    }

    try {
      setLoading(true);
      await onAdd(nuevo); // 👈 el padre hará la llamada a la API
      setMsg("✅ Empleado añadido");

      // Reset
      setNombre("");
      setAlias("");
      setEmail("");
      setTelefono("");
      setArea("");
      setActivo(true);
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar el empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold">Añadir Empleado</h2>

      <input
        className="input"
        placeholder="Nombre completo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="Alias"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      <input
        className="input"
        placeholder="Área"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
        />
        Activo
      </label>

      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar"}
      </button>

      {err && <p className="text-sm text-red-400">{err}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
    </form>
  );
}
