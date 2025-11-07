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

// Update campo-a-campo de un ejemplar
async function updateEjemplar(id: string, patch: Partial<{
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
  descripcion: string | null;
}>) {
  const res = await fetch("/api/ejemplares/list/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, ...patch }),
  });
  return safeJson(res, "Actualizar ejemplar");
}

/* ------------------------ Componentes pequeños ------------------------ */
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
        const numeros = Array.from(
          new Set(nums.split(/[,\n;\t| ]+/).map(s => s.trim()).filter(Boolean))
        ).join(",");
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
          alert(`Eliminados: ${j.removidos}${j.notFound?.length ? `\nNo encontrados: ${j.notFound.join(", ")}` : ""}`);
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
        Pega # inventario (de este grupo). Acepta comas y saltos de línea.
      </label>
      <textarea
        className="bg-neutral-800 rounded p-2 min-h-[120px]"
        placeholder="INV001, INV002… (o uno por línea)"
        value={nums}
        onChange={(e) => setNums(e.target.value)}
      />
      <button type="submit" className="self-start px-3 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Eliminando..." : "Quitar seleccionados"}
      </button>
    </form>
  );
}

/** Mover ejemplares (aula/empleado) — se queda SOLO en el sidebar */
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
  const [toEmpleadoId, setToEmpleadoId] = useState<string>(""); // "" -> undefined (no tocar)
  const [toAulaId, setToAulaId] = useState<number | "">("");     // "" -> undefined (no tocar)
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();

        const numeros = Array.from(
          new Set(nums.split(/[,\n;\t| ]+/).map(s => s.trim()).filter(Boolean))
        ).join(",");
        if (!numeros) return alert("Pega números de inventario.");

        setLoading(true);
        try {
          const body = {
            producto_id,
            from_aula_id,
            from_empleado_id: undefined as string | undefined,
            to_aula_id:      toAulaId === "" ? undefined : Number(toAulaId),
            to_empleado_id:  toEmpleadoId === "" ? undefined : toEmpleadoId,
            numeros,
          };

          const r = await fetch("/api/ejemplares/list/move-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
          });
          const j = await safeJson(r, "Mover ejemplares");

          alert(`Movimiento realizado.\nMovidos: ${j.moved ?? 0}${j.notFound?.length ? `\nNo encontrados: ${j.notFound.join(", ")}` : ""}`);

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
      <label className="text-sm text-neutral-300">Pega # de inventario a mover (acepta comas y saltos de línea).</label>
      <textarea
        className="bg-neutral-800 rounded p-2 min-h-[120px]"
        placeholder="INV001, INV010… (o uno por línea)"
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
            {aulas.map(a => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
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
            {empleados.map(emp => (<option key={emp.id} value={emp.id}>{emp.nombre}</option>))}
          </select>
        </div>
      </div>

      <button type="submit" className="self-start px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Moviendo..." : "Mover seleccionados"}
      </button>
    </form>
  );
}

/* ------------------------ Página ------------------------ */
export default function EjemplaresPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EjemplarRow[]>>({});

  // etiqueta de empleado homogéneo por grupo (nombre / “sin empleado” / “varios”)
  const [groupEmpLabel, setGroupEmpLabel] = useState<Record<string, string>>({});

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
    const rows: EjemplarRow[] = j.ejemplares ?? [];
    setDetails((d) => ({ ...d, [key]: rows }));

    // calcula etiqueta de empleado homogéneo
    const ids = new Set<string | "null">(
      rows.map((e: any) => (e.empleado?.id ?? e.empleado_id ?? "null"))
    );
    let label = "—";
    if (rows.length > 0) {
      if (ids.size === 1) {
        const only = [...ids][0];
        if (only === "null") label = "sin empleado";
        else {
          const emp = rows.find((r: any) => (r.empleado?.id ?? r.empleado_id) === only)?.empleado;
          // intenta resolver nombre desde catálogo si API no manda objeto
          const name =
            emp?.nombre ??
            empleados.find((x) => x.id === only)?.nombre ??
            "(empleado)";
          label = name;
        }
      } else {
        label = "varios";
      }
    }
    setGroupEmpLabel((m) => ({ ...m, [key]: label }));
  }, [empleados]);

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

  // cerrar sidebar por ESC
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
              onCreated={async () => { await refreshAll(); }}
            />
          </div>
        </div>
      )}

      {/* Tabla resumen: ahora con columna Empleado (grupo) */}
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-left">Aula</th>
              <th className="p-2 text-left">Empleado (grupo)</th>
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
                  <td className="p-2 text-neutral-300">{groupEmpLabel[key] ?? "—"}</td>
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
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detalle editable (solo Estado + Descripción). Empleado se quita aquí */}
      {open && (
        <div className="bg-neutral-950 p-3 rounded-lg flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="p-2 text-left"># Inventario</th>
                  <th className="p-2 text-left">Serie</th>
                  <th className="p-2 text-left">Estado físico</th>
                  <th className="p-2 text-left">Descripción / notas</th>
                </tr>
              </thead>
              <tbody>
                {(details[open] ?? []).map((e) => (
                  <EditableRow
                    key={e.id}
                    row={e}
                    onLocalChange={(patched) => {
                      const arr = (details[open] ?? []).map((r) =>
                        r.id === e.id ? { ...r, ...patched } as EjemplarRow : r
                      );
                      setDetails((d) => ({ ...d, [open]: arr }));
                    }}
                    afterSave={async () => {
                      await refreshAll();
                    }}
                  />
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
        </div>
      )}

      {/* Sidebar: Add (bloqueando producto/aula/empleado), Quitar y Mover */}
      {editKey && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex"
          onClick={(e) => { if (e.target === e.currentTarget) setEditKey(null); }}
        >
          <div className="ml-auto h-full w-full max-w-[780px] bg-neutral-950 border-l border-neutral-800 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar grupo</h2>
              <button type="button" className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700" onClick={() => setEditKey(null)}>Cerrar</button>
            </div>

            {(() => {
              const [producto_id, aulaKey] = editKey.split(":");
              const aula_id = aulaKey === "null" ? null : Number(aulaKey);

              // si tenemos etiqueta homogénea con un nombre real => intenta resolver empleado_id
              const empLabel = groupEmpLabel[editKey];
              const homogId =
                empLabel && empLabel !== "—" && empLabel !== "varios"
                  ? empleados.find(e => e.nombre === empLabel)?.id ?? null
                  : null;

              return (
                <div className="grid gap-6">
                  {/* Agregar ejemplares con precarga y bloqueo (producto/aula/empleado) */}
                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">Agregar ejemplares a este grupo</div>
                    <div className="p-4">
                      <AddEjemplarForm
                        key={editKey}
                        aulas={aulas}
                        productos={productos}
                        empleados={empleados}
                        defaults={{ producto_id, aula_id, empleado_id: homogId ?? null }}
                        lockProductoAula
                        /* requiere que AddEjemplarForm soporte lockEmpleado + defaults.empleado_id */
                        // @ts-ignore
                        lockEmpleado
                        onCreated={async () => { await refreshAll(); }}
                      />
                      <p className="text-xs text-neutral-400 mt-2">
                        Producto/aula/empleado precargados y bloqueados para mantener coherencia del grupo.
                      </p>
                    </div>
                  </section>

                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">Quitar ejemplares (por números)</div>
                    <div className="p-4">
                      <RemoveByNumbersForm producto_id={producto_id} aula_id={aula_id} onDone={async () => { await refreshAll(); }} />
                    </div>
                  </section>

                  <section className="border border-neutral-800 rounded-lg">
                    <div className="p-4 bg-neutral-900 rounded-t-lg font-medium">Mover ejemplares (aula / empleado)</div>
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

/* ---------- Fila editable (estado + nota con botón) ---------- */
function EditableRow({
  row,
  onLocalChange,
  afterSave,
}: {
  row: EjemplarRow & { empleado_id?: string | null };
  onLocalChange: (patch: Partial<EjemplarRow>) => void;
  afterSave: () => Promise<void> | void;
}) {
  const [savingEstado, setSavingEstado] = useState(false);

  // --- Nota por ejemplar (modo lectura -> botón -> editor)
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string>(row.descripcion ?? "");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    // Si la fila se refresca desde fuera, sincronizamos el borrador
    setNoteDraft(row.descripcion ?? "");
  }, [row.descripcion]);

  async function handleEstadoChange(
    val: "bueno" | "regular" | "malo" | "inutilizable"
  ) {
    const prev = row.estado_fisico;
    onLocalChange({ id: row.id, estado_fisico: val });
    setSavingEstado(true);
    try {
      await updateEjemplar(row.id, { estado_fisico: val });
      await afterSave();
    } catch (err: any) {
      onLocalChange({ id: row.id, estado_fisico: prev }); // rollback
      alert(err?.message || "No se pudo guardar el estado");
    } finally {
      setSavingEstado(false);
    }
  }

  async function handleSaveNote() {
    setSavingNote(true);
    const prev = row.descripcion ?? "";
    // Optimista
    onLocalChange({ id: row.id, descripcion: noteDraft || null });
    try {
      await updateEjemplar(row.id, { descripcion: noteDraft || null });
      setEditingNote(false);
      await afterSave();
    } catch (err: any) {
      // rollback
      onLocalChange({ id: row.id, descripcion: prev });
      alert(err?.message || "No se pudo guardar la nota");
    } finally {
      setSavingNote(false);
    }
  }

  function handleCancelNote() {
    setNoteDraft(row.descripcion ?? "");
    setEditingNote(false);
  }

  return (
    <tr className="border-t border-neutral-800 align-top">
      <td className="p-2">{row.num_inventario ?? "—"}</td>
      <td className="p-2">{row.serie ?? "—"}</td>

      {/* Estado físico */}
      <td className="p-2">
        <select
          className="bg-neutral-800 rounded p-2 min-w-[140px]"
          value={row.estado_fisico}
          onChange={(e) => handleEstadoChange(e.target.value as any)}
          disabled={savingEstado}
        >
          <option value="bueno">bueno</option>
          <option value="regular">regular</option>
          <option value="malo">malo</option>
          <option value="inutilizable">inutilizable</option>
        </select>
      </td>

      {/* Nota por ejemplar con botón */}
      <td className="p-2">
        {editingNote ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="bg-neutral-800 rounded p-2 min-w-[320px] min-h-[80px]"
              placeholder="Descripción / nota (auditoría)"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSaveNote}
                disabled={savingNote}
              >
                {savingNote ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
                onClick={handleCancelNote}
                disabled={savingNote}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="text-sm text-neutral-300 whitespace-pre-wrap max-w-[420px]">
              {row.descripcion && row.descripcion.trim()
                ? row.descripcion
                : <span className="text-neutral-500">— sin nota —</span>}
            </div>
            <button
              type="button"
              className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
              onClick={() => setEditingNote(true)}
            >
              {row.descripcion && row.descripcion.trim()
                ? "Editar nota"
                : "Añadir nota"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
