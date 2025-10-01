import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient(); // <- aquí ya con await
  const { data: { user } } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
