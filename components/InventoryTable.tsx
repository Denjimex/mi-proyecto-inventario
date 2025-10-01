"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

type Aula = { id: number; nombre: string };
type Item = { id: string; producto: string; modelo: string; serie: string; estado: string; created_at: string };
type Existencia = { id: string; item_id: string; aula_id: number; cantidad: number };

export default function InventoryTable({
  aulas,
  items,
  existencias,
  isAdmin
}: {
  aulas: Aula[];
  items: Item[];
  existencias: Existencia[];
  isAdmin: boolean;
}) {
  const [vista, setVista] = useState<"aulas" | "general">("aulas");

  const porAula = useMemo(() => {
    // Mapa: aula -> lista de filas
    const byAula: Record<number, any[]> = {};
    existencias.forEach((ex) => {
      const item = items.find((i) => i.id === ex.item_id);
      if (!item) return;
      (byAula[ex.aula_id] ||= []).push({
        item_id: item.id,
        producto: item.producto,
        modelo: item.modelo,
        serie: item.serie,
        estado: item.estado,
        cantidad: ex.cantidad
      });
    });
    return byAula;
  }, [items, existencias]);

  const general = useMemo(() => {
    // Agrupa por producto+modelo+serie sumando cantidades
    const key = (i: Item) => `${i.producto}||${i.modelo}||${i.serie}`;
    const sums = new Map<string, { producto: string; modelo: string; serie: string; total: number }>();
    existencias.forEach((ex) => {
      const item = items.find((i) => i.id === ex.item_id);
      if (!item) return;
      const k = key(item);
      if (!sums.has(k)) sums.set(k, { producto: item.producto, modelo: item.modelo, serie: item.serie, total: 0 });
      sums.get(k)!.total += ex.cantidad;
    });
    return Array.from(sums.values()).sort((a,b) => a.producto.localeCompare(b.producto));
  }, [items, existencias]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button className={clsx("btn", vista === "aulas" && "bg-neutral-800")} onClick={() => setVista("aulas")}>
          Vista por aula
        </button>
        <button className={clsx("btn", vista === "general" && "bg-neutral-800")} onClick={() => setVista("general")}>
          Vista general (acumulado)
        </button>
      </div>

      {vista === "aulas" ? (
        <div className="space-y-6">
          {aulas.map((a) => (
            <div key={a.id}>
              <h4 className="font-semibold mb-2">{a.nombre}</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Modelo</th>
                    <th>Serie</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(porAula[a.id] || []).map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.producto}</td>
                      <td>{r.modelo}</td>
                      <td>{r.serie}</td>
                      <td>{r.cantidad}</td>
                      <td><span className="badge">{r.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Modelo</th>
                <th>Serie</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {general.map((g, idx) => (
                <tr key={idx}>
                  <td>{g.producto}</td>
                  <td>{g.modelo}</td>
                  <td>{g.serie}</td>
                  <td>{g.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
