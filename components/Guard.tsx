"use client";

import {
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import { usePerms } from "@/components/permisions/PermissionsProvider";

type GuardMode = "hide" | "disable" | "show-message";

type GuardProps = {
  /** Permiso requerido, p.ej. "usuarios:create" | "productos:read" */
  perm: string;
  /** Comportamiento cuando NO hay permiso (por defecto: "hide") */
  mode?: GuardMode;
  /** Qué mostrar si no hay permiso y mode === "hide" */
  fallback?: ReactNode;
  /** Un único hijo controlable (botón, link, etc.) */
  children: ReactElement<any>;
};

/** ¿Se comporta como anchor (<a> o Link)? */
function isAnchorLike(el: ReactElement<any>) {
  const t = el.type as any;
  return (
    t === "a" ||
    t?.displayName === "Link" ||
    t?.name === "Link" ||
    "href" in (el.props ?? {})
  );
}

/** ¿Es un control que soporta `disabled`? (button/input/select/textarea o con onClick) */
function isButtonLike(el: ReactElement<any>) {
  const t = el.type as any;
  const tag =
    typeof t === "string" ? t : t?.displayName || t?.name || "";
  return (
    ["button", "input", "select", "textarea"].includes(tag) ||
    "onClick" in (el.props ?? {})
  );
}

/** Merge de classnames sencillito */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Guard({
  perm,
  mode = "hide",
  fallback = null,
  children,
}: GuardProps) {
  const { has, loading } = usePerms();

  if (loading) return null;

  const ok = has(perm);
  if (ok) return children;

  // ─────────────────────────────────────────
  // No hay permiso
  // ─────────────────────────────────────────
  if (mode === "disable") {
    // 1) Si es link/anchor, `disabled` no aplica → se envuelve en <span> “deshabilitado”
    if (isValidElement(children) && isAnchorLike(children)) {
      const childClass: string | undefined = (children.props as any)?.className;
      return (
        <span
          aria-disabled="true"
          className={cx(
            "pointer-events-none opacity-50 select-none",
            childClass
          )}
        >
          {children}
        </span>
      );
    }

    // 2) Si es control deshabilitable (button/input/…) clonamos con `disabled`
    if (isValidElement(children) && isButtonLike(children)) {
      // tipamos el hijo para que TS acepte `disabled` y `className`
      const typed = children as ReactElement<{
        disabled?: boolean;
        className?: string;
      }>;

      const childClass = typed.props.className ?? "";
      const mergedClass = cx(childClass, "opacity-50");

      return cloneElement(typed, {
        disabled: true,
        className: mergedClass,
        // `aria-disabled` no está tipado en muchos elementos → lo añadimos como any.
        ...({ "aria-disabled": true } as any),
      });
    }

    // 3) Cualquier otro nodo no “deshabilitable”: no se muestra
    return null;
  }

  if (mode === "show-message") {
    return <span className="text-xs text-neutral-400">Sin permiso</span>;
  }

  // mode === "hide" (default)
  return <>{fallback}</>;
}
