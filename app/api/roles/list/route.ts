import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  try {
    // 🔑 Inicializamos cliente con cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 📥 Consultar roles
    const { data: roles, error } = await supabase
      .from("roles")
      .select("id, nombre");

    if (error) throw error;

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error("Error en GET /api/roles/list:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
