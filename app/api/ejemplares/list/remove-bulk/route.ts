// app/api/ejemplares/list/remove-bulk/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Acepta comas, saltos de línea, tabs, punto y coma o barra vertical como separadores
    const lista = Array.from(
      new Set(
        numeros
          .split(/[,\n;\t| ]+/)
          .map(s => s.trim())
          .filter(Boolean)
      )
    );

    if (lista.length === 0) {
      return NextResponse.json({ error: "No hay números válidos" }, { status: 400 });
    }

    // Construye la query correctamente según aula_id
    let query = supabase
      .from("ejemplares")
      .select("id, num_inventario")
      .eq("producto_id", producto_id)
      .in("num_inventario", lista);

    if (aula_id === null) {
      query = query.is("aula_id", null);
    } else if (typeof aula_id === "number") {
      query = query.eq("aula_id", aula_id);
    } // si viene undefined, no filtramos por aula

    const { data: existentes, error: qErr } = await query;
    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 400 });
    }

    const existeSet = new Set((existentes ?? []).map(r => r.num_inventario));
    const notFound = lista.filter(n => !existeSet.has(n));
    const ids = (existentes ?? []).map(r => r.id);

    if (ids.length === 0) {
      // Nada que borrar, pero respondemos 200 con los no encontrados
      return NextResponse.json({ removidos: 0, notFound });
    }

    const { error: delErr } = await supabase
      .from("ejemplares")
      .delete()
      .in("id", ids);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ removidos: ids.length, notFound });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
