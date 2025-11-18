import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  producto_id: string;
  cantidad?: number;
  numeros?: string; // "A1, B2, C3"
  serie?: string | null;
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
  estatus: string;
  empleado_id?: string | null;
  aula_id?: number | null;
  descripcion?: string | null;
};

export async function POST(req: Request) {
  try {
    console.log("[API] /api/ejemplares/add HIT");
    const payload = (await req.json()) as Body;
    const supabase = await createClient();
    const toNull = (v: any) => (v === "null" ? null : v);

    const producto_id = payload.producto_id?.toString();
    if (!producto_id) return NextResponse.json({ error: "Falta producto_id" }, { status: 400 });

    const estado_fisico = payload.estado_fisico ?? "bueno";
    const estatus = payload.estatus ?? "activo";
    const empleado_id = toNull(payload.empleado_id ?? null) as string | null;
    const aula_id = payload.aula_id ?? null;
    const descripcion = toNull(payload.descripcion ?? null) as string | null;
    const serie = toNull(payload.serie ?? null) as string | null;

    let nums: string[] = [];
    if (payload.numeros) {
      nums = payload.numeros.split(",").map(s => s.trim()).filter(Boolean);
    }

    const cantidad = payload.cantidad ?? nums.length;
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
    }
    if (nums.length && nums.length !== cantidad) {
      return NextResponse.json(
        { error: `Cantidad (${cantidad}) no coincide con números (${nums.length}).` },
        { status: 400 }
      );
    }

    const uniques = Array.from(new Set(nums));
    if (uniques.length) {
      const { data: exist, error: qErr } = await supabase
        .from("ejemplares").select("num_inventario").in("num_inventario", uniques);
      if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

      const ya = new Set((exist ?? []).map(r => r.num_inventario));
      const repetidos = uniques.filter(n => ya.has(n));
      if (repetidos.length) {
        return NextResponse.json({ error: `Números ya existentes: ${repetidos.join(", ")}` }, { status: 409 });
      }
    }

    const rows =
      uniques.length
        ? uniques.map(n => ({
            producto_id, num_inventario: n, serie, estado_fisico, estatus,
            empleado_id, aula_id, descripcion,
          }))
        : Array.from({ length: cantidad }).map(() => ({
            producto_id, num_inventario: null, serie, estado_fisico, estatus,
            empleado_id, aula_id, descripcion,
          }));

    const { data, error } = await supabase.from("ejemplares").insert(rows).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // MOVIMIENTOS (sin fecha_inicio; usamos DEFAULT now() de fecha_movimiento)
    if (data && data.length) {
      const TIPO_ALTA = 1; // ajusta al id correcto
      const movs = data.map((r: { id: string }) => ({
        ejemplar_id: r.id,
        empleado_id: empleado_id || null,
        aula_id: aula_id ?? null,
        tipo_id: TIPO_ALTA,
        estado_fisico,
        descripcion: descripcion || null,
      }));
      const { error: movErr } = await supabase.from("movimientos").insert(movs);
      if (movErr) {
        console.error("Movimientos error:", movErr.message);
        // si quieres fallar la operación, descomenta:
        // return NextResponse.json({ error: movErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
