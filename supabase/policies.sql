-- Helpers
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- PROFILES
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update using (public.is_admin());

-- AULAS
drop policy if exists "aulas read auth" on public.aulas;
create policy "aulas read auth" on public.aulas
for select using (auth.role() = 'authenticated');

drop policy if exists "aulas write admin" on public.aulas;
create policy "aulas write admin" on public.aulas
for all using (public.is_admin()) with check (public.is_admin());

-- ITEMS
drop policy if exists "items read auth" on public.items;
create policy "items read auth" on public.items
for select using (auth.role() = 'authenticated');

drop policy if exists "items write admin" on public.items;
create policy "items write admin" on public.items
for all using (public.is_admin()) with check (public.is_admin());

-- EXISTENCIAS
drop policy if exists "existencias read auth" on public.existencias;
create policy "existencias read auth" on public.existencias
for select using (auth.role() = 'authenticated');

drop policy if exists "existencias write admin" on public.existencias;
create policy "existencias write admin" on public.existencias
for all using (public.is_admin()) with check (public.is_admin());

-- NUMERACIONES (solo admin puede leer y escribir)
drop policy if exists "numeraciones read admin" on public.numeraciones;
create policy "numeraciones read admin" on public.numeraciones
for select using (public.is_admin());

drop policy if exists "numeraciones write admin" on public.numeraciones;
create policy "numeraciones write admin" on public.numeraciones
for all using (public.is_admin()) with check (public.is_admin());

-- MOVIMIENTOS
drop policy if exists "movimientos read auth" on public.movimientos;
create policy "movimientos read auth" on public.movimientos
for select using (auth.role() = 'authenticated');

drop policy if exists "movimientos write admin" on public.movimientos;
create policy "movimientos write admin" on public.movimientos
for all using (public.is_admin()) with check (public.is_admin());

-- ACTUALIZACIONES
drop policy if exists "actualizaciones read auth" on public.actualizaciones;
create policy "actualizaciones read auth" on public.actualizaciones
for select using (auth.role() = 'authenticated');

drop policy if exists "actualizaciones write admin" on public.actualizaciones;
create policy "actualizaciones write admin" on public.actualizaciones
for all using (public.is_admin()) with check (public.is_admin());
