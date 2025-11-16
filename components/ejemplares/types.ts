// components/ejemplares/types.ts 

// --------- Tipos básicos ---------
export type Aula = { id: number; nombre: string };

export type ProductoLite = {
  id: string;
  producto: string;
  modelo: string | null;
};

export type EmpleadoLite = { id: string; nombre: string };

export type EjemplarRow = {
  id: string;
  cantidad?: number | null;

  producto?: ProductoLite | null;
  aula?: Aula | null;
  empleado?: EmpleadoLite | null;

  num_inventario: string | null;
  serie: string | null;

  // estado físico real del ejemplar
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";

  // estado en el sistema
  // añadimos "baja" porque lo vamos a usar como valor explícito
  estatus: "activo" | "inactivo" | "retirado";

  descripcion: string | null;
};

// Nuevo tipo para agrupar ejemplares (usado en la tabla principal)
export type Group = {
  producto_id: string;
  aula_id: number | null;
  producto: string;
  aula: string;
  cantidad: number;
  danados: number;
  // NUEVO:
  empleado_id?: string | null;
  empleado_label?: string | null;
};

// --------- Estado unificado para el FRONT ---------

// Este es el único estado que verá el usuario en el combo:
// los primeros 4 son físicos, "baja" es baja en el sistema (soft delete)
export type EstadoUI =
  | "bueno"
  | "regular"
  | "malo"
  | "inutilizable"
  | "baja";

/**
 * Convierte los valores de BD (estado_fisico + estatus)
 * al valor único que usaremos en la UI (EstadoUI).
 *
 * Reglas:
 * - Si estatus es "baja" o "retirado" => EstadoUI = "baja"
 * - En otro caso usamos estado_fisico (por defecto "bueno" si viene null)
 */
export function estadoUiFromDb(
  estado_fisico: EjemplarRow["estado_fisico"] | null,
  estatus: EjemplarRow["estatus"] | null
): EstadoUI {
  if ( estatus === "retirado") {
    return "baja";
  }

  const fisico = (estado_fisico ?? "bueno").toLowerCase();

  if (
    fisico === "regular" ||
    fisico === "malo" ||
    fisico === "inutilizable"
  ) {
    return fisico as EstadoUI;
  }

  return "bueno";
}
