// app/api/ejemplares/devolver/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { id, dano } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const payload: any = {
    empleado_id: null,
    aula_id: null,            // o a la “Bodega”, si tienes aula_id específico
  };
  if (dano === true) {
    payload.estado_fisico = "malo";
    payload.estatus = "inactivo";
  } else {
    payload.estatus = "inactivo";
  }

  const { error } = await supabase.from("ejemplares").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
