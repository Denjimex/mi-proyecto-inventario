// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // 1) cards
  const [{ data: totalProd }, { data: totalAulas }, { data: movHoy }] =
    await Promise.all([
      supabase.from("items").select("id", { count: "exact", head: true }),
      supabase.from("aulas").select("id", { count: "exact", head: true }),
      supabase
        .from("movimientos")
        .select("id", { count: "exact", head: true })
        .gte("fecha_movimiento", new Date().toISOString().slice(0, 10)),
    ]);

  // 2) vistas
  const { data: porAula } = await supabase
    .from("dashboard_por_aula")
    .select("*");

  const { data: general } = await supabase
    .from("dashboard_general")
    .select("*");

  // 3) ejemplares para PDFs detallados
const { data: ejemplares } = await supabase
  .from("dashboard_ejemplares_por_aula")
  .select("*");

return NextResponse.json({
  cards: {
    totalProductos: totalProd?.length ?? 0,
    totalAulas: totalAulas?.length ?? 0,
    movimientosHoy: movHoy?.length ?? 0,
  },
  porAula: porAula ?? [],
  general: general ?? [],
  ejemplares: ejemplares ?? [], // 👈 NUEVO
});

}
