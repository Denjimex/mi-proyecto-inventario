// app/usuarios/page.tsx
"use client";

import UsersTable from "@/components/UsersTable";
import AddUserForm from "@/components/AddUserForm";
import ToggleSection from "@/components/ToggleSection";

export default function UsuariosPage() {
  return (
    <main className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>

      {/* Formulario colapsable */}
      <ToggleSection title="Añadir usuario" defaultOpen={false}>
        <AddUserForm />
      </ToggleSection>

      {/* Tabla de usuarios */}
      <div className="card p-4">
        <UsersTable />
      </div>
    </main>
  );
}
