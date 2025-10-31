import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  producto_id: string;
  from_aula_id: number | null;              // grupo actual
  numeros: string;                           // "INV-001, INV-002, ..."
  to_aula_id: number | null;                 // destino (puede ser null)
  to_empleado_id: string | null;             // destino (puede ser null)
};

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      producto_id,
      from_aula_id,
      numeros,
      to_aula_id,
      to_empleado_id,
    } = (await req.json()) as Body;

    if (!producto_id) return NextResponse.json({ error: "Falta producto_id" }, { status: 400 });
    if (!numeros?.trim()) return NextResponse.json({ error: "Faltan números" }, { status: 400 });

    // Normaliza lista de números
    const lista = Array.from(
      new Set(
        numeros.split(",").map(s => s.trim()).filter(Boolean)
      )
    );
    if (lista.length === 0) {
      return NextResponse.json({ error: "Lista vacía" }, { status: 400 });
    }

    // 1) Localiza los ejemplares que pertenecen al grupo origen (producto + aula)
    const base = supabase
      .from("ejemplares")
      .select("id, num_inventario")
      .eq("producto_id", producto_id)
      .in("num_inventario", lista);

    // Manejo correcto de NULL en aula_id
    const { data: existentes, error: qErr } =
      from_aula_id === null
        ? await base.is("aula_id", null)
        : await base.eq("aula_id", from_aula_id);

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

    const existeSet = new Set((existentes ?? []).map(r => r.num_inventario));
    const notFound = lista.filter(n => !existeSet.has(n));
    const ids = (existentes ?? []).map(r => r.id);
    if (ids.length === 0) return NextResponse.json({ moved: 0, notFound });

    // 2) Actualiza aula y/o empleado. (No crea nada nuevo)
    const { error: upErr } = await supabase
      .from("ejemplares")
      .update({
        aula_id: to_aula_id === undefined ? undefined : to_aula_id,         // permite null
        empleado_id: to_empleado_id === undefined ? undefined : to_empleado_id, // permite null
      })
      .in("id", ids);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ moved: ids.length, notFound });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
