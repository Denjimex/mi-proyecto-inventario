"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function addProductAction(formData: FormData) {
  const supabase = await createClient();

  // Datos base
  const producto = String(formData.get("producto") || "").trim();
  const modelo = String(formData.get("modelo") || "").trim();
  const serie = String(formData.get("serie") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const aulaId = String(formData.get("aula_id") || "");
  const ejemplares = Number(formData.get("ejemplares") || 0);

  if (!producto || !aulaId || ejemplares <= 0) {
    return redirect("/dashboard?error=Campos%20obligatorios%20faltantes");
  }

  // 1) Crear item
  const { data: itemInsert, error: itemErr } = await supabase
    .from("items")
    .insert([{ producto, modelo, serie, category_id: categoryId || null }])
    .select("id")
    .single();

  if (itemErr || !itemInsert) {
    console.error("❌ Error creando producto:", itemErr?.message);
    return redirect("/dashboard?error=Error%20creando%20producto");
  }
  const itemId = itemInsert.id;

  // 2) Crear ejemplares (una fila por unidad)
  const ejemplaresList = Array.from({ length: ejemplares }, (_, i) => ({
    producto_id: itemId,
    aula_id: aulaId,
    num_inventario: `${producto}-${Date.now()}-${i + 1}`, // puedes mejorar este formato
    serie: null,
    estado_fisico: "bueno",
    estatus: "activo",
    fecha_registro: new Date().toISOString(),
  }));

  const { error: ejErr } = await supabase.from("ejemplares").insert(ejemplaresList);
  if (ejErr) {
    console.error("❌ Error creando ejemplares:", ejErr.message);
    return redirect("/dashboard?error=Error%20creando%20ejemplares");
  }

  // ✅ Listo
  return redirect("/dashboard?ok=Producto%20creado");
}
