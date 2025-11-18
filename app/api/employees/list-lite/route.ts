// Lista muy ligera de empleados: id, nombre
// app/api/employees/list-lite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, nombre:nombre_completo") // mapea a { id, nombre }
    .eq("activo", true)                   // si quieres solo activos
    .order("nombre_completo", { ascending: true });

  if (error) {
    console.error("EMP LIST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // normaliza: [{id, nombre}]
  const empleados = (data ?? []).map(r => ({ id: r.id, nombre: r.nombre }));
  return NextResponse.json({ empleados });
}
