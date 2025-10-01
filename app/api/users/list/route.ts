import { NextResponse } from "next/server";
import { getApiSupabase } from "@/lib/supabase/api"; // 👈 nuevo helper
import { supabaseAdmin } from "@/lib/supabase/admin";

type ProfileWithRole = {
  id: string;
  full_name: string | null;
  role: { nombre: string } | null;
};

export async function GET() {
  try {
    const supabase = await getApiSupabase(); // 👈 ya no repetimos el bloque

    // 1. Obtener usuario logueado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Obtener rol del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("role:roles(nombre)")
      .eq("id", user.id)
      .single<{ role: { nombre: string } | null }>();

    const rol = profile?.role?.nombre;

    // 3. Si no es superusuario → devolver solo profiles
    if (rol !== "superusuario") {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, role:roles(nombre)")
        .returns<ProfileWithRole[]>();

      if (error) throw error;

      const users = profiles.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        role: p.role?.nombre || "sin rol",
        email: "oculto",
      }));

      return NextResponse.json({ users });
    }

    // 4. Si es superusuario → también auth.admin
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role:roles(nombre)")
      .returns<ProfileWithRole[]>();

    if (error) throw error;

    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const users = profiles.map((p) => {
      const authUser = authUsers.users.find((u) => u.id === p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        role: p.role?.nombre || "sin rol",
        email: authUser?.email || "sin email",
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Error en GET /api/users/list:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
