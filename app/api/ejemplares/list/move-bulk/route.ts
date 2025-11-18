// app/api/ejemplares/list/move-bulk/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInv } from "@/utils/normalize";

type Body = {
  producto_id: string;

  // Origen (opcionales; si vienen undefined NO filtra)
  from_aula_id?: number | null;
  from_empleado_id?: string | null;

  // Destino (al menos uno definido; null = poner null)
  to_aula_id?: number | null;
  to_empleado_id?: string | null;

  // Números (admite comas, saltos de línea, tabs, ;, |, espacios)
  numeros: string;

  // Opcional: descripción para historizar (si luego insertas en movimientos)
  descripcion?: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      producto_id,
      from_aula_id,
      from_empleado_id,
      to_aula_id,
      to_empleado_id,
      numeros,
      // descripcion, // ← por si luego lo usas para historizar
    } = (await req.json()) as Body;

    if (!producto_id) {
      return NextResponse.json({ error: "Falta producto_id" }, { status: 400 });
    }
    if (!numeros || !numeros.trim()) {
      return NextResponse.json({ error: "Faltan números" }, { status: 400 });
    }
    if (typeof to_aula_id === "undefined" && typeof to_empleado_id === "undefined") {
      return NextResponse.json({ error: "Nada que mover: define aula o empleado destino" }, { status: 400 });
    }

    // 1) Parseo flexible + mantener tokens originales (para notFound legible)
    const rawList = numeros
      .split(/[,\n;\t| ]+/) // comas, saltos de línea, tabs, ;, |, espacios
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawList.length === 0) {
      return NextResponse.json({ error: "Lista de números vacía" }, { status: 400 });
    }

    // 2) Normalización consistente
    const normList = rawList.map((t) => normalizeInv(t));
    const uniqueNorm = Array.from(new Set(normList));

    // 3) Seleccionar ejemplares a mover por grupo (producto + filtros de origen), usando num_inventario_norm
    let sel = supabase
      .from("ejemplares")
      .select("id, num_inventario_norm")
      .eq("producto_id", producto_id)
      .in("num_inventario_norm", uniqueNorm);

    // Origen: aula
    if (typeof from_aula_id !== "undefined") {
      if (from_aula_id === null) sel = sel.is("aula_id", null);
      else sel = sel.eq("aula_id", from_aula_id);
    }
    // Origen: empleado
    if (typeof from_empleado_id !== "undefined") {
      if (from_empleado_id === null) sel = sel.is("empleado_id", null);
      else sel = sel.eq("empleado_id", from_empleado_id);
    }

    const { data: toMove, error: qErr } = await sel;
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

    // 4) Calcular notFound comparando por normalizado pero reportando el token original
    const foundNorm = new Set((toMove ?? []).map((r) => r.num_inventario_norm as string));
    const notFound = rawList.filter((raw, i) => !foundNorm.has(normList[i]));

    const ids = (toMove ?? []).map((r) => r.id);
    if (ids.length === 0) {
      return NextResponse.json({ moved: 0, notFound });
    }

    // 5) Construir patch de destino (solo actualiza lo que venga definido)
    const patch: Record<string, any> = {};
    if (typeof to_aula_id !== "undefined") patch.aula_id = to_aula_id;               // number | null
    if (typeof to_empleado_id !== "undefined") patch.empleado_id = to_empleado_id;   // string | null
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada que mover (patch vacío)" }, { status: 400 });
    }

    // 6) Actualizar por IDs (más seguro que por IN de strings)
    const { data: upd, error: uErr } = await supabase
      .from("ejemplares")
      .update(patch)
      .in("id", ids)
      .select("id");

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    // 7) (Opcional) Historizar aquí en 'movimientos' si quieres
    // const user = (await supabase.auth.getUser()).data.user;
    // await supabase.from("movimientos").insert(
    //   ids.map((id) => ({
    //     ejemplar_id: id,
    //     tipo_id: /* id del tipo 'Reubicación' */,
    //     descripcion: descripcion ?? "Reubicación masiva (move-bulk)",
    //     aula_id: typeof to_aula_id === "undefined" ? null : to_aula_id,
    //     empleado_id: typeof to_empleado_id === "undefined" ? null : to_empleado_id,
    //     usuario_id: user?.id ?? null,
    //   }))
    // );

    return NextResponse.json({ moved: upd?.length ?? 0, notFound });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
