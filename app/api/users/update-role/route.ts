import { NextResponse } from "next/server";
import { getApiSupabase } from "@/lib/supabase/api"; // 👈 usamos el helper para API routes

// Tipado para evitar problemas con el rol
type ProfileWithRole = {
  role_id: number;
  role: { nombre: string } | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await getApiSupabase(); // 👈 ya no usamos createClient()
    const { userId, roleId } = await req.json();

    // 1. Verificar usuario logueado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Consultar rol del usuario que hace la petición
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_id, role:roles(nombre)")
      .eq("id", user.id)
      .single<ProfileWithRole>();

    if (profileError) throw profileError;

    const rol = profile?.role?.nombre;

    // 3. Restringir a superusuario
    if (rol !== "superusuario") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 4. Actualizar rol del usuario objetivo
    const { error } = await supabase
      .from("profiles")
      .update({ role_id: roleId })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error en update-role:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
