// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  can,
  DEFAULT_HOME,
  normalizeRole,
  resourceFromPath,
  apiResourceFromPath,
  permFor,
  type Role,
} from "@/lib/supabase/permissions";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 1) Supabase server client con cookies (necesario para getUser() en middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const url = req.nextUrl.clone();
  const path = url.pathname;

  // 2) Páginas públicas de auth: no pedimos sesión
  const isAuthPage = path.startsWith("/login");
  const isApiAuth = path.startsWith("/api/auth");
  if (isAuthPage || isApiAuth) return res;

  // 3) Leemos sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Sin sesión → redirigir a /login para páginas (API devuelve 401)
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 4) Obtenemos rol desde profiles -> roles.nombre (o profiles.role_id si lo usas así)
  //    Ajusta el select a tu esquema actual.
  // middleware.ts (fragmento)
const { data: p } = await supabase
  .from("profiles")
  .select(`
    id,
    role_id,
    role:roles(nombre)
  `)
  .eq("id", user.id)
  .single();

const rel: any = p?.role; // Supabase a veces trae objeto o array
const roleName: string | null =
  Array.isArray(rel) ? rel[0]?.nombre ?? null : rel?.nombre ?? null;

const role: Role | null = normalizeRole(roleName);


  // 5) Construimos recurso y permiso
  const isApi = path.startsWith("/api/");
  const resource = isApi ? apiResourceFromPath(path) : resourceFromPath(path);
  // si no reconocemos el recurso, dejamos pasar (no bloqueamos cosas como /_next/…)
  if (!resource) return res;

  const perm = permFor(req.method, resource, !isApi);
  const allowed = can(role, perm);

  // 6) Cabeceras de debug (las puedes mirar en el Network panel)
  res.headers.set("x-rbac-role", String(role));
  res.headers.set("x-rbac-resource", resource);
  res.headers.set("x-rbac-perm", perm);
  res.headers.set("x-rbac-allowed", String(!!allowed));

  if (allowed) return res;

  // 7) Denegado
  if (isApi) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: res.headers });
  }
  // Página → redirigir a home por rol
  const home = (role && DEFAULT_HOME[role]) || "/dashboard";
  url.pathname = home;
  return NextResponse.redirect(url);
}

// No filtra /api/auth, ni assets internos:
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
