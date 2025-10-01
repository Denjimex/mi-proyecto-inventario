"use client";
import { useState } from "react";

type Employee = {
  id?: string;
  nombre_completo: string;
  alias: string;
  email: string;
  telefono: string;
  area: string;
  activo: boolean;
};

type Props = {
  onAdd: (emp: Employee) => void;
};

export default function AddEmployeeForm({ onAdd }: Props) {
  const [nombre, setNombre] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [area, setArea] = useState("");
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nuevo = {
      nombre_completo: nombre,
      alias,
      email,
      telefono,
      area,
      activo,
    };

    onAdd(nuevo); // 👈 dispara el callback hacia page.tsx
    setMensaje("✅ Empleado añadido");

    // Resetear campos
    setNombre("");
    setAlias("");
    setEmail("");
    setTelefono("");
    setArea("");
    setActivo(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-4 space-y-3 max-w-lg mx-auto"
    >
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

      <button type="submit" className="btn w-full">
        Guardar
      </button>
      {mensaje && <p className="text-sm">{mensaje}</p>}
    </form>
  );
}
