# Inventario (Supabase + Next.js + Tailwind)

Starter listo para arrancar el sistema de inventario con:
- **Auth** (email/contraseña) y **roles** (`admin` / `viewer`)
- **Entidades**: `items`, `aulas`, `existencias`, `numeraciones` (solo admin), `movimientos`, `actualizaciones`
- **UI**: Login, Dashboard con tarjetas, alta de producto (solo admin), tabla por aula y vista general

## 1) Requisitos

- Node.js 18+
- Cuenta de Supabase (gratis)

## 2) Crear proyecto y variables

1. Crea un proyecto en Supabase.
2. Copia las keys en `.env.local` (usa `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. (Opcional) Para ejecutar los SQL desde tu máquina, puedes usar el Service Role (`SUPABASE_SERVICE_ROLE_KEY`).

## 3) Migraciones SQL (roles, tablas y RLS)

En el panel de Supabase (SQL Editor), ejecuta los archivos de `./supabase/` en este orden:

1. `schema.sql`
2. `policies.sql`
3. `seed.sql` (opcional)

> El esquema usa RLS: **cualquier usuario autenticado puede leer**, pero **solo `admin` puede insertar/actualizar/borrar**.  
> La tabla `numeraciones` (números de inventario separados por comas) **solo es visible para admin**.

## 4) Instalar y correr

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 5) Asignar roles

- Crea usuarios en *Authentication → Users*.
- En la tabla `profiles`, establece `role = 'admin'` al gerente y `'viewer'` al resto.

## 6) Siguientes pasos sugeridos

- CRUD completo con server actions (editar/borrar producto, entradas/salidas en `movimientos`).
- Filtros/búsqueda, exportaciones PDF/Excel como requerimiento aparte.
- Historial de *Últimos movimientos* en el dashboard.
- Pruebas E2E y despliegue (Vercel).

> Mantiene tus lineamientos: **roles**, **vista por aula** y **vista general**, **números de inventario** ingresados manualmente, y **registro de movimientos** con `area` y `pedido` (sin *razón_salida*).
