import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const producto_id = searchParams.get("producto_id");
  const aula_raw = searchParams.get("aula_id"); // "null" | "12"...

  if (!producto_id) {
    return NextResponse.json({ error: "producto_id requerido" }, { status: 400 });
  }

  const aula_id = aula_raw === "null" ? null : Number(aula_raw);
  const supabase = await createClient();

  let q = supabase
  .from("ejemplares")
  .select(`
    id,
    num_inventario,
    serie,
    estado_fisico,
    estatus,
    descripcion,
    empleado:employees (
      id,
      alias,
      nombre_completo
    )
  `)
  .eq("producto_id", producto_id);


  if (aula_id === null) {
    q = q.is("aula_id", null);
  } else {
    q = q.eq("aula_id", aula_id);
  }

  const { data, error } = await q.order("num_inventario", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ejemplares: data ?? [] });
}
