// app/api/movimientos/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);

  const rawQ     = (url.searchParams.get("q") || "").trim();
  const tipo     = url.searchParams.get("tipo");       // 'alta' | 'cambio' | 'baja'
  const desdeStr = url.searchParams.get("desde");      // 'YYYY-MM-DD'
  const hastaStr = url.searchParams.get("hasta");      // 'YYYY-MM-DD'
  const limit    = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const page     = Math.max(Number(url.searchParams.get("page")  || 1), 1);
  const from     = (page - 1) * limit;
  const to       = from + limit - 1;

  // Evitar que el .or(...) se rompa con comas o comodines
  const q = rawQ.replace(/[%_]/g, "").replace(/,/g, " ");

  let qry = supabase
    .from("movimientos_feed")
    .select("*", { count: "exact" })
    .order("fecha_movimiento", { ascending: false })
    .range(from, to);

  if (q) {
    qry = qry.or(
      [
        `producto.ilike.%${q}%`,
        `num_inventario.ilike.%${q}%`,
        `serie.ilike.%${q}%`,
        `empleado.ilike.%${q}%`,
        `descripcion.ilike.%${q}%`,
        `aula.ilike.%${q}%`,
        `usuario.ilike.%${q}%`,
      ].join(",")
    );
  }

  if (tipo && ["alta", "cambio", "baja"].includes(tipo)) {
    qry = qry.eq("tipo", tipo);
  }

  // Ventana de fechas inclusiva por día
  if (desdeStr) qry = qry.gte("fecha_movimiento", `${desdeStr} 00:00:00`);
  if (hastaStr) qry = qry.lte("fecha_movimiento", `${hastaStr} 23:59:59`);

  const { data, error, count } = await qry;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    page,
    limit,
    total: count ?? 0,
    items: data ?? [],
  });
}
