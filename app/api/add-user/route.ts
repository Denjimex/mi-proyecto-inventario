import { NextResponse } from "next/server";
import { getApiSupabase } from "@/lib/supabase/api";   // 👈 cliente para API routes
import { supabaseAdmin } from "@/lib/supabase/admin"; // 👈 usamos el admin para crear users

export async function POST(req: Request) {
  try {
    const supabase = await getApiSupabase();
    const { nombre, email, password, rol } = await req.json();

    // 1. Crear usuario en Supabase Auth con Service Role (más seguro)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 👈 opcional: lo marca como confirmado
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "No se pudo crear usuario" }, { status: 400 });
    }

    // 2. Insertar en profiles con rol
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: nombre,
      role_id: rol, // 👈 guardamos el role_id que recibimos
    });

    if (profileError) {
      console.error("Error insertando en profiles:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error("Error en add-user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
