"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  LayoutDashboard, Boxes, Shuffle, Users,
  Briefcase, Layers, School, LogOut
} from "lucide-react";

type Profile = {
  full_name: string | null;
  role: { nombre: string } | null;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // util para marcar link activo
  const isActive = (href: string) =>
    pathname === href ? "bg-gray-800 text-white" : "text-neutral-200";

  useEffect(() => {
    const supabase = createClient();

    // Si la sesión cambia a null, enviamos a /login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_evt: AuthChangeEvent, session: Session | null) => {
        if (!session) router.replace("/login");
      }
    );

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, role:roles(nombre)")
          .eq("id", user.id)
          .single<Profile>();

        if (error) setError("Error al cargar perfil");
        else setProfile(data);
      } catch {
        setError("Error de conexión con Supabase");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  const rol = profile?.role?.nombre ?? "sin rol";
  const isSuperUser = rol === "superusuario";

  return (
    <div className="h-screen w-64 bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">Inventario</h2>

        {loading ? (
          <div className="flex items-center text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Cargando perfil...
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-gray-400">
            Hola {profile?.full_name || "usuario"} •{" "}
            <span className="uppercase">{rol}</span>
          </p>
        )}
      </div>

      {/* Navegación */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-1 px-2">
          <li>
            <Link href="/dashboard"
              className={`flex items-center p-2 rounded ${isActive("/dashboard")}`}>
              <LayoutDashboard className="mr-3" />
              Dashboard
            </Link>
          </li>

          <li>
            <Link href="/productos"
              className={`flex items-center p-2 rounded ${isActive("/productos")}`}>
              <Boxes className="mr-3" />
              Productos
            </Link>
          </li>

          <li>
            <Link href="/movimientos"
              className={`flex items-center p-2 rounded ${isActive("/movimientos")}`}>
              <Shuffle className="mr-3" />
              Movimientos
            </Link>
          </li>

          {/* Ejemplo: solo superusuario ve Usuarios y Empleados */}
          {isSuperUser && (
            <>
              <li>
                <Link href="/usuarios"
                  className={`flex items-center p-2 rounded ${isActive("/usuarios")}`}>
                  <Users className="mr-3" />
                  Usuarios
                </Link>
              </li>
              <li>
                <Link href="/empleados"
                  className={`flex items-center p-2 rounded ${isActive("/empleados")}`}>
                  <Briefcase className="mr-3" />
                  Empleados
                </Link>
              </li>
            </>
          )}

          <li>
            <Link href="/categorias"
              className={`flex items-center p-2 rounded ${isActive("/categorias")}`}>
              <Layers className="mr-3" />
              Categorías
            </Link>
          </li>

          <li>
            <Link href="/aulas"
              className={`flex items-center p-2 rounded ${isActive("/aulas")}`}>
              <School className="mr-3" />
              Aulas
            </Link>
          </li>
        </ul>
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 hover:bg-red-600 rounded">
          <LogOut className="mr-3" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
