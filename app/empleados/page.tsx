// app/empleados/page.tsx
"use client";

import { useEffect, useState } from "react";
import AddEmployeeForm from "@/components/AddEmployeeForm";
import EmployeesTable from "@/components/EmployeesTable";
import ToggleSection from "@/components/ToggleSection";

import {
  EmployeeDB,
  EmployeeUI,
  EmployeeInput,
  normalizeEmployee,
} from "@/app/types/employee";

export default function EmpleadosPage() {
  const [rows, setRows] = useState<EmployeeUI[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/employees/list", { cache: "no-store" });
    const json = await res.json();
    const data = (json.data as EmployeeDB[] | undefined) ?? [];
    setRows(data.map(normalizeEmployee));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(emp: EmployeeInput) {
    const res = await fetch("/api/employees/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "No se pudo crear el empleado");
      return;
    }

    const { data } = await res.json(); // EmployeeDB o EmployeeDB[]
    const created = Array.isArray(data)
      ? data.map(normalizeEmployee)
      : [normalizeEmployee(data)];

    setRows((r) => [...r, ...created]);
  }

  async function handleUpdate(emp: EmployeeUI) {
    const res = await fetch("/api/employees/update", {
      method: "POST", // o PATCH
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "No se pudo actualizar");
      return;
    }

    setRows((r) => r.map((x) => (x.id === emp.id ? { ...emp } : x)));
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/employees/delete", {
      method: "POST", // o DELETE
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "No se pudo eliminar");
      return;
    }

    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <main className="p-10">Cargando…</main>;

  return (
    <main className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Empleados</h1>

      {/* Formulario colapsable */}
      <ToggleSection title="Añadir empleado" defaultOpen={false}>
        <AddEmployeeForm onAdd={handleAdd} />
      </ToggleSection>

      {/* Tabla */}
      <div className="card p-4">
        <EmployeesTable
          empleados={rows}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </div>
    </main>
  );
}
