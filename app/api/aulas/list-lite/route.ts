// Lista muy ligera de aulas: id, nombre
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aulas")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ aulas: data ?? [] });
}
