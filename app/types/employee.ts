// /types/employee.ts

export type EmployeeDB = {
  id: string;
  nombre_completo: string | null;
  alias: string | null;
  email: string | null;
  telefono: string | null;
  area: string | null;
  activo: boolean | null;
};

export type EmployeeUI = {
  id: string;
  nombre_completo: string;
  alias: string;
  email: string;
  telefono: string;
  area: string;
  activo: boolean;
};

export type EmployeeInput = Omit<EmployeeUI, "id">;

export const normalizeEmployee = (e: EmployeeDB): EmployeeUI => ({
  id: e.id,
  nombre_completo: e.nombre_completo ?? "",
  alias: e.alias ?? "",
  email: e.email ?? "",
  telefono: e.telefono ?? "",
  area: e.area ?? "",
  activo: !!e.activo,
});
