"use client";
import { useState } from "react";

type Employee = {
  id: string;
  nombre_completo: string;
  alias: string;
  email: string;
  telefono: string;
  area: string;
  activo: boolean;
};

type Props = {
  empleados: Employee[];
  onDelete: (id: string) => void;
  onUpdate: (emp: Employee) => void;
};

export default function EmployeesTable({ empleados, onDelete, onUpdate }: Props) {
  const [selected, setSelected] = useState<Employee | null>(null);

  const handleSave = () => {
    if (!selected) return;
    onUpdate(selected);
    setSelected(null);
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-3">Empleados</h2>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Alias</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Área</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((e) => (
            <tr key={e.id}>
              <td>{e.nombre_completo}</td>
              <td>{e.alias}</td>
              <td>{e.email}</td>
              <td>{e.telefono}</td>
              <td>{e.area}</td>
              <td>{e.activo ? "✅" : "❌"}</td>
              <td className="flex gap-2">
                <button
                  onClick={() => setSelected(e)}
                  className="btn btn-warning"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(e.id)}
                  className="btn text-red-400 border-red-600 hover:bg-red-600/20"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de edición */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded-xl shadow-lg w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">Editar empleado</h3>

            <input
              className="input"
              value={selected.nombre_completo}
              onChange={(e) => setSelected({ ...selected, nombre_completo: e.target.value })}
            />
            <input
              className="input"
              value={selected.alias}
              onChange={(e) => setSelected({ ...selected, alias: e.target.value })}
            />
            <input
              className="input"
              type="email"
              value={selected.email}
              onChange={(e) => setSelected({ ...selected, email: e.target.value })}
            />
            <input
              className="input"
              value={selected.telefono}
              onChange={(e) => setSelected({ ...selected, telefono: e.target.value })}
            />
            <input
              className="input"
              value={selected.area}
              onChange={(e) => setSelected({ ...selected, area: e.target.value })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.activo}
                onChange={(e) => setSelected({ ...selected, activo: e.target.checked })}
              />
              Activo
            </label>

            <div className="flex gap-2 justify-end">
              <button onClick={handleSave} className="btn btn-success">
                Guardar
              </button>
              <button
                onClick={() => setSelected(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
