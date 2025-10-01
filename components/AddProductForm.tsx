// components/AddProductForm.tsx (Server Component)
import { addProductAction } from "@/app/server-actions/inventory";
import { createClient } from "@/lib/supabase/server";

type Category = { id: string; nombre: string };
type Aula = { id: number; nombre: string };
type Employee = { id: string; alias: string; nombre_completo: string };

export default async function AddProductForm() {
  const supabase = await createClient();

  const [{ data: categories }, { data: aulas }, { data: employees }] =
    await Promise.all([
      supabase.from("categories").select("id,nombre").order("nombre", { ascending: true }),
      supabase.from("aulas").select("id,nombre").order("nombre", { ascending: true }),
      supabase.from("employees").select("id,alias,nombre_completo").order("alias", { ascending: true }),
    ]);

  return (
    <form action={addProductAction} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Producto</label>
          <input name="producto" className="input" placeholder="Banca, Laptop, Proyector..." required />
        </div>
        <div>
          <label className="label">Modelo</label>
          <input name="modelo" className="input" placeholder="B-100, Dell 5400..." />
        </div>
        <div>
          <label className="label">Serie</label>
          <input name="serie" className="input" placeholder="SER-001..." />
        </div>

        <div>
          <label className="label">Categoría</label>
          <select name="category_id" className="input">
            <option value="">— Selecciona —</option>
            {(categories as Category[] | null)?.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Aula</label>
          <select name="aula_id" className="input" required>
            <option value="">— Selecciona —</option>
            {(aulas as Aula[] | null)?.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Ejemplares</label>
          <input name="ejemplares" type="number" min={1} className="input" placeholder="Ej. 30" required />
        </div>

        <div className="md:col-span-2">
          <label className="label">Números de inventario (solo admin, separados por comas)</label>
          <input name="numeros" className="input" placeholder="INV-001, INV-002, ..." />
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-neutral-700/50 p-4">
        <div className="font-medium opacity-80">Responsabilidad (opcional)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Responsable (Empleado)</label>
            <select name="employee_id" className="input">
              <option value="">— Sin responsable —</option>
              {(employees as Employee[] | null)?.map(e => (
                <option key={e.id} value={e.id}>{e.alias || e.nombre_completo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cantidad bajo responsabilidad</label>
            <input name="cantidad_responsable" type="number" min={0} className="input" placeholder="Si vacío, usa todos los ejemplares" />
          </div>
          <div>
            <label className="label">Nota</label>
            <input name="nota_responsable" className="input" placeholder="Lote inicial, etc." />
          </div>
        </div>
      </div>

      <button className="btn" type="submit">Guardar</button>
    </form>
  );
}
