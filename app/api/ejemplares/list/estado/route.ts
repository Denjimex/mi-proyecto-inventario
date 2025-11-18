// Cambia el estado_fisico de un ejemplar
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const { id, estado_fisico } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("ejemplares")
    .update({ estado_fisico })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
