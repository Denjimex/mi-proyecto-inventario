"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/supabase/permissions";
import { can } from "@/lib/supabase/permissions";
import { getRoleFromCache, setRoleCache, clearRoleCache } from "./roleCache";
import { createClient } from "@/lib/supabase/client"; // para onAuthStateChange (opcional)

type Ctx = { role: Role | null; has: (perm: string) => boolean; loading: boolean };
const PermsCtx = createContext<Ctx>({ role: null, has: () => false, loading: true });

type Props = { children: React.ReactNode; /** SSR role opcional */ initialRole?: Role | null };

// cuánto tiempo consideramos “fresco” el caché
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function PermissionsProvider({ children, initialRole = null }: Props) {
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      // 1) intenta caché (si no venimos con initialRole desde SSR)
      if (initialRole == null) {
        const cached = getRoleFromCache(CACHE_TTL_MS);
        if (cached !== undefined) {
          if (!cancelled) {
            setRole(cached);
            setLoading(false);
          }
          return; // usamos caché, no llamamos a la API
        }
      }

      // 2) fetch a la API
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        const r: Role | null = json?.role ?? null;
        if (!cancelled) {
          setRole(r);
          setLoading(false);
        }
        setRoleCache(r); // guarda/renueva caché
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    loadRole();

    // 3) sincroniza entre pestañas
    function onStorage(ev: StorageEvent) {
      if (ev.key === "rbac:role") {
        const cached = getRoleFromCache(CACHE_TTL_MS);
        setRole(cached ?? null);
      }
    }
    window.addEventListener("storage", onStorage);

    // 4) limpia caché si supabase cierra sesión (opcional)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!session) {
        clearRoleCache();
        setRole(null);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      subscription?.unsubscribe();
    };
  }, [initialRole]);

  const value: Ctx = {
    role,
    loading,
    has: (perm) => can(role, perm),
  };

  return <PermsCtx.Provider value={value}>{children}</PermsCtx.Provider>;
}

export function usePerms() {
  return useContext(PermsCtx);
}
