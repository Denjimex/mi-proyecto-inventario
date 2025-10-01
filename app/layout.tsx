import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inventario | Supabase + Next.js",
  description: "Sistema de inventario simple con roles admin/visor",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es">
      <body className="flex bg-neutral-950 text-neutral-100">
        {/* ✅ Sidebar solo si hay sesión */}
        {user ? <Sidebar /> : null}

        {/* ✅ Contenido principal */}
        <main className="flex-1 p-6 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
