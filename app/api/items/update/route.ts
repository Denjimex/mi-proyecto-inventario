import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: Request) {
  try {
    const { id, producto, modelo, serie, estado, category_id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const payload: any = {};
    if (producto !== undefined) payload.producto = producto;
    if (modelo   !== undefined) payload.modelo   = modelo;
    if (serie    !== undefined) payload.serie    = serie;
    if (estado   !== undefined) payload.estado   = estado;
    if (category_id !== undefined) payload.category_id = category_id || null;

    const supabase = await createClient();
    const { error } = await supabase.from("items").update(payload).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
