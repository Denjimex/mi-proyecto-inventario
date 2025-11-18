// app/api/ejemplares/list/estado-bulk/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInv } from "@/utils/normalize";

type EstadoUI = "bueno" | "regular" | "malo" | "inutilizable" | "baja";

type Body = {
  numeros: string; // "A1, B2, C3"
  estado: EstadoUI;

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

    const estado = payload.estado;
    if (!estado) {
      return NextResponse.json(
        { error: "estado requerido" },
        { status: 400 }
      );
    }

    // 1) Lista original (para mostrar notFound con lo que pegó el usuario)
    const rawList = (payload.numeros ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawList.length === 0) {
      return NextResponse.json(
        { error: "Proporciona números de inventario" },
        { status: 400 }
      );
    }

    // 2) Normalización consistente con la BD (num_inventario_norm)
    const normList = rawList.map((t) => normalizeInv(t)); // misma longitud que rawList
    const uniqueNormList = Array.from(new Set(normList));

    // 3) Selección por grupo (producto + aula) y por num_inventario_norm
    let sel = supabase
      .from("ejemplares")
      .select("id, num_inventario_norm")
      .in("num_inventario_norm", uniqueNormList);

    if (payload.producto_id) sel = sel.eq("producto_id", payload.producto_id);
    if (payload.aula_id === null) sel = sel.is("aula_id", null);
    if (typeof payload.aula_id === "number")
      sel = sel.eq("aula_id", payload.aula_id);

    const { data: existentes, error: selErr } = await sel;
    if (selErr) {
      return NextResponse.json(
        { error: selErr.message },
        { status: 400 }
      );
    }

    // 4) Calcular notFound comparando por normalizado,
    //    pero devolviendo los tokens originales que no se encontraron
    const foundNormSet = new Set(
      (existentes ?? []).map((r) => r.num_inventario_norm as string)
    );
    const notFound = rawList.filter(
      (_raw, i) => !foundNormSet.has(normList[i])
    );

    if (!existentes || existentes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          updated: 0,
          notFound,
          message: "No se encontraron ejemplares con esos números",
        },
        { status: 404 }
      );
    }

    // 5) Build de updates según estado UI
    let updates: Record<string, any>;

    if (estado === "baja") {
      // Baja lógica (soft delete)
      updates = {
        estatus: "baja",
        deleted_at: new Date().toISOString(),
        // opcional: también podrías marcar fisicamente:
        // estado_fisico: "malo",
      };
    } else {
      // Estado físico normal
      updates = {
        estatus: "activo",
        deleted_at: null,
        estado_fisico: estado, // bueno / regular / malo / inutilizable
      };
    }

    // 6) Update por IDs (más seguro que por string)
    const ids = (existentes ?? []).map((r) => r.id);
    const { data: updated, error: updErr } = await supabase
      .from("ejemplares")
      .update(updates)
      .in("id", ids)
      .select("id");

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message },
        { status: 400 }
      );
    }

    // 7) (Opcional) Historizar en 'movimientos' cuando enciendas el módulo
    // const user = (await supabase.auth.getUser()).data.user;
    // await supabase.from("movimientos").insert(
    //   ids.map((id) => ({
    //     ejemplar_id: id,
    //     empleado_id: null,
    //     tipo_id: /* id del tipo 'Cambio de estado' */,
    //     descripcion: payload.descripcion ?? `Cambio masivo a ${estado}`,
    //     estado_fisico: estado === "baja" ? null : estado,
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
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
