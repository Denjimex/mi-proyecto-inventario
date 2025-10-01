-- Extensiones útiles
create extension if not exists "pgcrypto";

-- Perfiles (rol por usuario)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

-- Trigger: crea perfil al crear usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Aulas
create table if not exists public.aulas (
  id serial primary key,
  nombre text not null
);

-- Items (producto)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  producto text not null,
  modelo text not null,
  serie text not null,
  estado text not null default 'activo' check (estado in ('activo','inactivo','eliminado')),
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- Existencias (relación item-aula-cantidad)
create table if not exists public.existencias (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items on delete cascade,
  aula_id int not null references public.aulas on delete cascade,
  cantidad int not null default 0,
  unique (item_id, aula_id)
);

-- Numeraciones (solo admin puede ver)
create table if not exists public.numeraciones (
  item_id uuid primary key references public.items on delete cascade,
  lista text not null  -- coma-separado: "INV-001, INV-002"
);

-- Movimientos (entradas/salidas)
create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items on delete restrict,
  aula_id int not null references public.aulas on delete restrict,
  tipo text not null check (tipo in ('entrada','salida')),
  cantidad int not null check (cantidad > 0),
  area text,         -- preferencia del usuario: registrar el área
  pedido text,       -- y el número de pedido
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- Historial de actualizaciones (renombrado desde "Ajustes" según preferencia del usuario)
create table if not exists public.actualizaciones (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items on delete set null,
  user_id uuid references auth.users on delete set null,
  accion text not null, -- 'añadir','actualizar','borrar','entrada','salida'
  detalle jsonb,
  created_at timestamptz not null default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;
alter table public.aulas enable row level security;
alter table public.items enable row level security;
alter table public.existencias enable row level security;
alter table public.numeraciones enable row level security;
alter table public.movimientos enable row level security;
alter table public.actualizaciones enable row level security;
