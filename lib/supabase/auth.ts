// /app/lib/auth.ts
import type { Role } from "@/lib/supabase/permissions";
import { createClient } from "@/lib/supabase/server"; // tu helper del server

function normalizeRole(input: unknown): Role | null {
  if (!input) return null;

  if (typeof input === "number") {
    if (input === 1) return "superusuario";
    if (input === 2) return "admin";
    if (input === 3) return "vista";
    return null;
  }

  const s = String(input).toLowerCase();
  if (s.includes("super")) return "superusuario";
  if (s.includes("admin")) return "admin";
  if (s.includes("vista") || s.includes("view")) return "vista";
  return null;
}

export async function getUserAndRole() {
  // 👇 IMPORTANTE: await al crear el cliente
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as Role | null };

  // tu schema permite FK o valor directo
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role:roles(nombre)")
    .eq("id", user.id)
    .single();

  const roleRaw =
    profile?.role?.nombre ??  // si es FK (roles.nombre)
    profile?.role ??          // si guardas texto/num directo
    null;

  const role = normalizeRole(roleRaw);
  return { user, role };
}
