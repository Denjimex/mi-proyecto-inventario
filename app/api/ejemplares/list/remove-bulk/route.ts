// app/api/ejemplares/list/remove-bulk/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInv } from "@/utils/normalize";

type Body = {
  // OJO: si QUIERES filtrar por producto/aula, deja estos campos.
  // El RPC actual baja por número sin filtrar por producto/aula.
  producto_id?: string;
  aula_id?: number | null;
  numeros: string;           // "INV-001, INV-002", saltos de línea, etc.
  motivo?: string | null;    // descripción opcional que quieras guardar
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { numeros, motivo } = (await req.json()) as Body;

    if (!numeros || !numeros.trim()) {
      return NextResponse.json({ error: "Faltan números" }, { status: 400 });
    }

    // 1) Parseo flexible para limpiar la entrada del usuario
    const rawList = numeros
      .split(/[,\n;\t| ]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawList.length === 0) {
      return NextResponse.json({ error: "No hay números válidos" }, { status: 400 });
    }

    // 2) (Opcional) Normaliza del lado cliente; el RPC ya normaliza adentro.
    //    Puedes quitar esta parte si quieres.
    const normList = rawList.map((t) => normalizeInv(t));
    const uniqueNorm = Array.from(new Set(normList));

    // 3) Llamada al RPC de BAJA (soft delete). El trigger registrará el movimiento.
    //    p_desc es opcional: si mandas texto, se copia a 'descripcion' antes de poner deleted_at.
    const { data, error } = await supabase.rpc("ejemplares_baja_by_numbers", {
      p_nums: uniqueNorm,            // text[]
      p_desc: motivo ?? null,        // text | null
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 4) Armar respuesta parecida a la tuya
    //    El RPC devuelve filas: { num_inventario, bajado (bool), error (text|null) }
    const bajados = (data ?? []).filter((r: any) => r.bajado).length;
    const notFound = (data ?? [])
      .filter((r: any) => !r.bajado)
      .map((r: any) => r.num_inventario as string);

    return NextResponse.json({ removidos: bajados, notFound });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
