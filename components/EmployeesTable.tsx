// components/EmployeesTable.tsx
"use client";

import { useState } from "react";
import type { EmployeeUI } from "@/app/types/employee";

type Props = {
  empleados: EmployeeUI[];
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (emp: EmployeeUI) => void | Promise<void>; // acepta sync o async
};

export default function EmployeesTable({ empleados, onDelete, onUpdate }: Props) {
  const [selected, setSelected] = useState<EmployeeUI | null>(null);

  const openEdit = (e: EmployeeUI) => {
    // hacemos copia por si el padre guarda la ref
    setSelected({ ...e });
  };

  const handleSave = async () => {
    if (!selected) return;
    await onUpdate(selected);
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
                <button onClick={() => openEdit(e)} className="btn btn-warning">
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
          {empleados.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-6 opacity-70">
                Sin empleados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal de edición */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null); // cerrar fuera
          }}
        >
          <div className="bg-neutral-900 p-6 rounded-xl shadow-lg w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">Editar empleado</h3>

            <input
              className="input"
              placeholder="Nombre completo"
              value={selected.nombre_completo ?? ""} // nunca null
              onChange={(e) =>
                setSelected({ ...selected, nombre_completo: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Alias"
              value={selected.alias ?? ""}
              onChange={(e) => setSelected({ ...selected, alias: e.target.value })}
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={selected.email ?? ""}
              onChange={(e) => setSelected({ ...selected, email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Teléfono"
              value={selected.telefono ?? ""}
              onChange={(e) =>
                setSelected({ ...selected, telefono: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Área"
              value={selected.area ?? ""}
              onChange={(e) => setSelected({ ...selected, area: e.target.value })}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!selected.activo}
                onChange={(e) => setSelected({ ...selected, activo: e.target.checked })}
              />
              Activo
            </label>

            <div className="flex gap-2 justify-end">
              <button onClick={handleSave} className="btn btn-success">
                Guardar
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
