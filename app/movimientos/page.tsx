// app/movimientos/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type Movimiento = {
  id: string;
  fecha_movimiento: string;
  tipo: "alta" | "cambio" | "baja";
  ejemplar_id: string | null;
  aula_id: number | null;
  num_inventario: string | null;
  serie: string | null;
  producto: string | null;
  aula: string | null;
  empleado: string | null;
  estado_fisico: string | null;
  descripcion: string | null;
  usuario: string | null;
};

type ApiResp = {
  page: number;
  limit: number;
  total: number;
  items: Movimiento[];
};

export default function MovimientosPage() {
  const [tipo, setTipo] = useState<string>(""); // '', 'alta', 'cambio', 'baja'
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (tipo) sp.set("tipo", tipo);
    if (q.trim()) sp.set("q", q.trim());
    sp.set("page", String(page));
    sp.set("limit", String(limit));
    return sp.toString();
  }, [tipo, q, page, limit]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movimientos/list?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error al cargar movimientos");
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Movimientos</h1>

      {/* Filtros */}
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-sm opacity-80 mb-1">Tipo</label>
          <select
            className="w-full bg-neutral-800 rounded px-3 py-2"
            value={tipo}
            onChange={(e) => { setPage(1); setTipo(e.target.value); }}
          >
            <option value="">Todos</option>
            <option value="alta">Alta</option>
            <option value="cambio">Cambio</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm opacity-80 mb-1">Buscar</label>
          <input
            className="w-full bg-neutral-800 rounded px-3 py-2"
            placeholder="Producto, # inventario, serie, empleado, aula, descripción, usuario…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-900">
            <tr className="text-left">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2"># Inventario</th>
              <th className="px-3 py-2">Serie</th>
              <th className="px-3 py-2">Aula</th>
              <th className="px-3 py-2">Empleado</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center opacity-70">
                  Cargando…
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-red-400">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && data?.items?.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center opacity-70">
                  Sin resultados.
                </td>
              </tr>
            )}

            {data?.items?.map((m) => (
              <tr key={m.id} className="border-t border-neutral-800 hover:bg-neutral-900/40">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(m.fecha_movimiento).toLocaleString()}
                </td>
                <td className="px-3 py-2 capitalize">{m.tipo}</td>
                <td className="px-3 py-2">{m.producto ?? "—"}</td>
                <td className="px-3 py-2">{m.num_inventario ?? "—"}</td>
                <td className="px-3 py-2">{m.serie ?? "—"}</td>
                <td className="px-3 py-2">{m.aula ?? "—"}</td>
                <td className="px-3 py-2">{m.empleado ?? "—"}</td>
                <td className="px-3 py-2">{m.estado_fisico ?? "—"}</td>
                <td className="px-3 py-2 max-w-[260px] truncate" title={m.descripcion ?? ""}>
                  {m.descripcion ?? "—"}
                </td>
                <td className="px-3 py-2">{m.usuario ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm opacity-70">
          {data ? `Mostrando ${data.items.length} de ${data.total} movimientos` : "—"}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-neutral-800 disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span className="px-2 py-1 opacity-80 text-sm">
            Página {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-neutral-800 disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
