import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  numeros: string; // "A1, B2, C3"
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
  // Opcional: restringir al grupo abierto
  producto_id?: string;
  aula_id?: number | null;
  // Opcional: para historizar luego
  descripcion?: string | null;
};

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const payload = (await req.json()) as Body;

    const estado = payload.estado_fisico;
    if (!estado) {
      return NextResponse.json({ error: "estado_fisico requerido" }, { status: 400 });
    }

    // Normaliza lista de #inventario
    const rawNums = (payload.numeros ?? "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (rawNums.length === 0) {
      return NextResponse.json({ error: "Proporciona números de inventario" }, { status: 400 });
    }

    // Primero, obtener IDs que existen (y opcionalmente restringir por grupo)
    let sel = supabase
      .from("ejemplares")
      .select("id,num_inventario")
      .in("num_inventario", rawNums);

    if (payload.producto_id) sel = sel.eq("producto_id", payload.producto_id);
    if (payload.aula_id === null) sel = sel.is("aula_id", null);
    if (typeof payload.aula_id === "number") sel = sel.eq("aula_id", payload.aula_id);

    const { data: existentes, error: selErr } = await sel;
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 });

    const foundNums = new Set((existentes ?? []).map(r => r.num_inventario as string));
    const notFound = rawNums.filter(n => !foundNums.has(n));

    if (!existentes || existentes.length === 0) {
      return NextResponse.json(
        { ok: false, updated: 0, notFound, message: "No se encontraron ejemplares con esos números" },
        { status: 404 }
      );
    }

    // Actualiza por IDs encontrados (más seguro que por IN de strings)
    const ids = (existentes ?? []).map(r => r.id);
    const { data: updated, error: updErr } = await supabase
      .from("ejemplares")
      .update({ estado_fisico: estado })
      .in("id", ids)
      .select("id");
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    // (Opcional) Historizar en 'movimientos' si ya tienes ese módulo listo:
    // const user = (await supabase.auth.getUser()).data.user;
    // await supabase.from("movimientos").insert(
    //   ids.map(id => ({
    //     ejemplar_id: id,
    //     empleado_id: null,
    //     tipo_id:  /* id del tipo 'Reporte daño' o similar */,
    //     descripcion: payload.descripcion ?? `Cambio masivo a ${estado}`,
    //     estado_fisico: estado,
    //     aula_id: payload.aula_id ?? null,
    //     usuario_id: user?.id ?? null,
    //   }))
    // );

    return NextResponse.json({
      ok: true,
      updated: updated?.length ?? 0,
      notFound,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
