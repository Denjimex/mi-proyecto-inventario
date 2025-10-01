-- Aulas demo
insert into public.aulas (nombre) values ('Aula 1'), ('Aula 2')
on conflict do nothing;

-- Items + existencias demo
insert into public.items (id, producto, modelo, serie, estado)
values
  ('11111111-1111-1111-1111-111111111111','Banca','B-100','SER-001','activo'),
  ('22222222-2222-2222-2222-222222222222','Proyector','PJ-200','SER-002','activo')
on conflict (id) do nothing;

insert into public.existencias (item_id, aula_id, cantidad)
values
  ('11111111-1111-1111-1111-111111111111', 1, 20),
  ('11111111-1111-1111-1111-111111111111', 2, 15),
  ('22222222-2222-2222-2222-222222222222', 1, 1)
on conflict do nothing;
