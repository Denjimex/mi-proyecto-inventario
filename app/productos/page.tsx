"use client";

import { useEffect, useState } from "react";
import AddItemForm from "@/components/productos/AddItemForm";
import ItemsTable from "@/components/productos/ItemsTable";
import type { Category, ItemRow } from "@/components/productos/types";
import ToggleSection from "@/components/ToggleSection";

export default function ProductosPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ItemRow | null>(null);

  async function refresh() {
    const [cRes, iRes] = await Promise.all([
      fetch("/api/categories/list", { cache: "no-store", credentials: "include" }),
      fetch("/api/items/list",      { cache: "no-store", credentials: "include" }),
    ]);
    const [cJson, iJson] = await Promise.all([cRes.json(), iRes.json()]);
    setCats(cJson.categories ?? []);
    setItems(iJson.items ?? []);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch("/api/items/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Error eliminando");
    await refresh();
  }

  function handleEdit(row: ItemRow) {
    setEditing(row); // esto hará que el formulario se abra gracias a forceOpen
  }

  async function afterCreate() {
    await refresh();
  }

  async function afterUpdate() {
    setEditing(null);
    await refresh();
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Cargando…</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Productos</h1>

      <ToggleSection
        title={editing ? "Editar producto" : "Añadir producto"}
        forceOpen={!!editing}
      >
        <AddItemForm
          categories={cats}
          editing={editing}
          onCreated={afterCreate}
          onUpdated={afterUpdate}
          onCancelEdit={() => setEditing(null)}
        />
      </ToggleSection>

      <div className="card p-4">
        <ItemsTable
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
