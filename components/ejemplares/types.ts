// components/ejemplares/types.ts
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
  estado_fisico: "bueno" | "regular" | "malo" | "inutilizable";
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

