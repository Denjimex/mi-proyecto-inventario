// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import PermissionsProvider from "@/components/permisions/PermissionsProvider";
import { normalizeRole, type Role } from "@/lib/supabase/permissions";

export const metadata: Metadata = {
  title: "Inventario | Supabase + Next.js",
  description: "Sistema de inventario simple con roles admin/visor",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 IMPORTANTE: esperar el cliente del server
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles:roles(nombre)")
      .eq("id", user.id)
      .single();

    const roleName = (profile as any)?.roles?.nombre ?? null;
    role = normalizeRole(roleName);
  }

  return (
    <html lang="es">
      <body className="flex bg-neutral-950 text-neutral-100">
        {/* Sidebar solo si hay sesión */}
        {user ? <Sidebar /> : null}

        {/* RBAC para el front con rol inicial desde el server */}
        <main className="flex-1 p-6 min-h-screen">
          <PermissionsProvider initialRole={role}>
            {children}
          </PermissionsProvider>
        </main>
      </body>
    </html>
  );
}
