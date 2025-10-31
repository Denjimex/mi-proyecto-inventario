import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Agrupa por producto_id y aula_id
  const { data, error } = await supabase.rpc("ejemplares_summary_por_producto_aula");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Esperamos filas { producto_id, producto, aula_id, aula, cantidad, danados }
  return NextResponse.json({ groups: data ?? [] });
}
