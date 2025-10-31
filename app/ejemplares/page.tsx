// app/ejemplares/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  Group,
  EjemplarRow,
  Aula,
  ProductoLite,
  EmpleadoLite,
} from "@/components/ejemplares/types";
import AddEjemplarForm from "@/components/ejemplares/AddEjemplarForm";

/* ------------------------ Helpers ------------------------ */
async function safeJson(res: Response, name: string) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name} failed: ${res.status} ${res.statusText} :: ${text.slice(0,180)}`);
  }
  return res.json();
}

async function applyBulkEstado(opts: {
  numeros: string;
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
  producto_id?: string;
  aula_id?: number | null;
}) {
  const res = await fetch("/api/ejemplares/list/estado-bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(opts),
  });
  return safeJson(res, "Estado bulk") as Promise<{ ok: boolean; updated: number; notFound?: string[] }>;
}

/* ------------------------ Componentes pequeños ------------------------ */
function BulkDamageForm({
  onApply,
}: {
  onApply: (payload: {
    numeros: string;
    estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
  }) => Promise<void> | void;
}) {
  const [numeros, setNumeros] = useState("");
  const [estado, setEstado] =
    useState<"bueno" | "regular" | "malo" | "inutilizable">("malo");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_220px_120px] items-start"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!numeros.trim()) return alert("Pega los números de inventario.");
        setLoading(true);
        try {
          await onApply({ numeros, estado_fisico: estado });
          setNumeros("");
        } finally {
          setLoading(false);
        }
      }}
    >
      <textarea
        className="bg-neutral-800 rounded p-2 min-h-[120px]"
        placeholder="Pega # inventario separados por comas: INV001, INV002…"
        value={numeros}
        onChange={(e) => setNumeros(e.target.value)}
      />
      <select
        className="bg-neutral-800 rounded p-2"
        value={estado}
        onChange={(e) => setEstado(e.target.value as any)}
      >
        <option value="bueno">bueno</option>
        <option value="regular">regular</option>
        <option value="malo">malo</option>
        <option value="inutilizable">inutilizable</option>
      </select>
      <button type="submit" className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Aplicando..." : "Aplicar"}
      </button>
    </form>
  );
}

function RemoveByNumbersForm({
  producto_id,
  aula_id,
  onDone,
}: {
  producto_id: string;
  aula_id: number | null;
  onDone: () => Promise<void> | void;
}) {
  const [nums, setNums] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const numeros = nums.trim();
        if (!numeros) return alert("Pega números de inventario.");
        setLoading(true);
        try {
          const r = await fetch("/api/ejemplares/list/remove-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ producto_id, aula_id, numeros }),
          });
          const j = await safeJson(r, "Quitar por números");
          alert(
            `Eliminados: ${j.removidos}${
              j.notFound?.length ? `\nNo encontrados: ${j.notFound.join(", ")}` : ""
            }`
          );
          setNums("");
          await onDone();
        } catch (err: any) {
          alert(err?.message || "Error");
        } finally {
          setLoading(false);
        }
      }}
    >
      <label className="text-sm text-neutral-300">
        Pega # de inventario (de este grupo) separados por comas. Solo esos se eliminarán.
      </label>
      <textarea
        className="bg-neutral-800 rounded p-2 min-h-[120px]"
        placeholder="INV001, INV002, INV003…"
        value={nums}
        onChange={(e) => setNums(e.target.value)}
      />
      <button type="submit" className="self-start px-3 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Eliminando..." : "Quitar seleccionados"}
      </button>
    </form>
  );
}

/** Mover ejemplares por números
 *  - Permite mandar a otra aula y/o cambiar el empleado asignado.
 *  - Si dejas algún destino vacío, se envía como null (quita empleado / sin aula).
 */
function MoveBulkForm({
  producto_id,
  from_aula_id,
  empleados,
  aulas,
  onDone,
}: {
  producto_id: string;
  from_aula_id: number | null;
  empleados: EmpleadoLite[];
  aulas: Aula[];
  onDone: () => Promise<void> | void;
}) {
  const [nums, setNums] = useState("");
  const [toEmpleadoId, setToEmpleadoId] = useState<string>(""); // "" -> null
  const [toAulaId, setToAulaId] = useState<number | "">("");     // "" -> null
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const numeros = nums.trim();
        if (!numeros) return alert("Pega números de inventario.");
        setLoading(true);
        try {
          const body = {
            producto_id,
            from_aula_id,                                 // el grupo abierto/origen
            from_empleado_id: null as string | null,      // origen no forzado por empleado
            to_aula_id: toAulaId === "" ? null : Number(toAulaId),
            to_empleado_id: toEmpleadoId || null,
            numeros,
          };
          const r = await fetch("/api/ejemplares/list/move-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          });
          const j = await safeJson(r, "Mover ejemplares");
          // Puedes ajustar estos mensajes según lo que devuelva tu API:
          alert(`Movimiento realizado${j.moved ? `: ${j.moved}` : ""}`);
          setNums("");
          setToEmpleadoId("");
          setToAulaId("");
          await onDone();
        } catch (err: any) {
          alert(err?.message || "Error");
        } finally {
          setLoading(false);
        }
      }}
    >
      <label className="text-sm text-neutral-300">
        Pega # de inventario a mover (de este grupo), separados por comas.
      </label>
      <textarea
        className="bg-neutral-800 rounded p-2 min-h-[120px]"
        placeholder="INV001, INV010…"
        value={nums}
        onChange={(e) => setNums(e.target.value)}
      />

      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <span className="text-sm text-neutral-300">Aula destino (opcional)</span>
          <select
            className="bg-neutral-800 rounded p-2"
            value={toAulaId}
            onChange={(e) => setToAulaId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">— sin aula (null) —</option>
            {aulas.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <span className="text-sm text-neutral-300">Empleado destino (opcional)</span>
          <select
            className="bg-neutral-800 rounded p-2"
            value={toEmpleadoId}
            onChange={(e) => setToEmpleadoId(e.target.value)}
          >
            <option value="">— sin empleado (null) —</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="self-start px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Moviendo..." : "Mover seleccionados"}
      </button>

      <p className="text-xs text-neutral-400">
        Si el grupo destino no existe (producto + aula destino), se creará con esos ejemplares.
        Si dejas algún destino vacío, se enviará como <i>null</i>.
      </p>
    </form>
  );
}

/* ------------------------ Página ------------------------ */
export default function EjemplaresPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EjemplarRow[]>>({});

  const [showForm, setShowForm] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [productos, setProductos] = useState<ProductoLite[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoLite[]>([]);

  const loadCombos = useCallback(async () => {
    const [aR, pR, eR] = await Promise.all([
      fetch("/api/aulas/list-lite", { cache: "no-store", credentials: "include" }),
      fetch("/api/items/list-lite", { cache: "no-store", credentials: "include" }),
      fetch("/api/employees/list-lite", { cache: "no-store", credentials: "include" }),
    ]);
    const [aJ, pJ, eJ] = await Promise.all([
      safeJson(aR, "Aulas"),
      safeJson(pR, "Items"),
      safeJson(eR, "Empleados"),
    ]);
    setAulas(aJ.aulas ?? []);
    setProductos(pJ.items ?? []);
    setEmpleados(eJ.empleados ?? []);
  }, []);

  const loadSummary = useCallback(async () => {
    const r = await fetch("/api/ejemplares/list/summary", {
      cache: "no-store",
      credentials: "include",
    });
    const j = await safeJson(r, "Resumen ejemplares");
    setGroups(j.groups ?? []);
  }, []);

  const loadDetails = useCallback(async (producto_id: string, aula_id: number | null) => {
    const url = `/api/ejemplares/list/by-group?producto_id=${producto_id}&aula_id=${aula_id ?? "null"}`;
    const r = await fetch(url, { cache: "no-store", credentials: "include" });
    const j = await safeJson(r, "Detalle por grupo");
    const key = `${producto_id}:${aula_id ?? "null"}`;
    setDetails((d) => ({ ...d, [key]: j.ejemplares ?? [] }));
  }, []);

  const refreshAll = useCallback(async () => {
    await loadSummary();
    if (open) {
      const [producto_id, aulaKey] = open.split(":");
      const aula_id = aulaKey === "null" ? null : Number(aulaKey);
      await loadDetails(producto_id, aula_id);
    }
  }, [loadSummary, loadDetails, open]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadCombos(), loadSummary()]);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [loadCombos, loadSummary]);

  function makeKey(g: { producto_id: string; aula_id: number | null }) {
    return `${g.producto_id}:${g.aula_id ?? "null"}`;
  }

  async function toggle(g: Group) {
    const key = makeKey(g);
    if (open === key) return setOpen(null);
    setOpen(key);
    if (!details[key]) {
      await loadDetails(g.producto_id, g.aula_id ?? null);
    }
  }

  // Cierre panel edición por ESC y por click en backdrop
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditKey(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ejemplares</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? "Ocultar formulario" : "Añadir ejemplar"}
        </button>
      </div>

      {showForm && (
        <div className="border border-neutral-800 rounded-lg">
          <div className="p-4 bg-neutral-900 rounded-lg">
            <AddEjemplarForm
              aulas={aulas}
              productos={productos}
              empleados={empleados}
              onCreated={async () => {
                await refreshAll();
              }}
            />
          </div>
        </div>
      )}

      {/* Tabla resumen */}
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-left">Aula</th>
              <th className="p-2 text-left">Cantidad</th>
              <th className="p-2 text-left">Dañados</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const key = makeKey(g);
              const isOpen = open === key;
              return (
                <tr key={key} className="border-t border-neutral-800">
                  <td className="p-2">{g.producto}</td>
                  <td className="p-2">{g.aula}</td>
                  <td className="p-2">{g.cantidad}</td>
                  <td className="p-2">{g.danados}</td>
                  <td className="p-2 text-right flex gap-2 justify-end">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
                      onClick={() => toggle(g)}
                    >
                      {isOpen ? "Ocultar" : "Ver más"}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600"
                      onClick={() => setEditKey(key)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detalle + cambio masivo + mover */}
      {open && (
        <div className="bg-neutral-950 p-3 rounded-lg flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="p-2 text-left"># Inventario</th>
                  <th className="p-2 text-left">Serie</th>
                  <th className="p-2 text-left">Estado físico</th>
                  <th className="p-2 text-left">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {(details[open] ?? []).map((e) => (
                  <tr key={e.id} className="border-t border-neutral-800">
                    <td className="p-2">{e.num_inventario ?? "—"}</td>
                    <td className="p-2">{e.serie ?? "—"}</td>
                    <td className="p-2">{e.estado_fisico}</td>
                    <td className="p-2">{e.estatus}</td>
                  </tr>
                ))}
                {(details[open] ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-400">
                      Sin ejemplares
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cambio masivo de estado */}
          <div className="mt-2 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
            <h3 className="font-medium mb-2">Cambio masivo de estado</h3>
            <p className="text-sm text-neutral-400 mb-2">
              Pega los números de inventario de este grupo (producto + aula), separados por comas.
            </p>
            <BulkDamageForm
              onApply={async ({ numeros, estado_fisico }) => {
                if (!open) return;
                const [producto_id, aulaKey] = open.split(":");
                const aula_id = aulaKey === "null" ? null : Number(aulaKey);
                const res = await applyBulkEstado({ numeros, estado_fisico, producto_id, aula_id });
                if (res.notFound?.length) {
                  alert(`No se encontraron: ${res.notFound.join(", ")}`);
                } else {
                  alert(`Actualizados: ${res.updated}`);
                }
                await refreshAll();
              }}
            />
          </div>

          {/* Mover ejemplares */}
          <div className="mt-2 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
            <h3 className="font-medium mb-2">Mover ejemplares a otra aula / empleado</h3>
            <p className="text-sm text-neutral-400 mb-2">
              Pega los números de inventario de este grupo que deseas mover. El destino puede ser solo aula, solo empleado o ambos.
            </p>
            {(() => {
              const [producto_id, aulaKey] = open.split(":");
              const from_aula_id = aulaKey === "null" ? null : Number(aulaKey);
              return (
                <MoveBulkForm
                  producto_id={producto_id}
                  from_aula_id={from_aula_id}
                  empleados={empleados}
                  aulas={aulas}
                  onDone={async () => { await refreshAll(); }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Panel lateral de edición con PRE-CARGA */}
      {editKey && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditKey(null);
          }}
        >
          <div className="ml-auto h-full w-full max-w-[780px] bg-neutral-950 border-l border-neutral-800 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar grupo</h2>
              <button
                type="button"
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                onClick={() => setEditKey(null)}
              >
                Cerrar
              </button>
            </div>

            {(() => {
              const [producto_id, aulaKey] = editKey.split(":");
              const aula_id = aulaKey === "null" ? null : Number(aulaKey);
              return (
                <div className="grid gap-6">
                  {/* Agregar ejemplares PRE-CARGADO con el grupo */}
                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">
                      Agregar ejemplares a este grupo
                    </div>
                    <div className="p-4">
                      <AddEjemplarForm
                        key={editKey}
                        aulas={aulas}
                        productos={productos}
                        empleados={empleados}
                        defaults={{ producto_id, aula_id }}
                        lockProductoAula
                        onCreated={async () => { await refreshAll(); }}
                      />
                      <p className="text-xs text-neutral-400 mt-2">
                        Selecciona el mismo producto y aula para sumar a este grupo.
                      </p>
                    </div>
                  </section>

                  {/* Quitar ejemplares por números */}
                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">
                      Quitar ejemplares (por números de inventario)
                    </div>
                    <div className="p-4">
                      <RemoveByNumbersForm
                        producto_id={producto_id}
                        aula_id={aula_id}
                        onDone={async () => { await refreshAll(); }}
                      />
                    </div>
                  </section>

                  {/* Mover ejemplares */}
                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">
                      Mover ejemplares (aula / empleado)
                    </div>
                    <div className="p-4">
                      <MoveBulkForm
                        producto_id={producto_id}
                        from_aula_id={aula_id}
                        empleados={empleados}
                        aulas={aulas}
                        onDone={async () => { await refreshAll(); }}
                      />
                    </div>
                  </section>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
