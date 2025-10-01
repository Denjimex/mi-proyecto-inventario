// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InventoryTable from "@/components/InventoryTable";
import AddProductForm from "@/components/AddProductForm";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1) Usuario actual
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <main className="p-10">
        <p>
          No autenticado.{" "}
          <Link className="underline" href="/login">
            Ir a login
          </Link>
        </p>
      </main>
    );
  }

  // 2) Perfil / rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role:roles(nombre)")
    .eq("id", user.id)
    .single();

  const roleName =
    (profile as any)?.role?.nombre ??
    (profile as any)?.role ??
    "";

  const isAdmin = roleName === "admin" || roleName === "superusuario";

  // 3) Datos para UI
  const [{ data: aulas }, { data: items }, { data: existencias }] =
    await Promise.all([
      supabase.from("aulas").select("id, nombre").order("id"),
      supabase
        .from("items")
        .select("id, producto, modelo, serie, estado, created_at"),
      supabase
        .from("existencias")
        .select("id, item_id, aula_id, cantidad"),
    ]);

  return (
    <main className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-neutral-400">Total de productos</p>
          <p className="text-3xl font-semibold">{items?.length ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-400">Aulas</p>
          <p className="text-3xl font-semibold">{aulas?.length ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-400">Movimientos (hoy)</p>
          <p className="text-3xl font-semibold">—</p>
        </div>
      </div>

      {isAdmin && (
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Añadir producto</h3>
          {/* Opción 2: el form se autogestiona, sin props */}
          <AddProductForm />
        </div>
      )}

      <div className="card p-4">
        <InventoryTable
          aulas={aulas || []}
          items={items || []}
          existencias={existencias || []}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
