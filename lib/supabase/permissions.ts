// lib/supabase/permissions.ts
export type Role = "superusuario" | "admin" | "vista";

/**
 * Acciones base:
 * - :view   -> acceso a la página
 * - :read   -> GET en APIs
 * - :create -> POST
 * - :update -> PUT/PATCH
 * - :delete -> DELETE
 *
 * Aliases:
 * - :crud   -> create/read/update/delete
 * - :manage -> view + crud
 */

const MATRIX: Record<Role, string[]> = {
  superusuario: ["*"],

  admin: [
    // Dashboard
    "dashboard:view",

    // Productos / Categorías / Aulas / Empleados / Movimientos
    "productos:manage", "categorias:manage", "aulas:manage",
    "empleados:manage", "movimientos:manage",

    // Extras de negocio (si los usas)
    "productos:ajustar", "productos:importar", "productos:exportar",
    "movimientos:aprobar",

    // ⚠️ Sin permisos de usuarios.* (reservado a superusuario)
    // Nada de "usuarios:view/read/create/update/delete/cambiar-rol"
  ],

  vista: [
    // Solo auditoría de movimientos (lo que dijiste)
    "dashboard:view",
    "movimientos:view",
    "movimientos:read",

    // Si luego quieres ver/leer otros módulos, descomenta:
    // "productos:view", "productos:read",
    // "categorias:view", "categorias:read",
    // "aulas:view", "aulas:read",
    // "empleados:view", "empleados:read",
  ],
};

// ---------- Aliases ----------
function expand(alias: string): string[] {
  if (alias.endsWith(":crud")) {
    const base = alias.slice(0, -":crud".length);
    return [`${base}:create`, `${base}:read`, `${base}:update`, `${base}:delete`];
  }
  if (alias.endsWith(":manage")) {
    const base = alias.slice(0, -":manage".length);
    return [
      `${base}:view`,
      `${base}:create`, `${base}:read`, `${base}:update`, `${base}:delete`,
    ];
  }
  return [alias];
}

// ---------- API principal ----------
export function can(role: Role | null | undefined, perm: string): boolean {
  if (!role) return false;
  const allowed = MATRIX[role].flatMap(expand);
  return allowed.includes("*") || allowed.includes(perm);
}

// Normaliza lo que venga de la BD (FK, número, string…)
export function normalizeRole(input: unknown): Role | null {
  const s = String(input ?? "").toLowerCase();
  if (s.includes("super") || s === "1") return "superusuario";
  if (s.includes("admin") || s === "2") return "admin";
  if (s.includes("vista") || s.includes("view") || s === "3") return "vista";
  return null;
}

// Home sugerido por rol cuando falta permiso
export const DEFAULT_HOME: Record<Role, string> = {
  superusuario: "/dashboard",
  admin: "/dashboard",
  vista: "/movimientos",
};

// Mapeos de ruta -> recurso (páginas)
export function resourceFromPath(pathname: string):
  | "dashboard" | "productos" | "movimientos" | "empleados"
  | "categorias" | "aulas" | "usuarios" | null {
  const seg = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean)[0] ?? "";
  if (!seg) return "dashboard";
  if (seg === "dashboard") return "dashboard";
  if (seg === "productos") return "productos";
  if (seg === "movimientos") return "movimientos";
  if (seg === "empleados") return "empleados";
  if (seg === "categorias") return "categorias";
  if (seg === "aulas") return "aulas";
  if (seg === "usuarios") return "usuarios";
  return null;
}

// Mapeo /api -> recurso (APIs)
export function apiResourceFromPath(pathname: string): string | null {
  // /api/<seg>/...
  const parts = pathname.split("/").filter(Boolean);
  const seg = parts[1];
  if (!seg) return null;

  if (seg === "employees")    return "empleados";
  if (seg === "items" || seg === "productos") return "productos";
  if (seg === "categorias")   return "categorias";
  if (seg === "aulas")        return "aulas";
  if (seg === "movimientos")  return "movimientos";
  if (seg === "users" || seg === "usuarios") return "usuarios";
  if (seg === "roles")        return "usuarios";  // ← protegido igual que usuarios

  return null;
}

// Permiso HTTP por API o :view para páginas
export function permFor(method: string, resource: string, isPage: boolean) {
  if (isPage) return `${resource}:view`;
  const m = method.toUpperCase();
  if (m === "GET")    return `${resource}:read`;
  if (m === "POST")   return `${resource}:create`;
  if (m === "PUT" || m === "PATCH") return `${resource}:update`;
  if (m === "DELETE") return `${resource}:delete`;
  return `${resource}:read`;
}
