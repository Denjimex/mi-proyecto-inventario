// app/api/ejemplares/list/remove-bulk/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInv } from "@/utils/normalize";

type Body = {
  producto_id: string;
  aula_id?: number | null;
  numeros: string; // "INV-001, INV-002" o con saltos de línea
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { producto_id, aula_id, numeros } = (await req.json()) as Body;

    if (!producto_id) {
      return NextResponse.json({ error: "Falta producto_id" }, { status: 400 });
    }
    if (!numeros || !numeros.trim()) {
      return NextResponse.json({ error: "Faltan números" }, { status: 400 });
    }

    // 1) Parseo flexible + lista original (para reportar notFound con lo que pegó el usuario)
    const rawList = numeros
      .split(/[,\n;\t| ]+/) // comas, saltos de línea, tabs, ;, |, espacios
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawList.length === 0) {
      return NextResponse.json({ error: "No hay números válidos" }, { status: 400 });
    }

    // 2) Normalización consistente con la BD
    const normList = rawList.map((t) => normalizeInv(t));
    const uniqueNorm = Array.from(new Set(normList));

    // 3) Buscar por grupo (producto+aula) y por num_inventario_norm
    let sel = supabase
      .from("ejemplares")
      .select("id, num_inventario_norm")
      .eq("producto_id", producto_id)
      .in("num_inventario_norm", uniqueNorm);

    if (aula_id === null) sel = sel.is("aula_id", null);
    else if (typeof aula_id === "number") sel = sel.eq("aula_id", aula_id);
    // si aula_id === undefined, no filtramos por aula

    const { data: existentes, error: qErr } = await sel;
    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 400 });
    }

    // 4) Calcular notFound comparando por normalizado pero devolviendo los tokens originales
    const foundNorm = new Set((existentes ?? []).map((r) => r.num_inventario_norm as string));
    const notFound = rawList.filter((raw, i) => !foundNorm.has(normList[i]));

    const ids = (existentes ?? []).map((r) => r.id);
    if (ids.length === 0) {
      return NextResponse.json({ removidos: 0, notFound });
    }

    // 5) Borrado por IDs (seguro)
    const { error: delErr } = await supabase.from("ejemplares").delete().in("id", ids);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ removidos: ids.length, notFound });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
