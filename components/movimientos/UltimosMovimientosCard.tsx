// components/movimientos/UltimosMovimientosCard.tsx
"use client";
import { useEffect, useState } from "react";

type Movimiento = {
  id: string;
  fecha_movimiento: string;
  tipo: "alta" | "cambio" | "baja";
  producto: string | null;
  num_inventario: string | null;
  aula: string | null;
  empleado: string | null;
  estado_fisico: string | null;
  descripcion: string | null;
  usuario: string | null;
};

const TipoBadge: React.FC<{ tipo: Movimiento["tipo"] }> = ({ tipo }) => {
  const map: Record<string, string> = {
    alta:   "bg-emerald-700/30 text-emerald-300",
    cambio: "bg-amber-700/30 text-amber-300",
    baja:   "bg-rose-800/30 text-rose-300",
  };
  const label = tipo[0].toUpperCase() + tipo.slice(1);
  return <span className={`px-2 py-0.5 rounded text-xs ${map[tipo]}`}>{label}</span>;
};

export default function UltimosMovimientosCard({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = async () => {
      setLoading(true);
      const res = await fetch(`/api/movimientos?limit=${limit}`, { cache: "no-store" });
      const json = await res.json();
      setItems(json.movimientos || []);
      setLoading(false);
    };
    fetcher();
  }, [limit]);

  return (
    <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">Últimos movimientos</h3>
        <a href="/movimientos" className="text-xs text-neutral-400 hover:text-neutral-200">Ver todo</a>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 rounded bg-neutral-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400">Aún no hay movimientos.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(m => (
            <li key={m.id} className="flex items-start gap-3">
              <TipoBadge tipo={m.tipo} />
              <div className="min-w-0">
                <div className="text-sm text-neutral-200 truncate">
                  {m.producto ?? "—"} · {m.num_inventario ?? "—"}{m.aula ? ` · ${m.aula}` : ""}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {m.descripcion || "—"} · {m.usuario || "—"}
                </div>
              </div>
              <span className="ml-auto text-xs text-neutral-500">
                {new Date(m.fecha_movimiento).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
