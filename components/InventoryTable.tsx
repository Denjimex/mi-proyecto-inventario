// components/InventoryTable.tsx
"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Aula = {
  id: number;
  nombre: string;
};

type Ejemplar = {
  aula_id: number;
  aula: string;
  numeroinventario: string;
  producto: string;
  modelo: string | null;
  serie: string | null;
  estado: string | null;
};

type RowResumen = {
  producto: string;
  modelo: string | null;
  serie: string | null;
  estado: string | null;
  cantidad: number;
};

type RowGeneral = {
  producto: string;
  modelo: string | null;
  serie: string | null;
  estado: string | null;
  total: number;
};

type Props = {
  aulas: Aula[];
  ejemplares: Ejemplar[];
  isAdmin: boolean; // por si luego lo usas
};

export default function InventoryTable({ aulas, ejemplares }: Props) {
  const [viewMode, setViewMode] = useState<"aula" | "general">("aula");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [openAulaId, setOpenAulaId] = useState<number | null>(null);

  // =========================
  // Helpers de agrupación
  // =========================

  // Resumen por aula (agrupado por producto+modelo+serie+estado)
  const rowsPorAula = (aulaId: number): RowResumen[] => {
    const ejAula = ejemplares.filter((e) => e.aula_id === aulaId);
    const map = new Map<string, RowResumen>();

    ejAula.forEach((e) => {
      const key = `${e.producto}|${e.modelo ?? ""}|${e.serie ?? ""}|${
        e.estado ?? ""
      }`;
      const prev = map.get(key);
      if (prev) {
        prev.cantidad += 1;
      } else {
        map.set(key, {
          producto: e.producto,
          modelo: e.modelo,
          serie: e.serie,
          estado: e.estado,
          cantidad: 1,
        });
      }
    });

    return Array.from(map.values());
  };

  const totalPorAula = (aulaId: number): number =>
    ejemplares.filter((e) => e.aula_id === aulaId).length;

  // Vista general: agrupamos SOLO por producto+modelo+serie
  const vistaGeneral: RowGeneral[] = (() => {
    const map = new Map<string, RowGeneral>();

    ejemplares.forEach((e) => {
      const key = `${e.producto}|${e.modelo ?? ""}|${e.serie ?? ""}`;
      const prev = map.get(key);
      if (prev) {
        prev.total += 1;
      } else {
        map.set(key, {
          producto: e.producto,
          modelo: e.modelo,
          serie: e.serie,
          estado: e.estado ?? "-",
          total: 1,
        });
      }
    });

    return Array.from(map.values());
  })();

  // =======================
  // PDF 1: Resumen por aula
  // =======================
  const handlePdfResumen = (aula: Aula) => {
    try {
      setDownloadingId(aula.id);

      const filas = rowsPorAula(aula.id);
      const totalEjemplares = totalPorAula(aula.id);

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Reporte de aula: ${aula.nombre}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Total de ejemplares: ${totalEjemplares}`, 14, 28);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 34);

      const body = filas.map((f) => [
        f.producto,
        f.modelo || "-",
        f.serie || "-",
        f.cantidad.toString(),
        f.estado || "-",
      ]);

      autoTable(doc, {
        startY: 40,
        head: [["Producto", "Modelo", "Serie", "Cantidad", "Estado"]],
        body,
      });

      doc.save(`reporte-aula-${aula.nombre}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ==================================
  // PDF 2: Detallado por ejemplares
  // ==================================
  const handlePdfEjemplares = (aula: Aula) => {
    try {
      setDownloadingId(aula.id);

      const ejAula = ejemplares.filter((e) => e.aula_id === aula.id);

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Ejemplares del aula: ${aula.nombre}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Total de piezas: ${ejAula.length}`, 14, 28);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 34);

      const body = ejAula.map((e) => [
        e.numeroinventario,
        e.producto,
        e.modelo || "-",
        e.serie || "-",
        e.estado || "-",
      ]);

      autoTable(doc, {
        startY: 40,
        head: [["No. Inventario", "Producto", "Modelo", "Serie", "Estado"]],
        body,
      });

      doc.save(`ejemplares-aula-${aula.nombre}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ============================
  // PDF 3: Vista general
  // ============================
  const handlePdfGeneral = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Inventario general (acumulado)", 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 28);

    const body = vistaGeneral.map((f) => [
      f.producto,
      f.modelo || "-",
      f.serie || "-",
      f.total.toString(),
      f.estado || "-",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Producto", "Modelo", "Serie", "Total", "Estado"]],
      body,
    });

    doc.save("inventario-general.pdf");
  };

  // Colores para las tarjetas por aula
  const colorClasses = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-orange-600",
    "bg-pink-600",
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="inline-flex rounded-full bg-neutral-900/60 p-1 text-sm mb-3">
        <button
          onClick={() => setViewMode("aula")}
          className={`px-4 py-1 rounded-full ${
            viewMode === "aula" ? "bg-white text-black" : "text-neutral-400"
          }`}
        >
          Vista por aula
        </button>
        <button
          onClick={() => setViewMode("general")}
          className={`px-4 py-1 rounded-full ${
            viewMode === "general" ? "bg-white text-black" : "text-neutral-400"
          }`}
        >
          Vista general (acumulado)
        </button>
      </div>

      {/* VISTA POR AULA */}
      {viewMode === "aula" && (
        <div className="space-y-6">
          {aulas.map((aula, idx) => {
            const total = totalPorAula(aula.id);
            if (total === 0) return null;

            const color = colorClasses[idx % colorClasses.length];

            return (
              <div
                key={aula.id}
                className="space-y-2 border border-neutral-800 rounded-xl p-3"
              >
                {/* Tarjeta clickable */}
                <button
                  onClick={() =>
                    setOpenAulaId(openAulaId === aula.id ? null : aula.id)
                  }
                  className={`w-full text-left p-4 rounded-lg ${color} text-white flex items-center justify-between`}
                >
                  <div>
                    <p className="text-xs uppercase opacity-80">
                      Aula
                    </p>
                    <p className="font-semibold text-lg">{aula.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Total ejemplares</p>
                    <p className="font-semibold text-lg">{total}</p>
                  </div>
                </button>

                {/* Detalle expandible */}
                {openAulaId === aula.id && (
                  <div className="space-y-3 p-3 bg-neutral-950 rounded-lg mt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={() => handlePdfResumen(aula)}
                        disabled={downloadingId === aula.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs disabled:opacity-60"
                      >
                        {downloadingId === aula.id
                          ? "Generando..."
                          : "PDF resumen"}
                      </button>
                      <button
                        onClick={() => handlePdfEjemplares(aula)}
                        disabled={downloadingId === aula.id}
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-xs disabled:opacity-60"
                      >
                        {downloadingId === aula.id
                          ? "Generando..."
                          : "PDF ejemplares"}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-neutral-900/60">
                            <th className="text-left p-2">Producto</th>
                            <th className="text-left p-2">Modelo</th>
                            <th className="text-left p-2">Serie</th>
                            <th className="text-left p-2">Cantidad</th>
                            <th className="text-left p-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rowsPorAula(aula.id).map((row, i) => (
                            <tr
                              key={`${aula.id}-${row.producto}-${i}`}
                              className="border-b border-neutral-800"
                            >
                              <td className="p-2">{row.producto}</td>
                              <td className="p-2">{row.modelo || "-"}</td>
                              <td className="p-2">{row.serie || "-"}</td>
                              <td className="p-2">{row.cantidad}</td>
                              <td className="p-2">{row.estado || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA GENERAL */}
      {viewMode === "general" && (
        <div className="space-y-3">
          <button
            onClick={handlePdfGeneral}
            className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
          >
            PDF general
          </button>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-neutral-900/60">
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Serie</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {vistaGeneral.map((row, idx) => (
                  <tr
                    key={`${row.producto}-${row.modelo}-${row.serie}-${idx}`}
                    className="border-b border-neutral-800"
                  >
                    <td className="p-2">{row.producto}</td>
                    <td className="p-2">{row.modelo || "-"}</td>
                    <td className="p-2">{row.serie || "-"}</td>
                    <td className="p-2">{row.total}</td>
                    <td className="p-2">{row.estado || "-"}</td>
                  </tr>
                ))}
                {vistaGeneral.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-neutral-400"
                    >
                      No hay datos de inventario todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
