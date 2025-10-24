// app/api/items/delete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // tu helper server-side

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const supabase = await createClient();      // <-- si tu helper es async
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
