// app/components/permisions/roleCache.ts
import type { Role } from "@/lib/supabase/permissions";

const KEY = "rbac:role";
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutos

type CachePayload = { role: Role | null; ts: number };

export function getRoleFromCache(maxAgeMs = DEFAULT_TTL_MS): Role | null | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined; // no hay caché
    const data = JSON.parse(raw) as CachePayload;
    if (Date.now() - data.ts > maxAgeMs) return undefined; // caducado
    return data.role;
  } catch {
    return undefined;
  }
}

export function setRoleCache(role: Role | null) {
  try {
    const payload: CachePayload = { role, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function clearRoleCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
