"use client";

import Guard from "@/components/Guard";
import type { ItemRow } from "./types";

type Props = {
  items: ItemRow[];
  onEdit?: (item: ItemRow) => void;
  onDelete?: (id: string) => Promise<void> | void;
};

export default function ItemsTable({ items, onEdit, onDelete }: Props) {
  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;

    // Si el padre no pasó onDelete, resolvemos aquí
    if (!onDelete) {
      const res = await fetch("/api/items/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",               // ← MUY IMPORTANTE
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || "Error eliminando");
      location.reload();
      return;
    }
    await onDelete(id);
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-left">Modelo</th>
            <th className="p-2 text-left">Serie</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Categoría</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">Sin productos</td>
            </tr>
          )}

          {items.map((r) => (
            <tr key={r.id} className="border-t border-neutral-800">
              <td className="p-2">{r.producto}</td>
              <td className="p-2">{r.modelo}</td>
              <td className="p-2">{r.serie}</td>
              <td className="p-2">{r.estado}</td>
              <td className="p-2">{r.category?.nombre ?? "—"}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Guard perm="productos:update" mode="disable">
                    <button
                      className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
                      onClick={() => onEdit?.(r)}
                    >
                      Editar
                    </button>
                  </Guard>

                  <Guard perm="productos:delete" mode="disable">
                    <button
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
                      onClick={() => handleDelete(r.id, r.producto)}
                    >
                      Eliminar
                    </button>
                  </Guard>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
