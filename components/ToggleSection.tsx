// components/ToggleSection.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";

type Props = {
  title: string;           // Título de la sección
  children: ReactNode;     // El formulario (AddItemForm, etc.)
  defaultOpen?: boolean;   // Si quieres que arranque abierto
  forceOpen?: boolean;     // Para casos como "estoy editando" -> abrir sí o sí
};

export default function ToggleSection({
  title,
  children,
  defaultOpen = false,
  forceOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen || forceOpen);

  // Si forceOpen se pone en true (por ejemplo, al editar), abrimos el panel
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-1.5 rounded-full text-sm font-medium
                     bg-blue-600 hover:bg-blue-500
                     text-white transition"
        >
          {open ? "Cerrar formulario" : "Abrir formulario"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-neutral-700 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
