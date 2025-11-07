// components/ejemplares/AddEjemplarForm.tsx
"use client";

import { useEffect, useState } from "react";
import Guard from "@/components/Guard";
import type { Aula, ProductoLite, EjemplarRow, EmpleadoLite } from "./types";

async function safeJson(res: Response, name: string) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name} failed: ${res.status} ${res.statusText} :: ${text.slice(0,180)}`);
  }
  return res.json();
}

type Props = {
  aulas: Aula[];
  productos: ProductoLite[];
  empleados: EmpleadoLite[];
  onCreated: () => Promise<void> | void;

  editing?: EjemplarRow | null;
  onCancelEdit?: () => void;

  /** Precarga suave para “editar grupo” */
  defaults?: {
    producto_id?: string;
    aula_id?: number | null;
    empleado_id?: string | null; // NUEVO
    estado_fisico?: "bueno" | "regular" | "malo" | "inutilizable";
    estatus?: "activo" | "inactivo" | "retirado";
    serie?: string;
    descripcion?: string;
    cantidad?: number;
  };

  /** Bloquear selects (sidebar) */
  lockProductoAula?: boolean;
  lockEmpleado?: boolean; // NUEVO
};

export default function AddEjemplarForm({
  aulas,
  productos,
  empleados,
  onCreated,
  editing,
  onCancelEdit,
  defaults,
  lockProductoAula = false,
  lockEmpleado = false, // NUEVO
}: Props) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [empleadoId, setEmpleadoId] = useState<string>("");
  const [productoId, setProductoId] = useState<string>("");
  const [numInv, setNumInv] = useState<string>("");
  const [serie, setSerie] = useState<string>("");
  const [estadoFisico, setEstadoFisico] =
    useState<"bueno" | "regular" | "malo" | "inutilizable">("bueno");
  const [estatus, setEstatus] = useState<"activo" | "inactivo" | "retirado">("activo");
  const [descripcion, setDescripcion] = useState<string>("");
  const [aulaId, setAulaId] = useState<number | "">("");

  // Prefill edición 1-a-1 (tu modo antiguo)
  useEffect(() => {
    if (!editing) return;
    setCantidad(editing.cantidad ?? 1);
    setEmpleadoId(editing.empleado?.id ?? "");
    setProductoId(editing.producto?.id ?? "");
    setNumInv(editing.num_inventario ?? "");
    setSerie(editing.serie ?? "");
    setEstadoFisico(editing.estado_fisico);
    setEstatus(editing.estatus);
    setDescripcion(editing.descripcion ?? "");
    setAulaId(editing.aula?.id ?? "");
  }, [editing]);

  // Precarga para “grupo” (sidebar)
  useEffect(() => {
    if (editing) return;
    if (!defaults) return;

    if (defaults.cantidad !== undefined) setCantidad(defaults.cantidad);
    if (defaults.producto_id !== undefined) setProductoId(defaults.producto_id);
    if (defaults.aula_id !== undefined)
      setAulaId(defaults.aula_id === null ? "" : defaults.aula_id);
    if (defaults.empleado_id !== undefined && defaults.empleado_id !== null)
      setEmpleadoId(defaults.empleado_id); // NUEVO
    if (defaults.estado_fisico) setEstadoFisico(defaults.estado_fisico);
    if (defaults.estatus) setEstatus(defaults.estatus);
    if (defaults.serie !== undefined) setSerie(defaults.serie);
    if (defaults.descripcion !== undefined) setDescripcion(defaults.descripcion);
  }, [defaults, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payloadBase = {
      cantidad: Number.isFinite(cantidad) ? cantidad : 1,
      empleado_id: empleadoId || null,
      producto_id: productoId || null,
      numeros: numInv || "",
      serie: serie || null,
      estado_fisico: estadoFisico,
      estatus,
      descripcion: descripcion || null,
      aula_id: aulaId === "" ? null : Number(aulaId),
    };

    const url = editing ? "/api/ejemplares/update" : "/api/ejemplares/list/add";
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...payloadBase } : payloadBase;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await safeJson(res, editing ? "Actualizar ejemplar" : "Crear ejemplares");
    if (!res.ok) return alert(json.error || "Error");

    // reset
    setCantidad(1);
    setEmpleadoId("");
    setProductoId("");
    setNumInv("");
    setSerie("");
    setEstadoFisico("bueno");
    setEstatus("activo");
    setDescripcion("");
    setAulaId("");

    onCancelEdit?.();
    await onCreated();
  }

  return (
    <Guard perm="ejemplares:create" mode="disable">
      <form onSubmit={handleSubmit}
        className="max-w-4xl bg-neutral-900 p-4 rounded-lg grid md:grid-cols-2 gap-3">

        {/* Producto */}
        <select
          className="rounded p-2 bg-neutral-800"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          required
          disabled={lockProductoAula || !!editing}
        >
          <option value="">— Selecciona producto —</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.producto}{p.modelo ? ` · ${p.modelo}` : ""}
            </option>
          ))}
        </select>

        {/* Cantidad */}
        <input
          type="number" min={1}
          className="rounded p-2 bg-neutral-800"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value) || 1)}
        />

        {/* Núm. inventario */}
        <textarea
          className="rounded p-2 bg-neutral-800 md:col-span-1"
          rows={6}
          placeholder="Núm. inventario (A1, B2, C3...)"
          value={numInv}
          onChange={(e) => setNumInv(e.target.value)}
        />

        {/* Serie */}
        <input
          className="rounded p-2 bg-neutral-800"
          placeholder="Serie"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
        />

        {/* Estado físico */}
        <select
          className="rounded p-2 bg-neutral-800"
          value={estadoFisico}
          onChange={(e) => setEstadoFisico(e.target.value as any)}
        >
          <option value="bueno">Bueno</option>
          <option value="regular">Regular</option>
          <option value="malo">Malo</option>
          <option value="inutilizable">Inutilizable</option>
        </select>

        {/* Empleado (fijo si lockEmpleado) */}
        <select
          className="rounded p-2 bg-neutral-800"
          value={empleadoId}
          onChange={(e) => setEmpleadoId(e.target.value)}
          disabled={lockEmpleado}
        >
          <option value="">— Empleado (opcional) —</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>

        {/* Estatus */}
        <select
          className="rounded p-2 bg-neutral-800"
          value={estatus}
          onChange={(e) => setEstatus(e.target.value as any)}
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="retirado">Retirado</option>
        </select>

        {/* Aula */}
        <select
          className="rounded p-2 bg-neutral-800"
          value={aulaId}
          onChange={(e) => setAulaId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={lockProductoAula || !!editing}
        >
          <option value="">— Aula (opcional) —</option>
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>

        {/* Descripción */}
        <textarea
          className="rounded p-2 bg-neutral-800 md:col-span-2"
          placeholder="Descripción / notas"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />

        <div className="md:col-span-2 flex gap-3">
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
            {editing ? "Guardar cambios" : "Guardar"}
          </button>
          {editing && (
            <button type="button" onClick={onCancelEdit}
              className="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </Guard>
  );
}
