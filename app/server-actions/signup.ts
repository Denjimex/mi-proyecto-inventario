"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("❌ Error en signup:", error.message);
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  console.log("✅ Usuario creado:", data.user);
  console.log("🔑 Refresh token:", data.session?.refresh_token);

  return redirect("/dashboard");
}
