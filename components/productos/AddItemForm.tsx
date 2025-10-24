"use client";

import { useEffect, useState } from "react";
import type { Category, ItemRow } from "./types";

type Props = {
  categories: Category[];
  // Si viene un item -> modo edición. Si no, alta.
  editing?: ItemRow | null;
  onCreated?: () => Promise<void> | void;
  onUpdated?: () => Promise<void> | void;
  onCancelEdit?: () => void;
};

export default function AddItemForm({
  categories,
  editing = null,
  onCreated,
  onUpdated,
  onCancelEdit,
}: Props) {
  const [producto, setProducto] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [estado, setEstado] = useState<"activo" | "inactivo" | "desuso">("activo");
  const [categoryId, setCategoryId] = useState<string>("");

  // Cuando entramos en modo edición, precarga campos
  useEffect(() => {
    if (editing) {
      setProducto(editing.producto);
      setModelo(editing.modelo);
      setSerie(editing.serie);
      setEstado(editing.estado);
      setCategoryId(editing.category?.id ?? "");
    } else {
      setProducto("");
      setModelo("");
      setSerie("");
      setEstado("activo");
      setCategoryId("");
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      producto,
      modelo,
      serie,
      estado,
      category_id: categoryId || null,
    };

    if (!editing) {
      // Alta
      const res = await fetch("/api/items/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // COOKIES para el middleware
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || "Error al guardar");
      await onCreated?.();
      setProducto("");
      setModelo("");
      setSerie("");
      setEstado("activo");
      setCategoryId("");
      return;
    }

    // Edición
    const res = await fetch("/api/items/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: editing.id, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Error al actualizar");
    await onUpdated?.();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-3 bg-neutral-900 p-4 rounded-lg">
      <input
        className="w-full rounded p-2 bg-neutral-800"
        placeholder="Producto"
        value={producto}
        onChange={(e) => setProducto(e.target.value)}
      />

      <input
        className="w-full rounded p-2 bg-neutral-800"
        placeholder="Modelo"
        value={modelo}
        onChange={(e) => setModelo(e.target.value)}
      />

      <input
        className="w-full rounded p-2 bg-neutral-800"
        placeholder="Serie"
        value={serie}
        onChange={(e) => setSerie(e.target.value)}
      />

      {/* Solo estos 3 estados */}
      <select
        className="w-full rounded p-2 bg-neutral-800"
        value={estado}
        onChange={(e) => setEstado(e.target.value as any)}
      >
        <option value="activo">activo</option>
        <option value="inactivo">inactivo</option>
        <option value="desuso">desuso</option>
      </select>

      <select
        className="w-full rounded p-2 bg-neutral-800"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">— Selecciona categoría —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button className="rounded px-4 py-2 bg-blue-600 hover:bg-blue-700">
          {editing ? "Guardar cambios" : "Guardar"}
        </button>
        {editing && (
          <button
            type="button"
            className="rounded px-4 py-2 bg-neutral-700"
            onClick={() => onCancelEdit?.()}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
