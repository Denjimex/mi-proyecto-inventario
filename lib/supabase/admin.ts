// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,       // misma URL de tu proyecto
  process.env.SUPABASE_SERVICE_ROLE_KEY!       // ⚠️ clave secreta de servicio
);
