export type Category = {
  id: string;
  nombre: string;
};

export type ItemRow = {
  id: string;
  producto: string;
  modelo: string;
  serie: string;
  // Solo estos tres estados:
  estado: "activo" | "inactivo" | "desuso";
  category: { id: string; nombre: string } | null;
};
