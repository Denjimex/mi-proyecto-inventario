"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/supabase/permissions";
import { can } from "@/lib/supabase/permissions";
import { getRoleFromCache, setRoleCache, clearRoleCache } from "./roleCache";
import { createClient } from "@/lib/supabase/client";

type Ctx = { role: Role | null; has: (perm: string) => boolean; loading: boolean };
const PermsCtx = createContext<Ctx>({ role: null, has: () => false, loading: true });

type Props = { children: React.ReactNode; initialRole?: Role | null };

const CACHE_TTL_MS = 10 * 60 * 1000;

export default function PermissionsProvider({ children, initialRole = null }: Props) {
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      // 1) usa caché si existe (y no venimos con SSR)
      if (initialRole == null) {
        const cached = getRoleFromCache(CACHE_TTL_MS);
        if (cached !== undefined) {
          if (!cancelled) {
            setRole(cached ?? null);
            setLoading(false);
          }
          return;
        }
      }

      // 2) pide a la API **con cookies**
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",        // 👈 IMPORTANTE
        });
        const json = await res.json();
        const r: Role | null = json?.role ?? null;

        if (!cancelled) {
          setRole(r);
          setLoading(false);
        }

        // no guardes null en caché
        if (r) setRoleCache(r);
        else clearRoleCache();
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    loadRole();

    // sincroniza pestañas
    function onStorage(ev: StorageEvent) {
      if (ev.key === "rbac:role") {
        const cached = getRoleFromCache(CACHE_TTL_MS);
        setRole(cached ?? null);
      }
    }
    window.addEventListener("storage", onStorage);

    // limpia si cierra sesión
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
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

  return (
    <PermsCtx.Provider value={{ role, loading, has: (perm) => can(role, perm) }}>
      {children}
    </PermsCtx.Provider>
  );
}

export function usePerms() {
  return useContext(PermsCtx);
}
