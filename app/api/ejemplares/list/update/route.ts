// app/api/ejemplares/update/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { id, ...patch } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const allowed = ["producto_id","num_inventario","serie","estado_fisico","estatus","descripcion","aula_id","empleado_id"];
  const payload: any = {};
  for (const k of allowed) if (k in patch) payload[k] = patch[k];

  const { error } = await supabase.from("ejemplares").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
