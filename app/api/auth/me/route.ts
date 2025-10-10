import { NextResponse } from "next/server";
import { getUserAndRole } from "@/lib/supabase/auth"; // tu helper existente

export async function GET() {
  const { user, role } = await getUserAndRole();
  if (!user) return NextResponse.json({ user: null, role: null }, { status: 401 });
  return NextResponse.json({ role }); // "superusuario" | "admin" | "vista"
}
