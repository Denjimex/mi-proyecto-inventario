import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ✅ Cliente para API Routes
export async function getApiSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {}, // no escribimos cookies en API routes
        remove() {}, // tampoco borramos aquí
      },
    }
  );
}
