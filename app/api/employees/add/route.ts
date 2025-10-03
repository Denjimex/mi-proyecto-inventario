import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json();
  const { nombre_completo, alias, email, telefono, area, activo = true } = body;

  const { data, error } = await supabaseAdmin
    .from("employees")
    .insert([{ nombre_completo, alias, email, telefono, area, activo }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 👇 usa la misma clave que espera la UI
  return NextResponse.json({ data }, { status: 200 });
}
