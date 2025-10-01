import UsersTable from "@/components/UsersTable";
import AddUserForm from "@/components/AddUserForm";

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>
      <AddUserForm />
      <UsersTable />
    </div>
  );
}
