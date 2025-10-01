"use client";

import { useEffect, useState } from "react";
import AddEmployeeForm from "@/components/AddEmployeeForm";
import EmployeesTable from "@/components/EmployeesTable";

type Empleado = {
  id: string;
  alias: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  area: string;
  activo: boolean;
};

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // 🔹 Obtener empleados
  async function fetchEmpleados() {
    const res = await fetch("/api/employees/list");
    const data = await res.json();
    setEmpleados(data.employees || []);
  }

  useEffect(() => {
    fetchEmpleados();
  }, []);

  // 🔹 Añadir empleado
  async function handleAddEmpleado() {
    await fetchEmpleados(); // refresca tabla después de añadir
  }

  // 🔹 Eliminar empleado
  async function handleDeleteEmpleado(id: string) {
    const res = await fetch("/api/employees/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchEmpleados();
  }

  // 🔹 Actualizar empleado
  async function handleUpdateEmpleado(emp: Empleado) {
    const res = await fetch("/api/employees/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp),
    });
    if (res.ok) fetchEmpleados();
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Gestión de Empleados</h1>

      {/* Formulario con callback */}
      <AddEmployeeForm onAdd={handleAddEmpleado} />

      {/* Tabla con props */}
      <EmployeesTable
        empleados={empleados}
        onDelete={handleDeleteEmpleado}
        onUpdate={handleUpdateEmpleado}
      />
    </main>
  );
}
