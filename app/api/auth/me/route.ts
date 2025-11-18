// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";   // helper de servidor
import { normalizeRole } from "@/lib/supabase/permissions";

export async function GET() {
  // 👇 tu helper devuelve una Promise, así que hace falta await
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ role: null }, { status: 200 });
  }

  // Ajusta el select a tu esquema. Si guardas role_id en profiles:
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role:roles(nombre)")
    .eq("id", user.id)
    .single();

  if (error) {
    // si quieres ver el error en dev:
    console.error("auth/me profiles error:", error);
    return NextResponse.json({ role: null }, { status: 200 });
  }

  const roleName: string | null = (profile as any)?.role?.nombre ?? null;
  const role = normalizeRole(roleName);

  return NextResponse.json({ role });  // "superusuario" | "admin" | "vista" | null
}
