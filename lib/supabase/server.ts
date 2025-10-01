// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Crea un Supabase client para el LADO DEL SERVIDOR.
 * OJO: sólo LEE cookies (no set/remove). Las escrituras las hace el helper
 * de las route handlers (/api/auth/login|logout) automáticamente.
 */
export async function createClient() {
  // 👇 En Next 15, en algunos contextos cookies() es async → await
  const cookieStore = await cookies();

  return createServerClient(
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
}
