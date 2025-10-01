import { NextResponse } from "next/server";
import { getApiSupabase } from "@/lib/supabase/api"; // 👈 usamos el nuevo helper
import { supabaseAdmin } from "@/lib/supabase/admin";

// Tipado de perfil con rol
type ProfileWithRole = {
  role_id: number;
  role: { nombre: string } | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await getApiSupabase(); // 👈 ya no repetimos bloque
    const { userId } = await req.json(); // ⚠️ id del usuario a borrar viene en el body

    // 1. Verificar usuario logueado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Consultar su rol
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

    // 4. Borrar de profiles
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) throw profileDeleteError;

    // 5. Borrar de auth.users con Service Role Key
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error eliminando usuario:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
