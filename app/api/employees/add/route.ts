import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { nombre_completo, alias, email, telefono, area, activo } = await req.json();

  const { error } = await supabase.from("employees").insert([
    {
      nombre_completo,
      alias,
      email,
      telefono,
      area,
      activo,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
