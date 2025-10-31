// app/api/ejemplares/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ejemplares")
    .select(`
      id, num_inventario, serie, estado_fisico, estatus, descripcion, fecha_registro,
      aula:aulas(id,nombre),
      producto:items(id,producto,modelo)
    `)
    .order("fecha_registro", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ejemplares: data ?? [] });
}
