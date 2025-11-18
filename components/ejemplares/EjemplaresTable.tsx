// components/ejemplares/EjemplaresTable.tsx
"use client";

import Guard from "@/components/Guard";
import type { EjemplarRow } from "./types";
import { estadoUiFromDb } from "./types";

type Props = {
  rows: EjemplarRow[];
  onEdit?: (row: EjemplarRow) => void;
  onDelete?: (id: string) => Promise<void> | void;
};

export default function EjemplaresTable({ rows, onEdit, onDelete }: Props) {
  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-800">
          <tr>
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-left">Núm. inv.</th>
            <th className="p-2 text-left">Serie</th>
            {/* columna unificada */}
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Aula</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">
                Sin ejemplares
              </td>
            </tr>
          )}

          {rows.map((r) => {
            const estadoUI = estadoUiFromDb(r.estado_fisico, r.estatus);

            return (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="p-2">
                  {r.producto?.producto ?? "—"}
                  {r.producto?.modelo ? ` · ${r.producto?.modelo}` : ""}
                </td>
                <td className="p-2">{r.num_inventario ?? "—"}</td>
                <td className="p-2">{r.serie ?? "—"}</td>
                <td className="p-2">{estadoUI}</td>
                <td className="p-2">{r.aula?.nombre ?? "—"}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    {/* OJO: este Edit es el sidebar que dijiste que quizá ya no usarás.
                        Si luego lo quitamos, simplemente borramos este botón. */}
                    <Guard perm="ejemplares:update" mode="disable">
                      <button
                        className="px-3 py-1 rounded bg-neutral-700"
                        onClick={() => onEdit?.(r)}
                      >
                        Editar
                      </button>
                    </Guard>
                    <Guard perm="ejemplares:delete" mode="disable">
                      <button
                        className="px-3 py-1 rounded bg-red-600"
                        onClick={async () => {
                          if (!confirm("¿Eliminar ejemplar?")) return;
                          if (!onDelete) {
                            const res = await fetch(
                              "/api/ejemplares/delete",
                              {
                                method: "DELETE",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                credentials: "include",
                                body: JSON.stringify({ id: r.id }),
                              }
                            );
                            const json = await res.json();
                            if (!res.ok)
                              return alert(json.error || "Error");
                            location.reload();
                            return;
                          }
                          await onDelete(r.id);
                        }}
                      >
                        Eliminar
                      </button>
                    </Guard>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
