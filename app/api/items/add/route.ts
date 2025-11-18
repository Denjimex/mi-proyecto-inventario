import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { producto, modelo, serie, estado, category_id, created_by } = await req.json();
    if (!producto) return NextResponse.json({ error: "producto requerido" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("items").insert({
      producto,
      modelo,
      serie,
      estado,
      category_id: category_id || null,
      created_by: created_by || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
